"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import CrestBadge from "@/components/ui/CrestBadge";
import ProgressSteps from "@/components/purchase/ProgressSteps";
import TierRow from "@/components/purchase/TierRow";
import PurchaseForm from "@/components/purchase/PurchaseForm";
import OrderSummary from "@/components/purchase/OrderSummary";
import WhatsAppCheckoutBox from "@/components/purchase/WhatsAppCheckoutBox";
import CardCheckoutBox from "@/components/purchase/CardCheckoutBox";
import { CalendarIcon, MapPinIcon, WhatsAppIcon, CardIcon } from "@/components/ui/Icons";
import { tiers, fetchTiers } from "@/data/tiers";
import {
  initialBuyerFormValues,
  validateBuyerForm,
  type BuyerFormValues,
} from "@/lib/purchaseFormValidation";
import type { Match } from "@/data/matches";

export default function PurchaseFlow({ match }: { match: Match }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"whatsapp" | "card">("whatsapp");
  // Seeded with the static fallback for an identical first paint; upgraded
  // silently to the live /admin/precios data once the fetch resolves.
  const [baseTiers, setBaseTiers] = useState(tiers);
  const [buyerForm, setBuyerForm] = useState<BuyerFormValues>(initialBuyerFormValues);
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof BuyerFormValues, boolean>>
  >({});

  useEffect(() => {
    fetchTiers().then(setBaseTiers);
  }, []);

  const selections = useMemo(
    () =>
      baseTiers
        .map((tier) => ({ tier, quantity: quantities[tier.id] ?? 0 }))
        .filter(
          (selection) => selection.quantity > 0 && selection.tier.availability !== "agotado",
        ),
    [baseTiers, quantities],
  );

  const subtotal = selections.reduce(
    (sum, { tier, quantity }) => sum + tier.price * quantity,
    0,
  );
  const total = subtotal;
  const hasSelection = selections.length > 0;

  const formErrors = useMemo(() => validateBuyerForm(buyerForm), [buyerForm]);
  const isFormValid = Object.keys(formErrors).length === 0;

  const disabledReason = !hasSelection
    ? "Selecciona al menos una boleta para continuar."
    : !isFormValid
      ? "Completa todos los datos requeridos para continuar."
      : null;

  function handleFieldChange(field: keyof BuyerFormValues, value: string | boolean) {
    setBuyerForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFieldBlur(field: keyof BuyerFormValues) {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  }

  return (
    <section className="bg-royal-50/40 py-12 sm:py-16">
      <Container>
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-sm font-medium text-royal-500 transition-colors hover:text-royal-600"
          >
            ← Volver al inicio
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">
            Completa tu compra
          </h1>
        </div>

        <div className="mt-8 rounded-3xl border border-navy-900/8 bg-white p-6 shadow-card sm:p-8">
          <ProgressSteps current={submitted ? 4 : 2} />
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-navy-900/8 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center -space-x-3">
              <CrestBadge
                initial={match.homeInitial}
                size="md"
                crestSrc={match.homeCrest}
                alt={`Escudo de ${match.home}`}
              />
              <CrestBadge
                initial={match.awayInitial}
                size="md"
                crestSrc={match.awayCrest}
                alt={`Escudo de ${match.away}`}
              />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-navy-950">
                {match.home} <span className="text-navy-400">vs</span>{" "}
                {match.away}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-royal-500">
                {match.competition}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm font-medium text-navy-700/70">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-royal-500" />
              {match.date} · {match.time}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="h-4 w-4 text-royal-500" />
              {match.stadium}, {match.city}
            </span>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="flex flex-col gap-8">
            <div className="rounded-3xl border border-navy-900/8 bg-white p-6 shadow-card sm:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight text-navy-950">
                Selecciona tus boletas
              </h2>
              <p className="mt-1 text-sm font-medium text-navy-700/60">
                Escoge la localidad y la cantidad de boletas que deseas
                comprar.
              </p>

              <div className="mt-6 space-y-4">
                {baseTiers.map((tier) => (
                  <TierRow
                    key={tier.id}
                    tier={tier}
                    quantity={quantities[tier.id] ?? 0}
                    onChange={(value) => {
                      if (tier.availability === "agotado") return;
                      setQuantities((prev) => ({ ...prev, [tier.id]: value }));
                    }}
                  />
                ))}
              </div>
            </div>

            <PurchaseForm
              values={buyerForm}
              errors={formErrors}
              touched={touchedFields}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />
          </div>

          <div className="flex flex-col gap-6 lg:sticky lg:top-28">
            <OrderSummary
              match={match}
              selections={selections}
              subtotal={subtotal}
              total={total}
            />

            {!submitted && (
              <div className="rounded-3xl border border-navy-900/8 bg-white p-2 shadow-card">
                <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-navy-700/50">
                  Método de pago
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("whatsapp")}
                    className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${
                      paymentMethod === "whatsapp"
                        ? "bg-whatsapp-500 text-white"
                        : "text-navy-700/70 hover:bg-navy-900/5"
                    }`}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${
                      paymentMethod === "card"
                        ? "bg-royal-500 text-white"
                        : "text-navy-700/70 hover:bg-navy-900/5"
                    }`}
                  >
                    <CardIcon className="h-4 w-4" />
                    Tarjeta
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === "whatsapp" || submitted ? (
              <WhatsAppCheckoutBox
                match={match}
                selections={selections}
                subtotal={subtotal}
                total={total}
                buyer={buyerForm}
                disabled={Boolean(disabledReason)}
                disabledReason={disabledReason}
                submitted={submitted}
                onFinalize={() => setSubmitted(true)}
              />
            ) : (
              <CardCheckoutBox
                match={match}
                selections={selections}
                subtotal={subtotal}
                buyer={buyerForm}
                disabled={Boolean(disabledReason)}
                disabledReason={disabledReason}
              />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
