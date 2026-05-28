import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `你是一位接触过大量真实岗位的职业教练。任务是为一个目标岗位生成一份"岗位画像"，让在校大学生快速、立体地了解这个工作真实的样子。

要求：
- 内容必须基于该岗位在国内一线/新一线城市的真实日常，避免空话套话；
- 语言口语化、像学长学姐分享，带具体场景与数字；
- "网友声音"模拟来自小红书 / 知乎 / B站 / 脉脉的用户口吻，正反观点都要有；
- 严格输出 JSON，不要额外解释。

JSON Schema:
{
  "tagline": string,                       // 一句话标签，<= 18 字
  "dailyRoutine": [                        // 6 条左右一天日常（按时间顺序）
    { "time": string, "activity": string }
  ],
  "pros": [string],                        // 3-4 条这份工作的"爽点"
  "cons": [string],                        // 3-4 条吐槽点/累点
  "voices": [                              // 4 条网友声音
    { "platform": "小红书"|"知乎"|"B站"|"脉脉"|"微博", "quote": string, "stance": "正面"|"中性"|"反面" }
  ],
  "growthMyth": string,                    // 1 条对该岗位最常见的误解 + 真相
  "hashtags": [string]                     // 6-8 个适合去社媒搜索的关键词/话题
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { title, category, skills } = await req.json();
    if (!title || typeof title !== "string") {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `目标岗位：${title}
所属方向：${category || "未指定"}
关键技能：${(skills || []).slice(0, 6).join("、") || "未指定"}

请按 schema 输出 JSON。`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI gateway error:", resp.status, txt);
      return new Response(JSON.stringify({ error: `AI gateway ${resp.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    return new Response(JSON.stringify({ insight: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("job-insights error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
