/* Misc screens: Reports, Archive, More, Settings, Profile, Pricing, Billing, Notifications, Offline, Error */

// ============ REPORTS / EXPORT ============
function ReportsScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavCompact back="More" title="Reports" />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 14, paddingBottom: 24 }}>
        <SectionHeader label="Report type" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { name: 'P&L statement', desc: 'Income, expenses, net', icon: 'trendUp', active: true },
            { name: 'Transactions', desc: 'All ledger entries', icon: 'receipt', active: false },
            { name: 'Client revenue', desc: 'By client breakdown', icon: 'users', active: false },
            { name: 'Tax summary', desc: 'Deductible expenses', icon: 'doc', active: false },
          ].map((r, i) => (
            <div key={i} style={{
              padding: 14, borderRadius: 14,
              background: r.active ? 'var(--accent-tint)' : 'var(--surface)',
              border: `1.5px solid ${r.active ? 'var(--accent)' : 'var(--border)'}`,
              display: 'flex', flexDirection: 'column', gap: 8
            }}>
              <Icon name={r.icon} size={20} color={r.active ? 'var(--accent)' : 'var(--text-secondary)'} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <SectionHeader label="Date range" />
        <div className="list-card">
          <ListRow icon="calendar" iconKind="info" primary="From" right={<span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Nov 01, 2025</span>} chev={false} />
          <ListRow icon="calendar" iconKind="info" primary="To" right={<span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Nov 30, 2025</span>} chev={false} />
        </div>

        <SectionHeader label="Format" />
        <div className="segmented" style={{ background: 'var(--surface-hover)' }}>
          <div className="seg active">PDF</div>
          <div className="seg">CSV</div>
          <div className="seg">XLSX</div>
        </div>

        <div style={{ flex: 1 }} />
        <Button variant="primary" block icon="share">Export & share</Button>
      </div>
    </>
  );
}

// ============ ARCHIVE ============
function ArchiveScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavCompact back="More" title="Archive" />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 14, paddingBottom: 24 }}>
        <Card style={{ background: 'var(--info-tint)', borderColor: 'transparent', padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="info" size={16} color="var(--info)" />
          <div style={{ fontSize: 12, color: 'var(--info)', lineHeight: 1.4 }}>
            Archived items stay in your history but won't appear in active lists or contribute to monthly burden.
          </div>
        </Card>

        <SectionHeader label="Archived clients · 3" />
        <div className="list-card">
          {[
            { i: 'JP', name: 'Junichi Press', date: 'Mar 14, 2025', txn: 18 },
            { i: 'OV', name: 'Oslo & Vine', date: 'Feb 02, 2025', txn: 6 },
            { i: 'CD', name: 'Cosmos Diner', date: 'Jan 09, 2025', txn: 24 },
          ].map((c, i) => (
            <ListRow key={i}
              avatar={<Avatar name={c.i} size="md" bg="var(--surface-hover)" color="var(--text-muted)" />}
              primary={<span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>}
              secondary={<><Icon name="archive" size={11} strokeWidth={2} color="var(--text-muted)" />{c.date} · {c.txn} txns</>}
              right={<span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Restore</span>}
              chev={false}
            />
          ))}
        </div>

        <SectionHeader label="Archived subscriptions · 2" />
        <div className="list-card">
          <ListRow
            icon="film" iconKind="neutral"
            primary={<span style={{ color: 'var(--text-secondary)' }}>Spotify Premium</span>}
            secondary="Apr 22, 2025 · 8 payments"
            right={<span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Restore</span>}
            chev={false}
          />
          <ListRow
            icon="cloud" iconKind="neutral"
            primary={<span style={{ color: 'var(--text-secondary)' }}>Backblaze</span>}
            secondary="Jun 10, 2025 · 12 payments"
            right={<span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Restore</span>}
            chev={false}
          />
        </div>
      </div>
    </>
  );
}

