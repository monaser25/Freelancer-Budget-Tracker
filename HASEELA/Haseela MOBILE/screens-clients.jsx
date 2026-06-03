/* Clients, Add Client sheet, Subscriptions, Add Sub sheet, Analytics */

// ============ CLIENTS ============
function ClientsScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavLarge title="Clients" right={<><NavIcon icon="search" /><NavIcon icon="archive" /></>} />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 14, paddingBottom: 90 }}>
        {/* Donut summary */}
        <Card style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
          <Donut size={88} stroke={12} data={[
            { value: 32, color: '#7C6FFF' },
            { value: 24, color: '#34D399' },
            { value: 18, color: '#FBBF24' },
            { value: 14, color: '#38BDF8' },
            { value: 12, color: 'var(--surface-hover)' },
          ]} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revenue by client</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{fmt(11240, ccy)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#7C6FFF' }} />
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>Northwind</span>
                <span style={{ fontWeight: 600 }}>32%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#34D399' }} />
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>Helia</span>
                <span style={{ fontWeight: 600 }}>24%</span>
              </div>
            </div>
          </div>
        </Card>

        <SectionHeader label="Active · 8" link="Show all" />
        <div className="list-card">
          {[
            { initials: 'NS', name: 'Northwind Studios', co: 'Brand & web', type: 'Retainer', amt: 2400, status: 'pos', next: 'Dec 01', col: '#7C6FFF' },
            { initials: 'HB', name: 'Helia Botanicals', co: 'Packaging', type: 'One-time', amt: 3200, status: 'info', next: 'Due Dec 02', col: '#34D399' },
            { initials: 'MW', name: 'Marcus Wright', co: 'Personal', type: 'One-time', amt: 1850, status: 'warn', next: 'Overdue 4d', col: '#FBBF24' },
            { initials: 'AP', name: 'Atlas Print Co.', co: 'Editorial', type: 'Retainer', amt: 1800, status: 'pos', next: 'Dec 15', col: '#38BDF8' },
            { initials: 'KD', name: 'Kazu Designs', co: 'Subcontract', type: 'One-time', amt: 890, status: 'neutral', next: 'Draft', col: '#F43F5E' },
          ].map((c, i) => (
            <ListRow key={i}
              avatar={<Avatar name={c.initials} size="md" bg={c.col + '22'} color={c.col} />}
              primary={c.name}
              secondary={<><span>{c.co}</span> · <Badge kind="accent">{c.type}</Badge></>}
              amount={`${fmt(c.amt, ccy)}${c.type === 'Retainer' ? '/mo' : ''}`}
              sub={c.next}
              chev
            />
          ))}
        </div>
      </div>
      <TabBar active="clients" />
    </>
  );
}

