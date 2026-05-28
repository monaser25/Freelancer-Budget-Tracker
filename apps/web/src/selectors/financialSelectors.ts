import { Transaction, Client, Subscription } from '@/types/finance';

export const getTotalRevenue = (transactions: Transaction[]) => {
  return transactions
    .filter(tx => tx.type === 'INCOME' && tx.status === 'COMPLETED')
    .reduce((sum, tx) => sum + tx.amount, 0);
};

export const getTotalExpenses = (transactions: Transaction[]) => {
  return transactions
    .filter(tx => tx.type === 'EXPENSE' && tx.status === 'COMPLETED')
    .reduce((sum, tx) => sum + tx.amount, 0);
};

export const getNetProfit = (transactions: Transaction[]) => {
  return getTotalRevenue(transactions) - getTotalExpenses(transactions);
};

export const getMonthlyRevenue = (transactions: Transaction[]) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return transactions
    .filter(tx => {
      const d = new Date(tx.date);
      return tx.type === 'INCOME' && tx.status === 'COMPLETED' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
};

export const getClientRevenue = (transactions: Transaction[], clientId: string) => {
  return transactions
    .filter(tx => tx.type === 'INCOME' && tx.status === 'COMPLETED' && (tx.clientId === clientId || (tx.sourceType === 'client' && tx.sourceId === clientId)))
    .reduce((sum, tx) => sum + tx.amount, 0);
};

export const getRecentTransactions = (transactions: Transaction[], limit = 5) => {
  return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
};

export const getTopClients = (transactions: Transaction[], clients: Client[], limit = 5) => {
  const clientRevenue: Record<string, number> = {};
  
  transactions.forEach(tx => {
    const clientId = tx.clientId || (tx.sourceType === 'client' ? tx.sourceId : undefined);
    if (tx.type === 'INCOME' && clientId) {
      clientRevenue[clientId] = (clientRevenue[clientId] || 0) + tx.amount;
    }
  });

  return clients
    .map(c => ({ client: c, revenue: clientRevenue[c.id] || 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

export const getRevenueBreakdown = (transactions: Transaction[]) => {
  const breakdown: Record<string, number> = {};
  transactions.filter(tx => tx.type === 'INCOME').forEach(tx => {
    breakdown[tx.sourceType] = (breakdown[tx.sourceType] || 0) + tx.amount;
  });
  return breakdown;
};

export const getActiveSubscriptionsCount = (subscriptions: Subscription[]) => {
  return subscriptions.filter(s => s.status === 'ACTIVE' && !s.archivedAt).length;
};

export const getSubscriptionBurden = (subscriptions: Subscription[]) => {
  return subscriptions
    .filter(s => s.status === 'ACTIVE' && !s.archivedAt)
    .reduce((sum, subscription) => {
      const cycle = subscription.billingCycle || subscription.cycle;
      if (cycle === 'YEARLY') return sum + subscription.amount / 12;
      if (cycle === 'QUARTERLY') return sum + subscription.amount / 3;
      return sum + subscription.amount;
    }, 0);
};

export const getOverviewStats = (transactions: Transaction[], clients: Client[], subscriptions: Subscription[]) => {
  const totalRevenue = getTotalRevenue(transactions);
  const totalExpenses = getTotalExpenses(transactions);

  return {
    totalRevenue,
    monthlyRevenue: getMonthlyRevenue(transactions),
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    activeSubscriptionsCount: getActiveSubscriptionsCount(subscriptions),
    subscriptionBurden: getSubscriptionBurden(subscriptions),
    totalClients: clients.filter((client) => !client.archivedAt).length,
    activeClients: clients.filter((client) => client.status === 'ACTIVE' && !client.archivedAt).length,
  };
};
