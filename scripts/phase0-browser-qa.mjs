import { chromium } from 'playwright';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || WEB_URL;
const TOKEN_PREFIX = 'flowledger-dev:';

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const money0 = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const waitFor = async (label, predicate, timeoutMs = 10_000) => {
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

const snapshot = async (page) => {
  const response = await page.request.get(`${API_URL}/api/dashboard/overview`);
  assert(response.ok(), `Overview API returned ${response.status()}`);
  return response.json();
};

const totals = (data) => {
  const completed = data.transactions.filter((tx) => tx.status === 'COMPLETED');
  const revenue = completed.filter((tx) => tx.type === 'INCOME').reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = completed.filter((tx) => tx.type === 'EXPENSE').reduce((sum, tx) => sum + tx.amount, 0);
  return { revenue, expenses, profit: revenue - expenses };
};

const linkedClientTransactions = (data, clientId) => {
  return data.transactions.filter((tx) => tx.clientId === clientId || (tx.sourceType === 'client' && tx.sourceId === clientId));
};

const linkedSubscriptionTransactions = (data, subscriptionId) => {
  return data.transactions.filter((tx) => tx.subscriptionId === subscriptionId || (tx.sourceType === 'subscription' && tx.sourceId === subscriptionId));
};

const findClient = (data, name) => data.clients.find((client) => client.name === name);
const findSubscription = (data, name) => data.subscriptions.find((subscription) => subscription.name === name);

const devAuthUserFor = (qaId) => {
  const email = `${qaId.toLowerCase().replace(/[^a-z0-9._-]/g, '-')}@flowledger.local`;
  return {
    id: `dev-${email.replace(/[^a-z0-9._-]/g, '-')}`,
    email,
  };
};

const devAuthHeaderFor = (user) => {
  return `Bearer ${TOKEN_PREFIX}${encodeURIComponent(JSON.stringify(user))}`;
};

const deleteIfPresent = async (page, path) => {
  const response = await page.request.delete(`${API_URL}${path}`);
  assert(response.ok() || response.status() === 404, `Cleanup delete failed for ${path}: ${response.status()}`);
};

const cleanupQaArtifacts = async (page) => {
  const data = await snapshot(page);
  const qaClients = data.clients.filter((client) => client.name.startsWith('QA '));
  const qaSubscriptions = data.subscriptions.filter((subscription) => subscription.name.startsWith('QA '));
  const qaTransactions = data.transactions.filter((transaction) => transaction.notes?.startsWith('QA '));

  for (const client of qaClients) {
    await deleteIfPresent(page, `/api/clients/delete/${client.id}`);
  }

  for (const subscription of qaSubscriptions) {
    await deleteIfPresent(page, `/api/subscriptions/delete/${subscription.id}`);
  }

  for (const transaction of qaTransactions) {
    await deleteIfPresent(page, `/api/transactions/delete/${transaction.id}`);
  }
};

const saveAndWaitForNoModal = async (page, buttonName) => {
  await page.getByRole('button', { name: buttonName }).click();
  await page.locator('.fixed.inset-0').waitFor({ state: 'detached', timeout: 10_000 }).catch(() => undefined);
};

const assertTransactionsRowCount = async (page, text, expectedCount) => {
  await page.goto(`${WEB_URL}/transactions`);
  await waitFor(`transaction row count for ${text}`, async () => {
    const count = await page.locator('tbody tr').filter({ hasText: text }).count();
    return count === expectedCount;
  });
};

const assertOverviewAndAnalytics = async (page, expectedText, expectedAmount) => {
  const data = await snapshot(page);
  const total = totals(data);

  await page.goto(WEB_URL);
  await page.getByText(money0(total.revenue)).first().waitFor({ timeout: 10_000 });
  await page.getByText(money0(total.expenses)).first().waitFor({ timeout: 10_000 });

  await page.goto(`${WEB_URL}/analytics`);
  await page.getByText(expectedText).first().waitFor({ timeout: 10_000 });
  await page.getByText(money0(expectedAmount)).first().waitFor({ timeout: 10_000 });
};

const run = async () => {
  const qaId = `QA ${Date.now()}`;
  const oneTimeName = `${qaId} One-Time Client`;
  const subscriptionName = `${qaId} Tool`;
  const subscriptionNameUpdated = `${qaId} Tool Pro`;
  const retainerName = `${qaId} Retainer Client`;
  const retainerNameUpdated = `${qaId} Retainer Updated`;
  const manualNote = `${qaId} Manual Revenue`;
  const manualNoteUpdated = `${qaId} Manual Revenue Updated`;

  const devUser = devAuthUserFor(qaId);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: devAuthHeaderFor(devUser) },
  });
  await context.addInitScript((user) => {
    window.localStorage.clear();
    window.localStorage.setItem('flowledger-dev-auth-user', JSON.stringify(user));
  }, devUser);
  const page = await context.newPage();
  page.on('response', async (response) => {
    if (!response.url().includes('/api/dashboard/snapshot') || response.ok()) return;
    console.error(`Snapshot save failed with ${response.status()}: ${await response.text().catch(() => '<unreadable>')}`);
  });
  page.on('requestfailed', (request) => {
    if (request.url().includes('/api/dashboard/snapshot')) {
      console.error(`Snapshot request failed: ${request.failure()?.errorText || 'unknown error'}`);
    }
  });

  try {
    await cleanupQaArtifacts(page);

    await page.goto(WEB_URL);
    await page.getByText('Quick Actions').waitFor({ timeout: 15_000 });

    // One-time client payment flow.
    await page.goto(`${WEB_URL}/clients`);
    await page.getByRole('button', { name: 'Add Client' }).click();
    await page.getByLabel('Client Name', { exact: true }).fill(oneTimeName);
    await page.getByLabel('Amount', { exact: true }).fill('1200');
    await page.getByLabel('Company', { exact: true }).fill('QA Company');
    await page.getByLabel('Email', { exact: true }).fill('qa-one-time@example.com');
    await page.getByLabel('Payment Date', { exact: true }).fill(today());
    await saveAndWaitForNoModal(page, 'Save Client');

    let oneTimeClient = await waitFor('one-time client persisted', async () => findClient(await snapshot(page), oneTimeName));
    let oneTimeTxs = linkedClientTransactions(await snapshot(page), oneTimeClient.id);
    assert(oneTimeTxs.length === 1, `Expected one one-time linked transaction, found ${oneTimeTxs.length}`);
    assert(oneTimeTxs[0].amount === 1200, 'One-time linked transaction amount did not match initial revenue');
    await assertTransactionsRowCount(page, oneTimeName, 1);
    await assertOverviewAndAnalytics(page, oneTimeName, 1200);

    await page.goto(`${WEB_URL}/clients`);
    await page.getByRole('button', { name: `Edit ${oneTimeName}` }).click();
    await page.getByLabel('Amount', { exact: true }).fill('1800');
    await saveAndWaitForNoModal(page, 'Save Client');

    oneTimeClient = await waitFor('one-time client revenue updated', async () => {
      const client = findClient(await snapshot(page), oneTimeName);
      return client?.revenue === 1800 ? client : null;
    });
    oneTimeTxs = linkedClientTransactions(await snapshot(page), oneTimeClient.id);
    assert(oneTimeTxs.length === 1, `Expected one one-time linked transaction after edit, found ${oneTimeTxs.length}`);
    assert(oneTimeTxs[0].amount === 1800, 'One-time linked transaction amount did not update');
    await assertOverviewAndAnalytics(page, oneTimeName, 1800);

    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByText(oneTimeName).waitFor({ timeout: 10_000 });
    oneTimeClient = findClient(await snapshot(page), oneTimeName);
    assert(Boolean(oneTimeClient), 'One-time client did not persist after refresh');

    await page.goto(`${WEB_URL}/clients`);
    await page.getByRole('button', { name: `Delete ${oneTimeName}` }).click();
    await page.getByRole('button', { name: 'Delete Permanently' }).click();
    await waitFor('one-time client deleted', async () => !findClient(await snapshot(page), oneTimeName));
    assert(linkedClientTransactions(await snapshot(page), oneTimeClient.id).length === 0, 'One-time linked transaction remained after client delete');
    await assertTransactionsRowCount(page, oneTimeName, 0);

    // Subscription flow.
    await page.goto(`${WEB_URL}/subscriptions`);
    await page.getByRole('button', { name: 'Add Subscription' }).click();
    await page.getByLabel('Service Name', { exact: true }).fill(subscriptionName);
    await page.getByLabel('Cost', { exact: true }).fill('35');
    await page.getByLabel('Next Billing Date', { exact: true }).fill(today());
    await page.locator('select[name="cycle"]').selectOption('MONTHLY');
    await saveAndWaitForNoModal(page, 'Save Subscription');

    let subscription = await waitFor('subscription persisted', async () => findSubscription(await snapshot(page), subscriptionName));
    let subscriptionTxs = linkedSubscriptionTransactions(await snapshot(page), subscription.id);
    assert(subscriptionTxs.length === 1, `Expected one subscription linked transaction, found ${subscriptionTxs.length}`);
    assert(subscriptionTxs[0].amount === 35, 'Subscription linked transaction amount did not match initial cost');
    await assertTransactionsRowCount(page, `Subscription: ${subscriptionName}`, 1);
    await assertOverviewAndAnalytics(page, subscriptionName, 35);

    await page.goto(`${WEB_URL}/subscriptions`);
    await page.getByRole('button', { name: `Edit ${subscriptionName}` }).click();
    await page.getByLabel('Service Name', { exact: true }).fill(subscriptionNameUpdated);
    await page.getByLabel('Cost', { exact: true }).fill('70');
    await page.getByLabel('Next Billing Date', { exact: true }).fill(tomorrow());
    await page.locator('select[name="cycle"]').selectOption('YEARLY');
    await saveAndWaitForNoModal(page, 'Save Subscription');

    subscription = await waitFor('subscription updated', async () => {
      const sub = findSubscription(await snapshot(page), subscriptionNameUpdated);
      return sub?.amount === 70 && sub?.cycle === 'YEARLY' ? sub : null;
    });
    subscriptionTxs = linkedSubscriptionTransactions(await snapshot(page), subscription.id);
    assert(subscriptionTxs.length === 1, `Expected one subscription linked transaction after edit, found ${subscriptionTxs.length}`);
    assert(subscriptionTxs[0].amount === 70, 'Subscription linked transaction amount did not update');
    assert(subscriptionTxs[0].notes === `Subscription: ${subscriptionNameUpdated}`, 'Subscription linked transaction notes did not update');
    await assertTransactionsRowCount(page, `Subscription: ${subscriptionNameUpdated}`, 1);
    await assertOverviewAndAnalytics(page, subscriptionNameUpdated, 70);

    await page.goto(`${WEB_URL}/subscriptions`);
    await page.getByRole('button', { name: `Delete ${subscriptionNameUpdated}` }).click();
    await page.getByRole('button', { name: 'Delete Subscription' }).click();
    await waitFor('subscription deleted', async () => !findSubscription(await snapshot(page), subscriptionNameUpdated));
    assert(linkedSubscriptionTransactions(await snapshot(page), subscription.id).length === 0, 'Subscription linked transaction remained after delete');
    await assertTransactionsRowCount(page, subscriptionNameUpdated, 0);

    // Retainer client flow.
    await page.goto(`${WEB_URL}/clients`);
    await page.getByRole('button', { name: 'Add Client' }).click();
    await page.getByLabel('Client Name', { exact: true }).fill(retainerName);
    await page.getByLabel('Amount', { exact: true }).fill('2400');
    await page.locator('select[name="paymentType"]').selectOption('retainer');
    await page.getByLabel('Next Billing Date', { exact: true }).fill(today());
    await saveAndWaitForNoModal(page, 'Save Client');

    let retainerClient = await waitFor('retainer client persisted', async () => findClient(await snapshot(page), retainerName));
    let retainerTxs = linkedClientTransactions(await snapshot(page), retainerClient.id);
    assert(retainerTxs.length === 1, `Expected one retainer linked transaction, found ${retainerTxs.length}`);
    assert(retainerTxs[0].amount === 2400, 'Retainer linked transaction amount did not match initial revenue');
    await assertTransactionsRowCount(page, retainerName, 1);

    await page.goto(`${WEB_URL}/clients`);
    await page.getByRole('button', { name: `Edit ${retainerName}` }).click();
    await page.getByLabel('Client Name', { exact: true }).fill(retainerNameUpdated);
    await page.getByLabel('Amount', { exact: true }).fill('3000');
    await page.getByLabel('Next Billing Date', { exact: true }).fill(tomorrow());
    await saveAndWaitForNoModal(page, 'Save Client');

    retainerClient = await waitFor('retainer client updated', async () => {
      const client = findClient(await snapshot(page), retainerNameUpdated);
      return client?.revenue === 3000 ? client : null;
    });
    retainerTxs = linkedClientTransactions(await snapshot(page), retainerClient.id);
    assert(retainerTxs.length === 1, `Expected one retainer linked transaction after edit, found ${retainerTxs.length}`);
    assert(retainerTxs[0].amount === 3000, 'Retainer linked transaction amount did not update');
    assert(retainerTxs[0].notes === `${retainerNameUpdated} retainer`, 'Retainer linked transaction notes did not update');

    await page.goto(`${WEB_URL}/clients`);
    await page.getByRole('button', { name: `Delete ${retainerNameUpdated}` }).click();
    await page.getByRole('button', { name: 'Delete Permanently' }).click();
    await waitFor('retainer client deleted', async () => !findClient(await snapshot(page), retainerNameUpdated));
    assert(linkedClientTransactions(await snapshot(page), retainerClient.id).length === 0, 'Retainer linked transaction remained after delete');

    // Manual transaction flow.
    await page.goto(WEB_URL);
    await page.getByRole('button', { name: 'Add Revenue' }).first().click();
    await page.getByLabel('Description', { exact: true }).fill(manualNote);
    await page.getByLabel('Amount', { exact: true }).fill('555');
    await page.getByLabel('Date', { exact: true }).fill(today());
    await saveAndWaitForNoModal(page, 'Save Entry');

    let manualTx = await waitFor('manual transaction persisted', async () => {
      const data = await snapshot(page);
      return data.transactions.find((tx) => tx.notes === manualNote);
    });
    assert(manualTx.sourceType === 'manual', 'Manual transaction was linked to a source');
    assert(!manualTx.clientId && !manualTx.subscriptionId, 'Manual transaction has source foreign keys');

    await page.goto(`${WEB_URL}/transactions`);
    await page.getByRole('button', { name: `Edit ${manualNote}` }).click();
    await page.getByLabel('Amount', { exact: true }).fill('650');
    await page.getByLabel('Notes', { exact: true }).fill(manualNoteUpdated);
    await saveAndWaitForNoModal(page, 'Save Changes');

    manualTx = await waitFor('manual transaction updated', async () => {
      const data = await snapshot(page);
      return data.transactions.find((tx) => tx.notes === manualNoteUpdated && tx.amount === 650);
    });
    assert(manualTx.sourceType === 'manual', 'Edited manual transaction was linked to a source');

    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByText(manualNoteUpdated).waitFor({ timeout: 10_000 });

    await page.getByRole('button', { name: `Delete ${manualNoteUpdated}` }).click();
    await waitFor('manual transaction deleted', async () => {
      const data = await snapshot(page);
      return !data.transactions.some((tx) => tx.notes === manualNoteUpdated);
    });

    console.log(JSON.stringify({
      ok: true,
      qaId,
      checks: [
        'one-time client create/edit/delete sync',
        'overview and analytics update after client changes',
        'browser refresh reloads one-time client from Supabase',
        'subscription create/edit/delete sync without duplicates',
        'retainer create/edit/delete sync',
        'manual transaction create/edit/delete remains independent',
        'browser refresh reloads manual transaction from Supabase',
      ],
    }, null, 2));
  } finally {
    await cleanupQaArtifacts(page).catch((err) => console.error(`QA cleanup failed: ${err.message}`));
    await browser.close();
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