// ============ MORE MENU ============
function MoreScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavLarge title="More" />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 14, paddingBottom: 90 }}>
        {/* User card */}
        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name="SC" size="lg" bg="#7C6FFF22" color="#7C6FFF" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Sarah Chen</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>sarah@chenstudio.co</div>
            <Badge kind="accent" style={{ marginTop: 4 }}>Pro plan</Badge>
          </div>
          <Icon name="chevR" size={18} color="var(--text-muted)" />
        </Card>

        <SectionHeader label="Workspace" />
        <div className="list-card">
          <ListRow icon="repeat" iconKind="accent" primary="Subscriptions" secondary={`${fmt(312.40, ccy)}/mo · 9 active`} chev />
          <ListRow icon="doc" iconKind="info" primary="Invoices" secondary="12 · 1 overdue" chev />
          <ListRow icon="chart" iconKind="pos" primary="Analytics" secondary="Insights & trends" chev />
          <ListRow icon="download" iconKind="warn" primary="Reports / Export" chev />
          <ListRow icon="archive" iconKind="neutral" primary="Archive" secondary="3 clients · 2 subs" chev />
        </div>

        <SectionHeader label="Account" />
        <div className="list-card">
          <ListRow icon="bell" iconKind="warn" primary="Notifications" secondary="3 unread" chev />
          <ListRow icon="settings" iconKind="neutral" primary="Settings" chev />
          <ListRow icon="shield" iconKind="info" primary="Security" chev />
          <ListRow icon="help" iconKind="accent" primary="Help & support" chev />
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          FlowLedger · v2.4.1
        </div>
      </div>
      <TabBar active="more" />
    </>
  );
}

// ============ SETTINGS ============
function SettingsScreen({ ccy = 'USD', theme = 'dark' }) {
  return (
    <>
      <NavCompact back="More" title="Settings" />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 14, paddingBottom: 24 }}>
        <SectionHeader label="Account" />
        <div className="list-card">
          <ListRow icon="mail" iconKind="info" primary="Email" right={<span style={{ color: 'var(--text-secondary)' }}>sarah@chenstudio.co</span>} chev={false} />
          <ListRow icon="user" iconKind="accent" primary="Profile" chev />
          <ListRow icon="logout" iconKind="neg" primary={<span style={{ color: 'var(--negative)' }}>Log out</span>} chev={false} />
        </div>

        <SectionHeader label="Workspace" />
        <div className="list-card">
          <ListRow icon="dollar" iconKind="pos" primary="Currency" right={<span style={{ color: 'var(--text-secondary)' }}>{CURRENCY[ccy].code} · {CURRENCY[ccy].sym}</span>} chev />
          <ListRow icon="layers" iconKind="accent" primary="Accounting mode" right={<span style={{ color: 'var(--text-muted)' }}>Cash basis</span>} chev={false} />
        </div>

        <SectionHeader label="Appearance" />
        <div className="list-card">
          <div className="list-row" style={{ padding: '14px 16px' }}>
            <div className={`icon ${theme === 'dark' ? 'accent' : 'warn'}`} style={{}}>
              <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} />
            </div>
            <div className="body">
              <div className="primary">Theme</div>
              <div className="secondary">Match system or pick one</div>
            </div>
          </div>
          <div style={{ padding: '0 16px 14px' }}>
            <div className="segmented">
              <div className={`seg ${theme === 'light' ? '' : ''}`}>System</div>
              <div className={`seg ${theme === 'light' ? 'active' : ''}`}>Light</div>
              <div className={`seg ${theme === 'dark' ? 'active' : ''}`}>Dark</div>
            </div>
          </div>
        </div>

        <SectionHeader label="Notifications" />
        <div className="list-card">
          <ListRow icon="calendar" iconKind="warn" primary="Billing reminders" right={<Toggle on />} chev={false} />
          <ListRow icon="doc" iconKind="info" primary="Invoice due" right={<Toggle on />} chev={false} />
          <ListRow icon="chart" iconKind="pos" primary="Weekly summary" right={<Toggle />} chev={false} />
        </div>
      </div>
    </>
  );
}

function Toggle({ on }) {
  return (
    <div style={{
      width: 44, height: 26, borderRadius: 999,
      background: on ? 'var(--positive)' : 'var(--surface-hover)',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 22, height: 22, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        transition: 'left 200ms',
      }} />
    </div>
  );
}

