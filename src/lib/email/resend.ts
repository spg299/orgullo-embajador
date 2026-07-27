import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY ?? "re_missing_api_key");
  }
  return resendClient;
}

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? "Orgullo Embajador <onboarding@resend.dev>";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://orgullo-embajador.vercel.app";

export const LOGO_URL = `${SITE_URL}/images/logo-orgullo-embajador.png`;
