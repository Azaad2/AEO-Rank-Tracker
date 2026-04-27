// Shared SendGrid email helper for edge functions.
// Uses SendGrid v3 Mail Send API: https://api.sendgrid.com/v3/mail/send

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    /** Base64-encoded file content */
    content: string;
    type?: string;
    disposition?: "attachment" | "inline";
  }>;
}

export interface SendEmailResult {
  ok: boolean;
  status: number;
  messageId?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = Deno.env.get("SENDGRID_API_KEY");
  if (!apiKey) {
    return { ok: false, status: 0, error: "SENDGRID_API_KEY is not configured" };
  }

  const fromEmail =
    params.from ?? Deno.env.get("SENDGRID_FROM_EMAIL") ?? "hello@aimentionyou.com";
  const fromName =
    params.fromName ?? Deno.env.get("SENDGRID_FROM_NAME") ?? "AI Mention You";

  const recipients = (Array.isArray(params.to) ? params.to : [params.to])
    .map((e) => ({ email: e }));

  const body: Record<string, unknown> = {
    personalizations: [{ to: recipients, subject: params.subject }],
    from: { email: fromEmail, name: fromName },
    content: [
      ...(params.text ? [{ type: "text/plain", value: params.text }] : []),
      { type: "text/html", value: params.html },
    ],
  };

  if (params.replyTo) {
    body.reply_to = { email: params.replyTo };
  }

  if (params.attachments && params.attachments.length > 0) {
    body.attachments = params.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      type: a.type ?? "application/octet-stream",
      disposition: a.disposition ?? "attachment",
    }));
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("SendGrid send failed:", res.status, errText);
      return { ok: false, status: res.status, error: errText };
    }

    const messageId = res.headers.get("x-message-id") ?? undefined;
    return { ok: true, status: res.status, messageId };
  } catch (err) {
    console.error("SendGrid request error:", err);
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