// ============ PROFILE ============
function ProfileScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavCompact back="Settings" title="Profile" right={<span style={{ color: 'var(--accent)', fontSize: 15, fontWeight: 600 }}>Save</span>} />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 14, paddingBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0 8px' }}>
          <div style={{ position: 'relative' }}>
            <Avatar name="SC" size="lg" bg="#7C6FFF22" color="#7C6FFF" />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, background: 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center', border: '2px solid var(--bg)' }}>
              <Icon name="edit" size={11} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>Change photo</div>
        </div>

        <Field label="NAME" value="Sarah Chen" icon="user" />
        <Field label="EMAIL" value="sarah@chenstudio.co" icon="mail" helper="Changing this requires re-verification." />

        <SectionHeader label="Security" />
        <div className="list-card">
          <ListRow icon="lock" iconKind="info" primary="Change password" chev />
          <ListRow icon="shield" iconKind="pos" primary="Two-factor auth" right={<Badge kind="pos" icon="check">On</Badge>} chev={false} />
          <ListRow icon="logout" iconKind="warn" primary="Log out all devices" chev={false} />
        </div>

        <div style={{ flex: 1 }} />
        <Button variant="ghost" block style={{ color: 'var(--negative)' }}>Delete account</Button>
      </div>
    </>
  );
}

