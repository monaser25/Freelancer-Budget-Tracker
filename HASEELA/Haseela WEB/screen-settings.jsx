/* ============================================================
   FlowLedger — Settings · Profile · Pricing · Billing (§6.20–6.23)
   ============================================================ */
window.SCREENS = window.SCREENS || {};
const { useState: useStateSet } = React;

function SettingRow({ title, desc, children, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "16px 0", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div style={{ minWidth: 0 }}><div className="t-body-m">{title}</div>{desc && <div className="t-small text-muted" style={{ marginTop: 2 }}>{desc}</div>}</div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

/* ---------- Settings ---------- */
function Settings() {
  const { theme, setTheme, currency, setCurrency } = useApp();
  const toast = useToast();
  const [notif, setNotif] = useStateSet({ billing: true, invoice: true, weekly: false });
  const tot = FL.totals();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760, margin: "0 auto", width: "100%" }}>
      <Card pad={22}>
        <SectionHeader title="Account" />
        <SettingRow title="Email" desc={FL.user.email}><Badge>Verified</Badge></SettingRow>
        <SettingRow title="Profile" desc="Edit your name, avatar and password"><Button variant="secondary" size="sm" onClick={() => nav("profile")}>Open profile</Button></SettingRow>
        <SettingRow title="Log out" desc="Sign out of this device" last><Button variant="ghost" size="sm" icon="logout" style={{ color: "var(--negative)" }} onClick={() => nav("login")}>Log out</Button></SettingRow>
      </Card>

      <Card pad={22}>
        <SectionHeader title="Workspace" />
        <SettingRow title="Display currency" desc="Formatting only — no conversion between currencies">
          <Select value={currency} onChange={(e) => { setCurrency(e.target.value); toast.success("Currency updated", e.target.value); }} style={{ width: 120 }}>{Object.keys(FL.CURRENCIES).map((c) => <option key={c}>{c}</option>)}</Select>
        </SettingRow>
        <SettingRow title="Accounting mode" desc="How income and expenses are recognized"><Badge>Cash basis</Badge></SettingRow>
        <SettingRow title="Total revenue tracked" desc="Across all time, this workspace" last><span className="t-h3 tnum pos">{FL.money(tot.income)}</span></SettingRow>
      </Card>

      <Card pad={22}>
        <SectionHeader title="Appearance" />
        <SettingRow title="Theme" desc="Choose how FlowLedger looks" last>
          <Segmented options={[{ value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} value={theme === "dark" ? "dark" : theme === "light" ? "light" : "system"} onChange={(v) => setTheme(v === "system" ? "dark" : v)} />
        </SettingRow>
      </Card>

      <Card pad={22}>
        <SectionHeader title="Notifications" />
        <SettingRow title="Billing reminders" desc="Get notified before retainers and tools bill"><Switch checked={notif.billing} onChange={(v) => setNotif((s) => ({ ...s, billing: v }))} /></SettingRow>
        <SettingRow title="Invoice due alerts" desc="When an invoice becomes due or overdue"><Switch checked={notif.invoice} onChange={(v) => setNotif((s) => ({ ...s, invoice: v }))} /></SettingRow>
        <SettingRow title="Weekly summary email" desc="A digest of your week every Monday" last><Switch checked={notif.weekly} onChange={(v) => setNotif((s) => ({ ...s, weekly: v }))} /></SettingRow>
      </Card>
    </div>
  );
}

/* ---------- Profile ---------- */
function Profile() {
  const toast = useToast();
  const [name, setName] = useStateSet(FL.user.name);
  const [del, setDel] = useStateSet(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640, margin: "0 auto", width: "100%" }}>
      <Card pad={22}>
        <SectionHeader title="Personal details" />
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <Avatar name={name} size={64} style={{ fontSize: 24 }} />
          <Button variant="secondary" size="sm" icon="user">Change avatar</Button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email" hint="Changing your email requires re-verification"><Input value={FL.user.email} prefix={<Icon name="mail" size={15} />} /></Field>
        </div>
        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}><Button onClick={() => toast.success("Profile saved")}>Save changes</Button></div>
      </Card>

      <Card pad={22}>
        <SectionHeader title="Security" />
        <SettingRow title="Password" desc="Last changed 3 months ago"><Button variant="secondary" size="sm" onClick={() => nav("reset")}>Change password</Button></SettingRow>
        <SettingRow title="Active sessions" desc="2 devices signed in" last><Button variant="ghost" size="sm" onClick={() => toast.success("Signed out everywhere")}>Log out everywhere</Button></SettingRow>
      </Card>

      <Card pad={22} style={{ borderColor: "color-mix(in srgb, var(--negative) 30%, var(--border))" }}>
        <SectionHeader title="Danger zone" />
        <SettingRow title="Delete account" desc="Permanently delete your account and all data" last><Button variant="destructive" size="sm" icon="trash" onClick={() => setDel(true)}>Delete account</Button></SettingRow>
      </Card>

      <ConfirmDialog open={del} onClose={() => setDel(false)} title="Delete your account?"
        body="This permanently erases your workspace, clients, transactions and invoices. This cannot be undone."
        impact="All historical data will be lost. Consider exporting a report first."
        confirmLabel="Delete my account" onConfirm={() => { toast.error("Account deleted"); nav("login"); }} />
    </div>
  );
}

