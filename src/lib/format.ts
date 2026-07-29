export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

// Always-signed variant for transaction-style amounts (e.g. "+$50.000" /
// "-$20.000"), used wherever a value's direction matters more than its
// magnitude alone — movement lists, timelines, exports.
export function formatSignedCOP(value: number): string {
  return `${value >= 0 ? "+" : "-"}${formatCOP(Math.abs(value))}`;
}
