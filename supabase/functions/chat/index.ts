import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate embedding for query using Lovable AI Gateway
async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.substring(0, 8000), // Limit input length
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

// Semantic search using vector similarity
async function semanticSearch(
  supabase: any, 
  query: string, 
  apiKey: string
): Promise<Array<{ id: string; file_name: string; content_text: string; tags: string[]; similarity: number }>> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query, apiKey);
    
    if (!queryEmbedding) {
      console.log("Failed to generate query embedding, falling back to basic search");
      return [];
    }

    console.log("Generated query embedding, searching...");

    // Use vector similarity search
    const { data, error } = await supabase.rpc('match_knowledge_files', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 5,
    });

    if (error) {
      console.error("Semantic search error:", error);
      return [];
    }

    console.log(`Found ${data?.length || 0} relevant documents via semantic search`);
    return data || [];
  } catch (e) {
    console.error("Error in semantic search:", e);
    return [];
  }
}

// Fallback: basic keyword search
async function basicSearch(supabase: any, query: string): Promise<string[]> {
  try {
    // Get files with content
    const { data: files, error } = await supabase
      .from('knowledge_files')
      .select('file_name, content_text, tags')
      .eq('status', 'ready')
      .not('content_text', 'is', null)
      .limit(10);

    if (error || !files) {
      console.error("Basic search error:", error);
      return [];
    }

    // Simple keyword matching
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 1);
    const results: string[] = [];

    for (const file of files) {
      if (!file.content_text) continue;
      
      const content = file.content_text.toLowerCase();
      const tags = (file.tags || []).join(' ').toLowerCase();
      
      // Check if any keyword matches
      const matches = keywords.some(k => content.includes(k) || tags.includes(k));
      
      if (matches || results.length < 3) {
        // Truncate content for context
        const truncated = file.content_text.length > 2000 
          ? file.content_text.substring(0, 2000) + '...' 
          : file.content_text;
        results.push(`【${file.file_name}】\n${truncated}`);
      }
    }

    return results;
  } catch (e) {
    console.error("Error in basic search:", e);
    return [];
  }
}

// Get knowledge context with semantic search - returns both context string and sources
async function getKnowledgeContext(
  supabase: any, 
  userQuery: string, 
  apiKey: string
): Promise<{ context: string; sources: Array<{ fileName: string; similarity: number; tags: string[] }> }> {
  try {
    // Try semantic search first
    const semanticResults = await semanticSearch(supabase, userQuery, apiKey);
    
    if (semanticResults.length > 0) {
      const sources = semanticResults.map(r => ({
        fileName: r.file_name,
        similarity: r.similarity,
        tags: r.tags || [],
      }));

      const contents = semanticResults.map(r => {
        const tags = r.tags?.length > 0 ? `[标签: ${r.tags.join(', ')}]` : '';
        const similarity = `[相关度: ${(r.similarity * 100).toFixed(0)}%]`;
        const truncated = r.content_text.length > 2000 
          ? r.content_text.substring(0, 2000) + '...' 
          : r.content_text;
        return `【${r.file_name}】${tags} ${similarity}\n${truncated}`;
      });
      
      return {
        context: `\n\n以下是与问题相关的知识库内容（按相关度排序）：\n\n${contents.join('\n\n---\n\n')}`,
        sources,
      };
    }

    // Fallback to basic search
    console.log("Falling back to basic search");
    const basicResults = await basicSearch(supabase, userQuery);
    
    if (basicResults.length > 0) {
      return {
        context: `\n\n以下是可能相关的知识库内容：\n\n${basicResults.join('\n\n---\n\n')}`,
        sources: [], // No similarity scores for basic search
      };
    }

    console.log("No relevant knowledge found");
    return { context: '', sources: [] };
  } catch (e) {
    console.error("Error in getKnowledgeContext:", e);
    return { context: '', sources: [] };
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

    // Extract latest user query for semantic search
    const latestUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop()?.content || '';
    
    console.log("User query for knowledge search:", latestUserMessage.substring(0, 100));

    // Get knowledge base context using semantic search
    const { context: knowledgeContext, sources } = await getKnowledgeContext(supabase, latestUserMessage, LOVABLE_API_KEY);
    console.log("Knowledge context length:", knowledgeContext.length, "Sources:", sources.length);

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
- 注意知识库内容的相关度评分，优先使用高相关度的内容
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

    // Log knowledge usage for statistics (background task)
    if (sources.length > 0) {
      const authHeader = req.headers.get('Authorization');
      let conversationId: string | null = null;
      
      // Try to extract conversation context if available
      try {
        const requestBody = await req.clone().json();
        conversationId = requestBody.conversationId || null;
      } catch {}

      // Log usage in background (fire and forget)
      (async () => {
        for (const source of sources) {
          try {
            // Find file id by name
            const { data: fileData } = await supabase
              .from('knowledge_files')
              .select('id')
              .eq('file_name', source.fileName)
              .single();
            
            if (fileData) {
              await supabase.from('knowledge_usage').insert({
                file_id: fileData.id,
                conversation_id: conversationId,
                user_query: latestUserMessage.substring(0, 500),
                similarity: source.similarity,
              });
            }
          } catch (e) {
            console.error('Error logging knowledge usage:', e);
          }
        }
      })();
    }

    // Create a TransformStream to inject sources at the end
    const sourcesData = sources.length > 0 ? JSON.stringify(sources) : null;
    
    // If we have sources, we need to append them to the stream
    if (sourcesData && response.body) {
      const reader = response.body.getReader();
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                // Append sources as a special event before [DONE]
                const sourcesEvent = `data: ${JSON.stringify({ sources })}\n\n`;
                controller.enqueue(encoder.encode(sourcesEvent));
                break;
              }
              controller.enqueue(value);
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        }
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
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