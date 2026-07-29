"use client";

import { useEffect, useState } from "react";
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

interface Selection {
  tier: Tier;
  quantity: number;
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

  useEffect(() => {
    fetchSiteSettings().then((settings) => setWhatsappNumber(settings.whatsapp_number));
  }, []);

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
      `Documento: ${buyer.documentNumber}`,
      `WhatsApp: ${buyer.whatsapp}`,
      `Correo: ${buyer.email}`,
    ];

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;

    // Fire-and-forget: record the sale in the background without ever
    // blocking or delaying the WhatsApp redirect below, which remains the
    // actual critical path. Awaiting here would also risk the popup
    // blocker catching window.open once it's no longer in the same
    // synchronous click-handler call stack.
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

    window.open(url, "_blank", "noopener,noreferrer");
    onFinalize();
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
        disabled={disabled}
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
    </div>
  );
}
