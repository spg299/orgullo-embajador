"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Dialog } from "@/components/ui/admin/Dialog";
import Button from "@/components/ui/Button";
import { UploadIcon } from "@/components/ui/Icons";
import { formatCOP } from "@/lib/format";
import type { Advisor } from "@/data/advisors";

interface PreviewRow {
  advisorId: string;
  advisorName: string;
  presupuesto: number | null;
  ingresos: number | null;
  gastos: number | null;
  balanceDeclarado: number | null;
  matchesBalance: boolean | null;
}

const HEADER_PATTERNS: { key: "presupuesto" | "ingresos" | "gastos" | "balance"; pattern: RegExp }[] = [
  { key: "presupuesto", pattern: /presupuesto/i },
  { key: "ingresos", pattern: /ingreso|ganad/i },
  { key: "gastos", pattern: /gasto/i },
  { key: "balance", pattern: /balance|disponible/i },
];

function toNumber(cell: unknown): number | null {
  if (typeof cell === "number") return cell;
  if (typeof cell === "string") {
    const cleaned = cell.replace(/[^0-9.,-]/g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) && cleaned !== "" ? n : null;
  }
  return null;
}

function detectRows(workbook: XLSX.WorkBook, advisors: Advisor[]): PreviewRow[] {
  const results: PreviewRow[] = [];

  for (const advisor of advisors) {
    let found: PreviewRow | null = null;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

      // Find the header row: the first row containing at least one of our keywords.
      const columnFor: Partial<Record<"presupuesto" | "ingresos" | "gastos" | "balance", number>> = {};
      for (let r = 0; r < Math.min(rows.length, 5); r++) {
        const row = rows[r];
        let matches = 0;
        row.forEach((cell, c) => {
          if (typeof cell !== "string") return;
          for (const { key, pattern } of HEADER_PATTERNS) {
            if (pattern.test(cell)) {
              columnFor[key] = c;
              matches++;
            }
          }
        });
        if (matches > 0) break;
      }

      // Find the row mentioning this advisor's name anywhere.
      const nameLower = advisor.name.toLowerCase();
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const hasName = row.some((cell) => {
          if (typeof cell !== "string") return false;
          const cellLower = cell.trim().toLowerCase();
          return cellLower.length > 0 && (nameLower.includes(cellLower) || cellLower.includes(nameLower.split(" ")[0]));
        });
        if (!hasName) continue;

        const presupuesto = columnFor.presupuesto !== undefined ? toNumber(row[columnFor.presupuesto]) : null;
        const ingresos = columnFor.ingresos !== undefined ? toNumber(row[columnFor.ingresos]) : null;
        const gastos = columnFor.gastos !== undefined ? toNumber(row[columnFor.gastos]) : null;
        const balanceDeclarado = columnFor.balance !== undefined ? toNumber(row[columnFor.balance]) : null;

        const computedBalance = (ingresos ?? 0) - (gastos ?? 0);
        const matchesBalance =
          balanceDeclarado === null ? null : Math.abs(computedBalance - balanceDeclarado) < 1;

        found = {
          advisorId: advisor.id,
          advisorName: advisor.name,
          presupuesto,
          ingresos,
          gastos,
          balanceDeclarado,
          matchesBalance,
        };
        break;
      }
      if (found) break;
    }

    results.push(
      found ?? {
        advisorId: advisor.id,
        advisorName: advisor.name,
        presupuesto: null,
        ingresos: null,
        gastos: null,
        balanceDeclarado: null,
        matchesBalance: null,
      },
    );
  }

  return results;
}

export function ImportExcelDialog({
  open,
  onClose,
  advisors,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  advisors: Advisor[];
  onConfirm: (rows: PreviewRow[]) => Promise<void>;
}) {
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setRows(null);
    setError(null);
  }

  async function handleFile(file: File) {
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const detected = detectRows(workbook, advisors);
      setRows(detected);
    } catch {
      setError("No se pudo leer el archivo. Verifica que sea un Excel válido (.xlsx).");
    }
  }

  async function handleConfirm() {
    if (!rows) return;
    setImporting(true);
    const detectedRows = rows.filter((r) => r.presupuesto !== null || r.ingresos !== null || r.gastos !== null);
    await onConfirm(detectedRows);
    setImporting(false);
    reset();
  }

  const detectedCount = rows?.filter((r) => r.presupuesto !== null || r.ingresos !== null || r.gastos !== null).length ?? 0;

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Importar Excel"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4">
        {!rows && (
          <>
            <p className="text-sm font-medium text-admin-text-muted">
              Sube el archivo Excel con el presupuesto del grupo. El sistema detecta automáticamente a Edward,
              Harold, Jhon y Santiago, y las columnas de presupuesto, ingresos, gastos y balance. Revisarás todo
              antes de guardar — nada se guarda hasta que confirmes.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              icon={<UploadIcon className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Seleccionar archivo
            </Button>
            {error && <p className="text-sm text-rose-500">{error}</p>}
          </>
        )}

        {rows && (
          <>
            <p className="text-sm font-medium text-admin-text-muted">
              {detectedCount} de {rows.length} integrantes detectados. Revisa los valores antes de confirmar.
            </p>
            <div className="overflow-x-auto rounded-admin-md border border-admin-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-admin-bg text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                  <tr>
                    <th className="px-3 py-2">Integrante</th>
                    <th className="px-3 py-2">Presupuesto</th>
                    <th className="px-3 py-2">Ingresos</th>
                    <th className="px-3 py-2">Gastos</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {rows.map((row) => {
                    const detected = row.presupuesto !== null || row.ingresos !== null || row.gastos !== null;
                    return (
                      <tr key={row.advisorId}>
                        <td className="px-3 py-2 font-medium text-admin-text">{row.advisorName}</td>
                        <td className="px-3 py-2 text-admin-text">
                          {row.presupuesto !== null ? formatCOP(row.presupuesto) : "—"}
                        </td>
                        <td className="px-3 py-2 text-admin-text">
                          {row.ingresos !== null ? formatCOP(row.ingresos) : "—"}
                        </td>
                        <td className="px-3 py-2 text-admin-text">
                          {row.gastos !== null ? formatCOP(row.gastos) : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {!detected ? (
                            <span className="text-xs font-medium text-admin-text-muted">No detectado</span>
                          ) : row.matchesBalance === false ? (
                            <span className="text-xs font-medium text-gold-600">⚠ Balance no coincide</span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Listo</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-2 flex gap-3">
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                disabled={importing || detectedCount === 0}
                onClick={handleConfirm}
              >
                {importing ? "Importando..." : `Confirmar importación (${detectedCount})`}
              </Button>
              <Button type="button" variant="ghost" onClick={reset}>
                Elegir otro archivo
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