// ============ PRICING ============
function PricingScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavCompact back="Account" title="Plans" />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 14, paddingBottom: 24 }}>
        <div className="segmented" style={{ background: 'var(--surface-hover)', alignSelf: 'center', minWidth: 220 }}>
          <div className="seg">Monthly</div>
          <div className="seg active">Yearly · save 20%</div>
        </div>

        {[
          { name: 'Free', price: 0, current: true, popular: false, features: ['Up to 25 transactions/mo', '3 clients', '1 invoice template', 'Email support'] },
          { name: 'Pro', price: 12, current: false, popular: true, features: ['Unlimited transactions', 'Unlimited clients', 'PDF invoices + PDF reports', 'Auto-categorization'] },
          { name: 'Business', price: 28, current: false, popular: false, features: ['Everything in Pro', 'Multiple workspaces', 'Tax estimates', 'Priority support'] },
        ].map((p, i) => (
          <Card key={i} style={{ padding: 16, position: 'relative', borderColor: p.popular ? 'var(--accent)' : 'var(--border)', borderWidth: p.popular ? 1.5 : 1 }}>
            {p.popular && (
              <div style={{ position: 'absolute', top: -10, right: 16, background: 'var(--accent)', color: 'white', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 999, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Popular
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{p.name}</div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{fmt(p.price, ccy, { decimals: 0 })}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/mo</span>
                </div>
              </div>
              <Button variant={p.current ? 'secondary' : (p.popular ? 'primary' : 'secondary')} style={{ height: 36, padding: '0 14px', fontSize: 13 }}>
                {p.current ? 'Current' : 'Upgrade'}
              </Button>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {p.features.map((f, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <Icon name="check" size={14} strokeWidth={2.5} color="var(--positive)" />
                  {f}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

// ============ BILLING ============
function BillingScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavCompact back="Settings" title="Billing" />
      <div className="screen-body" style={{ overflow: 'hidden', gap: 14, paddingBottom: 24 }}>
        <Card style={{ padding: 18, background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent), #000 30%))', color: 'white', border: 'none' }}>
          <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current plan</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, letterSpacing: '-0.02em' }}>Pro · yearly</div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.16)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Renews</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>Mar 14, 2026</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmt(115, ccy, { decimals: 0 })}/yr</div>
            </div>
          </div>
        </Card>

        <SectionHeader label="Payment method" link="Change" />
        <Card style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 28, borderRadius: 4, background: 'linear-gradient(135deg, #1A1F71, #4B0082)', color: 'white', fontSize: 9, fontWeight: 700, display: 'grid', placeItems: 'center' }}>VISA</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>•••• •••• •••• 4242</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Expires 08 / 27</div>
          </div>
        </Card>

        <SectionHeader label="Invoices" link="All" />
        <div className="list-card">
          {[
            { d: 'Mar 14, 2025', amt: 115, status: 'Paid' },
            { d: 'Mar 14, 2024', amt: 115, status: 'Paid' },
            { d: 'Mar 14, 2023', amt: 95, status: 'Paid' },
          ].map((r, i) => (
            <ListRow key={i}
              icon="doc" iconKind="neutral"
              primary={r.d}
              secondary={<Badge kind="pos" icon="check">{r.status}</Badge>}
              amount={fmt(r.amt, ccy, { decimals: 0 })}
              right={<Icon name="download" size={16} color="var(--text-muted)" />}
              chev={false}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ============ NOTIFICATIONS ============
function NotificationsScreen({ ccy = 'USD' }) {
  return (
    <>
      <NavCompact back="More" title="Notifications" right={<span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Mark all</span>} />
      <div style={{ padding: '0 16px 8px' }}>
        <div className="segmented">
          <div className="seg active">All · 9</div>
          <div className="seg">Unread · 3</div>
        </div>
      </div>
      <div className="screen-body" style={{ overflow: 'hidden', gap: 6, paddingBottom: 24 }}>
        <div style={{ padding: '8px 4px 6px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</div>
        <div className="list-card">
          <NotifRow icon="alert" kind="neg" unread title="Invoice #0044 is overdue" body="Marcus Wright · 4 days late · $1,850" time="2h" />
          <NotifRow icon="trendUp" kind="pos" unread title="Payment received" body="Northwind Studios · +$2,400" time="6h" />
          <NotifRow icon="clock" kind="warn" unread title="Linear Plus bills tomorrow" body="$8 monthly subscription" time="9h" />
        </div>
        <div style={{ padding: '12px 4px 6px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>This week</div>
        <div className="list-card">
          <NotifRow icon="check" kind="pos" title="Atlas Print paid #0041" body="+$4,150" time="2d" />
          <NotifRow icon="chart" kind="info" title="Weekly summary ready" body="Nov 18 – Nov 24" time="3d" />
          <NotifRow icon="repeat" kind="neutral" title="Figma renewed" body="Auto-logged · $15" time="5d" />
        </div>
      </div>
    </>
  );
}

function NotifRow({ icon, kind, title, body, time, unread }) {
  return (
    <div className="list-row" style={{ alignItems: 'flex-start', padding: '14px 16px', position: 'relative' }}>
      <div className={`icon ${kind}`}><Icon name={icon} size={18} /></div>
      <div className="body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="primary" style={{ fontWeight: unread ? 600 : 500 }}>{title}</span>
          {unread && <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--accent)' }} />}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{body}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'flex-start' }}>{time}</div>
    </div>
  );
}

// ============ OFFLINE ============
function OfflineScreen({ ccy = 'USD' }) {
  return (
    <div className="screen-body" style={{ padding: '0 24px', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 20 }}>
      <div style={{ width: 96, height: 96, borderRadius: 24, background: 'var(--surface-hover)', color: 'var(--text-muted)', display: 'grid', placeItems: 'center' }}>
        <Icon name="wifiOff" size={44} strokeWidth={1.5} />
      </div>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>You're offline</h1>
        <div style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: 15, lineHeight: 1.5, maxWidth: 280 }}>
          Some data is cached locally so you can review recent transactions and clients.
        </div>
      </div>
      <Card style={{ padding: 14, width: '100%', textAlign: 'left', background: 'var(--info-tint)', borderColor: 'transparent' }}>
        <div style={{ fontSize: 12, color: 'var(--info)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last synced</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--info)', marginTop: 4 }}>Nov 25, 9:14 AM</div>
      </Card>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <Button variant="primary" block icon="refresh">Try again</Button>
        <Button variant="ghost" block>View cached data</Button>
      </div>
    </div>
  );
}

// ============ ERROR / NOT FOUND ============
function ErrorScreen({ ccy = 'USD' }) {
  return (
    <div className="screen-body" style={{ padding: '0 24px', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 20 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--accent)', opacity: 0.12, lineHeight: 1 }}>404</div>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
            <Icon name="alert" size={28} strokeWidth={1.75} />
          </div>
        </div>
      </div>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>We can't find that</h1>
        <div style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: 15, lineHeight: 1.5, maxWidth: 280 }}>
          The page or record you're looking for may have been archived or moved.
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <Button variant="primary" block icon="home">Back to home</Button>
        <Button variant="ghost" block>Report a problem</Button>
      </div>
    </div>
  );
}

Object.assign(window, {
  ReportsScreen, ArchiveScreen, MoreScreen, SettingsScreen, ProfileScreen,
  PricingScreen, BillingScreen, NotificationsScreen, OfflineScreen, ErrorScreen,
  Toggle, NotifRow,
});
