import { Client, Subscription, Transaction } from '@/types/finance';

export const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Acme Corp',
    company: 'Acme',
    revenue: 1500,
    clientType: 'COMPANY',
    status: 'ACTIVE',
    paymentType: 'retainer',
    billingDay: 17,
    nextBillingDate: new Date().toISOString().slice(0, 10),
    recorded: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'Globex',
    company: 'Globex Inc',
    revenue: 2400,
    clientType: 'COMPANY',
    status: 'PROSPECT',
    paymentType: 'onetime',
    paymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    recorded: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockSubscriptions: Subscription[] = [
  { id: 's1', name: 'Adobe CC', amount: 55, cycle: 'MONTHLY', billingDay: 17, nextBillingDate: new Date().toISOString().slice(0, 10), status: 'ACTIVE', notes: 'Design tools' },
  { id: 's2', name: 'Vercel Pro', amount: 20, cycle: 'MONTHLY', billingDay: 22, nextBillingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), status: 'ACTIVE', notes: 'Hosting' },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    amount: 1500,
    type: 'INCOME',
    status: 'COMPLETED',
    date: new Date().toISOString(),
    sourceType: 'client',
    sourceId: 'c1',
    clientId: 'c1',
    categoryId: 'CLIENT',
    notes: 'Acme Retainer',
    isAuto: true,
  },
  {
    id: 'tx2',
    amount: 55,
    type: 'EXPENSE',
    status: 'COMPLETED',
    date: new Date().toISOString(),
    sourceType: 'subscription',
    sourceId: 's1',
    subscriptionId: 's1',
    categoryId: 'TOOLS',
    notes: 'Adobe CC',
    isAuto: true,
  }
];
