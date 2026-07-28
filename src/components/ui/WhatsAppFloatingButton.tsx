"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { siteSettings as defaultSiteSettings, fetchSiteSettings } from "@/data/siteSettings";

const TOOLTIP_STORAGE_KEY = "oe-whatsapp-tooltip-seen";

// Admin and auth-related routes never show the floating button — it's a
// public-site-only affordance. /login, /registro and /recuperar-password
// don't exist as dedicated routes today (login/register are the AuthModal,
// reachable from any page; password reset lives at /reset-password), but
// the prefixes are matched here too so this keeps working if those routes
// are ever split out.
const HIDDEN_PATH_PREFIXES = ["/admin", "/login", "/registro", "/recuperar-password", "/reset-password"];

export default function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(defaultSiteSettings.whatsapp_number);

  useEffect(() => {
    fetchSiteSettings().then((settings) => setWhatsappNumber(settings.whatsapp_number));
  }, []);

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hola Orgullo Embajador, quiero información sobre las boletas.",
  )}`;

  useEffect(() => {
    if (window.localStorage.getItem(TOOLTIP_STORAGE_KEY)) return;

    const showTimer = setTimeout(() => setShowTooltip(true), 1200);
    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
      window.localStorage.setItem(TOOLTIP_STORAGE_KEY, "1");
    }, 7000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  function dismissTooltip() {
    setShowTooltip(false);
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, "1");
  }

  const isHidden = HIDDEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isHidden) return null;

  return (
    <div className="animate-fade-in-up fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      {showTooltip && (
        <div className="animate-fade-in-up flex max-w-[220px] items-start gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium leading-snug text-navy-950 shadow-soft sm:max-w-[240px]">
          <span>¿Necesitas ayuda? 💙 Escríbenos por WhatsApp</span>
          <button
            type="button"
            onClick={dismissTooltip}
            aria-label="Cerrar mensaje"
            className="shrink-0 text-navy-900/40 transition-colors hover:text-navy-900"
          >
            ×
          </button>
        </div>
      )}

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        onClick={dismissTooltip}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-whatsapp-500 text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.55)] transition-transform duration-300 ease-out hover:scale-110 hover:bg-whatsapp-600"
      >
        <WhatsAppIcon className="h-8 w-8" />
      </a>
    </div>
  );
}
