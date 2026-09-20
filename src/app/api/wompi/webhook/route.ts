import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyEventChecksum } from "@/lib/wompi/signature";

const STATUS_MAP: Record<string, "paid" | "declined" | "voided" | "error"> = {
  APPROVED: "paid",
  DECLINED: "declined",
  VOIDED: "voided",
  ERROR: "error",
};

interface WompiTransaction {
  id: string;
  status: string;
  reference: string;
  amount_in_cents: number;
}

// Public, unauthenticated route — this is the URL configured in Wompi's
// dashboard, not something a signed-in admin calls. Authenticity comes
// entirely from the checksum below, never from anything else in the
// request. This is the ONLY place an order may move out of
// 'pending_payment' — the post-payment redirect page never marks anything
// paid on its own, it only ever reads what this handler already wrote.
//
// Response codes matter here: Wompi only retries (up to 3 times, over ~24h)
// when we DON'T answer 2xx. So permanent problems (bad signature, unknown
// reference, amount mismatch) answer 4xx/2xx and stop the retry loop, but a
// transient failure on our side (DB unreachable, failed write) must answer
// 5xx — otherwise a real, approved payment would be silently lost and the
// order stuck in 'pending_payment' forever.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  try {
    const { event, data, signature, timestamp } = body as {
      event: string;
      data: { transaction?: WompiTransaction };
      signature?: { properties: string[]; checksum: string };
      timestamp: number;
    };

    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
    if (!eventsSecret) {
      return NextResponse.json({ error: "Wompi events secret no configurado" }, { status: 500 });
    }

    const valid = verifyEventChecksum({
      properties: signature?.properties ?? [],
      data,
      timestamp,
      checksum: signature?.checksum ?? "",
      eventsSecret,
    });

    if (!valid) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
    }

    if (event !== "transaction.updated" || !data.transaction) {
      // Valid signature, but not an event this handler acts on (e.g. a
      // token-related event) — acknowledge so Wompi doesn't retry.
      return NextResponse.json({ ok: true });
    }

    const { id: transactionId, status: wompiStatus, reference, amount_in_cents: reportedAmountInCents } =
      data.transaction;
    const mappedStatus = STATUS_MAP[wompiStatus];

    const admin = getSupabaseAdmin();

    // Look the order up first — needed both to cross-check the amount
    // before ever marking anything paid, and to make paid_at idempotent
    // (only set on the transition into 'paid', never overwritten by a
    // legitimate webhook retry of the same event).
    const { data: order, error: fetchError } = await admin
      .from("wompi_orders")
      .select("status, total")
      .eq("reference", reference)
      .maybeSingle();

    if (fetchError) {
      // Transient — let Wompi retry.
      console.error("wompi webhook: order lookup failed", reference, fetchError.message);
      return NextResponse.json({ error: "Error consultando la orden" }, { status: 500 });
    }

    if (!order) {
      // Nothing a retry of this exact payload can fix — acknowledge so
      // Wompi doesn't keep resending it.
      console.error("wompi webhook: unknown reference", reference);
      return NextResponse.json({ ok: true });
    }

    // Wompi can send several transactions for one reference (the buyer
    // retries after a decline) and doesn't guarantee delivery order, so a
    // late DECLINED/ERROR for an earlier attempt must never overwrite an
    // order that is already paid. (A VOIDED — a real reversal of the paid
    // transaction — is still allowed through.)
    if (order.status === "paid" && (mappedStatus === "declined" || mappedStatus === "error")) {
      console.error("wompi webhook: ignoring", wompiStatus, "for already-paid order", reference);
      return NextResponse.json({ ok: true });
    }

    if (mappedStatus === "paid") {
      const expectedAmountInCents = Math.round(order.total * 100);
      if (reportedAmountInCents !== expectedAmountInCents) {
        // Valid signature, but the amount Wompi confirms doesn't match what
        // this order was created for — never trust the client, and here
        // "the client" is the payload itself. Do NOT mark paid. Logged
        // without any secret; this needs a human to look at it, but a
        // retry of the identical payload would just repeat the same
        // mismatch, so still acknowledge with 200 to stop the retry storm.
        console.error(
          "wompi webhook: amount mismatch, order NOT marked paid",
          reference,
          "expected",
          expectedAmountInCents,
          "got",
          reportedAmountInCents,
        );
        return NextResponse.json({ ok: true });
      }
    }

    const update: Record<string, unknown> = {
      wompi_transaction_id: transactionId,
      wompi_status: wompiStatus,
      updated_at: new Date().toISOString(),
    };
    if (mappedStatus) {
      update.status = mappedStatus;
      // Idempotent: only stamp paid_at on the actual transition into
      // 'paid'. A legitimate retry of the same APPROVED event (Wompi
      // resends up to 3x if we don't answer fast enough) must not push
      // the original approval instant forward.
      if (mappedStatus === "paid" && order.status !== "paid") {
        update.paid_at = new Date().toISOString();
      }
    }
    // Anything else (e.g. PENDING) leaves `status` as 'pending_payment' —
    // only wompi_status/wompi_transaction_id are recorded.

    const { error } = await admin.from("wompi_orders").update(update).eq("reference", reference);
    if (error) {
      // A failed write is exactly what a retry of the same payload DOES fix
      // (the DB is usually back a moment later) — answer 5xx so Wompi
      // resends, instead of losing the payment.
      console.error("wompi webhook: failed to update order", reference, error.message);
      return NextResponse.json({ error: "No se pudo actualizar la orden" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("wompi webhook: unexpected error", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
