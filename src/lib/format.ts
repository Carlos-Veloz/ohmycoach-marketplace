/**
 * Number, money and date formatting. This is the only place that creates Intl formatters: the UI
 * language is `es` (D-062), but numbers and dates always use the `es-MX` locale (D-068).
 */
export const INTL_LOCALE = 'es-MX';

const numberFormat = new Intl.NumberFormat(INTL_LOCALE, { maximumFractionDigits: 2 });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

const moneyFormats = new Map<string, Intl.NumberFormat>();

/**
 * An amount from the API, in integer cents, with the currency the API returns (ISO 4217).
 * Display only: the client never computes prices (D-048 proration is done by the backend).
 */
export function formatMoney(amountCents: number, currency: string): string {
  if (!Number.isInteger(amountCents)) {
    throw new Error('formatMoney expects integer cents');
  }
  const code = currency.toUpperCase();
  let format = moneyFormats.get(code);
  if (!format) {
    format = new Intl.NumberFormat(INTL_LOCALE, { style: 'currency', currency: code });
    moneyFormats.set(code, format);
  }
  return format.format(amountCents / 100);
}

const dateFormat = new Intl.DateTimeFormat(INTL_LOCALE, { dateStyle: 'medium', timeZone: 'UTC' });

/** A calendar date (`YYYY-MM-DD`), for example "30 nov 2026". */
export function formatCalendarDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}
