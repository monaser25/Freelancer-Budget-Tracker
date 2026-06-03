/* The canvas — arranges every screen in light+dark within sections.
   IMPORTANT: DCSection unwraps Fragments only, not custom components — so
   helpers must return Fragments of DCArtboards, not be React components. */

const SCREEN_W = 414;
const SCREEN_H = 872;

// Plain function (NOT a React component) that returns a Fragment containing
// up to two DCArtboards (dark + light) — Fragments are unwrapped by DCSection.
function pair(idBase, label, render, tweaks, showDark, showLight) {
  const board = (theme) => (
    <DCArtboard key={theme} id={`${idBase}-${theme[0]}`} label={`${label} · ${theme === 'dark' ? 'Dark' : 'Light'}`} width={SCREEN_W} height={SCREEN_H}>
      <div style={{ width: SCREEN_W, height: SCREEN_H, display: 'grid', placeItems: 'center', background: theme === 'dark' ? '#050507' : '#F0F0F4' }}>
        <Phone theme={theme} accent={tweaks.accent} radius={tweaks.radius} density={tweaks.density} font={tweaks.font}>
          {render(theme)}
        </Phone>
      </div>
    </DCArtboard>
  );
  return (
    <>
      {showDark && board('dark')}
      {showLight && board('light')}
    </>
  );
}

function AppCanvas({ tweaks }) {
  const { ccy, mode } = tweaks;
  const showDark = mode === 'both' || mode === 'dark';
  const showLight = mode === 'both' || mode === 'light';
  const P = (idBase, label, fn) => pair(idBase, label, fn, tweaks, showDark, showLight);

  return (
    <DesignCanvas>
      <DCSection id="auth" title="Auth & onboarding" subtitle="Splash · Login · Register · Forgot · Reset · Verify">
        {P('splash', 'Splash', () => <SplashScreen ccy={ccy} />)}
        {P('login', 'Login', () => <LoginScreen />)}
        {P('register', 'Register', () => <RegisterScreen />)}
        {P('forgot', 'Forgot password', () => <ForgotScreen />)}
        {P('reset', 'Reset password', () => <ResetScreen />)}
        {P('verify', 'Verify email', () => <VerifyScreen />)}
      </DCSection>

      <DCSection id="onboarding" title="Onboarding" subtitle="5 swipeable steps">
        {P('onb1', '1 · Welcome', () => <OnboardingScreen step={1} ccy={ccy} />)}
        {P('onb2', '2 · Currency', () => <OnboardingScreen step={2} ccy={ccy} />)}
        {P('onb3', '3 · First client', () => <OnboardingScreen step={3} ccy={ccy} />)}
        {P('onb4', '4 · First subscription', () => <OnboardingScreen step={4} ccy={ccy} />)}
        {P('onb5', '5 · Done', () => <OnboardingScreen step={5} ccy={ccy} />)}
      </DCSection>

      <DCSection id="home" title="Home & Transactions" subtitle="Dashboard, ledger, and add-transaction sheet">
        {P('home', 'Home / Overview', () => <HomeScreen ccy={ccy} />)}
        {P('tx', 'Transactions', () => <TransactionsScreen ccy={ccy} />)}
        {P('addtx', 'Add Transaction · sheet', () => <AddTxScreen ccy={ccy} />)}
      </DCSection>

      <DCSection id="invoices" title="Invoices" subtitle="List · create/edit · detail">
        {P('invlist', 'Invoices list', () => <InvoicesScreen ccy={ccy} />)}
        {P('invedit', 'Invoice · create', () => <InvoiceEditScreen ccy={ccy} />)}
        {P('invdetail', 'Invoice · detail', () => <InvoiceDetailScreen ccy={ccy} />)}
      </DCSection>

      <DCSection id="clients" title="Clients & Subscriptions" subtitle="Manage who pays you and what you pay for">
        {P('clients', 'Clients', () => <ClientsScreen ccy={ccy} />)}
        {P('addclient', 'Add client · sheet', () => <AddClientScreen ccy={ccy} />)}
        {P('subs', 'Subscriptions', () => <SubscriptionsScreen ccy={ccy} />)}
        {P('addsub', 'Add subscription · sheet', () => <AddSubScreen ccy={ccy} />)}
      </DCSection>

      <DCSection id="analytics" title="Analytics & Reports">
        {P('analytics', 'Analytics', () => <AnalyticsScreen ccy={ccy} />)}
        {P('reports', 'Reports / Export', () => <ReportsScreen ccy={ccy} />)}
      </DCSection>

      <DCSection id="more" title="Account, Settings & Plans" subtitle="More menu, settings, profile, plans, billing">
        {P('more', 'More menu', () => <MoreScreen ccy={ccy} />)}
        {P('settings', 'Settings', (theme) => <SettingsScreen ccy={ccy} theme={theme} />)}
        {P('profile', 'Profile / Account', () => <ProfileScreen ccy={ccy} />)}
        {P('pricing', 'Pricing / Plans', () => <PricingScreen ccy={ccy} />)}
        {P('billing', 'Billing & Upgrade', () => <BillingScreen ccy={ccy} />)}
        {P('notif', 'Notifications', () => <NotificationsScreen ccy={ccy} />)}
      </DCSection>

      <DCSection id="system" title="System states" subtitle="Archive · Offline · Error / 404">
        {P('archive', 'Archive', () => <ArchiveScreen ccy={ccy} />)}
        {P('offline', 'Offline', () => <OfflineScreen ccy={ccy} />)}
        {P('error', 'Error / Not found', () => <ErrorScreen ccy={ccy} />)}
      </DCSection>
    </DesignCanvas>
  );
}

Object.assign(window, { AppCanvas });
