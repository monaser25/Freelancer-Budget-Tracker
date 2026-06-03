/* Core money screens: Home, Transactions, Add Transaction sheet, Invoices x3 */

// ============ HOME ============
function HomeScreen({ ccy = 'USD' }) {
  return (
    <>
      {/* Custom header w/ greeting */}
      <div style={{ padding: '4px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Good morning</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '2px 0 0' }}>Sarah</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavIcon icon="search" />
          <NavIcon icon="bell" badge />
        </div>
      </div>

      <div className="screen-body" style={{ overflow: 'hidden', gap: 16, paddingBottom: 90 }}>
        {/* Hero net card */}
        <div className="card elev" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in oklab, var(--accent), #000 20%) 100%)', color: 'white', border: 'none', padding: 20 }}>
          <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Net · November</div>
          <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 6 }}>
            {fmt(8432.18, ccy)}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.16)' }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revenue</div>
              <div style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{fmt(11240, ccy)}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.16)' }} />
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expenses</div>
              <div style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{fmt(2807.82, ccy)}</div>
            </div>
          </div>
        </div>

        {/* Stat cards carousel */}
        <div className="h-scroll" style={{ marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, gap: 10 }}>
          <StatCard label="Active subs" value={fmt(312, ccy, { decimals: 2 })} delta="2 new" icon="repeat" />
          <StatCard label="Clients" value="14" delta="+3 this mo" icon="users" />
          <StatCard label="Avg invoice" value={fmt(2150, ccy)} delta="↑ 8%" icon="doc" />
        </div>

        {/* Bar chart */}
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revenue vs Expenses</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>Last 6 months</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--positive)' }} /> Rev</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--negative)' }} /> Exp</span>
            </div>
          </div>
          <BarChart data={[
            { label: 'Jun', pos: 8200, neg: 2100 },
            { label: 'Jul', pos: 7400, neg: 2400 },
            { label: 'Aug', pos: 9100, neg: 2200 },
            { label: 'Sep', pos: 8600, neg: 2900 },
            { label: 'Oct', pos: 10400, neg: 2600 },
            { label: 'Nov', pos: 11240, neg: 2807 },
          ]} height={130} />
        </Card>

        {/* Recent transactions */}
        <div>
          <SectionHeader label="Recent" link="See all" />
          <div className="list-card">
            <ListRow icon="briefcase" iconKind="pos" primary="Northwind Studios" secondary="Retainer · Nov" amount={`+${fmt(2400, ccy)}`} amountKind="pos" sub="Today" chev={false} />
            <ListRow icon="paint" iconKind="neg" primary="Figma Professional" secondary="Subscription" amount={`−${fmt(15, ccy)}`} amountKind="neg" sub="Yesterday" chev={false} />
            <ListRow icon="coffee" iconKind="neg" primary="Blue Bottle Coffee" secondary="Meals · 5 items" amount={`−${fmt(34.50, ccy)}`} amountKind="neg" sub="Yesterday" chev={false} />
          </div>
        </div>
      </div>

      <TabBar active="home" />
    </>
  );
}

