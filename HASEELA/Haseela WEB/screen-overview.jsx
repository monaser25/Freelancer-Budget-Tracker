/* ============================================================
   FlowLedger — Overview / Dashboard (§6.7)
   ============================================================ */
window.SCREENS = window.SCREENS || {};
const { useState: useStateO, useEffect: useEffectO } = React;

function MoneyText({ value, type, decimals = 0, size }) {
  const sign = type === "income" ? "+" : "−";
  const color = type === "income" ? "var(--positive)" : "var(--negative)";
  return <span className="tnum" style={{ color, fontWeight: 500, fontSize: size }}>{sign}{FL.money(value, decimals)}</span>;
}

function StatCountUp({ amount, decimals = 0, run }) {
  const v = useCountUp(amount, 500, run);
  return <span>{FL.money(v, decimals)}</span>;
}
function PlainCountUp({ amount, run }) {
  const v = useCountUp(amount, 500, run);
  return <span>{Math.round(v)}</span>;
}

function Overview() {
  const [loading, setLoading] = useStateO(true);
  useEffectO(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);
  const tot = FL.totals();
  const months = FL.monthlyAgg();
  const recent = FL.transactions.slice(0, 5);
  const subs = FL.subscriptions.filter((s) => s.status === "Active" && !s.archived).sort((a, b) => a.nextBilling - b.nextBilling).slice(0, 4);
  const topClient = FL.revenueByClient()[0];

  if (loading) return <OverviewSkeleton />;

  const cards = [
    { label: "Total clients", value: <PlainCountUp amount={tot.clients} />, delta: 16, sub: "vs last month", icon: "clients", route: "clients" },
    { label: "Total revenue", value: <StatCountUp amount={tot.income} />, tone: "positive", delta: 12, icon: "trendUp", route: "transactions?income", spark: months.map((m) => m.income) },
    { label: "Total expenses", value: <StatCountUp amount={tot.expense} />, tone: "negative", delta: 4, icon: "receipt", route: "transactions?expense", spark: months.map((m) => m.expense) },
    { label: "Net profit", value: <StatCountUp amount={tot.net} />, delta: 18, icon: "wallet", route: "analytics" },
    { label: "Active subscriptions", value: <PlainCountUp amount={tot.subscriptions} />, sub: FL.money(tot.subMonthly) + "/mo", icon: "subscriptions", route: "subscriptions" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* quick actions */}
      <div className="fl-quickrow" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button icon="trendUp" onClick={() => openModal("income")}>Add revenue</Button>
        <Button variant="secondary" icon="receipt" onClick={() => openModal("expense")}>Log expense</Button>
        <Button variant="secondary" icon="invoices" onClick={() => nav("invoices/new")}>New invoice</Button>
        <Button variant="secondary" icon="clients" onClick={() => openModal("client")}>Add client</Button>
      </div>

      {/* stat cards */}
      <div className="fl-statgrid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
        {cards.map((c, i) => (
          <StatCard key={i} label={c.label} value={c.value} delta={c.delta} tone={c.tone} sub={c.sub} icon={c.icon}
            onClick={() => nav(c.route)} sparkline={c.spark && <Sparkline data={c.spark} width={140} height={30} color={c.tone === "negative" ? "var(--negative)" : "var(--positive)"} />} />
        ))}
      </div>

      {/* main grid */}
      <div className="fl-overview-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        <Card pad={22}>
          <SectionHeader title="Revenue vs Expenses" sub="Last 6 months" action={<Badge tone="accent" icon="trendUp">+{Math.round((tot.net / tot.income) * 100)}% margin</Badge>} />
          <BarChart data={months} height={260} />
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card pad={20}>
            <SectionHeader title="Active subscriptions" action={<button onClick={() => nav("subscriptions")} className="t-small" style={{ color: "var(--accent)", border: "none", background: "none", cursor: "pointer", fontWeight: 500 }}>View all</button>} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {subs.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                  <Avatar name={s.letter} size={32} color={s.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t-body-m" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                    <div className="t-small text-muted">Renews {FL.fmtDateShort(s.nextBilling)}</div>
                  </div>
                  <span className="t-body-m tnum">{FL.money(s.monthly)}<span className="text-muted" style={{ fontWeight: 400 }}>/mo</span></span>
                </div>
              ))}
            </div>
          </Card>

          {topClient && (
            <Card pad={20}>
              <div className="t-caption text-muted" style={{ marginBottom: 12 }}>Top client</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={topClient.name} size={40} color={topClient.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-h3">{topClient.name}</div>
                  <div className="t-small text-muted">{topClient.company}</div>
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="t-small text-muted">Total paid</span>
                <span className="t-h3 tnum pos">{FL.money(topClient.value)}</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* recent transactions */}
      <Card pad={0}>
        <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="t-h3">Recent transactions</span>
          <button onClick={() => nav("transactions")} className="t-small" style={{ color: "var(--accent)", border: "none", background: "none", cursor: "pointer", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>View ledger <Icon name="chevronRight" size={14} /></button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {recent.map((t, i) => (
              <tr key={t.id} onClick={() => nav("transactions")} style={{ cursor: "pointer", borderTop: "1px solid var(--border)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: t.type === "income" ? "var(--positive-tint)" : "var(--negative-tint)", color: t.type === "income" ? "var(--positive)" : "var(--negative)" }}>
                      <Icon name={t.type === "income" ? "arrowDown" : "arrowUp"} size={15} stroke={2.2} />
                    </span>
                    <div>
                      <div className="t-body-m">{t.name}</div>
                      <div className="t-small text-muted">{t.category} · {FL.relative(t.date)}</div>
                    </div>
                  </div>
                </td>
                <td className="right" style={{ padding: "12px 22px" }}><MoneyText value={t.amount} type={t.type} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 10 }}>{[120, 120, 120, 110].map((w, i) => <Skel key={i} w={w} h={36} r={12} />)}</div>
      <div className="fl-statgrid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => <Card key={i}><Skel w={80} h={12} /><Skel w={120} h={28} style={{ margin: "14px 0 10px" }} /><Skel w={60} h={12} /></Card>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card style={{ height: 340 }}><Skel w={180} h={18} /><Skel h={260} style={{ marginTop: 20 }} /></Card>
        <Card style={{ height: 340 }}><Skel w={140} h={16} />{Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ display: "flex", gap: 12, marginTop: 16 }}><Skel w={32} h={32} r={99} /><div style={{ flex: 1 }}><Skel w="70%" h={12} /><Skel w="40%" h={10} style={{ marginTop: 6 }} /></div></div>)}</Card>
      </div>
    </div>
  );
}

window.SCREENS.overview = Overview;
