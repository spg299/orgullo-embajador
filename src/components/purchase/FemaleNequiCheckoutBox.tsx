"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { WalletIcon, WhatsAppIcon, CheckIcon } from "@/components/ui/Icons";
import { formatCOP } from "@/lib/format";
import { siteSettings as defaultSiteSettings, fetchSiteSettings } from "@/data/siteSettings";
import type { Match } from "@/data/matches";
import type { Tier } from "@/data/tiers";
import type { BuyerFormValues } from "@/lib/purchaseFormValidation";

interface Selection {
  tier: Tier;
  quantity: number;
}

// Mirrors NequiCheckoutBox.tsx exactly (same manual-verification model,
// same Nequi config from site_settings) except it posts to
// /api/checkout-femenino — the men's NequiCheckoutBox.tsx is untouched and
// not imported here. Nequi's own config (activar/QR/llave/instrucciones)
// is shared between both flows, same as the WhatsApp number already is.
export default function FemaleNequiCheckoutBox({
  match,
  selections,
  subtotal,
  total,
  buyer,
  disabled,
  disabledReason,
}: {
  match: Match;
  selections: Selection[];
  subtotal?: number;
  total: number;
  buyer: BuyerFormValues;
  disabled: boolean;
  disabledReason: string | null;
}) {
  const [settings, setSettings] = useState(defaultSiteSettings);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteSettings().then(setSettings);
  }, []);

  async function handleConfirmPayment() {
    if (disabled || registering) return;
    setRegistering(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout-femenino", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          femaleMatchId: match.id,
          matchLabel: `${match.home} vs ${match.away} — Femenino`,
          buyer,
          selections: selections.map(({ tier, quantity }) => ({ tierId: tier.id, quantity })),
          paymentMethod: "nequi",
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? "No se pudo registrar tu solicitud.");

      const totalQuantity = selections.reduce((sum, s) => sum + s.quantity, 0);
      const lines = [
        "Hola, ya realicé el pago por Nequi de mi compra de boletas. Adjunto el comprobante:",
        "",
        `Partido: ${match.home} vs ${match.away} — Femenino`,
        `Fecha: ${match.date} · ${match.time}`,
        "",
        "Boletas:",
        ...selections.map(({ tier, quantity }) => `- ${tier.name} x${quantity}`),
        "",
        `Cantidad total: ${totalQuantity} boleta(s)`,
        `Total: ${formatCOP(total)}`,
        "",
        `Nombre: ${buyer.fullName}`,
        `WhatsApp: ${buyer.whatsapp}`,
        `Correo: ${buyer.email}`,
      ];
      const url = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(lines.join("\n"))}`;
      setWhatsappUrl(url);
      setDone(true);

      const opened = window.open(url, "_blank");
      if (opened) opened.opener = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar tu solicitud.");
    } finally {
      setRegistering(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-gold-500/25 bg-gold-100 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 text-navy-950">
          <CheckIcon className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-navy-950">
          Solicitud registrada
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-navy-700/70">
          Tu compra quedó registrada como <strong>pago pendiente de verificación</strong>. Un asesor
          confirmará manualmente tu pago en cuanto reciba tu comprobante por WhatsApp.
        </p>
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block">
            <Button type="button" variant="whatsapp" icon={<WhatsAppIcon className="h-5 w-5" />}>
              Abrir WhatsApp
            </Button>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-navy-900/8 bg-white p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e6007e] text-white">
          <WalletIcon className="h-5 w-5" />
        </div>
        <h3 className="font-display text-lg font-bold tracking-tight text-navy-950">Pago con Nequi</h3>
      </div>

      <p className="mt-4 text-sm font-medium leading-relaxed text-navy-800/80">
        {settings.nequi_instructions}
      </p>

      <div className="mt-5 rounded-2xl border border-navy-900/8 bg-navy-950 p-5 text-center">
        {settings.nequi_qr_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-supplied Supabase Storage URL
          <img
            src={settings.nequi_qr_url}
            alt="Código QR de Nequi"
            className="mx-auto h-44 w-44 rounded-xl bg-white object-contain p-2"
          />
        ) : (
          <p className="text-sm font-medium text-white/70">
            El QR de Nequi aún no ha sido configurado. Contacta a un asesor por WhatsApp.
          </p>
        )}
        <p className="mt-3 font-display text-sm font-bold text-white">{settings.nequi_display_name}</p>
        {settings.nequi_holder_name && (
          <p className="text-xs font-medium text-white/60">{settings.nequi_holder_name}</p>
        )}
        {settings.nequi_key && (
          <p className="mt-2 inline-block rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
            {settings.nequi_key}
          </p>
        )}
      </div>

      <div className="mt-5 space-y-2.5 border-t border-navy-900/8 pt-5 text-sm font-medium">
        <div className="flex items-center justify-between text-navy-700/70">
          <span>Precio de las boletas</span>
          <span>{formatCOP(subtotal ?? total)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-navy-900/10 pt-3 text-base font-bold tracking-tight text-navy-950">
          <span>Total a pagar por Nequi</span>
          <span className="font-display text-royal-500">{formatCOP(total)}</span>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}

      <Button
        type="button"
        variant="secondary"
        size="lg"
        icon={<WalletIcon className="h-5 w-5" />}
        disabled={disabled || registering}
        onClick={handleConfirmPayment}
        className="mt-6 w-full"
      >
        {registering ? "Registrando..." : "Ya realicé el pago"}
      </Button>

      <p className="mt-3 text-center text-xs font-medium text-navy-700/50">
        Esto registra tu solicitud como pago pendiente de verificación — no confirma el pago
        automáticamente. Te confirmaremos por WhatsApp una vez validemos tu comprobante.
      </p>

      {disabledReason && !registering && (
        <p className="mt-3 text-center text-xs font-medium text-navy-700/50">{disabledReason}</p>
      )}
    </div>
  );
}
