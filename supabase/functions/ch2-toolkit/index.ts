import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Different modes for chapter 2 toolkit
type Mode = "resume" | "tips" | "company" | "agent";

const PROMPTS: Record<Mode, string> = {
  resume: `你是一位顶级简历教练。基于用户提供的零散经历/语音/文字，输出一份**面向校招**的、可直接复制到 PDF 的中文简历草稿（Markdown 格式）。

要求：
- 结构：个人信息 / 求职意向 / 教育背景 / 实习与项目经历 / 校园经历 / 技能特长 / 自我评价
- 项目/实习用 **STAR 法则** + 量化数据描述（X% / Y 倍 / N 人 等）
- 动词开头、避免主语，例如「主导 / 推动 / 沉淀 / 复盘」
- 不要编造任何用户没提供的事实，缺失就写「（待补充：xxx）」
- 末尾追加一段 \`## 💡 简历医生点评\`，给出 3 条具体改进建议`,

  tips: `你是一位陪伴过 1000+ 应届生上岸的求职 mentor。回答任何求职细节问题时：
- 第一句话直接给结论
- 用「✅ 这样做 / ❌ 别这样做」对比展示
- 给出 1-2 个具体真实的场景例子（行业、岗位、时间点）
- 控制在 200 字内，不要鸡汤
- 如果问题模糊，主动反问 1 个澄清问题`,

  company: `你是一位行业研究员。给定公司名/行业，输出 JSON：
{
  "tagline": "一句话介绍 <=20字",
  "business": "主营业务，3-4 句话",
  "culture": ["文化关键词1", "文化关键词2", "文化关键词3", "文化关键词4"],
  "highlights": ["最近 1 年的亮点 1", "亮点 2", "亮点 3"],
  "concerns": ["求职者需要注意的点 1", "注意点 2"],
  "interviewFocus": ["该公司面试常考点 1", "常考点 2", "常考点 3"],
  "searchKeywords": ["适合社媒搜索的关键词 6 个"]
}
信息基于公开认知，避免编造具体数据；不确定的写「公开信息有限」。只输出 JSON。`,

  agent: `你是用户的"专属求职 Agent"。用户已经投喂了一些素材（播客/文章/书摘/社媒帖），你的回答必须：
- 风格融合用户素材中的观点和句式
- 每个回答末尾用 \`📚 引用了你的素材：xxx\` 标注主要参考
- 给出可执行的下一步建议（最多 3 条）`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const mode: Mode = body.mode;
    const userInput: string = body.input || "";
    const context: string = body.context || "";

    if (!mode || !PROMPTS[mode]) {
      return new Response(JSON.stringify({ error: "invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isJson = mode === "company";
    const messages = [
      { role: "system", content: PROMPTS[mode] },
      ...(context ? [{ role: "user", content: `参考素材：\n${context}` }] : []),
      { role: "user", content: userInput },
    ];

    // company mode returns JSON; others stream
    if (isJson) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          response_format: { type: "json_object" },
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("AI error", resp.status, txt);
        return new Response(JSON.stringify({ error: `AI ${resp.status}` }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || "{}";
      let parsed: unknown;
      try { parsed = JSON.parse(content); } catch { parsed = { error: "parse failed", raw: content }; }
      return new Response(JSON.stringify({ data: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // streaming for resume / tips / agent
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!resp.ok || !resp.body) {
      const txt = await resp.text().catch(() => "");
      console.error("AI stream error", resp.status, txt);
      return new Response(JSON.stringify({ error: `AI ${resp.status}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("ch2-toolkit error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
