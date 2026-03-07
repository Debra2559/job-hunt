import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Search HZAU website for relevant career/employment information
async function searchHZAU(query: string): Promise<{ results: { url: string; title: string; snippet: string }[]; context: string }> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.log("FIRECRAWL_API_KEY not configured, skipping web search");
    return { results: [], context: "" };
  }

  try {
    // Search specifically on hzau.edu.cn
    const searchQuery = `site:hzau.edu.cn ${query}`;
    console.log("Searching HZAU:", searchQuery);

    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
        lang: "zh",
        country: "cn",
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
        },
      }),
    });

    if (!response.ok) {
      console.error("Firecrawl search error:", response.status);
      return { results: [], context: "" };
    }

    const data = await response.json();
    const results = (data.data || []).map((item: any) => ({
      url: item.url || "",
      title: item.title || item.metadata?.title || "华中农业大学",
      snippet: item.description || item.markdown?.substring(0, 200) || "",
    }));

    // Build context for AI
    const contextParts = (data.data || []).map((item: any) => {
      const title = item.title || item.metadata?.title || "";
      const url = item.url || "";
      const content = item.markdown ? item.markdown.substring(0, 1500) : item.description || "";
      return `【${title}】(${url})\n${content}`;
    });

    const context = contextParts.length > 0
      ? `\n\n以下是从华中农业大学官网搜索到的相关信息：\n\n${contextParts.join("\n\n---\n\n")}`
      : "";

    console.log(`Found ${results.length} results from HZAU website`);
    return { results, context };
  } catch (e) {
    console.error("HZAU search error:", e);
    return { results: [], context: "" };
  }
}

// Determine if the query needs web search
function needsWebSearch(messages: any[]): boolean {
  const lastMsg = messages.filter((m: any) => m.role === "user").pop()?.content || "";
  const searchKeywords = [
    "就业", "招聘", "实习", "政策", "通知", "公告", "活动", "讲座",
    "考研", "保研", "留学", "选调", "公务员", "创业", "双选会",
    "学校", "学院", "专业", "课程", "导师", "奖学金", "补贴",
    "培训", "证书", "比赛", "竞赛", "社团", "志愿", "最新", "最近",
    "岗位", "工作", "薪资", "行业", "趋势", "发展", "前景",
  ];
  return searchKeywords.some((kw) => lastMsg.includes(kw));
}

const SYSTEM_PROMPT = `你是一位专业的职业规划顾问，专门帮助华中农业大学的学生进行职业测评和规划。

你的任务是通过对话式引导，逐步了解学生的以下维度：
1. **性格特征** - MBTI倾向、内外向、决策风格等
2. **专业背景** - 所学专业、核心课程、技能特长
3. **兴趣爱好** - 日常兴趣、热衷领域、自我驱动方向
4. **职业倾向** - 偏好的工作类型、工作环境、发展路径
5. **价值观** - 对薪资、稳定性、成就感、工作生活平衡的优先级

**对话规则：**
- 每次只问1-2个问题，不要一次性提太多问题
- 用轻松友善的语气，像朋友聊天一样
- 适当使用emoji让对话更轻松
- 在收集到足够信息后（通常4-6轮对话），主动生成完整的职业规划报告

**重要：选项式提问格式（必须严格遵守）：**
当你提问时，尽量提供可选择的选项让学生快速点击回答。选项用以下格式，每个选项独占一行：
A. 选项内容
B. 选项内容
C. 选项内容
D. 选项内容（如需要）

选项要求：
- 每个选项文字简短，不超过20个字
- 选项要尽可能全面覆盖常见情况
- 提供3-5个选项
- 最后一个选项可以是"其他/以上都不是"之类的兜底选项
- 选项前用大写字母A/B/C/D/E标注

示例：
"你更偏好哪种工作方式？ 🤔

A. 独立钻研，深度思考
B. 团队协作，头脑风暴
C. 带领团队，指挥协调
D. 自由灵活，远程办公
E. 都可以，看具体情况"

**引用网站信息规则：**
- 当你引用华中农业大学官网的信息时，必须在相关内容后附上来源链接
- 链接格式：[查看详情](URL) 或 [来源名称](URL)
- 主动结合学校的就业政策、招聘信息、培训资源等给出建议
- 如果搜索到相关活动或通知，要推荐给学生

**当你认为已经收集到足够信息时，必须按以下JSON格式输出报告（用 \`\`\`career-report 和 \`\`\` 包裹）：**

\`\`\`career-report
{
  "personality": {
    "type": "MBTI类型或性格描述",
    "traits": [
      { "name": "维度名称", "score": 85, "label": "高/中/低" }
    ],
    "summary": "性格总结描述"
  },
  "analysis": {
    "strengths": ["优势1", "优势2", "优势3"],
    "interests": ["兴趣方向1", "兴趣方向2"],
    "values": ["核心价值观1", "核心价值观2"]
  },
  "recommendations": [
    {
      "title": "岗位名称",
      "match": 92,
      "category": "行业类别",
      "salary": "薪资范围",
      "outlook": "发展前景描述",
      "reasons": ["推荐理由1", "推荐理由2"],
      "skills": ["需要技能1", "需要技能2"],
      "path": "成长路径描述"
    }
  ],
  "trends": [
    { "industry": "行业名", "trend": "上升/稳定/下降", "description": "趋势描述" }
  ],
  "learningPath": [
    { "phase": "阶段名", "duration": "时间", "actions": ["行动1", "行动2"] }
  ],
  "resources": [
    { "title": "资源名称", "url": "链接地址", "description": "简要描述" }
  ]
}
\`\`\`

在生成报告之前，先用一段文字总结你的分析思路，然后输出报告JSON。
报告中推荐3-5个岗位，每个岗位的match分数要根据实际匹配度合理分配（60-98之间）。
性格traits提供5-6个维度，score在30-95之间。
结合当前就业市场趋势给出建议。
resources字段包含从学校官网搜索到的相关资源链接。`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Search HZAU website if the query seems relevant
    let webContext = "";
    let webSources: { url: string; title: string; snippet: string }[] = [];

    if (needsWebSearch(messages)) {
      const lastUserMsg = messages.filter((m: any) => m.role === "user").pop()?.content || "";
      const { results, context } = await searchHZAU(lastUserMsg);
      webContext = context;
      webSources = results;
    }

    const systemPrompt = SYSTEM_PROMPT + webContext;

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
        return new Response(JSON.stringify({ error: "AI服务额度不足。" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we have web sources, prepend them as a special SSE event
    if (webSources.length > 0) {
      const sourcesEvent = `data: ${JSON.stringify({ webSources })}\n\n`;
      const encoder = new TextEncoder();
      const sourcesChunk = encoder.encode(sourcesEvent);

      // Combine sources event with the AI stream
      const combinedStream = new ReadableStream({
        async start(controller) {
          // Send sources first
          controller.enqueue(sourcesChunk);

          // Then pipe AI response
          const reader = response.body!.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } finally {
            controller.close();
          }
        },
      });

      return new Response(combinedStream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Career agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