/* ---------- Pricing ---------- */
function Pricing() {
  const [yearly, setYearly] = useStateSet(true);
  const toast = useToast();
  const plans = [
    { name: "Free", monthly: 0, tagline: "For getting started", current: false, features: ["Up to 3 clients", "Manual transactions", "Basic dashboard", "1 currency"] },
    { name: "Pro", monthly: 12, tagline: "For working freelancers", popular: true, current: true, features: ["Unlimited clients", "Recurring retainers & tools", "Invoicing + PDF export", "All 6 currencies", "Analytics & reports"] },
    { name: "Business", monthly: 29, tagline: "For studios & teams", features: ["Everything in Pro", "Multiple workspaces", "Team members", "Priority support", "Custom report branding"] },
  ];
  const [faq, setFaq] = useStateSet(-1);
  const FAQ = [
    ["Can I switch plans later?", "Yes — upgrade or downgrade anytime. Changes are prorated to your billing date."],
    ["Do you convert between currencies?", "No. Currency is a display/formatting choice only; FlowLedger never converts amounts."],
    ["Is there a free trial of Pro?", "Pro includes a 14-day trial. No card required to start."],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1000, margin: "0 auto", width: "100%" }}>
      <div style={{ textAlign: "center" }}>
        <div className="t-h1">Simple pricing for freelancers</div>
        <div className="t-body text-secondary" style={{ marginTop: 8 }}>Start free. Upgrade when your books get busy.</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginTop: 20 }}>
          <span className="t-body-m" style={{ color: yearly ? "var(--text-muted)" : "var(--text)" }}>Monthly</span>
          <Switch checked={yearly} onChange={setYearly} />
          <span className="t-body-m" style={{ color: yearly ? "var(--text)" : "var(--text-muted)" }}>Yearly</span>
          <Badge tone="positive">Save 20%</Badge>
        </div>
      </div>
      <div className="fl-pricing" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
        {plans.map((p) => {
          const price = yearly ? Math.round(p.monthly * 0.8) : p.monthly;
          return (
            <Card key={p.name} pad={24} style={{ position: "relative", border: p.popular ? "1.5px solid var(--accent)" : "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 16 }}>
              {p.popular && <div style={{ position: "absolute", top: -11, left: 24, background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: ".04em" }}>Most popular</div>}
              <div><div className="t-h3">{p.name}</div><div className="t-small text-muted" style={{ marginTop: 2 }}>{p.tagline}</div></div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}><span className="t-display tnum">{FL.money(price)}</span><span className="t-body text-muted">/mo</span></div>
              <Button variant={p.current ? "secondary" : p.popular ? "primary" : "secondary"} disabled={p.current} style={{ width: "100%" }} onClick={() => { nav("billing"); }}>{p.current ? "Current plan" : "Upgrade"}</Button>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
                {p.features.map((f) => <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><Icon name="check" size={16} style={{ color: "var(--positive)", marginTop: 1, flexShrink: 0 }} /><span className="t-small text-secondary">{f}</span></div>)}
              </div>
            </Card>
          );
        })}
      </div>
      <Card pad={8}>
        {FAQ.map(([q, a], i) => (
          <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? "1px solid var(--border)" : "none" }}>
            <button onClick={() => setFaq((f) => f === i ? -1 : i)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "16px 16px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
              <span className="t-body-m">{q}</span><Icon name="chevronDown" size={16} style={{ color: "var(--text-muted)", transform: faq === i ? "rotate(180deg)" : "none", transition: "transform var(--dur-base)" }} />
            </button>
            {faq === i && <div className="t-body text-secondary anim-rise" style={{ padding: "0 16px 16px" }}>{a}</div>}
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------- Billing ---------- */
function Billing() {
  const toast = useToast();
  const [cancel, setCancel] = useStateSet(false);
  const history = [
    { date: new Date(2026, 4, 1), amount: 12, status: "Paid" },
    { date: new Date(2026, 3, 1), amount: 12, status: "Paid" },
    { date: new Date(2026, 2, 1), amount: 12, status: "Paid" },
    { date: new Date(2026, 1, 1), amount: 12, status: "Paid" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760, margin: "0 auto", width: "100%" }}>
      <Card pad={22} style={{ background: "linear-gradient(135deg, var(--accent-tint), var(--surface) 70%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="t-h2">Pro plan</span><Badge tone="accent">Active</Badge></div>
            <div className="t-body text-secondary" style={{ marginTop: 6 }}>Renews Jun 1, 2026 · <span className="tnum">{FL.money(12)}</span>/mo billed monthly</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => nav("pricing")}>Change plan</Button>
            <Button variant="ghost" style={{ color: "var(--negative)" }} onClick={() => setCancel(true)}>Cancel</Button>
          </div>
        </div>
      </Card>

      <Card pad={22}>
        <SectionHeader title="Payment method" action={<Button variant="secondary" size="sm">Update</Button>} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 32, borderRadius: 7, background: "var(--surface-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="card" size={20} style={{ color: "var(--text-secondary)" }} /></div>
          <div><div className="t-body-m tnum">•••• •••• •••• 4242</div><div className="t-small text-muted">Expires 09 / 2027</div></div>
        </div>
      </Card>

      <Card pad={0}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)" }}><span className="t-h3">Invoice history</span></div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {history.map((h, i) => (
              <tr key={i} style={{ borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none" }}>
                <td style={{ padding: "13px 22px" }}><span className="t-body tnum">{FL.fmtDate(h.date)}</span></td>
                <td style={{ padding: "13px 22px" }}><span className="t-body-m tnum">{FL.money(h.amount, 2)}</span></td>
                <td style={{ padding: "13px 22px" }}><Badge tone="positive">{h.status}</Badge></td>
                <td style={{ padding: "13px 22px", textAlign: "right" }}><Button variant="ghost" size="sm" icon="download" onClick={() => toast.success("Receipt downloaded")}>Receipt</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ConfirmDialog open={cancel} onClose={() => setCancel(false)} title="Cancel your Pro plan?"
        body="You'll keep Pro features until the end of your billing period, then move to the Free plan."
        impact="Invoicing, recurring tracking and reports will be limited on Free." tone="destructive"
        confirmLabel="Cancel plan" onConfirm={() => toast.success("Plan cancelled", "Pro active until Jun 1")} />
    </div>
  );
}

window.SCREENS.settings = Settings;
window.SCREENS.profile = Profile;
window.SCREENS.pricing = Pricing;
window.SCREENS.billing = Billing;
