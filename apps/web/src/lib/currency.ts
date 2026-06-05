import { CurrencyCode } from '@/types/finance';
import { createCurrencyFormatter, type NumberFormatOptions } from './format';
import { DEFAULT_LOCALE, type Locale } from './locales';

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
