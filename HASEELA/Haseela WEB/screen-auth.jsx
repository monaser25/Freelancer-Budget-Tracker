/* ============================================================
   FlowLedger — Auth screens (§6.1–6.6)
   Login · Register · Forgot · Reset · Verify · Onboarding
   ============================================================ */
window.SCREENS = window.SCREENS || {};
const { useState: useStateAu, useEffect: useEffectAu, useRef: useRefAu } = React;

/* ---------- shared split layout ---------- */
function AuthLayout({ children, wide }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" }}>
      {/* brand panel */}
      <div className="fl-authbrand" style={{ width: "44%", maxWidth: 560, position: "relative", overflow: "hidden",
        background: "linear-gradient(155deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 60%, #2A1F6B) 55%, #120D2E 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
            <Icon name="wallet" size={20} style={{ color: "#fff" }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>FlowLedger</span>
        </div>
        {/* decorative grid of "ledger" numbers */}
        <div aria-hidden style={{ position: "absolute", inset: 0, opacity: .12, backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "26px 26px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 34, lineHeight: "42px", fontWeight: 600, color: "#fff", letterSpacing: "-0.02em", maxWidth: 380 }}>
            See your money clearly.
          </div>
          <p style={{ fontSize: 16, lineHeight: "26px", color: "rgba(255,255,255,.78)", maxWidth: 360, marginTop: 16 }}>
            Track who pays you, what you spend, and whether you're profitable — all in one calm, precise ledger.
          </p>
          <div style={{ display: "flex", gap: 24, marginTop: 36 }}>
            {[["$54k", "tracked this year"], ["6", "active clients"], ["98%", "on-time invoices"]].map(([n, l]) => (
              <div key={l}>
                <div className="tnum" style={{ fontSize: 24, fontWeight: 600, color: "#fff" }}>{n}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.66)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", fontSize: 13, color: "rgba(255,255,255,.6)" }}>© 2026 FlowLedger · Built for freelancers</div>
      </div>
      {/* form side */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: wide || 400 }}>{children}</div>
      </div>
    </div>
  );
}

function AuthHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div className="t-h1">{title}</div>
      {sub && <div className="t-body text-secondary" style={{ marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function InlineAlert({ tone = "negative", title, body, action }) {
  const c = { negative: "var(--negative)", warning: "var(--warning)", info: "var(--info)", positive: "var(--positive)" }[tone];
  const bg = { negative: "var(--negative-tint)", warning: "var(--warning-tint)", info: "color-mix(in srgb, var(--info) 12%, transparent)", positive: "var(--positive-tint)" }[tone];
  return (
    <div style={{ display: "flex", gap: 10, padding: 12, borderRadius: "var(--r-md)", background: bg, border: `1px solid color-mix(in srgb, ${c} 30%, transparent)`, marginBottom: 18 }}>
      <Icon name={tone === "positive" ? "check" : tone === "info" ? "info" : "alert"} size={16} style={{ color: c, marginTop: 1, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="t-body-m">{title}</div>
        {body && <div className="t-small text-secondary" style={{ marginTop: 2 }}>{body}</div>}
        {action}
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, error, placeholder = "••••••••", autoFocus }) {
  const [show, setShow] = useStateAu(false);
  return (
    <div style={{ position: "relative" }}>
      <Input type={show ? "text" : "password"} value={value} error={error} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus} style={{ paddingRight: 40 }} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
        style={{ position: "absolute", right: 8, top: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
        <Icon name={show ? "eyeOff" : "eye"} size={16} />
      </button>
    </div>
  );
}

function useCooldown() {
  const [left, setLeft] = useStateAu(0);
  useEffectAu(() => { if (left <= 0) return; const t = setTimeout(() => setLeft((l) => l - 1), 1000); return () => clearTimeout(t); }, [left]);
  return [left, () => setLeft(30)];
}

/* ---------- Login ---------- */
function Login() {
  const [email, setEmail] = useStateAu(localStorage.getItem("fl-last-email") || "maya@okonkwo.design");
  const [pw, setPw] = useStateAu("");
  const [state, setState] = useStateAu("default"); // default | submitting | error | unconfirmed
  const [cool, startCool] = useCooldown();
  const submit = (e) => {
    e.preventDefault();
    localStorage.setItem("fl-last-email", email);
    setState("submitting");
    setTimeout(() => {
      if (pw === "wrong") setState("error");
      else if (email.includes("unconfirmed")) { setState("unconfirmed"); }
      else { setState("default"); nav("overview"); }
    }, 800);
  };
  return (
    <AuthLayout>
      <AuthHeader title="Welcome back" sub="Log in to your FlowLedger workspace." />
      {state === "error" && <InlineAlert title="Incorrect email or password" body="Check your details and try again." />}
      {state === "unconfirmed" && <InlineAlert tone="warning" title="Confirm your email first" body="We sent a confirmation link when you signed up."
        action={<button disabled={cool > 0} onClick={startCool} className="t-small" style={{ marginTop: 8, color: cool > 0 ? "var(--text-muted)" : "var(--accent)", border: "none", background: "none", cursor: cool > 0 ? "default" : "pointer", fontWeight: 600 }}>{cool > 0 ? `Resend in ${cool}s` : "Resend confirmation email"}</button>} />}
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoFocus /></Field>
        <Field label="Password"><PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -4 }}>
          <button type="button" onClick={() => nav("forgot")} className="t-small" style={{ color: "var(--accent)", border: "none", background: "none", cursor: "pointer", fontWeight: 500 }}>Forgot password?</button>
        </div>
        <Button type="submit" loading={state === "submitting"} size="lg" style={{ width: "100%", marginTop: 4 }}>Log in</Button>
      </form>
      <div className="t-body text-secondary center" style={{ marginTop: 24 }}>
        New to FlowLedger? <button onClick={() => nav("register")} style={{ color: "var(--accent)", border: "none", background: "none", cursor: "pointer", fontWeight: 600 }}>Create an account</button>
      </div>
    </AuthLayout>
  );
}

/* ---------- Register ---------- */
function Register() {
  const [f, setF] = useStateAu({ name: "", email: "", pw: "" });
  const [err, setErr] = useStateAu({});
  const [state, setState] = useStateAu("default"); // default | submitting | success
  const [cool, startCool] = useCooldown();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = "Enter your name";
    if (!/.+@.+\..+/.test(f.email)) er.email = "Enter a valid email";
    if (strength(f.pw) < 2) er.pw = "Use at least 8 characters with a mix";
    setErr(er); if (Object.keys(er).length) return;
    setState("submitting");
    setTimeout(() => setState("success"), 900);
  };
  if (state === "success") return (
    <AuthLayout>
      <div style={{ width: 56, height: 56, borderRadius: 99, background: "var(--positive-tint)", color: "var(--positive)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><Icon name="mail" size={26} /></div>
      <AuthHeader title="Check your email" sub={`We sent a confirmation link to ${f.email}. Click it to activate your account.`} />
      <Button variant="secondary" disabled={cool > 0} onClick={startCool} style={{ width: "100%" }} icon="refresh">{cool > 0 ? `Resend in ${cool}s` : "Resend confirmation email"}</Button>
      <div className="t-body text-secondary center" style={{ marginTop: 20 }}>
        <button onClick={() => nav("verify")} style={{ color: "var(--accent)", border: "none", background: "none", cursor: "pointer", fontWeight: 600 }}>Simulate clicking the link →</button>
      </div>
    </AuthLayout>
  );
  return (
    <AuthLayout>
      <AuthHeader title="Create your account" sub="Start tracking your freelance finances in minutes." />
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Name" error={err.name}><Input value={f.name} error={err.name} onChange={(e) => set("name", e.target.value)} placeholder="Maya Okonkwo" autoFocus /></Field>
        <Field label="Email" error={err.email}><Input type="email" value={f.email} error={err.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" /></Field>
        <Field label="Password" error={err.pw} hint={!err.pw ? "Minimum 8 characters" : null}>
          <PasswordInput value={f.pw} error={err.pw} onChange={(e) => set("pw", e.target.value)} />
          {f.pw && <div style={{ marginTop: 8 }}><StrengthMeter value={f.pw} /></div>}
        </Field>
        <Button type="submit" loading={state === "submitting"} size="lg" style={{ width: "100%", marginTop: 4 }}>Create account</Button>
      </form>
      <div className="t-body text-secondary center" style={{ marginTop: 24 }}>
        Already have an account? <button onClick={() => nav("login")} style={{ color: "var(--accent)", border: "none", background: "none", cursor: "pointer", fontWeight: 600 }}>Log in</button>
      </div>
    </AuthLayout>
  );
}

/* ---------- Forgot password ---------- */
function Forgot() {
  const [email, setEmail] = useStateAu("");
  const [state, setState] = useStateAu("default");
  const [cool, startCool] = useCooldown();
  const submit = (e) => { e.preventDefault(); setState("submitting"); setTimeout(() => { setState("sent"); startCool(); }, 800); };
  if (state === "sent") return (
    <AuthLayout>
      <div style={{ width: 56, height: 56, borderRadius: 99, background: "var(--accent-tint)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><Icon name="mail" size={26} /></div>
      <AuthHeader title="Check your inbox" sub="If an account exists for that email, we've sent a password reset link." />
      <Button variant="secondary" disabled={cool > 0} onClick={startCool} style={{ width: "100%" }} icon="refresh">{cool > 0 ? `Resend in ${cool}s` : "Resend link"}</Button>
      <button onClick={() => nav("login")} className="t-body center" style={{ width: "100%", color: "var(--accent)", border: "none", background: "none", cursor: "pointer", fontWeight: 600, marginTop: 20 }}>← Back to login</button>
    </AuthLayout>
  );
  return (
    <AuthLayout>
      <AuthHeader title="Reset your password" sub="Enter the email tied to your account and we'll send a reset link." />
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoFocus /></Field>
        <Button type="submit" loading={state === "submitting"} size="lg" style={{ width: "100%" }}>Send reset link</Button>
      </form>
      <button onClick={() => nav("login")} className="t-body center" style={{ width: "100%", color: "var(--text-secondary)", border: "none", background: "none", cursor: "pointer", marginTop: 20 }}>← Back to login</button>
    </AuthLayout>
  );
}

/* ---------- Reset password ---------- */
function Reset() {
  const [pw, setPw] = useStateAu("");
  const [pw2, setPw2] = useStateAu("");
  const [err, setErr] = useStateAu({});
  const [state, setState] = useStateAu("default");
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (strength(pw) < 2) er.pw = "Use a stronger password";
    if (pw !== pw2) er.pw2 = "Passwords don't match";
    setErr(er); if (Object.keys(er).length) return;
    setState("submitting"); setTimeout(() => { setState("done"); setTimeout(() => nav("login"), 1400); }, 800);
  };
  if (state === "done") return (
    <AuthLayout>
      <div style={{ width: 56, height: 56, borderRadius: 99, background: "var(--positive-tint)", color: "var(--positive)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><Icon name="check" size={28} /></div>
      <AuthHeader title="Password updated" sub="Redirecting you to log in…" />
    </AuthLayout>
  );
  return (
    <AuthLayout>
      <AuthHeader title="Set a new password" sub="Choose a strong password you don't use elsewhere." />
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="New password" error={err.pw}><PasswordInput value={pw} error={err.pw} onChange={(e) => setPw(e.target.value)} autoFocus />{pw && <div style={{ marginTop: 8 }}><StrengthMeter value={pw} /></div>}</Field>
        <Field label="Confirm password" error={err.pw2}><PasswordInput value={pw2} error={err.pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
        <Button type="submit" loading={state === "submitting"} size="lg" style={{ width: "100%" }}>Update password</Button>
      </form>
    </AuthLayout>
  );
}

/* ---------- Verify email ---------- */
function Verify() {
  const [state, setState] = useStateAu("verifying"); // verifying | success | expired
  useEffectAu(() => { const t = setTimeout(() => setState("success"), 1600); return () => clearTimeout(t); }, []);
  return (
    <AuthLayout>
      <div style={{ textAlign: "center" }}>
        {state === "verifying" && <>
          <div style={{ width: 56, height: 56, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}><span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>
          <div className="t-h2">Confirming your email…</div>
          <div className="t-body text-secondary" style={{ marginTop: 6 }}>This only takes a moment.</div>
        </>}
        {state === "success" && <>
          <div style={{ width: 56, height: 56, margin: "0 auto 20px", borderRadius: 99, background: "var(--positive-tint)", color: "var(--positive)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={28} /></div>
          <div className="t-h1">Email confirmed</div>
          <div className="t-body text-secondary" style={{ marginTop: 6, marginBottom: 24 }}>Your account is ready to go.</div>
          <Button size="lg" onClick={() => nav("onboarding")} style={{ minWidth: 200 }}>Continue to app</Button>
        </>}
      </div>
    </AuthLayout>
  );
}

window.SCREENS.login = Login;
window.SCREENS.register = Register;
window.SCREENS.forgot = Forgot;
window.SCREENS.reset = Reset;
window.SCREENS.verify = Verify;
window.AuthLayout = AuthLayout;
window.InlineAlert = InlineAlert;
window.PasswordInput = PasswordInput;
