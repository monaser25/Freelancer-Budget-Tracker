import { intlTagFor, type Locale } from './locales';

type DateValue = Date | string | number;
export type DateFormatOptions = Intl.DateTimeFormatOptions;
export type NumberFormatOptions = Intl.NumberFormatOptions;

const toDate = (date: DateValue) => (date instanceof Date ? date : new Date(date));

export function createDateFormatter(locale: Locale, options?: DateFormatOptions) {
  return new Intl.DateTimeFormat(intlTagFor(locale), {
    ...options,
    numberingSystem: 'latn',
  });
}

export function createNumberFormatter(locale: Locale, options?: NumberFormatOptions) {
  return new Intl.NumberFormat(intlTagFor(locale), {
    ...options,
    numberingSystem: 'latn',
  });
}

export function createCurrencyFormatter(currency: string, locale: Locale, options?: NumberFormatOptions) {
  return createNumberFormatter(locale, {
    style: 'currency',
    currency,
    ...options,
  });
}

export function formatDate(date: DateValue, locale: Locale, options?: DateFormatOptions) {
  return createDateFormatter(locale, options).format(toDate(date));
}

export function formatCurrency(amount: number, currency: string, locale: Locale, options?: NumberFormatOptions) {
  return createCurrencyFormatter(currency, locale, options).format(amount);
}

export function formatNumber(value: number, locale: Locale, options?: NumberFormatOptions) {
  return createNumberFormatter(locale, options).format(value);
}
