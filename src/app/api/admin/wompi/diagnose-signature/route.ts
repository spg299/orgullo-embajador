import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/supabase/adminGuard";
import { computeIntegritySignature } from "@/lib/wompi/signature";

type SecretKind = "public_key" | "private_key" | "integrity" | "events" | "unrecognized";
type Environment = "production" | "sandbox" | "unrecognized";

interface SecretMeta {
  present: boolean;
  length?: number;
  // Only the fixed, non-secret format prefix Wompi uses for every merchant
  // (e.g. "prod_integrity_") is ever returned — never anything past it.
  // That prefix carries zero entropy; the actual secret is everything
  // after it, which this route never reads out loud.
  recognizedPrefix?: string;
  kind?: SecretKind;
  environment?: Environment;
  hasSurroundingWhitespace?: boolean;
}

function classifySecret(raw: string | undefined): SecretMeta {
  if (!raw) return { present: false };
  const trimmed = raw.trim();

  const integrityEvents = trimmed.match(/^(prod|test)_(integrity|events)_/);
  const pubPrv = trimmed.match(/^(pub|prv)_(prod|test)_/);

  let kind: SecretKind = "unrecognized";
  let environment: Environment = "unrecognized";
  let recognizedPrefix: string | undefined;

  if (integrityEvents) {
    kind = integrityEvents[2] as "integrity" | "events";
    environment = integrityEvents[1] === "prod" ? "production" : "sandbox";
    recognizedPrefix = integrityEvents[0];
  } else if (pubPrv) {
    kind = pubPrv[1] === "pub" ? "public_key" : "private_key";
    environment = pubPrv[2] === "prod" ? "production" : "sandbox";
    recognizedPrefix = pubPrv[0];
  }

  return {
    present: true,
    length: trimmed.length,
    recognizedPrefix,
    kind,
    environment,
    hasSurroundingWhitespace: trimmed !== raw,
  };
}

// Admin-only. Reveals structural facts about the configured Wompi
// credentials (which TYPE of secret each env var looks like, which
// ENVIRONMENT it belongs to, whether it has stray whitespace) — never the
// secret values themselves. Also runs a real signature computation through
// the exact same function create-order/route.ts uses, so the sample
// signature returned here is proof of what production actually produces
// right now, not a re-implementation that could silently diverge.
export async function POST(request: NextRequest) {
  const { accessToken } = await request.json().catch(() => ({}));
  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const publicKeyRaw = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  const integritySecretRaw = process.env.WOMPI_INTEGRITY_SECRET;
  const eventsSecretRaw = process.env.WOMPI_EVENTS_SECRET;

  const publicKeyMeta = classifySecret(publicKeyRaw);
  const integrityMeta = classifySecret(integritySecretRaw);
  const eventsMeta = classifySecret(eventsSecretRaw);

  const warnings: string[] = [];

  if (!publicKeyMeta.present) warnings.push("NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está configurada.");
  if (!integrityMeta.present) warnings.push("WOMPI_INTEGRITY_SECRET no está configurada.");
  if (!eventsMeta.present) warnings.push("WOMPI_EVENTS_SECRET no está configurada.");

  if (publicKeyMeta.present && publicKeyMeta.kind !== "public_key") {
    warnings.push("NEXT_PUBLIC_WOMPI_PUBLIC_KEY no tiene el formato de una llave pública (pub_prod_... o pub_test_...).");
  }
  if (integrityMeta.present && integrityMeta.kind === "events") {
    warnings.push("WOMPI_INTEGRITY_SECRET parece ser en realidad el Events Secret (empieza con ..._events_), no el Integrity Secret.");
  } else if (integrityMeta.present && integrityMeta.kind === "private_key") {
    warnings.push("WOMPI_INTEGRITY_SECRET parece ser en realidad la Private Key (prv_...), no el Integrity Secret.");
  } else if (integrityMeta.present && integrityMeta.kind !== "integrity") {
    warnings.push("WOMPI_INTEGRITY_SECRET no tiene el formato esperado de un Integrity Secret (..._integrity_...).");
  }
  if (eventsMeta.present && eventsMeta.kind === "integrity") {
    warnings.push("WOMPI_EVENTS_SECRET parece ser en realidad el Integrity Secret (empieza con ..._integrity_), no el Events Secret.");
  } else if (eventsMeta.present && eventsMeta.kind !== "events") {
    warnings.push("WOMPI_EVENTS_SECRET no tiene el formato esperado de un Events Secret (..._events_...).");
  }

  if (integrityMeta.hasSurroundingWhitespace) {
    warnings.push("WOMPI_INTEGRITY_SECRET tiene espacios o saltos de línea al inicio o al final — esto invalida la firma silenciosamente.");
  }
  if (eventsMeta.hasSurroundingWhitespace) {
    warnings.push("WOMPI_EVENTS_SECRET tiene espacios o saltos de línea al inicio o al final.");
  }
  if (publicKeyMeta.hasSurroundingWhitespace) {
    warnings.push("NEXT_PUBLIC_WOMPI_PUBLIC_KEY tiene espacios o saltos de línea al inicio o al final.");
  }

  if (
    publicKeyMeta.present &&
    integrityMeta.present &&
    publicKeyMeta.environment !== "unrecognized" &&
    integrityMeta.environment !== "unrecognized" &&
    publicKeyMeta.environment !== integrityMeta.environment
  ) {
    warnings.push(
      `La llave pública es de ${publicKeyMeta.environment === "production" ? "Producción" : "Sandbox"} pero el Integrity Secret es de ${integrityMeta.environment === "production" ? "Producción" : "Sandbox"} — pertenecen a ambientes distintos.`,
    );
  }
  if (
    publicKeyMeta.present &&
    eventsMeta.present &&
    publicKeyMeta.environment !== "unrecognized" &&
    eventsMeta.environment !== "unrecognized" &&
    publicKeyMeta.environment !== eventsMeta.environment
  ) {
    warnings.push(
      `La llave pública es de ${publicKeyMeta.environment === "production" ? "Producción" : "Sandbox"} pero el Events Secret es de ${eventsMeta.environment === "production" ? "Producción" : "Sandbox"} — pertenecen a ambientes distintos.`,
    );
  }
  if (publicKeyMeta.present && publicKeyMeta.environment === "sandbox") {
    warnings.push("La llave pública configurada actualmente es de Sandbox (pub_test_...), no de Producción.");
  }

  // A real signature, produced by the exact same function create-order
  // uses — proof of what's actually being sent right now, not a
  // re-implementation. Safe to return in full: this is the same value
  // that ends up in the checkout form's URL, visible in DevTools anyway.
  let sampleSignatureCheck: { reference: string; amountInCents: number; currency: string; signature: string } | null = null;
  if (integritySecretRaw) {
    const reference = `OE-DIAG-${randomUUID().slice(0, 8)}`;
    const amountInCents = 1_000_000;
    const currency = "COP";
    const signature = computeIntegritySignature({
      reference,
      amountInCents,
      currency,
      integritySecret: integritySecretRaw,
    });
    sampleSignatureCheck = { reference, amountInCents, currency, signature };
  }

  return NextResponse.json({
    publicKey: { ...publicKeyMeta, value: publicKeyRaw ?? null }, // full value — meant to be public
    integritySecret: integrityMeta,
    eventsSecret: eventsMeta,
    warnings,
    sampleSignatureCheck,
  });
}
