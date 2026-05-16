import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (s: string | null | undefined): string => {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

// Render a multi-line text block while preserving line breaks
const renderMultiline = (s: string | null | undefined, max = 4000): string => {
  if (!s) return "";
  const truncated = s.length > max ? `${s.slice(0, max)}\n…（已截断）` : s;
  return escapeHtml(truncated).replace(/\n/g, "<br/>");
};

interface KnowledgeSource {
  fileName: string;
  similarity: number;
  snippet?: string | null;
}

interface FeedbackNotificationRequest {
  feedback_id: string;
  feedback_type: string;
  content: string | null;
  user_display_name: string;
  user_question?: string | null;
  message_content: string | null;
  tag_labels?: string[];
  sources?: KnowledgeSource[];
  app_origin?: string;
  admin_emails: string[];
}

const DEFAULT_APP_ORIGIN = "https://ai-counselor.top";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  if (!auth.ok) return auth.response!;

  try {
    const {
      feedback_id,
      feedback_type,
      content,
      user_display_name,
      user_question,
      message_content,
      tag_labels,
      sources,
      app_origin,
      admin_emails,
    }: FeedbackNotificationRequest = await req.json();

    if (!admin_emails || admin_emails.length === 0) {
      console.log("No admin emails provided, skipping notification");
      return new Response(
        JSON.stringify({ message: "No admin emails to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const isNegative = feedback_type === "negative";
    const feedbackTypeText = isNegative ? "差评" : "好评";
    const feedbackEmoji = isNegative ? "👎" : "👍";
    const headerColor = isNegative ? "#ef4444" : "#22c55e";

    // Safe origin: must be http(s) and not contain whitespace
    const safeOrigin =
      typeof app_origin === "string" && /^https?:\/\/[^\s]+$/.test(app_origin)
        ? app_origin.replace(/\/+$/, "")
        : DEFAULT_APP_ORIGIN;
    const adminLink = `${safeOrigin}/admin?tab=feedback&feedback_id=${encodeURIComponent(feedback_id)}`;

    const tagsHtml =
      tag_labels && tag_labels.length > 0
        ? `<div class="section">
            <div class="label">用户选择的反馈标签</div>
            <div class="value">
              ${tag_labels
                .map(
                  (t) =>
                    `<span class="tag">${escapeHtml(t)}</span>`
                )
                .join(" ")}
            </div>
          </div>`
        : "";

    const sourcesHtml =
      sources && sources.length > 0
        ? `<div class="section">
            <div class="label">本次回答引用的知识库文档（${sources.length}）</div>
            <div class="value">
              <ol style="margin: 0; padding-left: 18px;">
                ${sources
                  .map((s) => {
                    const sim =
                      typeof s.similarity === "number"
                        ? ` <span style="color:#9ca3af;">· 相关度 ${(s.similarity * 100).toFixed(0)}%</span>`
                        : "";
                    const snippet = s.snippet
                      ? `<div style="margin-top:4px; padding:8px 10px; background:#f3f4f6; border-left:3px solid ${headerColor}; border-radius:4px; font-size:13px; color:#4b5563;">${renderMultiline(s.snippet, 400)}</div>`
                      : "";
                    return `<li style="margin-bottom:10px;"><strong>${escapeHtml(s.fileName)}</strong>${sim}${snippet}</li>`;
                  })
                  .join("")}
              </ol>
            </div>
          </div>`
        : isNegative
        ? `<div class="section">
            <div class="label">本次回答引用的知识库文档</div>
            <div class="value" style="color:#9ca3af; font-style:italic;">本次回答未检索到任何知识库文档（可能是知识库内容缺失或检索策略问题）</div>
          </div>`
        : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background:#f3f4f6; margin:0; padding:20px 0; }
          .container { max-width: 640px; margin: 0 auto; padding: 0 16px; }
          .header { background: ${headerColor}; color: white; padding: 20px 24px; border-radius: 10px 10px 0 0; }
          .header h2 { margin: 0; font-size: 18px; }
          .content { background: #ffffff; padding: 20px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          .section { background: #fafafa; padding: 14px 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #eef0f3; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.04em; }
          .value { font-size: 14px; color: #111827; word-break: break-word; }
          .tag { display:inline-block; background:#fef3c7; color:#92400e; border:1px solid #fde68a; border-radius:999px; padding:2px 10px; font-size:12px; margin-right:6px; margin-bottom:4px; }
          .cta { text-align:center; margin: 22px 0 6px; }
          .cta a { display:inline-block; background:${headerColor}; color:#ffffff !important; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600; font-size:14px; }
          .footer { text-align: center; margin-top: 18px; font-size: 12px; color: #9ca3af; }
          .meta { font-size:12px; color:#6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${feedbackEmoji} 收到新的${feedbackTypeText}反馈</h2>
            <div style="font-size:12px; opacity:0.9; margin-top:4px;">反馈用户：${escapeHtml(user_display_name) || "匿名用户"}</div>
          </div>
          <div class="content">
            ${tagsHtml}

            ${content ? `
            <div class="section">
              <div class="label">用户补充说明</div>
              <div class="value">${renderMultiline(content, 1000)}</div>
            </div>
            ` : ""}

            ${user_question ? `
            <div class="section">
              <div class="label">学生的原始提问</div>
              <div class="value">${renderMultiline(user_question, 1500)}</div>
            </div>
            ` : ""}

            ${message_content ? `
            <div class="section">
              <div class="label">AI 的完整回答</div>
              <div class="value" style="max-height:360px; overflow-y:auto;">${renderMultiline(message_content, 4000)}</div>
            </div>
            ` : ""}

            ${sourcesHtml}

            <div class="cta">
              <a href="${adminLink}" target="_blank" rel="noopener">前往后台处理此反馈 →</a>
            </div>

            <div class="section">
              <div class="meta">
                反馈 ID：<span style="font-family:monospace;">${escapeHtml(feedback_id)}</span><br/>
                收到时间：${escapeHtml(new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }))}
              </div>
            </div>
          </div>
          <div class="footer">
            校园AI辅导员 · 自动预警通知
          </div>
        </div>
      </body>
      </html>
    `;

    // Use Resend API directly via fetch
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "校园AI辅导员 <onboarding@resend.dev>",
        to: admin_emails,
        subject: `${feedbackEmoji} [${feedbackTypeText}] ${escapeHtml(user_display_name) || "用户"} 提交了新的反馈`,
        html: htmlContent,
      }),
    });

    const emailResponse = await response.json();

    if (!response.ok) {
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Feedback notification sent successfully:", emailResponse?.id || "(no id)");

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending feedback notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
