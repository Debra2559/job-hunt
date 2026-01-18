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

    // Use vector similarity search with lower threshold to get more results
    const { data, error } = await supabase.rpc('match_knowledge_files', {
      query_embedding: queryEmbedding,
      match_threshold: 0.15, // Lower threshold to include more results
      match_count: 8, // Get more results
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

// Get random knowledge files as fallback context
async function getRandomKnowledge(supabase: any, limit: number = 3): Promise<Array<{ file_name: string; content_text: string; tags: string[] }>> {
  try {
    const { data, error } = await supabase
      .from('knowledge_files')
      .select('file_name, content_text, tags')
      .eq('status', 'ready')
      .not('content_text', 'is', null)
      .limit(limit);

    if (error || !data) {
      console.error("Random knowledge error:", error);
      return [];
    }

    return data;
  } catch (e) {
    console.error("Error getting random knowledge:", e);
    return [];
  }
}

// Fallback: basic keyword search - improved to always return some results
async function basicSearch(supabase: any, query: string): Promise<Array<{ file_name: string; content_text: string; tags: string[]; matched: boolean }>> {
  try {
    // Get files with content
    const { data: files, error } = await supabase
      .from('knowledge_files')
      .select('file_name, content_text, tags')
      .eq('status', 'ready')
      .not('content_text', 'is', null)
      .limit(15);

    if (error || !files) {
      console.error("Basic search error:", error);
      return [];
    }

    // Simple keyword matching
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 1);
    const results: Array<{ file_name: string; content_text: string; tags: string[]; matched: boolean }> = [];
    const unmatched: typeof results = [];

    for (const file of files) {
      if (!file.content_text) continue;
      
      const content = file.content_text.toLowerCase();
      const tags = (file.tags || []).join(' ').toLowerCase();
      
      // Check if any keyword matches
      const matches = keywords.some(k => content.includes(k) || tags.includes(k));
      
      if (matches) {
        results.push({ ...file, matched: true });
      } else {
        unmatched.push({ ...file, matched: false });
      }
    }

    // If we have matched results, return them; otherwise return some unmatched as fallback
    if (results.length > 0) {
      return results.slice(0, 5);
    }
    
    // Return first few unmatched files as general context
    return unmatched.slice(0, 3);
  } catch (e) {
    console.error("Error in basic search:", e);
    return [];
  }
}

// Get knowledge context with semantic search - returns both context string and sources
// ALWAYS tries to return some knowledge context
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
        const truncated = r.content_text.length > 2500 
          ? r.content_text.substring(0, 2500) + '...' 
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
      const contents = basicResults.map(r => {
        const tags = r.tags?.length > 0 ? `[标签: ${r.tags.join(', ')}]` : '';
        const matchLabel = r.matched ? '[关键词匹配]' : '[参考资料]';
        const truncated = r.content_text.length > 2000 
          ? r.content_text.substring(0, 2000) + '...' 
          : r.content_text;
        return `【${r.file_name}】${tags} ${matchLabel}\n${truncated}`;
      });

      // Create sources for basic search too
      const sources = basicResults.map(r => ({
        fileName: r.file_name,
        similarity: r.matched ? 0.5 : 0.2, // Approximate similarity
        tags: r.tags || [],
      }));

      return {
        context: `\n\n以下是可能相关的知识库内容：\n\n${contents.join('\n\n---\n\n')}`,
        sources,
      };
    }

    // Last resort: get random knowledge files
    console.log("Getting random knowledge as fallback");
    const randomKnowledge = await getRandomKnowledge(supabase, 2);
    
    if (randomKnowledge.length > 0) {
      const contents = randomKnowledge.map(r => {
        const tags = r.tags?.length > 0 ? `[标签: ${r.tags.join(', ')}]` : '';
        const truncated = r.content_text.length > 1500 
          ? r.content_text.substring(0, 1500) + '...' 
          : r.content_text;
        return `【${r.file_name}】${tags} [背景参考]\n${truncated}`;
      });

      return {
        context: `\n\n以下是知识库中的参考资料（可能与问题相关）：\n\n${contents.join('\n\n---\n\n')}`,
        sources: randomKnowledge.map(r => ({
          fileName: r.file_name,
          similarity: 0.1,
          tags: r.tags || [],
        })),
      };
    }

    console.log("No knowledge found in database");
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

**极其重要的规则 - 必须遵守：**
1. 你必须优先且主要基于知识库内容来回答问题
2. 每次回答时，你都应该引用知识库中的相关文件名作为来源
3. 回答格式示例："根据《xxx文件》的规定，..."或"参考知识库中的《xxx》，..."
4. 如果知识库内容与问题相关度较低，你仍然应该尝试从中找到有用信息
5. 只有在知识库完全没有任何相关信息时，才说明"知识库中暂无相关信息"并提供通用建议
6. 即使是通用问题，也要尝试结合知识库中的校园政策或规定来回答${knowledgeContext}`;

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