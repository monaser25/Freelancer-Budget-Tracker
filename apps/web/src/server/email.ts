import nodemailer, { type Transporter } from 'nodemailer';

/**
 * SMTP email transport, configured entirely from environment variables.
 *
 * SECURITY: SMTP_PASS is read here and handed to nodemailer only. It is never
 * logged, never returned to the client, and never embedded in error messages.
 */

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
};

export const getSmtpConfig = (): SmtpConfig | null => {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS; // do not trim/log — treat as opaque secret
  const from = process.env.SMTP_FROM?.trim() || user;

  if (!host || !user || !pass || !from) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE.toLowerCase() === 'true'
    : port === 465;

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user,
    pass,
    from,
    fromName: process.env.SMTP_FROM_NAME?.trim() || 'Haseeela',
  };
};

export const isSmtpConfigured = () => getSmtpConfig() !== null;

export type SmtpErrorCode = 'not_configured' | 'auth' | 'send';

export class SmtpError extends Error {
  code: SmtpErrorCode;
  constructor(code: SmtpErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'SmtpError';
  }
}

let cached: Transporter | null = null;

const getTransport = (cfg: SmtpConfig): Transporter => {
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  return cached;
};

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
};

export const sendMail = async (input: SendMailInput): Promise<{ messageId: string }> => {
  const cfg = getSmtpConfig();
  if (!cfg) throw new SmtpError('not_configured', 'Email sending is not configured.');

  const transport = getTransport(cfg);

  try {
    const info = await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.from}>`,
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments,
    });
    return { messageId: info.messageId };
  } catch (err) {
    // Normalise to a safe error that never leaks credentials or transport config.
    const e = err as { code?: string; responseCode?: number };
    const isAuth = e?.code === 'EAUTH' || e?.responseCode === 535;
    throw new SmtpError(
      isAuth ? 'auth' : 'send',
      isAuth ? 'SMTP authentication failed.' : 'The email could not be sent.',
    );
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (value: string) => EMAIL_RE.test(value.trim());
