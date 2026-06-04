import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || WEB_URL;

const today = () => new Date().toISOString().slice(0, 10);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SUPABASE_PROJECT_REF = 'tpzydgcvlbndedsejqxb';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${SUPABASE_PROJECT_REF}.supabase.co`;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const serviceRoleKey = () => {
  const output = execFileSync('supabase', ['projects', 'api-keys', '--project-ref', SUPABASE_PROJECT_REF, '--output', 'json'], {
    encoding: 'utf8',
  });
  const keys = JSON.parse(output);
  const serviceRole = keys.find((key) => key.id === 'service_role' || key.name === 'service_role');
  assert(serviceRole?.api_key && !serviceRole.api_key.includes('··'), 'Could not load Supabase service role key for QA user setup');
  return serviceRole.api_key;
};

const createQaAuthAdmin = () => createClient(SUPABASE_URL, serviceRoleKey(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const createConfirmedUser = async (admin, email, password) => {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw error;
  assert(data.user?.id, `Failed to create QA user ${email}`);
  return data.user.id;
};

const deleteAuthUser = async (admin, userId) => {
  if (!userId) return;
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) console.error(`Failed to delete QA auth user ${userId}: ${error.message}`);
};

const waitFor = async (label, predicate, timeoutMs = 12_000) => {
  const start = Date.now();
  let lastError;

  while (Date.now() - start < timeoutMs) {
    try {
      const result = await predicate();
      if (result) return result;
    } catch (err) {
      lastError = err;
    }
    await delay(250);
  }

  throw new Error(`${label} timed out${lastError ? `: ${lastError.message}` : ''}`);
};

const accessToken = async (page) => {
  return page.evaluate(() => {
    const key = Object.keys(window.localStorage).find((item) => item.startsWith('sb-') && item.endsWith('-auth-token'));
    if (!key) return null;
    const session = JSON.parse(window.localStorage.getItem(key) || '{}');
    return session.access_token || null;
  });
};

const authHeaders = async (page) => {
  const token = await accessToken(page);
  assert(token, 'Missing Supabase access token in browser session');
  return { Authorization: `Bearer ${token}` };
};

const snapshot = async (page) => {
  const response = await page.request.get(`${API_URL}/api/dashboard/overview`, {
    headers: await authHeaders(page),
  });

  assert(response.ok(), `Overview API returned ${response.status()}: ${await response.text().catch(() => '')}`);
  return response.json();
};

const linkedClientTransactions = (data, clientId) => {
  return data.transactions.filter((tx) => tx.clientId === clientId || (tx.sourceType === 'client' && tx.sourceId === clientId));
};

const linkedSubscriptionTransactions = (data, subscriptionId) => {
  return data.transactions.filter((tx) => tx.subscriptionId === subscriptionId || (tx.sourceType === 'subscription' && tx.sourceId === subscriptionId));
};

const findClient = (data, name) => data.clients.find((client) => client.name === name);
const findSubscription = (data, name) => data.subscriptions.find((subscription) => subscription.name === name);
const findTransaction = (data, notes) => data.transactions.find((transaction) => transaction.notes === notes);

const saveAndWaitForNoModal = async (page, buttonName) => {
  await page.getByRole('button', { name: buttonName }).click();
  await page.locator('.fixed.inset-0').waitFor({ state: 'detached', timeout: 10_000 }).catch(() => undefined);
};

const register = async (page, email, password) => {
  await page.goto(`${WEB_URL}/register`);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.getByText('Quick Actions').waitFor({ timeout: 15_000 });
};

const login = async (page, email, password) => {
  await page.goto(`${WEB_URL}/login`);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByText('Quick Actions').waitFor({ timeout: 15_000 });
};

const logout = async (page) => {
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByText('Log in to FlowLedger').waitFor({ timeout: 15_000 });
};

const addClient = async (page, name, amount) => {
  await page.goto(`${WEB_URL}/clients`);
  await page.getByRole('button', { name: 'Add Client' }).click();
  await page.getByLabel('Client Name', { exact: true }).fill(name);
  await page.getByLabel('Amount', { exact: true }).fill(String(amount));
  await page.getByLabel('Payment Date', { exact: true }).fill(today());
  await saveAndWaitForNoModal(page, 'Save Client');
  return waitFor(`client ${name} persisted with linked transaction`, async () => {
    const data = await snapshot(page);
    const client = findClient(data, name);
    return client && linkedClientTransactions(data, client.id).length === 1 ? client : null;
  });
};

const addSubscription = async (page, name, amount) => {
  await page.goto(`${WEB_URL}/subscriptions`);
  await page.getByRole('button', { name: 'Add Subscription' }).click();
  await page.getByLabel('Service Name', { exact: true }).fill(name);
  await page.getByLabel('Cost', { exact: true }).fill(String(amount));
  await page.getByLabel('Next Billing Date', { exact: true }).fill(today());
  await page.locator('select[name="cycle"]').selectOption('MONTHLY');
  await saveAndWaitForNoModal(page, 'Save Subscription');
  return waitFor(`subscription ${name} persisted with linked transaction`, async () => {
    const data = await snapshot(page);
    const subscription = findSubscription(data, name);
    return subscription && linkedSubscriptionTransactions(data, subscription.id).length === 1 ? subscription : null;
  });
};

const addManualTransaction = async (page, notes, amount) => {
  await page.goto(WEB_URL);
  await page.getByRole('button', { name: 'Add Revenue' }).click();
  await page.getByLabel('Description', { exact: true }).fill(notes);
  await page.getByLabel('Amount', { exact: true }).fill(String(amount));
  await page.getByLabel('Date', { exact: true }).fill(today());
  await saveAndWaitForNoModal(page, 'Save Entry');
  return waitFor(`manual transaction ${notes} persisted`, async () => findTransaction(await snapshot(page), notes));
};

const clearFinancialCache = async (page) => {
  await page.evaluate(() => {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('flowledger-financial-state'))
      .forEach((key) => window.localStorage.removeItem(key));
  });
};

const cleanupCurrentUserData = async (page) => {
  const data = await snapshot(page);

  for (const client of data.clients) {
    await page.request.delete(`${API_URL}/api/clients/delete/${client.id}`, { headers: await authHeaders(page) });
  }

  for (const subscription of data.subscriptions) {
    await page.request.delete(`${API_URL}/api/subscriptions/delete/${subscription.id}`, { headers: await authHeaders(page) });
  }

  for (const transaction of data.transactions) {
    await page.request.delete(`${API_URL}/api/transactions/delete/${transaction.id}`, { headers: await authHeaders(page) });
  }
};

const run = async () => {
  const qaId = Date.now();
  const password = `FlowLedger-${qaId}!`;
  const userAEmail = `flowledger.qa.a.${qaId}@gmail.com`;
  const userBEmail = `flowledger.qa.b.${qaId}@gmail.com`;
  const userAClient = `QA ${qaId} User A Client`;
  const userASub = `QA ${qaId} User A Tool`;
  const userAManual = `QA ${qaId} User A Manual`;
  const userAManualUpdated = `QA ${qaId} User A Manual Updated`;
  const userBClient = `QA ${qaId} User B Client`;
  const admin = createQaAuthAdmin();
  let userAId;
  let userBId;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    userAId = await createConfirmedUser(admin, userAEmail, password);
    userBId = await createConfirmedUser(admin, userBEmail, password);

    await page.goto(WEB_URL);
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByText('Log in to FlowLedger').waitFor({ timeout: 15_000 });
    await page.goto(`${WEB_URL}/register`);
    await page.getByText('Create your FlowLedger account').waitFor({ timeout: 15_000 });

    await login(page, userAEmail, password);
    const clientA = await addClient(page, userAClient, 1000);
    const subscriptionA = await addSubscription(page, userASub, 45);
    const manualA = await addManualTransaction(page, userAManual, 125);

    let dataA = await snapshot(page);
    const userAClientLinks = linkedClientTransactions(dataA, clientA.id);
    const userASubscriptionLinks = linkedSubscriptionTransactions(dataA, subscriptionA.id);
    assert(userAClientLinks.length === 1, `User A client did not have exactly one linked transaction: ${JSON.stringify(dataA, null, 2)}`);
    assert(userASubscriptionLinks.length === 1, `User A subscription did not have exactly one linked transaction: ${JSON.stringify(dataA, null, 2)}`);
    assert(manualA.sourceType === 'manual' && !manualA.clientId && !manualA.subscriptionId, 'User A manual transaction was linked to a source');

    await clearFinancialCache(page);
    await page.reload();
    await page.getByText(userAClient).first().waitFor({ timeout: 15_000 });
    await page.getByText(userASub).first().waitFor({ timeout: 15_000 });

    await logout(page);

    await login(page, userBEmail, password);
    let dataB = await snapshot(page);
    assert(dataB.clients.length === 0 && dataB.subscriptions.length === 0 && dataB.transactions.length === 0, 'User B could see User A data');
    const clientB = await addClient(page, userBClient, 2000);
    dataB = await snapshot(page);
    assert(Boolean(findClient(dataB, userBClient)), 'User B client was not saved');
    assert(!findClient(dataB, userAClient), 'User B snapshot included User A client');

    await logout(page);

    await login(page, userAEmail, password);
    dataA = await snapshot(page);
    assert(Boolean(findClient(dataA, userAClient)), 'User A could not see User A client after login');
    assert(Boolean(findSubscription(dataA, userASub)), 'User A could not see User A subscription after login');
    assert(Boolean(findTransaction(dataA, userAManual)), 'User A could not see User A manual transaction after login');
    assert(!findClient(dataA, userBClient), 'User A could see User B data');

    await page.goto(`${WEB_URL}/clients`);
    await page.getByRole('button', { name: `Edit ${userAClient}` }).click();
    await page.getByLabel('Amount', { exact: true }).fill('1500');
    await saveAndWaitForNoModal(page, 'Save Client');
    dataA = await waitFor('User A client edit synced', async () => {
      const data = await snapshot(page);
      const editedClient = findClient(data, userAClient);
      const linked = editedClient ? linkedClientTransactions(data, editedClient.id) : [];
      if (editedClient?.revenue !== 1500 || linked.length !== 1 || linked[0].amount !== 1500) {
        console.log('Edit Sync pending. Client rev:', editedClient?.revenue, 'Tx amount:', linked[0]?.amount);
      }
      return editedClient?.revenue === 1500 && linked.length === 1 && linked[0].amount === 1500 ? data : null;
    });

    await page.goto(`${WEB_URL}/subscriptions`);
    await page.getByRole('button', { name: `Delete ${userASub}` }).click();
    await page.getByRole('button', { name: 'Delete Subscription' }).click();
    dataA = await waitFor('User A subscription delete synced', async () => {
      const data = await snapshot(page);
      return !findSubscription(data, userASub) && linkedSubscriptionTransactions(data, subscriptionA.id).length === 0 ? data : null;
    });

    await page.goto(`${WEB_URL}/transactions`);
    await page.locator('tbody tr').filter({ hasText: userAManual }).getByRole('button', { name: /Edit/ }).click();
    await page.getByLabel('Amount', { exact: true }).fill('175');
    await page.getByLabel('Notes', { exact: true }).fill(userAManualUpdated);
    await saveAndWaitForNoModal(page, 'Save Changes');
    dataA = await waitFor('User A manual edit synced', async () => {
      const data = await snapshot(page);
      return findTransaction(data, userAManualUpdated)?.amount === 175 ? data : null;
    });

    await page.locator('tbody tr').filter({ hasText: userAManualUpdated }).getByRole('button', { name: /Delete/ }).click();
    dataA = await waitFor('User A manual delete synced', async () => {
      const data = await snapshot(page);
      return !findTransaction(data, userAManualUpdated) ? data : null;
    });

    await page.goto(`${WEB_URL}/clients`);
    await page.getByRole('button', { name: `Delete ${userAClient}` }).click();
    await page.getByRole('button', { name: 'Delete Permanently' }).click();
    dataA = await waitFor('User A client delete synced', async () => {
      const data = await snapshot(page);
      return !findClient(data, userAClient) && linkedClientTransactions(data, clientA.id).length === 0 ? data : null;
    });

    await cleanupCurrentUserData(page);
    await logout(page);
    await login(page, userBEmail, password);
    assert(Boolean(findClient(await snapshot(page), userBClient)), 'User B data missing after User A cleanup');
    await cleanupCurrentUserData(page);

    console.log(JSON.stringify({
      ok: true,
      qaId,
      userAEmail,
      userBEmail,
      checks: [
        'unauthenticated dashboard redirects to login',
        'register page loads and User A login session works',
        'User A data persists after refresh from API',
        'User B cannot see User A data',
        'User B data persists separately',
        'User A cannot see User B data',
        'User A client edit/delete stays scoped and synced',
        'User A subscription delete stays scoped and synced',
        'User A manual transaction edit/delete remains independent',
      ],
    }, null, 2));
  } finally {
    await cleanupCurrentUserData(page).catch(() => undefined);
    await browser.close();
    await deleteAuthUser(admin, userAId);
    await deleteAuthUser(admin, userBId);
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
