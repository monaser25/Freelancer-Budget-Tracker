/* Onboarding: 5 steps in one viewport per artboard (we show step 3 as the "good" page).
   We render all 5 by passing step prop. */

function OnboardingScreen({ step = 3, ccy = 'USD' }) {
  const totalSteps = 5;
  return (
    <div className="screen-body" style={{ padding: '8px 24px 28px', gap: 0 }}>
      {/* Top: skip + progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              width: i === step - 1 ? 18 : 6, height: 6, borderRadius: 999,
              background: i <= step - 1 ? 'var(--accent)' : 'var(--surface-hover)',
              transition: 'all 200ms'
            }} />
          ))}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Skip</span>
      </div>

      {/* Body switches by step */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, marginTop: 16 }}>
        {step === 1 && <OnbWelcome />}
        {step === 2 && <OnbCurrency ccy={ccy} />}
        {step === 3 && <OnbClient ccy={ccy} />}
        {step === 4 && <OnbSubscription ccy={ccy} />}
        {step === 5 && <OnbDone />}
      </div>

      {/* Bottom CTA */}
      <Button variant="primary" block style={{ marginTop: 16 }}>
        {step === 5 ? 'Go to home' : 'Continue'}
      </Button>
    </div>
  );
}

function OnbWelcome() {
  return (
    <>
      <div style={{ display: 'grid', placeItems: 'center', height: 220 }}>
        <BrandMark size={104} />
      </div>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Welcome to FlowLedger</h1>
        <div style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15, lineHeight: 1.5 }}>
          A quieter way to track freelance income, expenses, and subscriptions. Let's set up in under a minute.
        </div>
      </div>
      <Field label="WHAT SHOULD WE CALL YOU?" value="Sarah" icon="user" focused />
    </>
  );
}

function OnbCurrency({ ccy }) {
  const opts = [
    { code: 'USD', name: 'US Dollar', sym: '$' },
    { code: 'EUR', name: 'Euro', sym: '€' },
    { code: 'GBP', name: 'British Pound', sym: '£' },
    { code: 'EGP', name: 'Egyptian Pound', sym: 'E£' },
    { code: 'SAR', name: 'Saudi Riyal', sym: '﷼' },
    { code: 'AED', name: 'UAE Dirham', sym: 'د.إ' },
  ];
  return (
    <>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Pick your currency</h1>
        <div style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>Used for formatting only. You can change this in settings.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {opts.map((o) => {
          const active = o.code === ccy;
          return (
            <div key={o.code} style={{
              padding: 14, borderRadius: 12,
              background: active ? 'var(--accent-tint)' : 'var(--surface)',
              border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              display: 'flex', flexDirection: 'column', gap: 4
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text)' }}>{o.sym}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.code} · {o.name}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function OnbClient({ ccy }) {
  return (
    <>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Add your first client</h1>
        <div style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>You can do this later — but it's faster now.</div>
      </div>
      <Field label="CLIENT NAME" value="Northwind Studios" icon="briefcase" focused />
      <Field label="PAYMENT TYPE" value="Retainer · monthly" icon="repeat" right={<Icon name="chevD" size={16} color="var(--text-muted)" />} />
      <Field label="MONTHLY AMOUNT" value="2,400.00" icon="dollar" />
      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Skip for now</span>
      </div>
    </>
  );
}

function OnbSubscription({ ccy }) {
  return (
    <>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Track your tools</h1>
        <div style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>Subscriptions sneak up. Add one to start watching the burn.</div>
      </div>
      <Field label="SUBSCRIPTION" value="Figma Professional" icon="paint" focused />
      <Field label="AMOUNT" value="15.00" icon="dollar" />
      <Field label="BILLING CYCLE" value="Monthly" icon="repeat" right={<Icon name="chevD" size={16} color="var(--text-muted)" />} />
      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Skip for now</span>
      </div>
    </>
  );
}

function OnbDone() {
  return (
    <>
      <div style={{ display: 'grid', placeItems: 'center', height: 200 }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--positive-tint)', color: 'var(--positive)', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={56} strokeWidth={2.5} />
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>You're all set</h1>
        <div style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: 15, lineHeight: 1.5 }}>
          Your workspace is ready. Start logging revenue and expenses — FlowLedger does the math.
        </div>
      </div>
    </>
  );
}

Object.assign(window, { OnboardingScreen });
