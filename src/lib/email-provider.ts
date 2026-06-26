import "server-only";

import net from "node:net";
import tls from "node:tls";

type SendEmailInput = {
  from: string;
  html: string;
  preheader?: string | null;
  replyTo?: string | null;
  subject: string;
  to: string;
  unsubscribeUrl?: string | null;
};

type ResendSuccess = {
  id?: string;
};

type ResendError = {
  message?: string;
  name?: string;
};

export type SendEmailResult = {
  deliveredTo?: string;
  mode: EmailProviderMode;
  provider: "resend" | "smtp";
  providerId?: string;
};

export type EmailProviderMode = "resend" | "smtp-demo";

type SmtpConfig = {
  host: string;
  pass?: string;
  port: number;
  secure: boolean;
  user?: string;
};

export function getEmailProviderMode(): EmailProviderMode {
  const provider = process.env.EMAIL_PROVIDER;

  return provider === "smtp" ||
    provider === "smtp-demo" ||
    process.env.SMTP_DEMO_EMAIL_MODE === "true"
    ? "smtp-demo"
    : "resend";
}

function getRequiredResendEnv() {
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

function getRequiredSmtpEnv(): SmtpConfig {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);

  if (!host) {
    throw new Error("Missing SMTP_HOST. Add it before using SMTP demo email mode.");
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid port number.");
  }

  return {
    host,
    pass: process.env.SMTP_PASS,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user: process.env.SMTP_USER,
  };
}

function buildEmailHtml({
  html,
  preheader,
  unsubscribeUrl,
}: Pick<SendEmailInput, "html" | "preheader" | "unsubscribeUrl">) {
  const hiddenPreheader = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>`
    : "";
  const unsubscribeFooter = unsubscribeUrl
    ? `<div style="margin-top:14px;">
          <a href="${escapeHtml(unsubscribeUrl)}" style="display:inline-block;border:1px solid #d4d4d8;padding:8px 12px;color:#52525b;text-decoration:none;font-weight:bold;">
            Unsubscribe from emails
          </a>
        </div>`
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
        ${unsubscribeFooter}
      </div>
    </div>
  </body>
</html>`;
}

function getEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);

  return (match?.[1] ?? value).trim();
}

function formatSmtpDate(date = new Date()) {
  return date.toUTCString().replace("GMT", "+0000");
}

function encodeHeader(value: string) {
  return value.replace(/\r?\n/g, " ").trim();
}

function dotStuff(value: string) {
  return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSmtpMessage(input: SendEmailInput, deliveredTo: string) {
  const html = buildEmailHtml({
    html: `<p style="margin:0 0 18px;color:#374151;"><strong>SMTP demo mode:</strong> intended recipient ${escapeHtml(input.to)}</p>${input.html}`,
    preheader: input.preheader,
    unsubscribeUrl: input.unsubscribeUrl,
  });

  return [
    `From: ${encodeHeader(input.from)}`,
    `To: ${encodeHeader(deliveredTo)}`,
    `Reply-To: ${encodeHeader(input.replyTo || input.from)}`,
    `Subject: ${encodeHeader(`[Demo] ${input.subject}`)}`,
    `Date: ${formatSmtpDate()}`,
    ...(input.unsubscribeUrl
      ? [
          `List-Unsubscribe: <${encodeHeader(input.unsubscribeUrl)}>`,
          "List-Unsubscribe-Post: List-Unsubscribe=One-Click",
        ]
      : []),
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
  ].join("\r\n");
}

async function sendSmtpCommand(
  socket: net.Socket | tls.TLSSocket,
  command: string,
  expectedCodes: number[],
) {
  socket.write(`${command}\r\n`);

  return readSmtpResponse(socket, expectedCodes);
}

function readSmtpResponse(
  socket: net.Socket | tls.TLSSocket,
  expectedCodes: number[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const lastLine = lines.at(-1);

      if (!lastLine || !/^\d{3} /.test(lastLine)) {
        return;
      }

      const code = Number(lastLine.slice(0, 3));
      cleanup();

      if (!expectedCodes.includes(code)) {
        reject(new Error(`SMTP rejected command: ${buffer.trim()}`));
        return;
      }

      resolve(buffer);
    };

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function openSmtpSocket(config: SmtpConfig) {
  const socket = config.secure
    ? tls.connect({
        host: config.host,
        port: config.port,
        servername: config.host,
      })
    : net.connect({
        host: config.host,
        port: config.port,
      });

  await new Promise<void>((resolve, reject) => {
    socket.once(config.secure ? "secureConnect" : "connect", resolve);
    socket.once("error", reject);
  });
  await readSmtpResponse(socket, [220]);

  return socket;
}

async function upgradeSmtpSocket(socket: net.Socket, host: string) {
  const secureSocket = tls.connect({
    servername: host,
    socket,
  });

  await new Promise<void>((resolve, reject) => {
    secureSocket.once("secureConnect", resolve);
    secureSocket.once("error", reject);
  });

  return secureSocket;
}

async function sendSmtpDemoEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = getRequiredSmtpEnv();
  const deliveredTo = process.env.SMTP_DEMO_TO_EMAIL?.trim() || input.to;
  const fromAddress = getEmailAddress(input.from);
  let socket = await openSmtpSocket(config);
  const ehloHost = process.env.SMTP_HELO_NAME || "gridiron-alumni.local";
  const ehloResponse = await sendSmtpCommand(socket, `EHLO ${ehloHost}`, [250]);

  if (!config.secure && ehloResponse.includes("STARTTLS")) {
    await sendSmtpCommand(socket, "STARTTLS", [220]);
    socket = await upgradeSmtpSocket(socket, config.host);
    await sendSmtpCommand(socket, `EHLO ${ehloHost}`, [250]);
  }

  if (config.user && config.pass) {
    await sendSmtpCommand(socket, "AUTH LOGIN", [334]);
    await sendSmtpCommand(socket, Buffer.from(config.user).toString("base64"), [334]);
    await sendSmtpCommand(socket, Buffer.from(config.pass).toString("base64"), [235]);
  }

  await sendSmtpCommand(socket, `MAIL FROM:<${fromAddress}>`, [250]);
  await sendSmtpCommand(socket, `RCPT TO:<${deliveredTo}>`, [250, 251]);
  await sendSmtpCommand(socket, "DATA", [354]);
  socket.write(`${dotStuff(buildSmtpMessage(input, deliveredTo))}\r\n.\r\n`);
  await readSmtpResponse(socket, [250]);
  await sendSmtpCommand(socket, "QUIT", [221]).catch(() => undefined);
  socket.end();

  return {
    deliveredTo,
    mode: "smtp-demo",
    provider: "smtp",
  };
}

async function sendResendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { apiKey } = getRequiredResendEnv();
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: input.from,
      html: buildEmailHtml(input),
      headers: input.unsubscribeUrl
        ? {
            "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined,
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
    deliveredTo: input.to,
    mode: "resend",
    provider: "resend",
    providerId: payload && "id" in payload ? payload.id : undefined,
  };
}

export async function sendCampaignTestEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (getEmailProviderMode() === "smtp-demo") {
    return sendSmtpDemoEmail(input);
  }

  return sendResendEmail(input);
}
