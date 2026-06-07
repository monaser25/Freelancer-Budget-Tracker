import { CurrencyCode } from '@/types/finance';
import { createCurrencyFormatter, type NumberFormatOptions } from './format';
import { DEFAULT_LOCALE, intlTagFor, type Locale } from './locales';

export const supportedCurrencies: { code: CurrencyCode; label: string }[] = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'EGP', label: 'EGP (E£)' },
  { code: 'SAR', label: 'SAR (ر.س)' },
  { code: 'AED', label: 'AED (د.إ)' },
];

export const isCurrencyCode = (value: unknown): value is CurrencyCode => (
  typeof value === 'string' && supportedCurrencies.some((currency) => currency.code === value)
);

export const getCurrencyLabel = (currency: CurrencyCode) => (
  supportedCurrencies.find((item) => item.code === currency)?.label || currency
);

export const makeCurrencyFormatter = (currency: CurrencyCode, options?: NumberFormatOptions, locale: Locale = DEFAULT_LOCALE) => (
  createCurrencyFormatter(currency, locale, options)
);

export const makeLongCurrencyFormatter = (currency: CurrencyCode, options?: NumberFormatOptions, locale: Locale = DEFAULT_LOCALE) => (
  new Intl.NumberFormat(intlTagFor(locale), {
    style: 'currency',
    currency,
    currencyDisplay: 'name',
    numberingSystem: 'latn',
    ...options,
  })
);

export const makeCompactCurrencyFormatter = (currency: CurrencyCode, options?: NumberFormatOptions, locale: Locale = DEFAULT_LOCALE) => {
  const currencyDefaults = new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions();
  const defaultMaximumFractionDigits = currencyDefaults.maximumFractionDigits ?? 2;
  const defaultMinimumFractionDigits = currencyDefaults.minimumFractionDigits ?? defaultMaximumFractionDigits;
  const maximumFractionDigits = options?.maximumFractionDigits ?? defaultMaximumFractionDigits;
  const minimumFractionDigits = Math.min(
    options?.minimumFractionDigits ?? (options?.maximumFractionDigits === 0 ? 0 : defaultMinimumFractionDigits),
    maximumFractionDigits,
  );
  const number = new Intl.NumberFormat(locale === 'ar' ? 'en-US' : intlTagFor(locale), {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping: options?.useGrouping,
  });
  const symbol = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0).find((part) => part.type === 'currency')?.value || currency;

  return {
    format: (value: number) => `${number.format(value)} ${symbol}`,
    formatToParts: (value: number) => [
      ...number.formatToParts(value),
      { type: 'literal' as const, value: ' ' },
      { type: 'currency' as const, value: symbol },
    ],
  };
};
