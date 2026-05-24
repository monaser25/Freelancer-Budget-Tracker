import { z } from 'zod';

const optionalString = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().optional(),
);

const optionalEmail = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().email().optional(),
);

const optionalBillingDay = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().int().min(1).max(28).optional(),
);

const billingDay = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().int().min(1).max(28).default(1),
);

const sourceTypeSchema = z.enum(['manual', 'client', 'client-payment', 'subscription']).transform((value) => (
  value === 'client-payment' ? 'client' : value
));

export const ClientSchema = z.object({
  name: z.string().trim().min(1),
  email: optionalEmail,
  company: optionalString,
  revenue: z.coerce.number().nonnegative().default(0),
  clientType: z.enum(['INDIVIDUAL', 'COMPANY']).default('COMPANY'),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PROSPECT', 'INACTIVE']).default('ACTIVE'),
  paymentType: z.enum(['onetime', 'retainer']).default('onetime'),
  paymentDate: optionalString,
  billingDay: optionalBillingDay,
  nextBillingDate: optionalString,
  recorded: z.boolean().optional(),
  transactionId: optionalString,
});

export const SubscriptionSchema = z.object({
  name: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  cycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  notes: optionalString,
  billingDay,
  nextBillingDate: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  transactionId: optionalString,
});

export const TransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  status: z.enum(['COMPLETED', 'PENDING']).default('COMPLETED'),
  date: z.string().min(1),
  notes: optionalString,
  sourceType: sourceTypeSchema,
  sourceId: optionalString,
  clientId: optionalString,
  subscriptionId: optionalString,
  categoryId: z.string().min(1),
  isAuto: z.boolean().optional(),
  isEdited: z.boolean().optional(),
});
