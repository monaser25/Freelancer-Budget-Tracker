/* ============================================================
   FlowLedger — Reports · Archive · Notifications (§6.18, 6.19, 6.24)
   ============================================================ */
window.SCREENS = window.SCREENS || {};
const { useState: useStateM } = React;

/* ---------- Reports / Export ---------- */
function Reports() {
  const toast = useToast();
  const [type, setType] = useStateM("pnl");
  const [format, setFormat] = useStateM("PDF");
  const [state, setState] = useStateM("idle"); // idle | generating | ready
  const TYPES = [
    { id: "pnl", icon: "trendUp", title: "Profit & Loss", desc: "Income, expenses and net profit summary" },
    { id: "txns", icon: "transactions", title: "Transactions", desc: "Full itemized ledger for the period" },
    { id: "clients", icon: "clients", title: "Client revenue", desc: "Revenue broken down by client" },
    { id: "tax", icon: "receipt", title: "Tax summary", desc: "Totals formatted for tax filing" },
  ];
  const tot = FL.totals();
  const generate = () => { setState("generating"); setTimeout(() => setState("ready"), 1400); };

  return (
    <div className="fl-reports" style={{ display: "grid", gridTemplateColumns: "minmax(0,380px) 1fr", gap: 20, alignItems: "start" }}>
      <Card pad={22} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div className="t-body-m text-secondary" style={{ marginBottom: 10 }}>Report type</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TYPES.map((t) => {
              const active = type === t.id;
              return (
                <button key={t.id} onClick={() => { setType(t.id); setState("idle"); }}
                  style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, borderRadius: "var(--r-md)", cursor: "pointer", textAlign: "left",
                    border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent-tint)" : "var(--surface)", transition: "all var(--dur-fast)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: active ? "var(--accent)" : "var(--surface-hover)", color: active ? "#fff" : "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={t.icon} size={17} /></div>
                  <div><div className="t-body-m">{t.title}</div><div className="t-small text-muted">{t.desc}</div></div>
                </button>
              );
            })}
          </div>
        </div>
        <Field label="Date range"><Input value="Jan 1 – Jun 30, 2026" readOnly prefix={<Icon name="calendar" size={15} />} /></Field>
        <Field label="Format"><Segmented options={["PDF", "CSV"]} value={format} onChange={setFormat} /></Field>
        <Button size="lg" icon="download" loading={state === "generating"} onClick={state === "ready" ? () => toast.success(`${format} downloaded`) : generate} style={{ width: "100%" }}>
          {state === "ready" ? `Download ${format}` : "Generate report"}
        </Button>
      </Card>

      <Card pad={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="t-body-m">Preview</span><Badge>{TYPES.find((t) => t.id === type).title}</Badge>
        </div>
        <div style={{ padding: 28, background: "var(--bg)" }}>
          {state === "generating"
            ? <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={i === 0 ? 28 : 16} w={i === 0 ? "40%" : "100%"} />)}</div>
            : <div style={{ background: "#fff", color: "#18181B", borderRadius: "var(--r-md)", padding: 32, boxShadow: "var(--shadow-md)" }}>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{TYPES.find((t) => t.id === type).title}</div>
              <div style={{ fontSize: 13, color: "#71717A", marginTop: 4 }}>Maya Okonkwo · Jan – Jun 2026 · Cash basis</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 24 }}>
                {[["Revenue", FL.money(tot.income), "#10B981"], ["Expenses", FL.money(tot.expense), "#EF4444"], ["Net profit", FL.money(tot.net), "#18181B"]].map(([k, v, c]) => (
                  <div key={k} style={{ padding: 14, borderRadius: 10, background: "#F4F4F6" }}><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "#A1A1AA" }}>{k}</div><div className="tnum" style={{ fontSize: 20, fontWeight: 600, color: c, marginTop: 4 }}>{v}</div></div>
                ))}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 24 }}>
                <thead><tr style={{ borderBottom: "2px solid #18181B" }}><th style={{ textAlign: "left", padding: "8px 0", fontSize: 11, textTransform: "uppercase", color: "#A1A1AA" }}>Category</th><th style={{ textAlign: "right", padding: "8px 0", fontSize: 11, textTransform: "uppercase", color: "#A1A1AA" }}>Amount</th></tr></thead>
                <tbody>
                  {FL.expenseByCategory().slice(0, 6).map((c) => (
                    <tr key={c.name} style={{ borderBottom: "1px solid #F4F4F6" }}><td style={{ padding: "9px 0" }}>{c.name}</td><td className="tnum" style={{ textAlign: "right" }}>{FL.money(c.value)}</td></tr>
                  ))}
                </tbody>
              </table>
              {state === "ready" && <div style={{ marginTop: 20, padding: "8px 12px", borderRadius: 8, background: "#ECFDF5", color: "#10B981", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ display: "inline-flex" }}>✓</span> Report ready to download</div>}
            </div>}
        </div>
      </Card>
    </div>
  );
}

