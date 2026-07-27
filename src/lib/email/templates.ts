import { LOGO_URL, SITE_URL } from "./resend";

function emailLayout(bodyHtml: string): string {
  return `
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f2f6ff;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f6ff;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(10,15,36,0.08);">
            <tr>
              <td style="background-color:#0a0f24;padding:32px;text-align:center;">
                <img src="${LOGO_URL}" width="64" height="64" alt="Orgullo Embajador" style="border-radius:14px;display:inline-block;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#0a0f24;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background-color:#f2f6ff;text-align:center;">
                <p style="margin:0;font-size:12px;color:#7a8299;">
                  © ${new Date().getFullYear()} Orgullo Embajador · Bogotá, Colombia
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(180deg,#e0b84a,#cc9a2e);color:#0a0f24;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:14px;">${label}</a>`;
}

export function welcomeEmailHtml({ name }: { name: string }): string {
  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;">¡Bienvenido, ${name}!</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333a4d;">
      Gracias por unirte a la comunidad de <strong>Orgullo Embajador</strong>. A partir de ahora
      formas parte de la hinchada azul que nunca se pierde un partido de Millonarios FC.
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333a4d;">
      Te avisaremos por correo apenas haya nuevas boletas disponibles para que siempre seas de
      los primeros en asegurar tu puesto en El Campín.
    </p>
    <div style="text-align:center;">
      ${ctaButton(SITE_URL, "Visitar la página web")}
    </div>
  `);
}

export function ticketsAvailableEmailHtml({
  match,
  date,
  rival,
  stadium,
  buyUrl,
}: {
  match: string;
  date: string;
  rival: string;
  stadium: string;
  buyUrl: string;
}): string {
  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;">🎟️ ¡Ya están disponibles las boletas!</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#333a4d;">
      Se abrió la venta de boletas para el próximo partido de Millonarios. No te quedes por fuera.
    </p>
    <table role="presentation" width="100%" style="background-color:#f2f6ff;border-radius:16px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;font-size:14px;color:#0a0f24;"><strong>Partido:</strong> ${match}</td></tr>
      <tr><td style="padding:0 20px 8px;font-size:14px;color:#0a0f24;"><strong>Rival:</strong> ${rival}</td></tr>
      <tr><td style="padding:0 20px 8px;font-size:14px;color:#0a0f24;"><strong>Fecha:</strong> ${date}</td></tr>
      <tr><td style="padding:0 20px 16px;font-size:14px;color:#0a0f24;"><strong>Estadio:</strong> ${stadium}</td></tr>
    </table>
    <div style="text-align:center;">
      ${ctaButton(buyUrl, "Comprar ahora")}
    </div>
  `);
}
