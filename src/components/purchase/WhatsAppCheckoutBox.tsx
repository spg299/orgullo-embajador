"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { CheckIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { formatCOP } from "@/lib/format";
import { siteSettings as defaultSiteSettings, fetchSiteSettings } from "@/data/siteSettings";
import type { Match } from "@/data/matches";
import type { Tier } from "@/data/tiers";
import type { BuyerFormValues } from "@/lib/purchaseFormValidation";

const checklist = [
  "Confirmaremos el pedido",
  "Compartiremos los datos para el pago",
  "Una vez confirmado el pago recibirás tus boletas",
];

const REDIRECT_SECONDS = 3;

interface Selection {
  tier: Tier;
  quantity: number;
}

interface PendingRedirect {
  url: string;
}

export default function WhatsAppCheckoutBox({
  match,
  selections,
  subtotal,
  total,
  buyer,
  disabled,
  disabledReason,
  submitted,
  onFinalize,
}: {
  match: Match;
  selections: Selection[];
  subtotal?: number;
  total: number;
  buyer: BuyerFormValues;
  disabled: boolean;
  disabledReason: string | null;
  submitted: boolean;
  onFinalize: () => void;
}) {
  const [whatsappNumber, setWhatsappNumber] = useState(defaultSiteSettings.whatsapp_number);
  const [pendingRedirect, setPendingRedirect] = useState<PendingRedirect | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const onFinalizeRef = useRef(onFinalize);
  useEffect(() => {
    onFinalizeRef.current = onFinalize;
  }, [onFinalize]);
  // A blank tab opened synchronously inside the click handler, before the
  // countdown starts. Browsers only allow window.open to bypass the popup
  // blocker when called directly from a user gesture — reusing this
  // reference to set .location.href once the countdown ends keeps the
  // delayed redirect from being blocked. Null if the browser refused even
  // the synchronous open; the fallback below covers that case. A ref (not
  // state) because it's an external handle, not render-derived data.
  const redirectWinRef = useRef<Window | null>(null);

  useEffect(() => {
    fetchSiteSettings().then((settings) => setWhatsappNumber(settings.whatsapp_number));
  }, []);

  useEffect(() => {
    if (!pendingRedirect) return;

    const timer = setTimeout(() => {
      if (countdown <= 1) {
        const win = redirectWinRef.current;
        if (win) {
          win.location.href = pendingRedirect.url;
        } else {
          window.open(pendingRedirect.url, "_blank", "noopener,noreferrer");
        }
        redirectWinRef.current = null;
        setPendingRedirect(null);
        onFinalizeRef.current();
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [pendingRedirect, countdown]);

  function handleFinalize() {
    if (disabled) return;
    const totalQuantity = selections.reduce((sum, s) => sum + s.quantity, 0);

    const lines = [
      "Hola, quiero finalizar mi compra de boletas:",
      "",
      `Partido: ${match.home} vs ${match.away}`,
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

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;

    // Fire-and-forget: record the sale in the background without ever
    // blocking or delaying the WhatsApp redirect. Awaiting here would risk
    // the popup blocker catching window.open once it's no longer in the
    // same synchronous click-handler call stack.
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: match.id,
        matchLabel: `${match.home} vs ${match.away}`,
        buyer,
        selections: selections.map(({ tier, quantity }) => ({
          tierId: tier.id,
          tierName: tier.name,
          quantity,
          unitPrice: tier.price,
        })),
        subtotal: subtotal ?? total,
        total,
      }),
    }).catch(() => {});

    // Open the tab now (still inside the click gesture, so it isn't
    // blocked) but leave it blank — the modal below shows for
    // REDIRECT_SECONDS, then the effect above points this tab at `url`.
    redirectWinRef.current = window.open("", "_blank");
    setCountdown(REDIRECT_SECONDS);
    setPendingRedirect({ url });
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-whatsapp-500/30 bg-whatsapp-100 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp-500 text-white">
          <CheckIcon className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-navy-950">
          ¡Solicitud enviada!
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-navy-700/70">
          Se abrió WhatsApp en una nueva pestaña con el resumen de tu pedido
          para continuar la compra con uno de nuestros asesores.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-whatsapp-500/25 bg-whatsapp-100 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-whatsapp-500 text-white">
          <WhatsAppIcon className="h-5 w-5" />
        </div>
        <h3 className="font-display text-lg font-bold tracking-tight text-navy-950">
          Compra por WhatsApp
        </h3>
      </div>

      <p className="mt-4 text-sm font-medium leading-relaxed text-navy-800/80">
        Al hacer clic continuarás la compra con uno de nuestros asesores por
        WhatsApp.
      </p>

      <ul className="mt-4 space-y-2.5">
        {checklist.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-navy-800/80">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp-600" />
            {item}
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="whatsapp"
        size="lg"
        icon={<WhatsAppIcon className="h-5 w-5" />}
        disabled={disabled || Boolean(pendingRedirect)}
        onClick={handleFinalize}
        className="mt-6 w-full"
      >
        Finalizar compra por WhatsApp
      </Button>

      {disabledReason && (
        <p className="mt-3 text-center text-xs font-medium text-navy-700/50">
          {disabledReason}
        </p>
      )}

      {pendingRedirect && (
        <div
          role="alertdialog"
          aria-live="assertive"
          aria-label="Importante"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-3xl border border-navy-900/8 bg-white p-6 text-center shadow-soft sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-2xl">
              <span aria-hidden="true">⚠️</span>
            </div>
            <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-navy-950">
              Importante
            </h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-navy-700/70">
              El correo electrónico que ingresaste debe ser el mismo con el
              que estás registrado en Quentro, ya que allí recibirás tus
              boletas.
            </p>

            <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-royal-200 bg-royal-50 font-display text-2xl font-bold text-royal-500">
              {countdown}
            </div>
            <p className="mt-3 text-sm font-semibold text-navy-900/70">
              Serás redirigido a WhatsApp en {countdown}{" "}
              {countdown === 1 ? "segundo" : "segundos"}…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
