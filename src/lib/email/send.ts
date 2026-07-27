import { getResend, EMAIL_FROM } from "./resend";
import { welcomeEmailHtml, ticketsAvailableEmailHtml } from "./templates";

export async function sendWelcomeEmail(to: string, name: string) {
  return getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: "¡Bienvenido a Orgullo Embajador!",
    html: welcomeEmailHtml({ name }),
  });
}

export interface TicketsAvailablePayload {
  match: string;
  date: string;
  rival: string;
  stadium: string;
  buyUrl: string;
}

export async function sendTicketsAvailableEmail(to: string, payload: TicketsAvailablePayload) {
  return getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: "🎟️ ¡Ya están disponibles las boletas!",
    html: ticketsAvailableEmailHtml(payload),
  });
}