// ============ ADD CLIENT (sheet) ============
function AddClientScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavLarge title="Clients" right={<><NavIcon icon="search" /><NavIcon icon="archive" /></>} />
      <div style={{ padding: '0 16px', opacity: 0.5 }}>
        <Card style={{ padding: 16, height: 80 }}></Card>
      </div>
      <Sheet height={620}>
        <div style={{ padding: '0 4px' }}>
          <div style={{ fontSize: 20, fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>New client</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 20 }}>Add details — payments will link here.</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="NAME" value="Sona Müller" icon="user" focused />
              <Field label="COMPANY" value="Müller & Co." icon="building" />
            </div>
            <Field label="EMAIL" value="sona@mueller.co" icon="mail" />

            <div style={{ marginTop: 4 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Payment type</label>
              <div style={{ background: 'var(--surface-hover)', borderRadius: 12, padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginTop: 8 }}>
                <div style={{ padding: '10px', textAlign: 'center', borderRadius: 10, color: 'var(--text-secondary)', fontWeight: 500, fontSize: 13 }}>One-time</div>
                <div style={{ padding: '10px', textAlign: 'center', borderRadius: 10, background: 'var(--surface)', color: 'var(--text)', fontWeight: 600, fontSize: 13, boxShadow: '0 1px 2px rgba(0,0,0,.06)' }}>Retainer</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="MONTHLY AMOUNT" value="1,800.00" icon="dollar" />
              <Field label="BILLING DAY" value="1st" icon="calendar" />
            </div>

            <Button variant="primary" block style={{ marginTop: 8 }}>Save client</Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

// ============ SUBSCRIPTIONS ============
function SubscriptionsScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavCompact back="More" title="Subscriptions" right={<Icon name="plus" size={22} color="var(--accent)" />} />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 14, paddingBottom: 24 }}>
        <Card style={{ padding: 18, background: 'var(--negative-tint)', borderColor: 'transparent' }}>
          <div style={{ fontSize: 11, color: 'var(--negative)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly burden</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--negative)', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
            {fmt(312.40, ccy)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>9 active · 1 due soon</span>
            <span style={{ color: 'var(--negative)', fontWeight: 600 }}>+{fmt(15, ccy)} vs Oct</span>
          </div>
        </Card>

        <div className="chip-row">
          <Chip active>All · 9</Chip>
          <Chip>Monthly</Chip>
          <Chip>Yearly</Chip>
        </div>

        <div className="list-card">
          {[
            { icon: 'paint', name: 'Figma Professional', cycle: 'Monthly', amt: 15, next: 'Dec 03', warn: false, col: 'accent' },
            { icon: 'film', name: 'Adobe Creative Cloud', cycle: 'Yearly', amt: 59.99, next: 'Jan 14', warn: false, col: 'neg' },
            { icon: 'cloud', name: 'Dropbox Plus', cycle: 'Monthly', amt: 11.99, next: 'Dec 28', warn: false, col: 'info' },
            { icon: 'monitor', name: 'Linear Plus', cycle: 'Monthly', amt: 8, next: 'Tomorrow', warn: true, col: 'warn' },
            { icon: 'doc', name: 'Notion Plus', cycle: 'Monthly', amt: 10, next: 'Dec 11', warn: false, col: 'pos' },
            { icon: 'mail', name: 'Fastmail', cycle: 'Yearly', amt: 4.16, next: 'Apr 02', warn: false, col: 'neg' },
          ].map((s, i) => (
            <ListRow key={i}
              icon={s.icon} iconKind={s.col}
              primary={s.name}
              secondary={<><Badge kind="neutral">{s.cycle}</Badge>{s.warn && <Badge kind="warn">Due soon</Badge>}</>}
              amount={`${fmt(s.amt, ccy)}/mo`}
              amountKind="neg"
              sub={s.next}
              chev
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ============ ADD SUBSCRIPTION (sheet) ============
function AddSubScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavCompact back="More" title="Subscriptions" right={<Icon name="plus" size={22} color="var(--accent)" />} />
      <div style={{ padding: '0 16px', opacity: 0.4 }}>
        <Card style={{ padding: 16, height: 100 }}></Card>
      </div>
      <Sheet height={540}>
        <div style={{ padding: '0 4px' }}>
          <div style={{ fontSize: 20, fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>New subscription</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 20 }}>Track recurring tools — we'll calculate monthly burden.</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="NAME" value="Raycast Pro" icon="zap" focused />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="AMOUNT" value="8.00" icon="dollar" />
              <Field label="CYCLE" value="Monthly" icon="repeat" right={<Icon name="chevD" size={16} color="var(--text-muted)" />} />
            </div>
            <Field label="NEXT BILLING" value="Dec 28, 2025" icon="calendar" />

            <Card style={{ background: 'var(--info-tint)', borderColor: 'transparent', padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="info" size={16} color="var(--info)" />
              <div style={{ fontSize: 12, color: 'var(--info)', lineHeight: 1.4 }}>
                A matching expense will be auto-logged each cycle. You can edit it from Transactions.
              </div>
            </Card>

            <Button variant="primary" block style={{ marginTop: 4 }}>Save subscription</Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

// ============ ANALYTICS ============
function AnalyticsScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavLarge title="Analytics" sub="Last 30 days" right={<NavIcon icon="filter" />} />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 14, paddingBottom: 90 }}>
        <Segmented options={['Week', 'Month', 'Year']} value="Month" />

        {/* Metric carousel */}
        <div className="h-scroll" style={{ marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, gap: 10 }}>
          <StatCard label="Revenue" value={fmt(11240, ccy, { decimals: 0 })} delta="↑ 12.4%" deltaKind="pos" icon="trendUp" />
          <StatCard label="Expenses" value={fmt(2807, ccy, { decimals: 0 })} delta="↑ 4.8%" deltaKind="neg" icon="trendDn" />
          <StatCard label="Net profit" value={fmt(8432, ccy, { decimals: 0 })} delta="↑ 14.9%" deltaKind="pos" icon="dollar" />
          <StatCard label="Profit margin" value="75%" delta="↑ 2.1pt" deltaKind="pos" icon="pie" />
        </div>

        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Revenue vs Expenses</div>
          <BarChart data={[
            { label: 'W1', pos: 2400, neg: 720 },
            { label: 'W2', pos: 3100, neg: 540 },
            { label: 'W3', pos: 2800, neg: 880 },
            { label: 'W4', pos: 2940, neg: 667 },
          ]} height={120} />
        </Card>

        <div>
          <SectionHeader label="Top clients" link="See all" />
          <Card style={{ padding: 14 }}>
            {[
              { name: 'Northwind Studios', amt: 3600, pct: 32, col: '#7C6FFF' },
              { name: 'Helia Botanicals', amt: 2700, pct: 24, col: '#34D399' },
              { name: 'Atlas Print Co.', amt: 2000, pct: 18, col: '#38BDF8' },
              { name: 'Marcus Wright', amt: 1574, pct: 14, col: '#FBBF24' },
            ].map((r, i) => (
              <div key={i} style={{ marginBottom: i < 3 ? 14 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{r.name}</span>
                  <span className="tnum" style={{ color: 'var(--text-secondary)' }}>{fmt(r.amt, ccy, { decimals: 0 })}</span>
                </div>
                <HBar value={r.pct} max={32} color={r.col} />
              </div>
            ))}
          </Card>
        </div>
      </div>
      <TabBar active="more" />
    </>
  );
}

Object.assign(window, { ClientsScreen, AddClientScreen, SubscriptionsScreen, AddSubScreen, AnalyticsScreen });
