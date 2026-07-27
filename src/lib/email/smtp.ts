import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

// Server-only. Free stopgap while no domain is verified with a transactional
// email provider: sends through a regular Gmail/Outlook account via SMTP
// using an app password. Swap this out once a verified sending domain is
// ready (e.g. Resend). Never import this file from a client component.
export function getMailer(): Transporter {
  if (transporter) return transporter;

  const host = process.env.EMAIL_SMTP_HOST;
  const port = Number(process.env.EMAIL_SMTP_PORT ?? 587);
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP credentials. Set EMAIL_SMTP_HOST, EMAIL_SMTP_USER and EMAIL_SMTP_PASSWORD.",
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}
