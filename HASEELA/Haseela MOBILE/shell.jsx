/* FlowLedger Mobile — Shell + Icons + small atoms
   Exports to window: Phone, StatusBar, TabBar, FAB, HomeIndicator, Icon, Avatar, Badge,
   Chip, Segmented, ListRow, Card, StatCard, NavLarge, NavCompact, Sheet, Button, Field
*/

// ---------- Lucide-style icons (subset, inline SVG) ----------
const I = {
  home: <path d="M3 11l9-8 9 8M5 10v10h14V10"/>,
  receipt: <path d="M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-1 1V2zm4 6h8M8 12h8M8 16h5"/>,
  users: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M17 3.13a4 4 0 0 1 0 7.75"/>,
  chart: <path d="M3 3v18h18M7 14l4-4 4 4 5-5"/>,
  menu: <path d="M3 12h18M3 6h18M3 18h18"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  search: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2l-4.35-4.35"/>,
  bell: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/>,
  filter: <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z"/>,
  chevR: <path d="M9 6l6 6-6 6"/>,
  chevL: <path d="M15 6l-6 6 6 6"/>,
  chevD: <path d="M6 9l6 6 6-6"/>,
  chevU: <path d="M6 15l6-6 6 6"/>,
  arrR: <path d="M5 12h14M13 5l7 7-7 7"/>,
  arrL: <path d="M19 12H5M12 19l-7-7 7-7"/>,
  arrUp: <path d="M12 19V5M5 12l7-7 7 7"/>,
  arrDn: <path d="M12 5v14M5 12l7 7 7-7"/>,
  trendUp: <path d="M3 17l6-6 4 4 7-7M14 8h6v6"/>,
  trendDn: <path d="M3 7l6 6 4-4 7 7M14 16h6v-6"/>,
  check: <path d="M5 12l5 5L20 7"/>,
  x: <path d="M6 6l12 12M18 6L6 18"/>,
  eye: <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>,
  eyeOff: <path d="M3 3l18 18M10.5 6.2A9.5 9.5 0 0 1 12 6c6 0 10 6 10 6a13.7 13.7 0 0 1-3 3.5M6 7s-2 2.5-4 5c0 0 4 6 10 6 1.7 0 3.2-.5 4.5-1.2M10 10a3 3 0 0 0 4 4"/>,
  mail: <path d="M4 4h16v16H4zM4 4l8 7 8-7"/>,
  lock: <path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4"/>,
  user: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>,
  wallet: <path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11M16 14h2"/>,
  card: <path d="M2 7h20v12H2zM2 11h20"/>,
  briefcase: <path d="M2 8h20v12H2zM8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>,
  calendar: <path d="M5 5h14v15H5zM5 9h14M9 3v4M15 3v4"/>,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2"/>,
  zap: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>,
  repeat: <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>,
  download: <path d="M12 3v12m0 0l-5-5m5 5l5-5M4 21h16"/>,
  share: <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>,
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>,
  trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>,
  edit: <path d="M11 4h-7v16h16v-7M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>,
  archive: <path d="M3 5h18v4H3zM5 9v11h14V9M10 13h4"/>,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3"/>,
  star: <path d="M12 2l3 7 7 .5-5.5 4.7L18 22l-6-4-6 4 1.5-7.8L2 9.5 9 9l3-7z"/>,
  sun: <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4L4.2 19.8M19.8 4.2l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>,
  shield: <path d="M12 22s8-4 8-12V4l-8-2-8 2v6c0 8 8 12 8 12z"/>,
  help: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.1 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17v.01"/>,
  settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>,
  wifi: <path d="M5 13a10 10 0 0 1 14 0M8.5 16.5a6 6 0 0 1 7 0M12 20h.01M2 8.5C5.5 5 8.5 4 12 4s6.5 1 10 4.5"/>,
  wifiOff: <path d="M1 1l22 22M16.7 16.7a6 6 0 0 0-9.4 0M9.5 12.7a10 10 0 0 1 10.6.2M5 13c.3-.3.6-.6 1-.8M19 13a10 10 0 0 0-3-2M12 20h.01"/>,
  alert: <path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>,
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16v-4M12 8h.01"/>,
  dollar: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>,
  building: <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/>,
  bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>,
  globe: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>,
  bag: <path d="M5 8h14l-1 13H6L5 8zM9 8V5a3 3 0 0 1 6 0v3"/>,
  coffee: <path d="M17 8H3v9a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4V8zM17 8h2a3 3 0 0 1 0 6h-2M6 1v3M10 1v3M14 1v3"/>,
  monitor: <path d="M3 4h18v12H3zM8 21h8M12 17v4"/>,
  cloud: <path d="M18 10a5 5 0 0 0-9.5-2A4 4 0 0 0 6 16h12a4 4 0 0 0 0-8h-.5a5 5 0 0 0 .5 2z"/>,
  film: <path d="M3 3h18v18H3zM7 3v18M17 3v18M3 7h4M3 11h4M3 15h4M3 19h4M17 7h4M17 11h4M17 15h4M17 19h4"/>,
  doc: <path d="M14 3H6v18h12V7l-4-4zM14 3v4h4"/>,
  paint: <path d="M19 11h2v4h-9v6h-2v-6a3 3 0 0 1 3-3h6V8a5 5 0 0 0-10 0 5 5 0 0 1-5-5"/>,
  refresh: <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>,
  pie: <path d="M21.2 15.9A10 10 0 1 1 8 2.8M22 12A10 10 0 0 0 12 2v10z"/>,
  arc: <path d="M3 3v18h18"/>,
  qr: <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14h1M14 18v3M18 20h3"/>,
  copy: <path d="M9 9h12v12H9zM5 15H3V3h12v2"/>,
  link: <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>,
  pin: <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>,
  send2: <path d="M5 12h14M13 5l7 7-7 7"/>,
  flag: <path d="M4 15s2-2 5-2 5 2 8 2 5-2 5-2V3s-2 2-5 2-5-2-8-2-5 2-5 2zM4 22V15"/>,
  inbox: <path d="M22 12h-6l-2 3h-4l-2-3H2M5 5h14l3 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6l3-7z"/>,
  history: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2"/>,
  layers: <path d="M12 2l10 6-10 6L2 8l10-6zM2 14l10 6 10-6M2 18l10 6 10-6"/>,
};

