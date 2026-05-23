export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  revenue: number;
  clientType: 'INDIVIDUAL' | 'COMPANY';
  status: 'ACTIVE' | 'COMPLETED' | 'PROSPECT' | 'INACTIVE';
  paymentType: 'onetime' | 'retainer';
  paymentDate?: string;
  billingDay?: number;
  nextBillingDate?: string;
  recorded?: boolean;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  notes?: string;
  billingDay: number;
  nextBillingDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  transactionId?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  status: 'COMPLETED' | 'PENDING';
  date: string;
  notes?: string;
  sourceType: 'manual' | 'client' | 'subscription';
  sourceId?: string;
  clientId?: string;
  subscriptionId?: string;
  categoryId: string;
  isAuto?: boolean;
  isEdited?: boolean;
}

export interface OverviewStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeSubscriptionsCount: number;
  subscriptionBurden: number;
  totalClients: number;
  activeClients: number;
}
