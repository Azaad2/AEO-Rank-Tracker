import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendEmail } from "../_shared/sendgrid.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  domain: string;
  score: number;
  scanId?: string;
}

function buildHtml({
  domain,
  score,
  scanId,
}: {
  domain: string;
  score: number;
  scanId?: string;
}) {
  const siteUrl = "https://aimentionyou.com";
  const resultsUrl = scanId ? `${siteUrl}/?scan=${scanId}` : siteUrl;
  const scoreColor = score >= 70 ? "#22c55e" : score >= 40 ? "#facc15" : "#ef4444";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Your AI Visibility Scan is Ready</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fafafa;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="color:#facc15;font-size:24px;margin:0 0 8px;letter-spacing:-0.5px;">AI Mention You</h1>
        <p style="color:#a3a3a3;font-size:14px;margin:0;">Your AI Visibility Scan is ready</p>
      </div>

      <div style="background:#171717;border:1px solid #262626;border-radius:12px;padding:32px 24px;text-align:center;margin-bottom:24px;">
        <p style="color:#a3a3a3;font-size:14px;margin:0 0 8px;">Visibility score for</p>
        <p style="color:#fafafa;font-size:18px;font-weight:600;margin:0 0 20px;">${domain}</p>
        <div style="font-size:64px;font-weight:800;color:${scoreColor};line-height:1;margin-bottom:8px;">${score}</div>
        <p style="color:#737373;font-size:13px;margin:0;">out of 100</p>
      </div>

      <div style="background:#171717;border:1px solid #262626;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#fafafa;font-size:16px;margin:0 0 12px;">What's inside your full report</h2>
        <ul style="color:#d4d4d4;font-size:14px;line-height:1.7;padding-left:20px;margin:0;">
          <li>All prompt results across Gemini, Perplexity & Search</li>
          <li>Your personalized improvement roadmap</li>
          <li>Top competitors mentioned in your category</li>
          <li>CSV export with detailed recommendations</li>
        </ul>
      </div>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${resultsUrl}" style="display:inline-block;background:#facc15;color:#0a0a0a;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:8px;font-size:15px;">View Full Results →</a>
      </div>

      <div style="background:#1a1a0a;border:1px solid #facc15;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="color:#facc15;font-size:14px;font-weight:600;margin:0 0 8px;">Track your score weekly</p>
        <p style="color:#d4d4d4;font-size:13px;margin:0 0 16px;">Get automated daily scans, competitor alerts & action plans</p>
        <a href="${siteUrl}/pricing" style="color:#facc15;text-decoration:underline;font-size:13px;font-weight:600;">See Pro plans from $19/mo →</a>
      </div>

      <p style="color:#737373;font-size:12px;text-align:center;margin:32px 0 0;line-height:1.6;">
        You're receiving this because you ran a free AI visibility scan on aimentionyou.com.<br/>
        Questions? Reply to this email or contact <a href="mailto:hello@aimentionyou.com" style="color:#facc15;">hello@aimentionyou.com</a>
      </p>
    </div>
  </body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { email, domain, score, scanId } = body;

    if (!email || !domain || typeof score !== "number") {
      return new Response(
        JSON.stringify({ error: "email, domain, and score are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await sendEmail({
      to: email,
      subject: `Your AI Visibility Score for ${domain}: ${score}/100`,
      html: buildHtml({ domain, score, scanId }),
    });

    if (!result.ok) {
      console.error("send-scan-complete failed:", result.error);
      return new Response(
        JSON.stringify({ error: result.error ?? "Send failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, messageId: result.messageId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("send-scan-complete error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
