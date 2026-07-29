import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCOP } from "@/lib/format";
import type { BudgetMovement } from "@/data/finance";
import type { Advisor } from "@/data/advisors";

function movementRows(movements: BudgetMovement[], advisors: Advisor[]) {
  const nameFor = (id: string) => advisors.find((a) => a.id === id)?.name ?? "—";
  return movements.map((m) => ({
    Fecha: m.movement_date,
    Integrante: nameFor(m.advisor_id),
    Tipo: m.type === "ingreso" ? "Ingreso" : "Gasto",
    Concepto: m.concept,
    Valor: m.amount,
    Observaciones: m.observations ?? "",
    Autor: m.profiles?.full_name || m.profiles?.email || "—",
  }));
}

export function exportMovementsToExcel(movements: BudgetMovement[], advisors: Advisor[]) {
  const rows = movementRows(movements, advisors);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");
  XLSX.writeFile(workbook, `finanzas-movimientos-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportMovementsToPdf(movements: BudgetMovement[], advisors: Advisor[]) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Orgullo Embajador — Historial financiero", 14, 16);
  doc.setFontSize(9);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-CO")}`, 14, 22);

  const rows = movementRows(movements, advisors).map((r) => [
    r.Fecha,
    r.Integrante,
    r.Tipo,
    r.Concepto,
    formatCOP(r.Valor),
    r.Observaciones,
    r.Autor,
  ]);

  autoTable(doc, {
    startY: 28,
    head: [["Fecha", "Integrante", "Tipo", "Concepto", "Valor", "Observaciones", "Autor"]],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 63, 176] },
  });

  doc.save(`finanzas-movimientos-${new Date().toISOString().slice(0, 10)}.pdf`);
}
