import { CurrencyCode } from '@/types/finance';

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

export const makeCurrencyFormatter = (currency: CurrencyCode, options?: Intl.NumberFormatOptions) => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    ...options,
  })
);
