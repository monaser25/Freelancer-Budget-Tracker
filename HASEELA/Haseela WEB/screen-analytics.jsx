/* ============================================================
   FlowLedger — Analytics (§6.17)
   ============================================================ */
const { useState: useStateAn } = React;

function Analytics() {
  const [period, setPeriod] = useStateAn("Month");
  const months = FL.monthlyAgg();
  const tot = FL.totals();
  const margin = Math.round((tot.net / tot.income) * 100);
  const expCat = FL.expenseByCategory();
  const clientRev = FL.revenueByClient();
  const totalClientRev = clientRev.reduce((a, c) => a + c.value, 0);
  const active = FL.subscriptions.filter((s) => s.status === "Active" && !s.archived);
  const subTotal = active.reduce((a, s) => a + s.monthly, 0);

  const metrics = [
    { label: "Revenue", value: FL.money(tot.income), tone: "positive", delta: 12 },
    { label: "Expenses", value: FL.money(tot.expense), tone: "negative", delta: 4 },
    { label: "Net profit", value: FL.money(tot.net), delta: 18 },
    { label: "Profit margin", value: margin + "%", delta: 6 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Segmented options={["Week", "Month", "Year"]} value={period} onChange={setPeriod} />
      </div>

      <div className="fl-statgrid4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {metrics.map((m, i) => <StatCard key={i} label={m.label} value={m.value} tone={m.tone} delta={m.delta} sub="vs prev period" />)}
      </div>

      <Card pad={22}>
        <SectionHeader title="Revenue vs Expenses" sub={period === "Year" ? "By month" : period === "Week" ? "By day" : "Last 6 months"} />
        <BarChart data={months} height={280} />
      </Card>

      <div className="fl-analytics-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Client revenue ranked */}
        <Card pad={22}>
          <SectionHeader title="Revenue by client" sub={`${clientRev.length} clients · ${FL.money(totalClientRev)} total`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {clientRev.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="t-body-m tnum text-muted" style={{ width: 18 }}>{i + 1}</span>
                <Avatar name={c.name} size={30} color={c.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span className="t-body-m" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                    <span className="t-body-m tnum">{FL.money(c.value)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "var(--surface-hover)", overflow: "hidden" }}>
                    <div style={{ width: `${(c.value / totalClientRev) * 100}%`, height: "100%", background: `var(${c.color})`, borderRadius: 99 }} />
                  </div>
                </div>
                <span className="t-small tnum text-muted" style={{ width: 36, textAlign: "right" }}>{Math.round((c.value / totalClientRev) * 100)}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Expenses by category */}
        <Card pad={22}>
          <SectionHeader title="Expenses by category" sub={`${expCat.length} categories`} />
          <HBarChart data={expCat} />
        </Card>
      </div>

      {/* Subscription costs */}
      <Card pad={22}>
        <SectionHeader title="Subscription costs" sub={`${FL.money(subTotal)}/mo · ${Math.round((subTotal / (tot.expense / 6)) * 100)}% of monthly expenses`} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {active.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
              <Avatar name={s.letter} size={32} color={s.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-body-m" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                <div className="t-small text-muted tnum">{Math.round((s.monthly / subTotal) * 100)}% of tools</div>
              </div>
              <span className="t-body-m tnum">{FL.money(s.monthly)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* All-time summary */}
      <Card pad={22}>
        <SectionHeader title="All-time summary" />
        <div className="fl-alltime" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
          {[
            ["Total revenue", FL.money(tot.income), "pos"], ["Total expenses", FL.money(tot.expense), "neg"],
            ["Net profit", FL.money(tot.net), "pos"], ["Profit margin", margin + "%", ""],
            ["Active clients", tot.clients, ""], ["Avg / client", FL.money(Math.round(totalClientRev / clientRev.length)), ""],
            ["Active tools", active.length, ""], ["Tools / mo", FL.money(subTotal), "neg"],
          ].map(([k, v, c], i) => (
            <div key={i} style={{ background: "var(--surface)", padding: "16px 18px" }}>
              <div className="t-caption text-muted">{k}</div>
              <div className={"t-h2 tnum " + c} style={{ marginTop: 6 }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

window.SCREENS.analytics = Analytics;
