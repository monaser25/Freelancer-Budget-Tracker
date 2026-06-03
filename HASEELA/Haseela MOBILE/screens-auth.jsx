/* Auth screens: Splash, Login, Register, Forgot, Reset, Verify */

function SplashScreen({ ccy }) {
  return (
    <>
      <div className="screen-body" style={{ alignItems: 'center', justifyContent: 'center', gap: 24, padding: '0 16px' }}>
        <BrandMark size={88} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>FlowLedger</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6, letterSpacing: '0.04em' }}>Calm finance for freelancers</div>
        </div>
        <div style={{ marginTop: 32, width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--accent-tint)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

function LoginScreen() {
  return (
    <div className="screen-body" style={{ padding: '24px 24px 32px', gap: 0 }}>
      <BrandMark size={48} />
      <div style={{ marginTop: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Welcome back</h1>
        <div style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 15 }}>Sign in to your FlowLedger account.</div>
      </div>
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="EMAIL" value="sarah@chenstudio.co" icon="mail" />
        <Field label="PASSWORD" value="••••••••••••" icon="lock" focused
          right={<Icon name="eye" size={18} color="var(--text-muted)" />} />
        <div style={{ textAlign: 'right', marginTop: -4 }}>
          <span style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 500 }}>Forgot password?</span>
        </div>
      </div>
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Button variant="primary" block>Log in</Button>
        <Button variant="secondary" block>Create account</Button>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
        Protected by end-to-end encryption
      </div>
    </div>
  );
}

function RegisterScreen() {
  return (
    <>
      <NavCompact back="Login" title="Create account" />
      <div className="screen-body" style={{ padding: '0 24px 32px', gap: 16 }}>
        <div style={{ marginTop: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Start tracking in 60s</h1>
          <div style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>No card required. Cancel anytime.</div>
        </div>
        <Field label="FULL NAME" value="Sarah Chen" icon="user" />
        <Field label="EMAIL" value="sarah@chenstudio.co" icon="mail" />
        <Field label="PASSWORD" value="••••••••••••" icon="lock" focused
          right={<Icon name="eyeOff" size={18} color="var(--text-muted)" />} />
        {/* Strength meter */}
        <div style={{ marginTop: -4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--positive)' }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--positive)' }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--positive)' }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border)' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Strong · 12+ characters, mixed case, number</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          By continuing you agree to our <span style={{ color: 'var(--accent)' }}>Terms</span> and <span style={{ color: 'var(--accent)' }}>Privacy</span>.
        </div>
        <Button variant="primary" block style={{ marginTop: 8 }}>Create account</Button>
      </div>
    </>
  );
}

function ForgotScreen() {
  return (
    <>
      <NavCompact back="Login" title="Forgot password" />
      <div className="screen-body" style={{ padding: '0 24px 32px', gap: 20 }}>
        <div style={{ marginTop: 4 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
            <Icon name="mail" size={24} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Reset your password</h1>
          <div style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
            Enter the email you signed up with. We'll send a secure reset link.
          </div>
        </div>
        <Field label="EMAIL" value="sarah@chenstudio.co" icon="mail" focused />
        <Button variant="primary" block>Send reset link</Button>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Didn't get it? Resend in <span style={{ color: 'var(--text)' }}>00:47</span>
        </div>
      </div>
    </>
  );
}

function ResetScreen() {
  return (
    <>
      <NavCompact back="Cancel" title="New password" />
      <div className="screen-body" style={{ padding: '0 24px 32px', gap: 16 }}>
        <div style={{ marginTop: 4 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
            <Icon name="lock" size={24} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Choose a new password</h1>
          <div style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>Make it at least 8 characters.</div>
        </div>
        <Field label="NEW PASSWORD" value="••••••••••••" icon="lock" focused
          right={<Icon name="eye" size={18} color="var(--text-muted)" />} />
        <Field label="CONFIRM PASSWORD" value="••••••••••••" icon="lock" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, background: 'var(--positive-tint)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--positive)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={14} strokeWidth={2.5} /> Passwords match
          </div>
        </div>
        <Button variant="primary" block style={{ marginTop: 8 }}>Update password</Button>
      </div>
    </>
  );
}

function VerifyScreen() {
  return (
    <div className="screen-body" style={{ padding: '24px 24px 32px', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 24 }}>
      <div style={{ width: 88, height: 88, borderRadius: 24, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
        <Icon name="mail" size={40} strokeWidth={1.5} />
      </div>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Check your email</h1>
        <div style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: 15, lineHeight: 1.5, maxWidth: 280 }}>
          We sent a verification link to <strong style={{ color: 'var(--text)' }}>sarah@chenstudio.co</strong>. Tap it to activate your account.
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <Button variant="primary" block>Open mail app</Button>
        <Button variant="ghost" block>Resend in 00:43</Button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 'auto' }}>
        Wrong email? <span style={{ color: 'var(--accent)' }}>Use a different one</span>
      </div>
    </div>
  );
}

Object.assign(window, { SplashScreen, LoginScreen, RegisterScreen, ForgotScreen, ResetScreen, VerifyScreen });
