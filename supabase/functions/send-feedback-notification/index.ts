import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

const escapeHtml = (s: string | null | undefined): string => {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackNotificationRequest {
  feedback_id: string;
  feedback_type: string;
  content: string | null;
  user_display_name: string;
  message_content: string | null;
  admin_emails: string[];
}

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
      message_content,
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

    const feedbackTypeText = feedback_type === "negative" ? "差评" : "好评";
    const feedbackEmoji = feedback_type === "negative" ? "👎" : "👍";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${feedback_type === "negative" ? "#ef4444" : "#22c55e"}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .section { background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #e5e7eb; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
          .value { font-size: 14px; color: #111827; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">${feedbackEmoji} 收到新的${feedbackTypeText}反馈</h2>
          </div>
          <div class="content">
            <div class="section">
              <div class="label">反馈用户</div>
              <div class="value">${escapeHtml(user_display_name) || "匿名用户"}</div>
            </div>
            ${content ? `
            <div class="section">
              <div class="label">用户反馈内容</div>
              <div class="value">${escapeHtml(content)}</div>
            </div>
            ` : ""}
            ${message_content ? `
            <div class="section">
              <div class="label">相关AI回复</div>
              <div class="value" style="max-height: 200px; overflow-y: auto;">${escapeHtml(message_content.slice(0, 500))}${message_content.length > 500 ? "..." : ""}</div>
            </div>
            ` : ""}
            <div class="section">
              <div class="label">反馈ID</div>
              <div class="value" style="font-family: monospace; font-size: 12px;">${escapeHtml(feedback_id)}</div>
            </div>
          </div>
          <div class="footer">
            请登录管理后台查看详情并处理此反馈
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
        from: "AI辅导员系统 <onboarding@resend.dev>",
        to: admin_emails,
        subject: `${feedbackEmoji} [${feedbackTypeText}] 收到新的用户反馈`,
        html: htmlContent,
      }),
    });

    const emailResponse = await response.json();

    if (!response.ok) {
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Feedback notification sent successfully:", emailResponse);

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