// ============ TRANSACTIONS ============
function TransactionsScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavLarge title="Transactions" right={<>
        <NavIcon icon="search" />
        <NavIcon icon="filter" />
      </>} />

      <div style={{ padding: '0 16px 8px' }}>
        <div className="chip-row" style={{ overflow: 'visible' }}>
          <Chip active>All</Chip>
          <Chip kind="pos" icon="arrUp">Revenue</Chip>
          <Chip kind="neg" icon="arrDn">Expense</Chip>
          <Chip icon="repeat">Subs</Chip>
        </div>
      </div>

      <div className="screen-body" style={{ overflow: 'hidden', gap: 12, paddingBottom: 90 }}>
        <div>
          <div style={{ padding: '8px 4px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</span>
            <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--positive)', fontWeight: 600 }}>+{fmt(2400, ccy)}</span>
          </div>
          <div className="list-card">
            <ListRow icon="briefcase" iconKind="pos" primary="Northwind Studios"
              secondary={<><Badge kind="accent">Retainer</Badge><span>· Nov payment</span></>}
              amount={`+${fmt(2400, ccy)}`} amountKind="pos" sub="9:14 AM" chev={false} />
          </div>
        </div>

        <div>
          <div style={{ padding: '8px 4px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Yesterday</span>
            <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--negative)', fontWeight: 600 }}>−{fmt(98.50, ccy)}</span>
          </div>
          <div className="list-card">
            <ListRow icon="paint" iconKind="neg" primary="Figma Professional"
              secondary={<><Badge kind="warn" icon="zap">Auto</Badge><span>· Subscription</span></>}
              amount={`−${fmt(15, ccy)}`} amountKind="neg" sub="3:00 PM" chev={false} />
            <ListRow icon="coffee" iconKind="neg" primary="Blue Bottle Coffee" secondary="Meals · receipt scanned"
              amount={`−${fmt(34.50, ccy)}`} amountKind="neg" sub="11:42 AM" chev={false} />
            <ListRow icon="bag" iconKind="neg" primary="Office supplies" secondary="Staples · misc"
              amount={`−${fmt(49.00, ccy)}`} amountKind="neg" sub="9:08 AM" chev={false} />
          </div>
        </div>

        <div>
          <div style={{ padding: '8px 4px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mon, Nov 18</span>
            <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--positive)', fontWeight: 600 }}>+{fmt(1850, ccy)}</span>
          </div>
          <div className="list-card">
            <ListRow icon="briefcase" iconKind="pos" primary="Marcus Wright"
              secondary={<><Badge kind="accent">One-time</Badge><span>· Brand sprint</span></>}
              amount={`+${fmt(1850, ccy)}`} amountKind="pos" sub="Inv #0042" chev={false} />
          </div>
        </div>
      </div>

      <TabBar active="transactions" />
    </>
  );
}

// ============ ADD TRANSACTION (sheet) ============
function AddTxScreen({ ccy = 'USD' }) {
  return (
    <>
      {/* Background — clients underneath */}
      <NavLarge title="Transactions" right={<><NavIcon icon="search" /><NavIcon icon="filter" /></>} />
      <div style={{ padding: '0 16px', opacity: 0.5 }}>
        <div className="chip-row"><Chip active>All</Chip><Chip>Revenue</Chip><Chip>Expense</Chip></div>
      </div>
      <Sheet height={680} title="">
        <div style={{ padding: '0 4px' }}>
          {/* Type toggle */}
          <div style={{ background: 'var(--surface-hover)', borderRadius: 12, padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 24 }}>
            <div style={{ padding: '12px', textAlign: 'center', borderRadius: 10, background: 'var(--positive-tint)', color: 'var(--positive)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="arrUp" size={14} strokeWidth={2.5} /> Income
            </div>
            <div style={{ padding: '12px', textAlign: 'center', borderRadius: 10, color: 'var(--text-secondary)', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="arrDn" size={14} strokeWidth={2.25} /> Expense
            </div>
          </div>

          {/* Big amount */}
          <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Amount</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: 28, color: 'var(--text-muted)', fontWeight: 500 }}>{CURRENCY[ccy].sym}</span>
              <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--positive)' }}>2,400</span>
              <span style={{ fontSize: 28, color: 'var(--text-muted)', fontWeight: 500 }}>.00</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="DESCRIPTION" value="November retainer payment" icon="edit" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="DATE" value="Nov 25, 2025" icon="calendar" />
              <Field label="CATEGORY" value="Retainer" icon="briefcase" />
            </div>
            <Field label="LINKED CLIENT" value="Northwind Studios" icon="users" right={<Icon name="chevD" size={16} color="var(--text-muted)" />} />
          </div>

          <div style={{ marginTop: 20 }}>
            <Button variant="primary" block>Save income</Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

// ============ INVOICES LIST ============
function InvoicesScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavLarge title="Invoices" right={<>
        <NavIcon icon="search" />
        <NavIcon icon="plus" />
      </>} />

      <div className="screen-body" style={{ overflow: 'hidden', gap: 12, paddingBottom: 90 }}>
        {/* Summary tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Outstanding</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{fmt(6240, ccy, { decimals: 0 })}</div>
          </div>
          <div className="card" style={{ padding: 12, background: 'var(--negative-tint)', borderColor: 'transparent' }}>
            <div style={{ fontSize: 10, color: 'var(--negative)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overdue</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 4, color: 'var(--negative)' }}>{fmt(1850, ccy, { decimals: 0 })}</div>
          </div>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Paid · 30d</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{fmt(9100, ccy, { decimals: 0 })}</div>
          </div>
        </div>

        <div className="chip-row">
          <Chip active>All · 12</Chip>
          <Chip>Draft</Chip>
          <Chip kind="info">Sent</Chip>
          <Chip kind="pos">Paid</Chip>
          <Chip kind="neg">Overdue</Chip>
        </div>

        <div className="list-card">
          <ListRow
            primary="#0044 · Marcus Wright"
            secondary={<><Badge kind="neg">Overdue · 4d</Badge></>}
            amount={fmt(1850, ccy)}
            sub="Due Nov 21"
            chev={false}
          />
          <ListRow
            primary="#0043 · Helia Botanicals"
            secondary={<><Badge kind="info">Sent</Badge></>}
            amount={fmt(3200, ccy)}
            sub="Due Dec 02"
            chev={false}
          />
          <ListRow
            primary="#0042 · Northwind Studios"
            secondary={<><Badge kind="info">Sent</Badge></>}
            amount={fmt(2400, ccy)}
            sub="Due Dec 05"
            chev={false}
          />
          <ListRow
            primary="#0041 · Atlas Print Co."
            secondary={<><Badge kind="pos" icon="check">Paid</Badge></>}
            amount={fmt(4150, ccy)}
            sub="Nov 18"
            chev={false}
          />
          <ListRow
            primary="#0040 · Marcus Wright"
            secondary={<><Badge kind="pos" icon="check">Paid</Badge></>}
            amount={fmt(2100, ccy)}
            sub="Nov 12"
            chev={false}
          />
          <ListRow
            primary="#0039 · Kazu Designs"
            secondary={<><Badge kind="neutral">Draft</Badge></>}
            amount={fmt(890, ccy)}
            sub="—"
            chev={false}
          />
        </div>
      </div>

      <TabBar active="more" />
    </>
  );
}

// ============ INVOICE EDIT ============
function InvoiceEditScreen({ ccy = 'USD' }) {
  const sub = 4200; const tax = sub * 0.085; const total = sub + tax;
  return (
    <>
      <NavCompact back="Cancel" title="New invoice" right={<span style={{ color: 'var(--accent)', fontSize: 15, fontWeight: 600 }}>Send</span>} />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 12, paddingBottom: 24 }}>
        <Field label="CLIENT" value="Helia Botanicals" icon="briefcase" right={<Icon name="chevD" size={16} color="var(--text-muted)" />} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="ISSUE DATE" value="Nov 25, 2025" icon="calendar" />
          <Field label="DUE DATE" value="Dec 25, 2025" icon="calendar" />
        </div>

        <div>
          <SectionHeader label="Line items" link="+ Add" />
          <div className="list-card">
            <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 500, fontSize: 15 }}>Brand identity system</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>2 × {fmt(1500, ccy)}</span>
                <span className="tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(3000, ccy)}</span>
              </div>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 500, fontSize: 15 }}>Style guide & handoff</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>1 × {fmt(1200, ccy)}</span>
                <span className="tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(1200, ccy)}</span>
              </div>
            </div>
          </div>
        </div>

        <Card style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
            <span>Subtotal</span><span className="tnum">{fmt(sub, ccy)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>
            <span>Tax · 8.5%</span><span className="tnum">{fmt(tax, ccy)}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 10 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
            <span>Total</span><span className="tnum">{fmt(total, ccy)}</span>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Button variant="secondary">Save draft</Button>
          <Button variant="primary">Preview</Button>
        </div>
      </div>
    </>
  );
}

// ============ INVOICE DETAIL ============
function InvoiceDetailScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavCompact back="Invoices" title="Invoice #0043" right={<Icon name="more" size={22} color="var(--text)" />} />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 14, paddingBottom: 24 }}>
        {/* Status hero */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Badge kind="info">Sent · awaiting payment</Badge>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 10, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmt(3200, ccy)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Due Dec 02 · 7 days</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>To</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Helia Botanicals</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>finance@helia.co</div>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Timeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: 'check', color: 'pos', t: 'Created', d: 'Nov 25, 10:14 AM' },
              { icon: 'send', color: 'info', t: 'Sent to client', d: 'Nov 25, 10:18 AM' },
              { icon: 'eye', color: 'info', t: 'Opened', d: 'Nov 26, 2:42 PM' },
              { icon: 'clock', color: 'warn', t: 'Awaiting payment', d: 'Pending' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: `var(--${e.color}-tint)`, color: `var(--${e.color})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={e.icon} size={14} strokeWidth={2.25} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{e.t}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.d}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Button variant="secondary" icon="download">PDF</Button>
          <Button variant="primary" icon="check">Mark paid</Button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { HomeScreen, TransactionsScreen, AddTxScreen, InvoicesScreen, InvoiceEditScreen, InvoiceDetailScreen });
