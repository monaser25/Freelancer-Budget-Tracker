import { Client, Subscription, Transaction } from '@/types/finance';
import { getDevAuthHeaders, isDevAuthEnabled } from '@/lib/devAuth';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

export type FinancialSnapshot = {
  clients: Client[];
  subscriptions: Subscription[];
  transactions: Transaction[];
};

const apiBaseUrl = () => (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

const authHeaders = async () => {
  if (isDevAuthEnabled()) {
    const headers = getDevAuthHeaders();
    if (!headers) throw new Error('Missing local development session.');
    return headers;
  }

  const { data, error } = await getSupabaseBrowserClient().auth.getSession();

  if (error || !data.session?.access_token) {
    throw new Error('Missing authenticated Supabase session.');
  }

  return { Authorization: `Bearer ${data.session.access_token}` };
};

export const loadFinancialSnapshot = async (): Promise<FinancialSnapshot> => {
  const response = await fetch(`${apiBaseUrl()}/api/dashboard/overview`, {
    headers: await authHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to load financial snapshot: ${response.status}`);
  }

  return response.json();
};

export const createClientAPI = async (client: Partial<Client>) => {
  const response = await fetch(`${apiBaseUrl()}/api/clients/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(client),
  });
  if (!response.ok) throw new Error(`Failed to create client: ${response.status}`);
  return response.json();
};

export const updateClientAPI = async (id: string, updates: Partial<Client>) => {
  const response = await fetch(`${apiBaseUrl()}/api/clients/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error(`Failed to update client: ${response.status}`);
  return response.json();
};

export const deleteClientAPI = async (id: string) => {
  const response = await fetch(`${apiBaseUrl()}/api/clients/delete/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to delete client: ${response.status}`);
  return response.json();
};

export const createSubscriptionAPI = async (subscription: Partial<Subscription>) => {
  const response = await fetch(`${apiBaseUrl()}/api/subscriptions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(subscription),
  });
  if (!response.ok) throw new Error(`Failed to create subscription: ${response.status}`);
  return response.json();
};

export const updateSubscriptionAPI = async (id: string, updates: Partial<Subscription>) => {
  const response = await fetch(`${apiBaseUrl()}/api/subscriptions/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error(`Failed to update subscription: ${response.status}`);
  return response.json();
};

export const deleteSubscriptionAPI = async (id: string) => {
  const response = await fetch(`${apiBaseUrl()}/api/subscriptions/delete/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to delete subscription: ${response.status}`);
  return response.json();
};

export const createTransactionAPI = async (transaction: Partial<Transaction>) => {
  const response = await fetch(`${apiBaseUrl()}/api/transactions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(transaction),
  });
  if (!response.ok) throw new Error(`Failed to create transaction: ${response.status}`);
  return response.json();
};

export const updateTransactionAPI = async (id: string, updates: Partial<Transaction>) => {
  const response = await fetch(`${apiBaseUrl()}/api/transactions/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error(`Failed to update transaction: ${response.status}`);
  return response.json();
};

export const deleteTransactionAPI = async (id: string) => {
  const response = await fetch(`${apiBaseUrl()}/api/transactions/delete/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to delete transaction: ${response.status}`);
  return response.json();
};
