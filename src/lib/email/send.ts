import { getResend, EMAIL_FROM } from "./resend";
import { welcomeEmailHtml, ticketsAvailableEmailHtml } from "./templates";

export async function sendWelcomeEmail(to: string, name: string) {
  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: "¡Bienvenido a Orgullo Embajador!",
    html: welcomeEmailHtml({ name }),
  });
  if (error) throw error;
  return data;
}

export interface TicketsAvailablePayload {
  match: string;
  date: string;
  rival: string;
  stadium: string;
  buyUrl: string;
}

export async function sendTicketsAvailableEmail(to: string, payload: TicketsAvailablePayload) {
  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: "🎟️ ¡Ya están disponibles las boletas!",
    html: ticketsAvailableEmailHtml(payload),
  });
  if (error) throw error;
  return data;
}
