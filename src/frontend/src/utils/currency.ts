// ─── Currency Conversion Utility ─────────────────────────────────────────────
// Static exchange rates relative to USD as base.
// These are approximate rates; live rates would require a client-side API call.

const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  ICP: 0.083,
  AED: 3.67,
  INR: 83.5,
  SGD: 1.34,
  AUD: 1.54,
  CAD: 1.36,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  ICP: "ICP",
  AED: "د.إ",
  INR: "₹",
  SGD: "S$",
  AUD: "A$",
  CAD: "C$",
};

export const SUPPORTED_CURRENCIES: string[] = Object.keys(RATES);

/**
 * Convert an amount in USD to the target currency.
 * @param amountUSD - amount in USD (can be fractional, e.g. cents / 100)
 * @param toCurrency - target currency code
 */
export function convertFromUSD(amountUSD: number, toCurrency: string): number {
  const rate = RATES[toCurrency] ?? 1;
  return amountUSD * rate;
}

/**
 * Convert an amount in a given currency back to USD.
 * @param amount - amount in the source currency
 * @param fromCurrency - source currency code
 */
export function convertToUSD(amount: number, fromCurrency: string): number {
  const rate = RATES[fromCurrency] ?? 1;
  if (rate === 0) return 0;
  return amount / rate;
}

/**
 * Format a numeric value in the given currency for display.
 * @param amount - amount in the target currency (NOT cents)
 * @param currency - currency code
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;

  if (currency === "ICP") {
    // ICP displayed with 4 decimal places
    return `${amount.toFixed(4)} ICP`;
  }

  if (currency === "AED") {
    return `${symbol} ${amount.toFixed(2)}`;
  }

  if (currency === "INR") {
    // Indian number format
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Standard formatting for remaining currencies
  const currencyCodes: Record<string, string> = {
    USD: "USD",
    EUR: "EUR",
    GBP: "GBP",
    SGD: "SGD",
    AUD: "AUD",
    CAD: "CAD",
  };

  const iso = currencyCodes[currency];
  if (iso) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: iso,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return `${symbol}${amount.toFixed(2)}`;
}
