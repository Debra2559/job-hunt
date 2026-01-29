import { KnowledgeSource } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';

type ChatMessage = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Read text file content
async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Parse PDF file using edge function
async function parsePdfFile(file: File): Promise<string> {
  try {
    // Upload to temporary storage
    const tempPath = `temp/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('knowledge')
      .upload(tempPath, file);

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      return `[PDF文件: ${file.name} - 上传失败]`;
    }

    // Call parse-document edge function
    const { data, error } = await supabase.functions.invoke('parse-document', {
      body: {
        fileId: `temp_${Date.now()}`,
        filePath: tempPath,
        fileName: file.name,
      },
    });

    // Delete temp file after parsing
    await supabase.storage.from('knowledge').remove([tempPath]);

    if (error || !data?.success) {
      console.error('PDF parse error:', error || data?.error);
      return `[PDF文件: ${file.name} - 解析失败，请稍后重试]`;
    }

    // Directly extract text from PDF using pdf.js in browser
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractPdfTextInBrowser(arrayBuffer);
    
    if (text && text.length > 100) {
      return `[PDF文档: ${file.name}]\n\n${text}`;
    }
    
    return `[PDF文件: ${file.name} - 已上传，内容待解析]`;
  } catch (e) {
    console.error('PDF parsing error:', e);
    return `[PDF文件: ${file.name} - 处理出错]`;
  }
}

// Extract PDF text in browser using pdf.js
async function extractPdfTextInBrowser(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // @ts-ignore - Dynamic import of pdf.js
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];
    
    // Extract text from each page (max 50 pages)
    const maxPages = Math.min(pdf.numPages, 50);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      if (pageText.trim()) {
        textParts.push(`[第${i}页]\n${pageText}`);
      }
    }
    
    if (pdf.numPages > 50) {
      textParts.push(`\n[注: 仅显示前50页，共${pdf.numPages}页]`);
    }
    
    return textParts.join('\n\n');
  } catch (e) {
    console.error('Browser PDF extraction failed:', e);
    return '';
  }
}

// Parse Office documents (docx, pptx, xlsx)
async function parseOfficeFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  try {
    if (ext === 'docx') {
      // @ts-ignore
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return `[Word文档: ${file.name}]\n\n${result.value}`;
    }
    
    // For other Office files, return placeholder
    return `[Office文件: ${file.name}, 类型: ${ext?.toUpperCase()}, 大小: ${(file.size / 1024).toFixed(1)}KB]`;
  } catch (e) {
    console.error('Office file parse error:', e);
    return `[${ext?.toUpperCase()}文件: ${file.name} - 解析失败]`;
  }
}

export async function streamChat({
  messages,
  files,
  onDelta,
  onDone,
  onError,
  onSources,
}: {
  messages: ChatMessage[];
  files?: File[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  onSources?: (sources: KnowledgeSource[]) => void;
}) {
  try {
    // Process files if any
    let fileContents: Array<{ name: string; type: string; content: string }> = [];
    
    if (files && files.length > 0) {
      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const isImage = file.type.startsWith('image/');
        const isText = file.type.startsWith('text/') || 
                       ['txt', 'md', 'json', 'csv'].includes(ext || '');
        const isPdf = ext === 'pdf' || file.type === 'application/pdf';
        const isOffice = ['docx', 'pptx', 'xlsx', 'doc', 'ppt', 'xls'].includes(ext || '');
        
        if (isImage) {
          const base64 = await fileToBase64(file);
          fileContents.push({
            name: file.name,
            type: 'image',
            content: base64,
          });
        } else if (isText) {
          const text = await readTextFile(file);
          fileContents.push({
            name: file.name,
            type: 'text',
            content: text,
          });
        } else if (isPdf) {
          // Parse PDF content
          const pdfContent = await parsePdfFile(file);
          fileContents.push({
            name: file.name,
            type: 'document',
            content: pdfContent,
          });
        } else if (isOffice) {
          // Parse Office documents
          const officeContent = await parseOfficeFile(file);
          fileContents.push({
            name: file.name,
            type: 'document',
            content: officeContent,
          });
        } else {
          // For other files, just send the name as placeholder
          fileContents.push({
            name: file.name,
            type: 'file',
            content: `[文件: ${file.name}, 类型: ${file.type}, 大小: ${(file.size / 1024).toFixed(1)}KB]`,
          });
        }
      }
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages,
        files: fileContents.length > 0 ? fileContents : undefined,
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      const errorMessage = errorData.error || "AI服务暂时不可用";
      onError(errorMessage);
      return;
    }

    if (!resp.body) {
      onError("无法建立连接");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      // Process line-by-line as data arrives
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          
          // Check for sources data
          if (parsed.sources && onSources) {
            onSources(parsed.sources);
            continue;
          }
          
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          // Incomplete JSON split across chunks: put it back and wait for more data
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush in case remaining buffered lines arrived without trailing newline
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          
          // Check for sources data
          if (parsed.sources && onSources) {
            onSources(parsed.sources);
            continue;
          }
          
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore partial leftovers */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("Stream chat error:", error);
    onError("网络连接失败，请检查网络后重试");
  }
}
