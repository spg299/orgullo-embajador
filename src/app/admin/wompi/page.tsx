"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { DataTable, type DataTableColumn } from "@/components/ui/admin/DataTable";
import { useDataTable } from "@/components/ui/admin/useDataTable";
import { Badge } from "@/components/ui/admin/Badge";
import { Dialog } from "@/components/ui/admin/Dialog";
import { KpiCard } from "@/components/ui/admin/KpiCard";
import Button from "@/components/ui/Button";
import { WalletIcon, CheckIcon, ClockIcon, CardIcon, ChartBarIcon } from "@/components/ui/Icons";
import { formatCOP } from "@/lib/format";
import { WOMPI_STATUS_LABELS, WOMPI_STATUS_BADGE_VARIANT, type WompiOrder } from "@/data/wompiOrders";

const POLL_INTERVAL_MS = 10_000;

interface SecretMeta {
  present: boolean;
  length?: number;
  recognizedPrefix?: string;
  kind?: string;
  environment?: string;
  hasSurroundingWhitespace?: boolean;
}

interface DiagnoseResult {
  publicKey: SecretMeta & { value: string | null };
  integritySecret: SecretMeta;
  eventsSecret: SecretMeta;
  warnings: string[];
  sampleSignatureCheck: { reference: string; amountInCents: number; currency: string; signature: string } | null;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function fetchOrders(): Promise<{ orders: WompiOrder[]; error: string | null }> {
  const accessToken = await getAccessToken();
  const res = await fetch("/api/admin/wompi/list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  const body = await res.json().catch(() => ({}));
  return res.ok
    ? { orders: body.orders ?? [], error: null }
    : { orders: [], error: body.error ?? "No se pudieron cargar las transacciones." };
}

export default function AdminWompiPage() {
  const [result, setResult] = useState<{ orders: WompiOrder[]; error: string | null } | null>(null);
  const [detail, setDetail] = useState<WompiOrder | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnoseResult | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnoseError, setDiagnoseError] = useState<string | null>(null);
  const loading = result === null;
  const orders = result?.orders ?? [];
  const error = result?.error ?? null;

  async function runDiagnosis() {
    setDiagnosing(true);
    setDiagnoseError(null);
    try {
      const accessToken = await getAccessToken();
      const res = await fetch("/api/admin/wompi/diagnose-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "No se pudo ejecutar el diagnóstico.");
      setDiagnosis(body);
    } catch (err) {
      setDiagnoseError(err instanceof Error ? err.message : "No se pudo ejecutar el diagnóstico.");
    } finally {
      setDiagnosing(false);
    }
  }

  useEffect(() => {
    fetchOrders().then(setResult);
    // Auto-refresh so a webhook-confirmed transaction shows up here without
    // a manual reload — polling, not Realtime, to stay consistent with the
    // rest of this app's "always re-fetch, never cache" admin pages.
    const interval = setInterval(() => {
      fetchOrders().then(setResult);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const table = useDataTable<WompiOrder>({
    data: orders,
    searchableFields: ["reference", "buyer_full_name", "buyer_email", "match_label"],
    initialSort: { field: "created_at", direction: "desc" },
  });

  const ingresos = orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.total, 0);
  const aprobados = orders.filter((o) => o.status === "paid").length;
  const pendientes = orders.filter((o) => o.status === "pending_payment").length;
  const rechazados = orders.filter((o) => o.status === "declined" || o.status === "voided" || o.status === "error").length;

  const columns: DataTableColumn<WompiOrder>[] = [
    {
      key: "created_at",
      header: "Fecha",
      sortable: true,
      render: (o) => new Date(o.created_at).toLocaleString("es-CO"),
    },
    { key: "reference", header: "Referencia", sortable: true },
    {
      key: "buyer_full_name",
      header: "Comprador",
      sortable: true,
      render: (o) => (
        <div>
          <p className="font-semibold text-admin-text">{o.buyer_full_name}</p>
          <p className="text-xs text-admin-text-muted">{o.buyer_email}</p>
        </div>
      ),
    },
    {
      key: "match_label",
      header: "Partido",
      sortable: true,
      render: (o) => (
        <div className="flex items-center gap-2">
          <span>{o.match_label}</span>
          {o.female_match_id && <Badge variant="info" dot={false}>Femenino</Badge>}
        </div>
      ),
    },
    {
      key: "items",
      header: "Localidad(es)",
      render: (o) => o.wompi_order_items.map((item) => `${item.quantity}x ${item.tier_name}`).join(", "),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      render: (o) => <span className="font-semibold text-admin-text">{formatCOP(o.total)}</span>,
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      render: (o) => (
        <Badge variant={WOMPI_STATUS_BADGE_VARIANT[o.status]}>{WOMPI_STATUS_LABELS[o.status]}</Badge>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">Wompi</h1>
      <p className="mt-1 text-sm font-medium text-admin-text-muted">
        Transacciones realizadas con Tarjeta a través de Wompi. Se actualiza automáticamente cuando
        Wompi confirma un pago.
      </p>

      <div className="mt-6 rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-admin-text">Diagnóstico de firma</h2>
            <p className="mt-0.5 text-xs font-medium text-admin-text-muted">
              Verifica el tipo y ambiente de las credenciales de Wompi configuradas en Vercel — nunca
              muestra el secreto completo.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={runDiagnosis} disabled={diagnosing}>
            {diagnosing ? "Ejecutando..." : "Ejecutar diagnóstico"}
          </Button>
        </div>

        {diagnoseError && <p className="mt-4 text-sm font-medium text-rose-500">{diagnoseError}</p>}

        {diagnosis && (
          <div className="mt-4 flex flex-col gap-4">
            {diagnosis.warnings.length > 0 ? (
              <ul className="flex flex-col gap-1.5 rounded-admin-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {diagnosis.warnings.map((warning) => (
                  <li key={warning} className="flex gap-2">
                    <span aria-hidden="true">⚠️</span>
                    {warning}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-admin-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                No se detectó ningún problema estructural en las credenciales configuradas.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-admin-lg border border-admin-border p-3 text-xs">
                <p className="font-semibold uppercase tracking-wider text-admin-text-muted">
                  NEXT_PUBLIC_WOMPI_PUBLIC_KEY
                </p>
                <p className="mt-1 break-all font-mono text-admin-text">{diagnosis.publicKey.value ?? "—"}</p>
                <p className="mt-1 text-admin-text-muted">
                  ambiente: <strong>{diagnosis.publicKey.environment ?? "—"}</strong>
                </p>
              </div>
              <div className="rounded-admin-lg border border-admin-border p-3 text-xs">
                <p className="font-semibold uppercase tracking-wider text-admin-text-muted">
                  WOMPI_INTEGRITY_SECRET
                </p>
                <p className="mt-1 font-mono text-admin-text">
                  {diagnosis.integritySecret.recognizedPrefix ?? "(prefijo no reconocido)"}
                  ••••••••
                </p>
                <p className="mt-1 text-admin-text-muted">
                  tipo: <strong>{diagnosis.integritySecret.kind ?? "—"}</strong> · ambiente:{" "}
                  <strong>{diagnosis.integritySecret.environment ?? "—"}</strong> · largo:{" "}
                  {diagnosis.integritySecret.length ?? "—"}
                </p>
              </div>
              <div className="rounded-admin-lg border border-admin-border p-3 text-xs">
                <p className="font-semibold uppercase tracking-wider text-admin-text-muted">
                  WOMPI_EVENTS_SECRET
                </p>
                <p className="mt-1 font-mono text-admin-text">
                  {diagnosis.eventsSecret.recognizedPrefix ?? "(prefijo no reconocido)"}
                  ••••••••
                </p>
                <p className="mt-1 text-admin-text-muted">
                  tipo: <strong>{diagnosis.eventsSecret.kind ?? "—"}</strong> · ambiente:{" "}
                  <strong>{diagnosis.eventsSecret.environment ?? "—"}</strong> · largo:{" "}
                  {diagnosis.eventsSecret.length ?? "—"}
                </p>
              </div>
            </div>

            {diagnosis.sampleSignatureCheck && (
              <div className="rounded-admin-lg border border-admin-border bg-admin-bg p-3 text-xs">
                <p className="font-semibold uppercase tracking-wider text-admin-text-muted">
                  Firma de prueba generada ahora mismo (misma función que create-order)
                </p>
                <p className="mt-1 font-mono text-admin-text">
                  reference: {diagnosis.sampleSignatureCheck.reference}
                </p>
                <p className="font-mono text-admin-text">
                  amount-in-cents: {diagnosis.sampleSignatureCheck.amountInCents}
                </p>
                <p className="font-mono text-admin-text">currency: {diagnosis.sampleSignatureCheck.currency}</p>
                <p className="mt-1 break-all font-mono text-admin-text">
                  signature:integrity → {diagnosis.sampleSignatureCheck.signature}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error ? (
        <div className="mt-6 rounded-admin-xl border border-admin-border bg-admin-surface p-6 shadow-admin-xs">
          <p className="text-sm font-medium text-rose-500">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => fetchOrders().then(setResult)}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard
              label="Ingresos Wompi"
              value={formatCOP(ingresos)}
              icon={<WalletIcon className="h-5 w-5" />}
              accent="royal"
            />
            <KpiCard
              label="Pagos aprobados"
              value={aprobados}
              icon={<CheckIcon className="h-5 w-5" />}
              accent="whatsapp"
            />
            <KpiCard
              label="Pagos pendientes"
              value={pendientes}
              icon={<ClockIcon className="h-5 w-5" />}
              accent="gold"
            />
            <KpiCard
              label="Pagos rechazados"
              value={rechazados}
              icon={<CardIcon className="h-5 w-5" />}
              accent="neutral"
            />
            <KpiCard
              label="Total de transacciones"
              value={orders.length}
              icon={<ChartBarIcon className="h-5 w-5" />}
              accent="royal"
            />
          </div>

          <div className="mt-6">
            <DataTable
              table={table}
              keyField="id"
              loading={loading}
              emptyMessage="Aún no hay transacciones con Wompi."
              searchPlaceholder="Buscar por referencia, comprador o partido..."
              columns={columns}
              renderActions={(o) => (
                <button
                  type="button"
                  onClick={() => setDetail(o)}
                  className="text-xs font-semibold text-royal-500 hover:text-royal-600"
                >
                  Ver detalle
                </button>
              )}
            />
          </div>
        </>
      )}

      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Detalle de la transacción"
        maxWidth="md"
      >
        {detail && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-center justify-between">
              <Badge variant={WOMPI_STATUS_BADGE_VARIANT[detail.status]}>
                {WOMPI_STATUS_LABELS[detail.status]}
              </Badge>
              <span className="text-xs font-medium text-admin-text-muted">{detail.reference}</span>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  Comprador
                </dt>
                <dd className="mt-0.5 font-medium text-admin-text">{detail.buyer_full_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  Correo
                </dt>
                <dd className="mt-0.5 font-medium text-admin-text">{detail.buyer_email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  WhatsApp
                </dt>
                <dd className="mt-0.5 font-medium text-admin-text">{detail.buyer_whatsapp}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  Partido
                </dt>
                <dd className="mt-0.5 flex items-center gap-2 font-medium text-admin-text">
                  <span>{detail.match_label}</span>
                  {detail.female_match_id && <Badge variant="info" dot={false}>Femenino</Badge>}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  Boletas
                </dt>
                <dd className="mt-0.5 font-medium text-admin-text">
                  {detail.wompi_order_items.map((item) => `${item.quantity}x ${item.tier_name}`).join(", ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  Precio boletas
                </dt>
                <dd className="mt-0.5 font-medium text-admin-text">{formatCOP(detail.subtotal)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  Costo de procesamiento
                </dt>
                <dd className="mt-0.5 font-medium text-admin-text">{formatCOP(detail.processing_fee)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  Total
                </dt>
                <dd className="mt-0.5 font-bold text-admin-text">{formatCOP(detail.total)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  Método de pago
                </dt>
                <dd className="mt-0.5 font-medium text-admin-text">{detail.payment_method}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  ID transacción Wompi
                </dt>
                <dd className="mt-0.5 font-medium text-admin-text">{detail.wompi_transaction_id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  Estado Wompi (raw)
                </dt>
                <dd className="mt-0.5 font-medium text-admin-text">{detail.wompi_status ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  Creada
                </dt>
                <dd className="mt-0.5 font-medium text-admin-text">
                  {new Date(detail.created_at).toLocaleString("es-CO")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  Pagada
                </dt>
                <dd className="mt-0.5 font-medium text-admin-text">
                  {detail.paid_at ? new Date(detail.paid_at).toLocaleString("es-CO") : "—"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Dialog>
    </div>
  );
}