function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, style }) {
  const p = I[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={style}>
      {p}
    </svg>
  );
}

// ---------- Status bar ----------
function StatusBar({ time = "9:41" }) {
  return (
    <div className="status-bar">
      <span>{time}</span>
      <div className="status-right">
        {/* signal */}
        <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="5" y="5" width="3" height="6" rx="0.5"/><rect x="10" y="2" width="3" height="9" rx="0.5"/><rect x="15" y="0" width="3" height="11" rx="0.5"/></svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 11a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zM2 4.5L0 2.5a11 11 0 0 1 16 0L14 4.5a8 8 0 0 0-12 0zM4.5 7l-2-2a7 7 0 0 1 11 0l-2 2a4 4 0 0 0-7 0z"/></svg>
        {/* battery */}
        <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="currentColor" opacity="0.4"/></svg>
      </div>
    </div>
  );
}

// ---------- Home indicator ----------
function HomeIndicator() { return <div className="home-indicator" />; }

// ---------- Phone wrapper ----------
function Phone({ theme = 'dark', accent, radius, density, font, children, style, time, hideHome }) {
  const attrs = {
    'data-theme': theme,
    ...(accent ? { 'data-accent': accent } : {}),
    ...(radius ? { 'data-radius': radius } : {}),
    ...(density ? { 'data-density': density } : {}),
    ...(font ? { 'data-font': font } : {}),
  };
  return (
    <div className="phone" {...attrs} style={style}>
      <StatusBar time={time} />
      <div className="screen" style={{ paddingTop: 0 }}>
        {children}
      </div>
      {!hideHome && <HomeIndicator />}
    </div>
  );
}

// ---------- Nav ----------
function NavLarge({ title, left, right, sub }) {
  return (
    <div className="nav-large">
      <div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{sub}</div>}
        <h1>{title}</h1>
      </div>
      {right && <div className="nav-actions">{right}</div>}
    </div>
  );
}
function NavIcon({ icon, badge, onClick }) {
  return (
    <div className="nav-icon" onClick={onClick}>
      <Icon name={icon} size={18} />
      {badge && <span className="dot" />}
    </div>
  );
}
function NavCompact({ back = "Back", title, right }) {
  return (
    <div className="nav-compact">
      <div className="back"><Icon name="chevL" size={20} /> <span>{back}</span></div>
      <div className="title">{title}</div>
      <div className="nav-actions">{right || <span style={{ width: 36 }} />}</div>
    </div>
  );
}

