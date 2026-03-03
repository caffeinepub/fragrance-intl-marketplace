// Stripe utility module for frontend integration
// Uses Stripe Checkout (hosted payment page), not Stripe Elements

export interface CheckoutSession {
  id: string;
  url: string;
}

export const DEFAULT_CURRENCY = "usd";

/**
 * Constructs the success URL for Stripe Checkout redirect.
 * Stripe appends ?session_id={CHECKOUT_SESSION_ID} automatically.
 */
export function buildSuccessUrl(orderId: string): string {
  const base = `${window.location.protocol}//${window.location.host}`;
  return `${base}/payment/success?orderId=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`;
}

/**
 * Constructs the cancel URL for Stripe Checkout redirect.
 */
export function buildCancelUrl(orderId: string): string {
  const base = `${window.location.protocol}//${window.location.host}`;
  return `${base}/payment/cancel?orderId=${encodeURIComponent(orderId)}`;
}

/**
 * Parses a Stripe Checkout Session JSON string returned from the backend.
 * Validates that the session contains a non-empty URL.
 */
export function parseCheckoutSession(json: string): CheckoutSession {
  let session: CheckoutSession;
  try {
    session = JSON.parse(json) as CheckoutSession;
  } catch {
    throw new Error("Invalid Stripe session response from backend");
  }
  if (!session?.url) {
    throw new Error("Stripe session is missing a checkout URL");
  }
  return session;
}
