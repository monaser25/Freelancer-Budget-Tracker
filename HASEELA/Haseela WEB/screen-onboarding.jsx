/* ============================================================
   FlowLedger — Onboarding wizard (§6.6) — 5 steps
   ============================================================ */
window.SCREENS = window.SCREENS || {};
const { useState: useStateOb } = React;

const OB_STEPS = ["Welcome", "Currency", "First client", "First tool", "Done"];

function Onboarding() {
  const [step, setStep] = useStateOb(0);
  const [data, setData] = useStateOb({ name: FL.user.name, currency: "USD", client: { name: "", payType: "Retainer", amount: "" }, sub: { name: "", amount: "", cycle: "Monthly" } });
  const set = (patch) => setData((d) => ({ ...d, ...patch }));
  const next = () => setStep((s) => Math.min(s + 1, OB_STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const finish = () => { FL.setCurrency(data.currency); localStorage.setItem("fl-currency", data.currency); nav("overview"); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" }}>
      {/* progress rail */}
      <div className="fl-ob-rail" style={{ width: 280, borderRight: "1px solid var(--border)", padding: 40, background: "var(--surface)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 48 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="wallet" size={18} style={{ color: "#fff" }} /></div>
          <span style={{ fontSize: 16, fontWeight: 600 }}>FlowLedger</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {OB_STEPS.map((s, i) => {
            const done = i < step, active = i === step;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
                <div style={{ width: 26, height: 26, borderRadius: 99, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600,
                  background: done ? "var(--accent)" : active ? "var(--accent-tint)" : "var(--surface-hover)",
                  color: done ? "#fff" : active ? "var(--accent)" : "var(--text-muted)", border: active ? "1px solid var(--accent)" : "1px solid transparent" }}>
                  {done ? <Icon name="check" size={13} stroke={3} /> : i + 1}
                </div>
                <span className="t-body-m" style={{ color: active ? "var(--text)" : done ? "var(--text-secondary)" : "var(--text-muted)" }}>{s}</span>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <div className="t-small text-muted">Step {step + 1} of {OB_STEPS.length}</div>
      </div>

      {/* content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ width: "100%", maxWidth: 440 }} key={step} className="anim-rise">
            {step === 0 && <StepWelcome data={data} set={set} />}
            {step === 1 && <StepCurrency data={data} set={set} />}
            {step === 2 && <StepClient data={data} set={set} />}
            {step === 3 && <StepSub data={data} set={set} />}
            {step === 4 && <StepDone data={data} />}
          </div>
        </div>
        {/* footer */}
        <div style={{ borderTop: "1px solid var(--border)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>{step > 0 && step < 4 && <Button variant="ghost" icon="chevronLeft" onClick={back}>Back</Button>}</div>
          <div style={{ display: "flex", gap: 10 }}>
            {(step === 2 || step === 3) && <Button variant="ghost" onClick={next}>Skip</Button>}
            {step < 4 && <Button iconRight="chevronRight" onClick={next}>{step === 0 ? "Get started" : "Continue"}</Button>}
            {step === 4 && <Button size="lg" onClick={finish} iconRight="arrowUpRight">Go to dashboard</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div className="t-caption" style={{ color: "var(--accent)", marginBottom: 8 }}>{eyebrow}</div>
      <div className="t-h1">{title}</div>
      {sub && <div className="t-body text-secondary" style={{ marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

function StepWelcome({ data, set }) {
  return (
    <div>
      <StepHeader eyebrow="Welcome" title={`Hi ${data.name.split(" ")[0]}, let's set up your books`} sub="A few quick steps and you'll have a clear picture of your freelance finances. You can change anything later." />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[["trendUp", "Track income", "Log payments from clients and retainers"], ["receipt", "Watch expenses", "Keep tabs on tools and subscriptions"], ["analytics", "Know your profit", "See trends and margins at a glance"]].map(([ic, t, d]) => (
          <div key={t} style={{ display: "flex", gap: 14, alignItems: "center", padding: 14, borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-tint)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={ic} size={18} /></div>
            <div><div className="t-body-m">{t}</div><div className="t-small text-muted">{d}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCurrency({ data, set }) {
  return (
    <div>
      <StepHeader eyebrow="Currency" title="Choose your display currency" sub="This only changes how amounts are formatted — FlowLedger doesn't convert between currencies." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {Object.keys(FL.CURRENCIES).map((code) => {
          const c = FL.CURRENCIES[code]; const active = data.currency === code;
          return (
            <button key={code} onClick={() => set({ currency: code })}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: "var(--r-md)", cursor: "pointer", textAlign: "left",
                border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent-tint)" : "var(--surface)", transition: "all var(--dur-fast)" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: active ? "var(--accent)" : "var(--surface-hover)", color: active ? "#fff" : "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, flexShrink: 0 }}>{c.symbol}</div>
              <div><div className="t-body-m">{code}</div><div className="t-small text-muted tnum">{c.symbol}1,200</div></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepClient({ data, set }) {
  const c = data.client;
  return (
    <div>
      <StepHeader eyebrow="First client" title="Add your first client" sub="Who pays you? Add one now or skip and do it later." />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Client name"><Input value={c.name} onChange={(e) => set({ client: { ...c, name: e.target.value } })} placeholder="e.g. Northwind Studio" autoFocus /></Field>
        <Field label="Payment type"><Segmented options={[{ value: "Retainer", label: "Retainer" }, { value: "One-time", label: "One-time" }]} value={c.payType} onChange={(v) => set({ client: { ...c, payType: v } })} /></Field>
        <Field label={c.payType === "Retainer" ? "Monthly amount" : "Project amount"}><Input value={c.amount} onChange={(e) => set({ client: { ...c, amount: e.target.value } })} prefix={FL.CURRENCIES[data.currency].symbol} suffix={c.payType === "Retainer" ? "/mo" : ""} className="tnum" placeholder="0" /></Field>
      </div>
    </div>
  );
}

function StepSub({ data, set }) {
  const s = data.sub;
  return (
    <div>
      <StepHeader eyebrow="First tool" title="Add a tool or subscription" sub="Track a recurring cost like Figma or Adobe. Skip if you'd rather not." />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Tool name"><Input value={s.name} onChange={(e) => set({ sub: { ...s, name: e.target.value } })} placeholder="e.g. Figma" autoFocus /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Amount"><Input value={s.amount} onChange={(e) => set({ sub: { ...s, amount: e.target.value } })} prefix={FL.CURRENCIES[data.currency].symbol} className="tnum" placeholder="0" /></Field>
          <Field label="Cycle"><Select value={s.cycle} onChange={(e) => set({ sub: { ...s, cycle: e.target.value } })}><option>Monthly</option><option>Quarterly</option><option>Yearly</option></Select></Field>
        </div>
      </div>
    </div>
  );
}

function StepDone({ data }) {
  const items = [];
  if (data.client.name) items.push(["clients", data.client.name, (data.client.payType === "Retainer" ? FL.CURRENCIES[data.currency].symbol + data.client.amount + "/mo" : "one-time")]);
  if (data.sub.name) items.push(["subscriptions", data.sub.name, data.sub.cycle]);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 64, height: 64, margin: "0 auto 20px", borderRadius: 99, background: "var(--positive-tint)", color: "var(--positive)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fl-pop 400ms var(--ease-out)" }}><Icon name="check" size={32} stroke={2.4} /></div>
      <div className="t-h1">You're all set!</div>
      <div className="t-body text-secondary" style={{ marginTop: 8, marginBottom: 24 }}>Here's what we've added to your workspace.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: 14, borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
          <span className="t-body-m">Display currency</span><span className="t-body-m tnum">{data.currency}</span>
        </div>
        {items.map(([ic, name, detail]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--accent-tint)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={ic} size={16} /></div>
            <span className="t-body-m" style={{ flex: 1 }}>{name}</span><Badge tone="accent">{detail}</Badge>
          </div>
        ))}
        {items.length === 0 && <div className="t-small text-muted center" style={{ padding: 8 }}>You can add clients and tools anytime from the dashboard.</div>}
      </div>
    </div>
  );
}

window.SCREENS.onboarding = Onboarding;
