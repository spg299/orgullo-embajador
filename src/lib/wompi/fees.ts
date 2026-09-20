// Card-payment surcharge for Wompi. Imported by both the checkout UI (to
// display the fee) and create-order/route.ts (to compute the actual amount
// sent to Wompi) so the number shown to the buyer and the number charged can
// never drift apart.
//
// Wompi does NOT take a percentage of the ticket price: it charges its
// commission on the TOTAL the buyer pays (gross), as a percentage plus a fixed
// amount, and then IVA on top of that commission:
//
//   wompiFee(gross) = (gross * CARD_RATE + CARD_FIXED_COP) * (1 + IVA_RATE)
//
// (verified against a real transaction: gross $362.250 -> fee $12.256,54,
// which this formula reproduces to within $0,02). Because the fee grows with
// the gross, adding "X% of the subtotal" always under-collects. The gross the
// buyer must pay so that we net exactly the subtotal solves
//
//   gross - wompiFee(gross) = subtotal
//   gross = (subtotal + CARD_FIXED_COP * (1 + IVA_RATE)) / (1 - CARD_RATE * (1 + IVA_RATE))
//
// If Wompi ever changes our contracted rate, these three constants are the only
// thing to update.
export const WOMPI_CARD_RATE = 0.0265;
export const WOMPI_CARD_FIXED_COP = 700;
export const WOMPI_IVA_RATE = 0.19;

// Tolerance so a gross that is mathematically a whole peso but lands a hair
// above it in floating point isn't bumped a full peso by Math.ceil.
const FLOAT_EPSILON = 1e-6;

// What Wompi keeps out of a card payment of `gross` pesos.
export function calculateWompiFee(gross: number): number {
  return (gross * WOMPI_CARD_RATE + WOMPI_CARD_FIXED_COP) * (1 + WOMPI_IVA_RATE);
}

// Total the buyer pays so that, after Wompi's fee, we receive `subtotal`.
// Rounded UP to a whole peso (the amount shown and sent to Wompi has no
// decimals), so the net received is never below the subtotal — by less than
// one peso above it.
export function calculateChargeTotal(subtotal: number): number {
  const ivaFactor = 1 + WOMPI_IVA_RATE;
  const gross = (subtotal + WOMPI_CARD_FIXED_COP * ivaFactor) / (1 - WOMPI_CARD_RATE * ivaFactor);
  return Math.ceil(gross - FLOAT_EPSILON);
}

// The "Costo de procesamiento" line: the extra the buyer pays on top of the
// ticket price. Callers keep doing `total = subtotal + processingFee`.
export function calculateProcessingFee(subtotal: number): number {
  return calculateChargeTotal(subtotal) - subtotal;
}
