const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return jsonResponse({ error: "prompt is required" }, 400);
    }

    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    const model = Deno.env.get("LLM_MODEL") || "deepseek-v4-pro";

    if (!apiKey) {
      return jsonResponse({ error: "DEEPSEEK_API_KEY is not configured" }, 500);
    }

    const resp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      return jsonResponse({
        error: "DeepSeek request failed",
        status: resp.status,
        detail: detail.slice(0, 500),
      }, 502);
    }

    const data = await resp.json() as DeepSeekResponse;
    if (data.error?.message) {
      return jsonResponse({ error: data.error.message }, 502);
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return jsonResponse({ error: "DeepSeek response is invalid or empty" }, 502);
    }

    return jsonResponse({ content });
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unknown career-llm error",
    }, 500);
  }
});
