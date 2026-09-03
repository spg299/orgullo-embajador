"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { CardIcon } from "@/components/ui/Icons";
import { formatCOP } from "@/lib/format";
import { calculateProcessingFee } from "@/lib/wompi/fees";
import type { Match } from "@/data/matches";
import type { Tier } from "@/data/tiers";
import type { BuyerFormValues } from "@/lib/purchaseFormValidation";

interface Selection {
  tier: Tier;
  quantity: number;
}

export default function CardCheckoutBox({
  match,
  selections,
  subtotal,
  buyer,
  disabled,
  disabledReason,
}: {
  match: Match;
  selections: Selection[];
  subtotal: number;
  buyer: BuyerFormValues;
  disabled: boolean;
  disabledReason: string | null;
}) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Same formula the server uses (src/lib/wompi/fees.ts) to compute the
  // real charge — shown here purely for display. The amount actually sent
  // to Wompi is always recomputed server-side from live tier prices, never
  // from anything this component sends.
  const processingFee = calculateProcessingFee(subtotal);
  const total = subtotal + processingFee;

  async function handlePay() {
    if (disabled || creating) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/wompi/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          matchLabel: `${match.home} vs ${match.away}`,
          buyer,
          selections: selections.map(({ tier, quantity }) => ({ tierId: tier.id, quantity })),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "No se pudo iniciar el pago.");

      // Wompi's documented Web Checkout redirect: a real GET form
      // submission (not fetch/XHR) to checkout.wompi.co, carrying the
      // server-computed signature. Full-page navigation away from here.
      const form = document.createElement("form");
      form.method = "GET";
      form.action = body.checkoutUrl;

      const fields: Record<string, string> = {
        "public-key": body.publicKey,
        currency: body.currency,
        "amount-in-cents": String(body.amountInCents),
        reference: body.reference,
        "signature:integrity": body.signature,
        "redirect-url": body.redirectUrl,
      };

      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
      setCreating(false);
    }
  }

  return (
    <div className="rounded-3xl border border-navy-900/8 bg-white p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-royal-500 text-white">
          <CardIcon className="h-5 w-5" />
        </div>
        <h3 className="font-display text-lg font-bold tracking-tight text-navy-950">
          Pago con tarjeta
        </h3>
      </div>

      <p className="mt-4 text-sm font-medium leading-relaxed text-navy-800/80">
        Pagarás de forma segura con Wompi. Tus boletas quedan confirmadas
        automáticamente al aprobarse el pago.
      </p>

      <div className="mt-5 space-y-2.5 border-t border-navy-900/8 pt-5 text-sm font-medium">
        <div className="flex items-center justify-between text-navy-700/70">
          <span>Precio de las boletas</span>
          <span>{formatCOP(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-navy-700/70">
          <span>Costo de procesamiento</span>
          <span>{formatCOP(processingFee)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-navy-900/10 pt-3 text-base font-bold tracking-tight text-navy-950">
          <span>Total</span>
          <span className="font-display text-royal-500">{formatCOP(total)}</span>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}

      <Button
        type="button"
        variant="primary"
        size="lg"
        icon={<CardIcon className="h-5 w-5" />}
        disabled={disabled || creating}
        onClick={handlePay}
        className="mt-6 w-full"
      >
        {creating ? "Redirigiendo a Wompi..." : "PAGAR CON TARJETA"}
      </Button>

      {disabledReason && !creating && (
        <p className="mt-3 text-center text-xs font-medium text-navy-700/50">
          {disabledReason}
        </p>
      )}
    </div>
  );
}
