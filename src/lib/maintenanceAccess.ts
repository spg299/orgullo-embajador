// Emails allowed to run destructive-looking admin maintenance actions
// (e.g. "Recalcular Dashboard"). Checked both client-side (to hide the
// control) and server-side (the actual security boundary — see
// src/app/api/admin/maintenance/recalculate/route.ts).
export const MAINTENANCE_ALLOWED_EMAILS = ["spg29988@hotmail.com", "edfabian95@gmail.com"];

export function isMaintenanceAllowed(email: string | null | undefined): boolean {
  return !!email && MAINTENANCE_ALLOWED_EMAILS.includes(email.toLowerCase());
}
