type SendEmailInput = {
  from: string;
  html: string;
  preheader?: string | null;
  replyTo?: string | null;
  subject: string;
  to: string;
};

type ResendSuccess = {
  id?: string;
};

type ResendError = {
  message?: string;
  name?: string;
};

export type SendEmailResult = {
  provider: "resend";
  providerId?: string;
};

function getRequiredEmailEnv() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing RESEND_API_KEY. Add it in Vercel Environment Variables, then redeploy.",
    );
  }

  return {
    apiKey,
  };
}

function buildEmailHtml({ html, preheader }: Pick<SendEmailInput, "html" | "preheader">) {
  const hiddenPreheader = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f4f5;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    ${hiddenPreheader}
    <div style="margin:0 auto;max-width:680px;background:#ffffff;border:1px solid #e4e4e7;">
      <div style="height:8px;background:#d71920;"></div>
      <div style="padding:28px;color:#111827;font-size:16px;line-height:1.6;">
        ${html}
      </div>
      <div style="border-top:1px solid #e4e4e7;padding:18px 28px;color:#6b7280;font-size:12px;">
        Swift Current Colts Football Alumni and Booster Club
      </div>
    </div>
  </body>
</html>`;
}

export async function sendCampaignTestEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { apiKey } = getRequiredEmailEnv();
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: input.from,
      html: buildEmailHtml(input),
      reply_to: input.replyTo || undefined,
      subject: input.subject,
      to: [input.to],
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = (await response.json().catch(() => null)) as
    | ResendSuccess
    | ResendError
    | null;

  if (!response.ok) {
    const message =
      payload && "message" in payload && payload.message
        ? payload.message
        : `Resend rejected the test email with status ${response.status}.`;
    throw new Error(message);
  }

  return {
    provider: "resend",
    providerId: payload && "id" in payload ? payload.id : undefined,
  };
}
