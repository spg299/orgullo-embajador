// Flat processing fee charged on top of ticket price for card payments via
// Wompi. Imported by both the checkout UI (to display the fee) and
// create-order/route.ts (to compute the actual amount sent to Wompi) so the
// number shown to the buyer and the number charged can never drift apart.
export const PROCESSING_FEE_RATE = 0.035;

export function calculateProcessingFee(subtotal: number): number {
  return Math.round(subtotal * PROCESSING_FEE_RATE);
}
