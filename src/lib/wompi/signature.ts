import { createHash, timingSafeEqual } from "crypto";

// Wompi Web Checkout's "signature:integrity" field — must be computed
// server-side only (never in a client component), since it's derived from
// WOMPI_INTEGRITY_SECRET. SHA256(reference + amountInCents + currency + secret),
// per Wompi's Web Checkout docs.
export function computeIntegritySignature({
  reference,
  amountInCents,
  currency,
  integritySecret,
}: {
  reference: string;
  amountInCents: number;
  currency: string;
  integritySecret: string;
}): string {
  const raw = `${reference}${amountInCents}${currency}${integritySecret}`;
  return createHash("sha256").update(raw).digest("hex");
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// Validates a Wompi webhook event's checksum. Per Wompi's Eventos docs:
// concatenate the values found at each signature.properties dot-path
// (read from the event's `data`), then the Unix timestamp, then the
// events secret (WOMPI_EVENTS_SECRET) — SHA256 the result and compare
// (constant-time) against signature.checksum / the X-Event-Checksum header.
export function verifyEventChecksum({
  properties,
  data,
  timestamp,
  checksum,
  eventsSecret,
}: {
  properties: string[];
  data: unknown;
  timestamp: number;
  checksum: string;
  eventsSecret: string;
}): boolean {
  const concatenated =
    properties.map((path) => String(getByPath(data, path) ?? "")).join("") +
    String(timestamp) +
    eventsSecret;
  const expected = createHash("sha256").update(concatenated).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from((checksum ?? "").toLowerCase(), "hex");
  if (expectedBuf.length === 0 || expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}
