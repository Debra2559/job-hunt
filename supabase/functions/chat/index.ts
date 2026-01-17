import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fetch knowledge base content from database
async function getKnowledgeContext(supabase: any): Promise<string> {
  try {
    const { data: files, error } = await supabase
      .from('knowledge_files')
      .select('file_name, file_path, content_text')
      .eq('status', 'ready')
      .limit(10);

    if (error) {
      console.error('Error fetching knowledge files:', error);
      return '';
    }

    if (!files || files.length === 0) {
      console.log('No knowledge files found');
      return '';
    }

    console.log(`Found ${files.length} knowledge files`);

    // Collect content from files
    const contents: string[] = [];
    
    for (const file of files) {
      // If content_text is stored in DB, use it
      if (file.content_text) {
        contents.push(`【${file.file_name}】\n${file.content_text}`);
        continue;
      }

      // For text files, try to download and read content
      const ext = file.file_name.split('.').pop()?.toLowerCase();
      if (['md', 'txt'].includes(ext || '')) {
        try {
          const { data, error: downloadError } = await supabase.storage
            .from('knowledge')
            .download(file.file_path);

          if (!downloadError && data) {
            const text = await data.text();
            // Limit content length per file to avoid token overflow
            const truncatedText = text.length > 3000 ? text.substring(0, 3000) + '...' : text;
            contents.push(`【${file.file_name}】\n${truncatedText}`);
            
            // Update content_text in database for future use
            await supabase
              .from('knowledge_files')
              .update({ content_text: truncatedText })
              .eq('file_path', file.file_path);
          }
        } catch (e) {
          console.error(`Error reading file ${file.file_name}:`, e);
        }
      }
    }

    if (contents.length === 0) {
      return '';
    }

    return `\n\n以下是相关的知识库内容，请参考这些内容来回答用户问题：\n\n${contents.join('\n\n---\n\n')}`;
  } catch (e) {
    console.error('Error in getKnowledgeContext:', e);
    return '';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log("Received chat request with", messages?.length || 0, "messages");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client for fetching knowledge
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get knowledge base context
    const knowledgeContext = await getKnowledgeContext(supabase);
    console.log("Knowledge context length:", knowledgeContext.length);

    const systemPrompt = `你是一位友善、专业的校园AI辅导员。你的职责是帮助学生解决学业、生活、心理和行政方面的问题。

你的特点：
- 语气亲切友好，像一位关心学生的老师
- 回答专业准确，涉及政策法规时要谨慎
- 善于倾听，能够理解学生的困惑和压力
- 提供具体可行的建议和解决方案
- 必要时会建议学生寻求专业帮助（如心理咨询中心、教务处等）

回答格式：
- 使用清晰的结构，必要时使用列表或分步骤说明
- 使用emoji让回答更加生动友好
- 控制回答长度，简洁明了
- 如果问题需要具体信息（如学校政策），优先参考知识库中的内容，如无相关内容则提供通用建议并建议查询官方渠道

重要提示：
- 如果知识库中有相关内容，请优先基于知识库内容回答
- 引用知识库内容时，可以提及来源文件名
- 如果知识库中没有相关信息，请诚实说明并提供通用建议${knowledgeContext}`;

    console.log("Calling Lovable AI Gateway...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试。" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI额度已用完，请联系管理员充值。" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI服务暂时不可用，请稍后重试。" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway...");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "服务器错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
