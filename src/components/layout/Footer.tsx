import Link from "next/link";
import Container from "@/components/ui/Container";

const columns = [
  {
    title: "Ayuda",
    links: [
      { label: "Preguntas frecuentes", href: "#" },
      { label: "Cómo comprar", href: "/#como-comprar" },
      { label: "Política de cambios", href: "#" },
      { label: "Términos y condiciones", href: "#" },
    ],
  },
  {
    title: "Contacto",
    links: [
      { label: "WhatsApp: +57 318 631 9954", href: "#" },
      { label: "Soporte: +57 318 631 9954", href: "#" },
      { label: "Bogotá D.C., Colombia", href: "#" },
    ],
  },
];

const socials = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/santiago-perdomo-gonzalez-68b4663b6/?locale=en",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/orgullo.embajador/?hl=es",
  },
  { label: "TikTok", href: "#" },
];

export default function Footer() {
  return (
    <footer id="contacto" className="bg-navy-950 text-white/70">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-royal-400 to-royal-600 font-display text-lg font-bold text-white">
                OE
              </span>
              <span className="font-display text-lg font-extrabold leading-none tracking-tight text-white">
                Orgullo
                <br />
                <span className="text-gold-400">Embajador</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm font-medium leading-relaxed text-white/50">
              La plataforma oficial para vivir cada partido de Millonarios FC.
              Boletas garantizadas, atención personalizada y toda la pasión
              azul en un solo lugar.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xs font-semibold text-white/70 transition-colors hover:border-gold-400 hover:text-gold-400"
                >
                  {social.label.slice(0, 2)}
                </Link>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="font-display text-sm font-bold uppercase tracking-widest text-white">
                {column.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-white/50 transition-colors hover:text-gold-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 border-t border-white/10 pt-8 text-center text-xs font-medium text-white/40">
          <p>© 2026 Orgullo Embajador. Todos los derechos reservados.</p>

          <p className="text-white/30">
            Desarrollado por{" "}
            <Link
              href="https://www.linkedin.com/in/santiago-perdomo-gonzalez-68b4663b6/?locale=en"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/50 transition-colors hover:text-gold-400"
            >
              Santiago Perdomo
            </Link>
          </p>

          <p className="text-white/30">
            Contacto del desarrollador:{" "}
            <Link
              href="https://wa.me/573197906681"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/50 transition-colors hover:text-whatsapp-500"
            >
              +57 319 790 6681
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
