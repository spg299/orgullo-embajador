"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "oe-visitor-id";
const SESSION_ID_KEY = "oe-session-id";
const SESSION_TRACKED_KEY = "oe-session-tracked";

// Admin/auth routes are never tracked as site visits — same exclusion
// list as the floating WhatsApp button (src/components/ui/WhatsAppFloatingButton.tsx).
const HIDDEN_PATH_PREFIXES = ["/admin", "/login", "/registro", "/recuperar-password", "/reset-password"];

function randomId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreate(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const created = randomId();
  storage.setItem(key, created);
  return created;
}

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const isHidden = HIDDEN_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (isHidden) return;

    // Checked-and-set synchronously (before the fetch) so at most one
    // visit is recorded per browser session, even under React's dev-mode
    // double-effect-invocation.
    if (window.sessionStorage.getItem(SESSION_TRACKED_KEY)) return;
    window.sessionStorage.setItem(SESSION_TRACKED_KEY, "1");

    const visitorId = getOrCreate(window.localStorage, VISITOR_ID_KEY);
    const sessionId = getOrCreate(window.sessionStorage, SESSION_ID_KEY);

    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, sessionId, path: pathname }),
    }).catch(() => {});
    // Only ever fire once per session — intentionally not re-running on
    // every pathname change within the same tab/session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
