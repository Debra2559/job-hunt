import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Improved keyword-based search with scoring
async function keywordSearch(
  supabase: any, 
  query: string
): Promise<Array<{ file_name: string; content_text: string; tags: string[]; score: number; id: string }>> {
  try {
    // Get all files with content
    const { data: files, error } = await supabase
      .from('knowledge_files')
      .select('id, file_name, content_text, tags')
      .eq('status', 'ready')
      .not('content_text', 'is', null);

    if (error || !files) {
      console.error("Keyword search error:", error);
      return [];
    }

    console.log(`Found ${files.length} knowledge files to search`);

    // Extract keywords from query (filter short words and common words)
    const stopWords = new Set(['的', '是', '在', '有', '和', '了', '我', '你', '他', '她', '它', '们', '这', '那', '什么', '怎么', '如何', '吗', '呢', '吧', '啊', '请', '能', '可以', '想', '要', '问', '一下', '关于', '一些', '一个']);
    const keywords = query
      .toLowerCase()
      .replace(/[，。？！、；：""''（）【】《》\s]/g, ' ')
      .split(/\s+/)
      .filter(k => k.length >= 2 && !stopWords.has(k));
    
    console.log("Search keywords:", keywords.join(", "));

    const results: Array<{ file_name: string; content_text: string; tags: string[]; score: number; id: string }> = [];

    for (const file of files) {
      if (!file.content_text) continue;
      
      const content = file.content_text.toLowerCase();
      const fileName = file.file_name.toLowerCase();
      const tags = (file.tags || []).join(' ').toLowerCase();
      
      let score = 0;
      let matchedKeywords: string[] = [];
      
      for (const keyword of keywords) {
        // Count occurrences in content
        const contentMatches = (content.match(new RegExp(keyword, 'g')) || []).length;
        // Check filename match (higher weight)
        const fileNameMatch = fileName.includes(keyword) ? 3 : 0;
        // Check tags match (higher weight)
        const tagsMatch = tags.includes(keyword) ? 2 : 0;
        
        if (contentMatches > 0 || fileNameMatch > 0 || tagsMatch > 0) {
          score += Math.min(contentMatches, 10) + fileNameMatch + tagsMatch;
          matchedKeywords.push(keyword);
        }
      }
      
      if (score > 0) {
        // Boost score by percentage of keywords matched
        const keywordCoverage = matchedKeywords.length / keywords.length;
        score = score * (0.5 + keywordCoverage * 0.5);
        
        results.push({
          id: file.id,
          file_name: file.file_name,
          content_text: file.content_text,
          tags: file.tags || [],
          score,
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    
    console.log(`Keyword search found ${results.length} matching files`);
    return results.slice(0, 5);
  } catch (e) {
    console.error("Error in keyword search:", e);
    return [];
  }
}

// Get some knowledge files as fallback context
async function getFallbackKnowledge(
  supabase: any, 
  limit: number = 3
): Promise<Array<{ file_name: string; content_text: string; tags: string[]; id: string }>> {
  try {
    const { data, error } = await supabase
      .from('knowledge_files')
      .select('id, file_name, content_text, tags')
      .eq('status', 'ready')
      .not('content_text', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error("Fallback knowledge error:", error);
      return [];
    }

    return data;
  } catch (e) {
    console.error("Error getting fallback knowledge:", e);
    return [];
  }
}

// Get knowledge context - ALWAYS tries to return some knowledge context
async function getKnowledgeContext(
  supabase: any, 
  userQuery: string
): Promise<{ context: string; sources: Array<{ fileName: string; similarity: number; tags: string[]; id: string }> }> {
  try {
    // Try keyword search first
    const keywordResults = await keywordSearch(supabase, userQuery);
    
    if (keywordResults.length > 0) {
      const sources = keywordResults.map(r => ({
        id: r.id,
        fileName: r.file_name,
        similarity: Math.min(r.score / 10, 1), // Normalize score to 0-1 range for similarity
        tags: r.tags || [],
      }));

      const contents = keywordResults.map(r => {
        const tags = r.tags?.length > 0 ? `[标签: ${r.tags.join(', ')}]` : '';
        const scoreLabel = `[匹配度: ${Math.min(Math.round(r.score * 10), 100)}%]`;
        const truncated = r.content_text.length > 3000 
          ? r.content_text.substring(0, 3000) + '...' 
          : r.content_text;
        return `【${r.file_name}】${tags} ${scoreLabel}\n${truncated}`;
      });
      
      console.log(`Returning ${sources.length} keyword matched sources`);
      return {
        context: `\n\n以下是与问题相关的知识库内容：\n\n${contents.join('\n\n---\n\n')}`,
        sources,
      };
    }

    // Fallback: get recent knowledge files
    console.log("No keyword matches, getting fallback knowledge");
    const fallbackKnowledge = await getFallbackKnowledge(supabase, 3);
    
    if (fallbackKnowledge.length > 0) {
      const contents = fallbackKnowledge.map(r => {
        const tags = r.tags?.length > 0 ? `[标签: ${r.tags.join(', ')}]` : '';
        const truncated = r.content_text.length > 2000 
          ? r.content_text.substring(0, 2000) + '...' 
          : r.content_text;
        return `【${r.file_name}】${tags} [参考资料]\n${truncated}`;
      });

      return {
        context: `\n\n以下是知识库中的参考资料（供参考）：\n\n${contents.join('\n\n---\n\n')}`,
        sources: fallbackKnowledge.map(r => ({
          id: r.id,
          fileName: r.file_name,
          similarity: 0.5, // Default similarity for fallback sources
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

    // Extract latest user query for knowledge search
    const latestUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop()?.content || '';
    
    console.log("User query for knowledge search:", latestUserMessage.substring(0, 100));

    // Get knowledge base context using keyword search
    const { context: knowledgeContext, sources } = await getKnowledgeContext(supabase, latestUserMessage);
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

**极其重要的规则 - 必须严格遵守：**
1. 你必须优先且主要基于下方知识库内容来回答问题
2. 每次回答时，必须引用知识库中的相关文件名作为来源，格式如："根据《xxx文件》的规定，..."
3. 如果知识库中有相关内容，必须使用并引用
4. 即使是通用问题，也要尝试结合知识库中的校园政策或规定来回答
5. 只有在知识库完全没有任何相关信息时，才可以说明"知识库中暂无相关信息"并提供通用建议${knowledgeContext}`;

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
      // Log usage in background (fire and forget)
      (async () => {
        for (const source of sources) {
          try {
            await supabase.from('knowledge_usage').insert({
              file_id: source.id,
              user_query: latestUserMessage.substring(0, 500),
              similarity: source.similarity,
            });
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
