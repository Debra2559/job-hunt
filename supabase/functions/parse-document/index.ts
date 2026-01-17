import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate embedding for document content
async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    // Truncate and clean text for embedding
    const cleanText = text.substring(0, 8000).replace(/\s+/g, ' ').trim();
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: cleanText,
        dimensions: 768,
      }),
    });

    if (!response.ok) {
      console.error("Embedding API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (e) {
    console.error("Error generating embedding:", e);
    return null;
  }
}

// Extract text from DOCX file
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
    
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXml = await zip.file("word/document.xml")?.async("string");
    
    if (!documentXml) {
      throw new Error("Could not find document.xml in DOCX file");
    }
    
    // Extract text from XML - simple regex approach
    const textContent = documentXml
      .replace(/<w:p[^>]*>/g, '\n') // Paragraph breaks
      .replace(/<w:tab[^>]*\/>/g, '\t') // Tabs
      .replace(/<w:br[^>]*\/>/g, '\n') // Line breaks
      .replace(/<[^>]+>/g, '') // Remove all XML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .trim();
    
    return textContent;
  } catch (e: unknown) {
    console.error("Error extracting text from DOCX:", e);
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to extract text from DOCX: ${message}`);
  }
}

// Extract text from PPTX file
async function extractTextFromPptx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
    
    const zip = await JSZip.loadAsync(arrayBuffer);
    const texts: string[] = [];
    
    // Find all slide files
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
        return numA - numB;
      });
    
    for (const slideFile of slideFiles) {
      const slideXml = await zip.file(slideFile)?.async("string");
      if (slideXml) {
        const slideNum = slideFile.match(/slide(\d+)/)?.[1] || '?';
        const slideText = slideXml
          .replace(/<a:p[^>]*>/g, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        if (slideText) {
          texts.push(`[幻灯片 ${slideNum}]\n${slideText}`);
        }
      }
    }
    
    return texts.join('\n\n---\n\n');
  } catch (e: unknown) {
    console.error("Error extracting text from PPTX:", e);
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to extract text from PPTX: ${message}`);
  }
}

// Extract text from PDF using pdf-parse
async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Use pdf.js-extract for PDF parsing in Deno
    const pdfParse = await import("https://esm.sh/pdf-parse@1.1.1");
    
    const uint8Array = new Uint8Array(arrayBuffer);
    const result = await pdfParse.default(uint8Array);
    
    return result.text || '';
  } catch (e) {
    console.error("Error extracting text from PDF:", e);
    // Fallback: return a message indicating PDF parsing failed
    return `[PDF文档 - 无法自动提取文本内容，可能需要人工整理]`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, filePath, fileName, regenerateEmbedding } = await req.json();
    console.log(`Processing document: ${fileName || fileId} (regenerateEmbedding: ${regenerateEmbedding})`);

    if (!fileId) {
      throw new Error("Missing required parameter: fileId");
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // If only regenerating embedding
    if (regenerateEmbedding) {
      const { data: file, error: fetchError } = await supabase
        .from('knowledge_files')
        .select('content_text, tags, file_name')
        .eq('id', fileId)
        .single();

      if (fetchError || !file?.content_text) {
        throw new Error("File not found or no content");
      }

      // Generate embedding with tags context
      const tagsContext = file.tags?.length > 0 ? `[分类: ${file.tags.join(', ')}] ` : '';
      const textForEmbedding = tagsContext + file.content_text;
      
      let embedding = null;
      if (LOVABLE_API_KEY) {
        embedding = await generateEmbedding(textForEmbedding, LOVABLE_API_KEY);
      }

      if (embedding) {
        const { error: updateError } = await supabase
          .from('knowledge_files')
          .update({ embedding })
          .eq('id', fileId);

        if (updateError) {
          console.error("Failed to update embedding:", updateError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Embedding regenerated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!filePath || !fileName) {
      throw new Error("Missing required parameters: filePath, fileName");
    }

    // Update status to processing
    await supabase
      .from('knowledge_files')
      .update({ status: 'processing' })
      .eq('id', fileId);

    // Download file from storage
    console.log(`Downloading file from storage: ${filePath}`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge')
      .download(filePath);

    if (downloadError) {
      console.error("Download error:", downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    let extractedText = '';
    
    console.log(`Extracting text from ${ext} file...`);
    
    switch (ext) {
      case 'docx':
        extractedText = await extractTextFromDocx(arrayBuffer);
        break;
      case 'pptx':
        extractedText = await extractTextFromPptx(arrayBuffer);
        break;
      case 'pdf':
        extractedText = await extractTextFromPdf(arrayBuffer);
        break;
      case 'md':
      case 'txt':
        extractedText = new TextDecoder().decode(arrayBuffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }

    // Truncate if too long (max 50000 characters)
    const maxLength = 50000;
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength) + '\n\n[内容已截断...]';
    }

    console.log(`Extracted ${extractedText.length} characters from ${fileName}`);

    // Generate embedding for semantic search
    let embedding = null;
    if (LOVABLE_API_KEY && extractedText.length > 0) {
      console.log("Generating embedding...");
      embedding = await generateEmbedding(extractedText, LOVABLE_API_KEY);
      if (embedding) {
        console.log("Embedding generated successfully");
      }
    }

    // Update database with extracted text and embedding
    const updateData: any = { 
      content_text: extractedText,
      status: extractedText.length > 0 ? 'ready' : 'error',
      updated_at: new Date().toISOString()
    };
    
    if (embedding) {
      updateData.embedding = embedding;
    }

    const { error: updateError } = await supabase
      .from('knowledge_files')
      .update(updateData)
      .eq('id', fileId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Failed to update database: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully extracted ${extractedText.length} characters`,
        textLength: extractedText.length,
        hasEmbedding: !!embedding
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (e) {
    console.error("Parse document error:", e);
    
    // Try to update status to error if we have fileId
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.fileId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('knowledge_files')
          .update({ status: 'error' })
          .eq('id', body.fileId);
      }
    } catch {}
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e instanceof Error ? e.message : "Unknown error" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});