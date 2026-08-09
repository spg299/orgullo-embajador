"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { CheckIcon, WhatsAppIcon, CardIcon } from "@/components/ui/Icons";
import { formatCOP } from "@/lib/format";

type OrderStatus = "pending_payment" | "paid" | "declined" | "voided" | "error";

interface OrderStatusResult {
  status: OrderStatus;
  matchLabel: string;
  total: number;
  whatsappRedirected: boolean;
  whatsappUrl?: string;
}

const MAX_ATTEMPTS = 40; // ~2 minutes at 3s intervals
const POLL_INTERVAL_MS = 3000;

const shellClasses =
  "mx-auto max-w-lg rounded-3xl border border-navy-900/8 bg-white p-6 text-center shadow-card sm:p-10";

export default function PaymentResult() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref");

  const [result, setResult] = useState<OrderStatusResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // Guards against opening WhatsApp twice within this same page session
  // (e.g. two poll ticks both seeing whatsappRedirected: false before the
  // mark-redirected call lands) — the durable, reload-proof guard is the
  // server's whatsapp_redirected_at column, reflected in whatsappRedirected.
  const [autoOpened, setAutoOpened] = useState(false);

  // Self-scheduling poll — this page is the Wompi redirect-url target, and
  // per spec it NEVER treats the buyer's return here as proof of anything.
  // Every status shown comes from this repeated round-trip into Supabase,
  // which only ever reflects what /api/wompi/webhook already verified and
  // wrote. Stops on any terminal status, on a 404 (unknown reference), or
  // after MAX_ATTEMPTS if the order is still pending_payment.
  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let count = 0;

    async function tick() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/wompi/order-status?reference=${encodeURIComponent(reference as string)}`);
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const body: OrderStatusResult = await res.json();
        if (cancelled) return;
        setResult(body);
        if (body.status !== "pending_payment") return;
      } catch {
        // Network hiccup — keep trying on the next tick.
      }

      count += 1;
      if (count >= MAX_ATTEMPTS) {
        if (!cancelled) setTimedOut(true);
        return;
      }
      if (!cancelled) timeoutId = setTimeout(tick, POLL_INTERVAL_MS);
    }

    tick();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [reference]);

  // Auto-redirect to WhatsApp — but only once the DB itself says 'paid'
  // (never because the buyer merely landed back on this page from Wompi)
  // and only the first time: whatsappRedirected persists server-side, so a
  // reload of this exact URL never re-opens WhatsApp again.
  useEffect(() => {
    if (!result || result.status !== "paid" || !result.whatsappUrl) return;
    if (result.whatsappRedirected || autoOpened) return;

    const whatsappUrl = result.whatsappUrl;
    let cancelled = false;

    (async () => {
      try {
        await fetch("/api/wompi/mark-redirected", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
      } catch {
        // Best-effort — the manual "Abrir WhatsApp" button below still
        // works even if this call fails; worst case a reload could open
        // WhatsApp once more.
      }
      if (cancelled) return;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setAutoOpened(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [result, autoOpened, reference]);

  if (!reference) {
    return (
      <Container className="py-16 sm:py-24">
        <div className={shellClasses}>
          <h1 className="font-display text-xl font-bold tracking-tight text-navy-950">
            Falta la referencia de pago
          </h1>
          <p className="mt-2 text-sm font-medium text-navy-700/60">
            No pudimos identificar tu pago. Si venías de Wompi, vuelve a intentarlo desde el checkout.
          </p>
          <Link href="/comprar" className="mt-6 inline-block">
            <Button type="button" variant="primary">Volver al checkout</Button>
          </Link>
        </div>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container className="py-16 sm:py-24">
        <div className={shellClasses}>
          <h1 className="font-display text-xl font-bold tracking-tight text-navy-950">
            No encontramos esta orden
          </h1>
          <p className="mt-2 text-sm font-medium text-navy-700/60">
            Referencia: <span className="font-semibold text-navy-900">{reference}</span>
          </p>
          <Link href="/comprar" className="mt-6 inline-block">
            <Button type="button" variant="primary">Volver al checkout</Button>
          </Link>
        </div>
      </Container>
    );
  }

  if (!result) {
    return (
      <Container className="py-16 sm:py-24">
        <div className={shellClasses}>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-royal-200 border-t-royal-500" />
          <h1 className="mt-6 font-display text-xl font-bold tracking-tight text-navy-950">
            Verificando tu pago...
          </h1>
          <p className="mt-2 text-sm font-medium text-navy-700/60">
            Esto solo toma unos segundos.
          </p>
        </div>
      </Container>
    );
  }

  if (result.status === "paid") {
    return (
      <Container className="py-16 sm:py-24">
        <div className={shellClasses}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp-500 text-white">
            <CheckIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-navy-950">
            ¡Pago aprobado!
          </h1>
          <p className="mt-2 text-sm font-medium text-navy-700/60">
            {result.matchLabel} · Total {formatCOP(result.total)}
          </p>
          <p className="mt-1 text-xs font-medium text-navy-700/50">Referencia: {reference}</p>
          <p className="mx-auto mt-4 max-w-sm text-sm font-medium text-navy-700/70">
            Estamos abriendo WhatsApp automáticamente para confirmar tu compra. Si no se abrió, usa
            el botón de abajo.
          </p>
          {result.whatsappUrl && (
            <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block">
              <Button type="button" variant="whatsapp" icon={<WhatsAppIcon className="h-5 w-5" />}>
                Abrir WhatsApp
              </Button>
            </a>
          )}
        </div>
      </Container>
    );
  }

  if (result.status === "declined" || result.status === "voided" || result.status === "error") {
    return (
      <Container className="py-16 sm:py-24">
        <div className={shellClasses}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <CardIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-navy-950">
            El pago no se pudo completar
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-navy-700/60">
            Tu banco o Wompi rechazó la transacción. No se realizó ningún cobro. Puedes intentarlo de
            nuevo o elegir pagar por WhatsApp.
          </p>
          <Link href="/comprar" className="mt-6 inline-block">
            <Button type="button" variant="primary">Volver a intentar</Button>
          </Link>
        </div>
      </Container>
    );
  }

  // status === "pending_payment"
  return (
    <Container className="py-16 sm:py-24">
      <div className={shellClasses}>
        {!timedOut ? (
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-royal-200 border-t-royal-500" />
        ) : (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-100 text-2xl">
            <span aria-hidden="true">⏳</span>
          </div>
        )}
        <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-navy-950">
          Tu pago sigue en proceso
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-navy-700/60">
          Wompi todavía no confirma este pago. No cierres esta pestaña — en cuanto se confirme, tus
          boletas quedarán registradas automáticamente. Si prefieres, puedes cerrar esta página; te
          contactaremos con la referencia <span className="font-semibold text-navy-900">{reference}</span>.
        </p>
      </div>
    </Container>
  );
}
