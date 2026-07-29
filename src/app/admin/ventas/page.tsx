"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/admin/DataTable";
import { useDataTable } from "@/components/ui/admin/useDataTable";
import { Badge } from "@/components/ui/admin/Badge";
import { useToast } from "@/components/ui/admin/Toast";
import { formatCOP } from "@/lib/format";
import { SALE_STATUSES, STATUS_LABELS, type Sale, type SaleStatus } from "@/data/sales";
import type { Advisor } from "@/data/advisors";

interface VentasResult {
  sales: Sale[];
  me: { advisorId: string | null };
  error: string | null;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function fetchVentas(): Promise<VentasResult> {
  const accessToken = await getAccessToken();
  const res = await fetch("/api/admin/ventas/list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  const body = await res.json().catch(() => ({}));

  return res.ok
    ? { sales: body.sales ?? [], me: body.me ?? { advisorId: null }, error: null }
    : { sales: [], me: { advisorId: null }, error: body.error ?? "No se pudo cargar las ventas." };
}

async function fetchAdvisors(): Promise<Advisor[]> {
  const accessToken = await getAccessToken();
  const res = await fetch("/api/admin/advisors/list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  const body = await res.json().catch(() => ({}));
  return res.ok ? (body.advisors as Advisor[]) : [];
}

export default function AdminVentasPage() {
  const toast = useToast();
  const [result, setResult] = useState<VentasResult | null>(null);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const loading = result === null;
  const sales = result?.sales ?? [];
  const error = result?.error ?? null;
  const myAdvisorId = result?.me.advisorId ?? null;
  const activeAdvisors = advisors.filter((a) => a.active);

  const table = useDataTable<Sale>({
    data: sales,
    searchableFields: ["buyer_full_name", "buyer_email", "match_label"],
    initialSort: { field: "created_at", direction: "desc" },
  });

  function reload() {
    fetchVentas().then(setResult);
    fetchAdvisors().then(setAdvisors);
  }

  useEffect(() => {
    reload();
  }, []);

  async function updateSale(
    sale: Sale,
    patch: { status?: SaleStatus; advisor_id?: string | null; delivered?: boolean },
  ) {
    const accessToken = await getAccessToken();
    const res = await fetch("/api/admin/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id: sale.id, ...patch }),
    });
    if (res.ok) {
      reload();
      toast.success("Venta actualizada.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo actualizar la venta.");
    }
  }

  const columns: DataTableColumn<Sale>[] = [
    {
      key: "buyer_full_name",
      header: "Comprador",
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-semibold text-admin-text">{s.buyer_full_name}</p>
          <p className="text-xs text-admin-text-muted">
            {s.buyer_whatsapp} · {s.buyer_email}
          </p>
        </div>
      ),
    },
    { key: "match_label", header: "Partido", sortable: true },
    {
      key: "quantity",
      header: "Boletas",
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-semibold text-admin-text">{s.quantity}</p>
          <p className="text-xs text-admin-text-muted">
            {s.sale_items.map((item) => `${item.quantity}x ${item.tier_name}`).join(", ")}
          </p>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      render: (s) => <span className="font-semibold text-admin-text">{formatCOP(s.total)}</span>,
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      render: (s) => (
        <select
          value={s.status}
          onChange={(e) => updateSale(s, { status: e.target.value as SaleStatus })}
          className="rounded-admin-sm border border-admin-border bg-admin-surface px-2.5 py-1.5 text-sm font-medium text-admin-text focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40"
        >
          {SALE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "delivered_at",
      header: "Entrega",
      render: (s) =>
        s.delivered_at ? (
          <button
            type="button"
            title={`Entregadas el ${new Date(s.delivered_at).toLocaleDateString("es-CO")}. Clic para desmarcar.`}
            onClick={() => updateSale(s, { delivered: false })}
            className="cursor-pointer"
          >
            <Badge variant="success">Entregado</Badge>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => updateSale(s, { delivered: true })}
            className="whitespace-nowrap text-xs font-semibold text-royal-500 hover:text-royal-600"
          >
            Marcar entregado
          </button>
        ),
    },
    {
      key: "advisor_id",
      header: "Asesor",
      render: (s) => (
        <div className="flex items-center gap-2">
          <select
            value={s.advisor_id ?? ""}
            onChange={(e) => updateSale(s, { advisor_id: e.target.value || null })}
            className="rounded-admin-sm border border-admin-border bg-admin-surface px-2.5 py-1.5 text-sm font-medium text-admin-text focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40"
          >
            <option value="">Sin asignar</option>
            {activeAdvisors.map((advisor) => (
              <option key={advisor.id} value={advisor.id}>
                {advisor.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!myAdvisorId}
            title={
              myAdvisorId
                ? "Asignarme esta venta"
                : "Tu cuenta no está vinculada a un asesor. Pídele a un administrador que la vincule desde Configuración → Asesores de ventas."
            }
            onClick={() => myAdvisorId && updateSale(s, { advisor_id: myAdvisorId })}
            className="whitespace-nowrap text-xs font-semibold text-royal-500 hover:text-royal-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Asignarme
          </button>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Fecha",
      sortable: true,
      render: (s) => new Date(s.created_at).toLocaleDateString("es-CO"),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">Ventas</h1>
      <p className="mt-1 text-sm font-medium text-admin-text-muted">
        Solicitudes generadas desde el checkout público. Actualiza el estado y asigna un asesor.
      </p>

      {error ? (
        <div className="mt-6 rounded-admin-xl border border-admin-border bg-admin-surface p-6 shadow-admin-xs">
          <p className="text-sm font-medium text-rose-500">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={reload}>
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <DataTable
            table={table}
            keyField="id"
            loading={loading}
            emptyMessage="Aún no hay ventas registradas."
            searchPlaceholder="Buscar por comprador, correo o partido..."
            columns={columns}
          />
        </div>
      )}
    </div>
  );
}