// ---------- Tab bar ----------
function TabBar({ active = 'home' }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'transactions', label: 'Transactions', icon: 'receipt' },
    { id: 'fab' },
    { id: 'clients', label: 'Clients', icon: 'users' },
    { id: 'more', label: 'More', icon: 'menu' },
  ];
  return (
    <div className="tab-bar">
      {tabs.map((t) => {
        if (t.id === 'fab') return <div key="fab" className="fab-slot" />;
        const isActive = active === t.id;
        return (
          <div key={t.id} className={`tab ${isActive ? 'active' : ''}`}>
            <Icon name={t.icon} size={22} strokeWidth={isActive ? 2.25 : 1.75} />
            <span>{t.label}</span>
          </div>
        );
      })}
      <div className="fab center"><Icon name="plus" size={28} strokeWidth={2.25} /></div>
    </div>
  );
}

// ---------- Buttons / Field ----------
function Button({ variant = 'primary', block, children, icon, style, onClick }) {
  return (
    <button onClick={onClick} className={`btn btn-${variant} ${block ? 'btn-block' : ''}`} style={style}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

function Field({ label, value, placeholder, icon, right, focused, helper, error, type = 'text' }) {
  return (
    <div className="input">
      {label && <label>{label}</label>}
      <div className={`field ${focused ? 'focused' : ''}`} style={error ? { borderColor: 'var(--negative)', boxShadow: '0 0 0 4px var(--negative-tint)' } : {}}>
        {icon && <Icon name={icon} size={18} color="var(--text-muted)" />}
        <div style={{ flex: 1, color: value ? 'var(--text)' : 'var(--text-muted)', fontFamily: type === 'pw' ? 'monospace' : undefined, letterSpacing: type === 'pw' ? '0.3em' : undefined }}>
          {value || placeholder}
        </div>
        {right}
      </div>
      {helper && <div className="helper" style={error ? { color: 'var(--negative)' } : {}}>{helper}</div>}
    </div>
  );
}

// ---------- Sheet ----------
function Sheet({ title, children, scrim = true, height = 'auto', style }) {
  return (
    <>
      {scrim && <div className="scrim" />}
      <div className="sheet" style={{ ...(height !== 'auto' ? { height } : {}), ...style }}>
        <div className="handle" />
        {title && <div className="sheet-title">{title}</div>}
        {children}
      </div>
    </>
  );
}

// ---------- Avatar ----------
function Avatar({ name = "JD", size = 'md', color, bg }) {
  return (
    <div className={`avatar ${size}`} style={{ ...(color ? { color } : {}), ...(bg ? { background: bg } : {}) }}>
      {name}
    </div>
  );
}

// ---------- Badge / Chip ----------
function Badge({ kind = 'neutral', children, icon }) {
  return (
    <span className={`badge ${kind}`}>
      {icon && <Icon name={icon} size={11} strokeWidth={2.25} />}
      {children}
    </span>
  );
}
function Chip({ active, kind, children, icon }) {
  return (
    <span className={`chip ${active ? 'active' : ''} ${kind || ''}`}>
      {icon && <Icon name={icon} size={13} strokeWidth={2} style={{ marginRight: 4, verticalAlign: -2 }} />}
      {children}
    </span>
  );
}
function Segmented({ options, value }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <div key={o} className={`seg ${value === o ? 'active' : ''}`}>{o}</div>
      ))}
    </div>
  );
}

// ---------- List row ----------
function ListRow({ icon, iconKind, avatar, primary, secondary, amount, amountKind, sub, badge, chev = true, right, dense }) {
  return (
    <div className="list-row" style={dense ? { padding: '10px 16px', minHeight: 52 } : {}}>
      {avatar ? avatar : icon && <div className={`icon ${iconKind || ''}`}><Icon name={icon} size={18} /></div>}
      <div className="body">
        <div className="primary">{primary}</div>
        {secondary && <div className="secondary">{secondary}</div>}
      </div>
      {right ? right : (
        <div className="right">
          {amount && <div className={`amount ${amountKind || ''}`}>{amount}</div>}
          {sub && <div className="sub">{sub}</div>}
          {badge && badge}
        </div>
      )}
      {chev && !right && <Icon name="chevR" size={16} color="var(--text-muted)" />}
    </div>
  );
}

