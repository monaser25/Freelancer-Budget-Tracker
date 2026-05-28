import { Client, Subscription, Transaction } from '@/types/finance';
import { getDevAuthHeaders, isDevAuthEnabled } from '@/lib/devAuth';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

export type FinancialSnapshot = {
  clients: Client[];
  subscriptions: Subscription[];
  transactions: Transaction[];
};

const apiBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL || '';
  return raw.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
};

class ApiRequestError extends Error {
  status?: number;
  responseBody?: string;
  serverMessage?: string;

  constructor(message: string, status?: number, responseBody?: string, serverMessage?: string) {
    super(message);
    this.status = status;
    this.responseBody = responseBody;
    this.serverMessage = serverMessage;
  }
}

const parseServerError = (body?: string) => {
  if (!body) return undefined;
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.error === 'string') return parsed.error;
      if (Array.isArray(parsed.details) && parsed.details.length > 0) {
        const first = parsed.details[0];
        if (first && typeof first.message === 'string') return first.message;
      }
    }
  } catch {
    // Body wasn't JSON; fall through to undefined and use the default message.
  }
  return undefined;
};

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

const logApiFailure = (method: string, url: string, err: unknown) => {
  if (err instanceof ApiRequestError) {
    console.error('FlowLedger API request failed', {
      method,
      url,
      status: err.status,
      responseBody: err.responseBody,
    });
    return;
  }

  console.error('FlowLedger API request failed', {
    method,
    url,
    error: err instanceof Error ? err.message : String(err),
  });
};

const userMessageForFailure = (resource: string, err: unknown) => {
  if (err instanceof ApiRequestError) {
    if (err.serverMessage) return err.serverMessage;
    if (err.status === 404) return `${resource[0].toUpperCase()}${resource.slice(1)} target was not found.`;
    if (err.status === 400) return `Unable to ${resource}. The server rejected the request as invalid.`;
    return `Unable to ${resource}. Server responded with ${err.status}.`;
  }

  return `Unable to ${resource}. Check that the API is reachable and try again.`;
};

const apiRequest = async <T>(path: string, options: RequestInit = {}, resource: string): Promise<T> => {
  const method = options.method || 'GET';
  const url = `${apiBaseUrl()}${path}`;

  try {
    const headers = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(await authHeaders()),
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      method,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => undefined);
      throw new ApiRequestError(`HTTP ${response.status}`, response.status, responseBody, parseServerError(responseBody));
    }

    return response.json();
  } catch (err) {
    logApiFailure(method, url, err);
    throw new Error(userMessageForFailure(resource, err));
  }
};

export const loadFinancialSnapshot = async (): Promise<FinancialSnapshot> => {
  return apiRequest<FinancialSnapshot>('/api/dashboard/overview', {}, 'load financial data');
};

export const createClientAPI = async (client: Partial<Client>) => {
  return apiRequest<Client>('/api/clients/create', {
    method: 'POST',
    body: JSON.stringify(client),
  }, 'create client');
};

export const updateClientAPI = async (id: string, updates: Partial<Client>) => {
  return apiRequest<Client>(`/api/clients/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }, 'update client');
};

export const deleteClientAPI = async (id: string) => {
  return apiRequest<Client>(`/api/clients/delete/${id}`, {
    method: 'DELETE',
  }, 'delete client');
};

<<<<<<< HEAD
export const restoreClientAPI = async (id: string) => {
  return apiRequest<Client>(`/api/clients/restore/${id}`, {
    method: 'PATCH',
  }, 'restore client');
};

=======
>>>>>>> 8dff0d787412a023feb47cd94d0d5457c2fb31c8
export const recordClientPaymentAPI = async (id: string) => {
  return apiRequest<{ client: Client; transaction: Transaction }>(`/api/clients/${id}/record-payment`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, 'record client payment');
};

export const createSubscriptionAPI = async (subscription: Partial<Subscription>) => {
  return apiRequest<Subscription>('/api/subscriptions/create', {
    method: 'POST',
    body: JSON.stringify(subscription),
  }, 'create subscription');
};

export const updateSubscriptionAPI = async (id: string, updates: Partial<Subscription>) => {
  return apiRequest<Subscription>(`/api/subscriptions/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }, 'update subscription');
};

export const deleteSubscriptionAPI = async (id: string) => {
  return apiRequest<Subscription>(`/api/subscriptions/delete/${id}`, {
    method: 'DELETE',
  }, 'delete subscription');
};

<<<<<<< HEAD
export const restoreSubscriptionAPI = async (id: string) => {
  return apiRequest<Subscription>(`/api/subscriptions/restore/${id}`, {
    method: 'PATCH',
  }, 'restore subscription');
};

=======
>>>>>>> 8dff0d787412a023feb47cd94d0d5457c2fb31c8
export const recordSubscriptionPaymentAPI = async (id: string) => {
  return apiRequest<{ subscription: Subscription; transaction: Transaction }>(`/api/subscriptions/${id}/record-payment`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, 'record subscription payment');
};

export const createTransactionAPI = async (transaction: Partial<Transaction>) => {
  return apiRequest<Transaction>('/api/transactions/create', {
    method: 'POST',
    body: JSON.stringify(transaction),
  }, 'create transaction');
};

export const updateTransactionAPI = async (id: string, updates: Partial<Transaction>) => {
  return apiRequest<Transaction>(`/api/transactions/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }, 'update transaction');
};

export const deleteTransactionAPI = async (id: string) => {
  return apiRequest<{ success: boolean }>(`/api/transactions/delete/${id}`, {
    method: 'DELETE',
  }, 'delete transaction');
};