/* ---------- Archive ---------- */
function Archive() {
  const toast = useToast();
  const clients = FL.clients.filter((c) => c.archived);
  const subs = FL.subscriptions.filter((s) => s.archived);
  const empty = clients.length === 0 && subs.length === 0;
  const Row = ({ avatar, color, name, badge, badgeTone, date, count, onRestore }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
      <Avatar name={avatar} size={36} color={color} style={{ filter: "grayscale(.4)", opacity: .8 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="t-body-m">{name}</span><Badge tone={badgeTone}>{badge}</Badge></div>
        <div className="t-small text-muted">Archived {FL.fmtDate(date)} · {count} historical transaction{count === 1 ? "" : "s"}</div>
      </div>
      <Button size="sm" variant="secondary" icon="refresh" onClick={onRestore}>Restore</Button>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <InlineAlert tone="info" title="Archived items keep their history" body="They no longer bill or appear in active lists, but past transactions are preserved. Restore anytime." />
      {empty ? <Card><EmptyState icon="archive" title="Nothing archived" body="Archived clients and subscriptions will appear here." /></Card> : <>
        <Card pad={0}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}><span className="t-body-m">Archived clients</span><Badge>{clients.length}</Badge></div>
          {clients.map((c) => <Row key={c.id} avatar={c.name} color={c.color} name={c.name} badge={c.payType} badgeTone="accent" date={c.history[0]?.date || FL.TODAY} count={c.history.length} onRestore={() => toast.success("Client restored", c.name)} />)}
          {clients.length === 0 && <div className="t-small text-muted center" style={{ padding: 20 }}>No archived clients</div>}
        </Card>
        <Card pad={0}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}><span className="t-body-m">Archived subscriptions</span><Badge>{subs.length}</Badge></div>
          {subs.map((s) => <Row key={s.id} avatar={s.letter} color={s.color} name={s.name} badge={s.cycle} badgeTone="info" date={FL.TODAY} count={4} onRestore={() => toast.success("Subscription restored", s.name)} />)}
          {subs.length === 0 && <div className="t-small text-muted center" style={{ padding: 20 }}>No archived subscriptions</div>}
        </Card>
      </>}
    </div>
  );
}

/* ---------- Notifications ---------- */
function Notifications() {
  const toast = useToast();
  const [tab, setTab] = useStateM("All");
  const [read, setRead] = useStateM(() => FL.notifications.filter((n) => n.read).map((n) => n.id));
  const list = FL.notifications.filter((n) => tab === "All" ? true : !read.includes(n.id));
  const iconFor = { warning: ["bell", "warning"], negative: ["alert", "negative"], positive: ["check", "positive"], info: ["info", "info"] };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Segmented options={["All", "Unread"]} value={tab} onChange={setTab} />
        <Button variant="ghost" icon="check" onClick={() => { setRead(FL.notifications.map((n) => n.id)); toast.success("All marked as read"); }}>Mark all read</Button>
      </div>
      <Card pad={0}>
        {list.length === 0 ? <EmptyState icon="bell" title="You're all caught up" body="No unread notifications right now." compact /> : list.map((n) => {
          const [ic, tone] = iconFor[n.type];
          const isRead = read.includes(n.id);
          const c = { warning: "var(--warning)", negative: "var(--negative)", positive: "var(--positive)", info: "var(--info)" }[n.type];
          return (
            <div key={n.id} onClick={() => { setRead((r) => r.includes(n.id) ? r : [...r, n.id]); window.location.hash = n.link; }}
              style={{ display: "flex", gap: 14, padding: "16px 18px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: isRead ? "transparent" : "color-mix(in srgb, var(--accent) 5%, transparent)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = isRead ? "transparent" : "color-mix(in srgb, var(--accent) 5%, transparent)"}>
              <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `color-mix(in srgb, ${c} 14%, transparent)`, color: c }}><Icon name={ic} size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="t-body-m">{n.title}</span>{!isRead && <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--accent)" }} />}</div>
                <div className="t-small text-secondary" style={{ marginTop: 2 }}>{n.body}</div>
              </div>
              <span className="t-small text-muted" style={{ whiteSpace: "nowrap" }}>{FL.relative(n.time)}</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

window.SCREENS.reports = Reports;
window.SCREENS.archive = Archive;
window.SCREENS.notifications = Notifications;