// ---------- Card / Stat card ----------
function Card({ children, style, elev }) {
  return <div className={`card ${elev ? 'elev' : ''}`} style={style}>{children}</div>;
}

function StatCard({ label, value, delta, deltaKind, icon, style }) {
  return (
    <div className="stat-card" style={style}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="label">{label}</span>
        {icon && <Icon name={icon} size={16} color="var(--text-muted)" />}
      </div>
      <div className="value">{value}</div>
      {delta && (
        <div className={`delta ${deltaKind || 'pos'}`}>
          <Icon name={deltaKind === 'neg' ? 'arrDn' : 'arrUp'} size={11} strokeWidth={2.5} />
          {delta}
        </div>
      )}
    </div>
  );
}

// ---------- Section header ----------
function SectionHeader({ label, link }) {
  return (
    <div className="section-header">
      <span className="label">{label}</span>
      {link && <span className="link">{link}</span>}
    </div>
  );
}

// ---------- Wallpaper / brand mark ----------
function BrandMark({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="2" y="2" width="60" height="60" rx="18" fill="var(--accent)"/>
      <path d="M20 22 L20 44 M20 22 L40 22 M20 32 L36 32" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="44" cy="40" r="6" fill="white"/>
    </svg>
  );
}

// ---------- Tiny chart helpers ----------
function BarChart({ data, height = 140, neg = false }) {
  // data: [{label, pos, neg}]
  const max = Math.max(...data.flatMap(d => [d.pos || 0, d.neg || 0])) || 1;
  const w = 320;
  const groupW = w / data.length;
  const barW = 9;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const cx = i * groupW + groupW / 2;
        const ph = ((d.pos || 0) / max) * (height - 30);
        const nh = ((d.neg || 0) / max) * (height - 30);
        return (
          <g key={i}>
            <rect x={cx - barW - 1} y={height - 24 - ph} width={barW} height={ph} rx="3" fill="var(--positive)"/>
            <rect x={cx + 1} y={height - 24 - nh} width={barW} height={nh} rx="3" fill="var(--negative)"/>
            <text x={cx} y={height - 8} fontSize="10" fill="var(--text-muted)" textAnchor="middle" fontWeight="500">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ size = 120, data, stroke = 14, total }) {
  // data: [{value, color}]
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const sum = total || data.reduce((s, d) => s + d.value, 0);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-hover)" strokeWidth={stroke} />
      {data.map((d, i) => {
        const len = (d.value / sum) * c;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={d.color}
            strokeWidth={stroke} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
            transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="butt" />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

function HBar({ value, max, color = 'var(--accent)', height = 6 }) {
  return (
    <div style={{ width: '100%', height, background: 'var(--surface-hover)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, (value/max)*100)}%`, height: '100%', background: color, borderRadius: 999 }} />
    </div>
  );
}

function Sparkline({ data, color = 'var(--accent)', height = 40, width = 120 }) {
  const max = Math.max(...data); const min = Math.min(...data);
  const pts = data.map((v, i) => `${(i/(data.length-1))*width},${height - ((v-min)/(max-min || 1))*(height-4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- Money formatter ----------
const CURRENCY = {
  USD: { sym: '$', code: 'USD' },
  EUR: { sym: '€', code: 'EUR' },
  GBP: { sym: '£', code: 'GBP' },
  EGP: { sym: 'E£', code: 'EGP' },
  SAR: { sym: '﷼', code: 'SAR' },
  AED: { sym: 'د.إ', code: 'AED' },
};
function fmt(n, ccy = 'USD', opts = {}) {
  const { sym } = CURRENCY[ccy] || CURRENCY.USD;
  const sign = n < 0 ? '−' : (opts.signed && n > 0 ? '+' : '');
  const abs = Math.abs(n);
  const str = abs.toLocaleString('en-US', { minimumFractionDigits: opts.decimals ?? 2, maximumFractionDigits: opts.decimals ?? 2 });
  return `${sign}${sym}${str}`;
}

Object.assign(window, {
  Icon, StatusBar, HomeIndicator, Phone, NavLarge, NavCompact, NavIcon, TabBar,
  Button, Field, Sheet, Avatar, Badge, Chip, Segmented, ListRow, Card, StatCard,
  SectionHeader, BrandMark, BarChart, Donut, HBar, Sparkline, fmt, CURRENCY,
});
