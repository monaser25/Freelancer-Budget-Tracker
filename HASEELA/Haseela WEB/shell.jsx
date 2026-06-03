/* ============================================================
   FlowLedger — app shell, router, global context
   ============================================================ */
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS, createContext: createCtxS, useContext: useCtxS, useCallback: useCbS } = React;

/* ---------- global app context ---------- */
const AppCtx = createCtxS(null);
function useApp() { return useCtxS(AppCtx); }

const NAV_PRIMARY = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "transactions", label: "Transactions", icon: "transactions" },
  { id: "invoices", label: "Invoices", icon: "invoices" },
  { id: "clients", label: "Clients", icon: "clients" },
  { id: "subscriptions", label: "Subscriptions", icon: "subscriptions" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "reports", label: "Reports", icon: "reports" },
];
const NAV_SECONDARY = [
  { id: "archive", label: "Archive", icon: "archive" },
  { id: "settings", label: "Settings", icon: "settings" },
];
const PAGE_TITLES = {
  overview: ["Overview", "Your money at a glance"],
  transactions: ["Transactions", "Every dollar in and out"],
  invoices: ["Invoices", "Bill clients and track payment"],
  clients: ["Clients & Revenue", "Who pays you, and how much"],
  subscriptions: ["Subscriptions", "Recurring tools & software"],
  analytics: ["Analytics", "Trends across periods"],
  reports: ["Reports", "Generate & export statements"],
  archive: ["Archive", "Restore past clients & tools"],
  settings: ["Settings", "Account & workspace"],
  profile: ["Profile", "Your personal details"],
  notifications: ["Notifications", "Reminders & events"],
  pricing: ["Plans", "Choose what fits"],
  billing: ["Billing", "Manage your subscription"],
};

const BARE_ROUTES = ["login", "register", "forgot", "reset", "verify", "onboarding", "offline", "404"];

/* ---------- routing ---------- */
function parseHash() {
  const h = (window.location.hash || "#/overview").replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  return { name: parts[0] || "overview", param: parts[1] || null, parts };
}
function nav(route) { window.location.hash = "#/" + route; }

function useRoute() {
  const [route, setRoute] = useStateS(parseHash());
  useEffectS(() => {
    const h = () => { setRoute(parseHash()); document.querySelector(".fl-content")?.scrollTo(0, 0); };
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  return route;
}

/* ---------- Sidebar ---------- */
function NavItem({ item, active, collapsed, onClick }) {
  const [hov, setHov] = useStateS(false);
  return (
    <button onClick={onClick} title={collapsed ? item.label : undefined} className="focus-ring"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position: "relative", display: "flex", alignItems: "center", gap: 11, width: "100%",
        height: 38, padding: collapsed ? 0 : "0 11px", justifyContent: collapsed ? "center" : "flex-start",
        border: "none", cursor: "pointer", borderRadius: "var(--r-md)", fontSize: 14, fontWeight: active ? 600 : 500,
        background: active ? "var(--accent-tint)" : hov ? "var(--surface-hover)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-secondary)", transition: "background var(--dur-fast), color var(--dur-fast)" }}>
      {active && <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 2.5, borderRadius: 99, background: "var(--accent)" }} />}
      <Icon name={item.icon} size={18} />
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

function Sidebar({ mobile, onClose }) {
  const { route, collapsed, setCollapsed, user } = useApp();
  const c = mobile ? false : collapsed;
  const go = (id) => { nav(id); onClose && onClose(); };
  return (
    <aside style={{ width: c ? "var(--sidebar-rail)" : "var(--sidebar-w)", flexShrink: 0, height: "100%",
      background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column",
      transition: "width var(--dur-base) var(--ease-out)" }}>
      {/* brand */}
      <div style={{ height: "var(--header-h)", display: "flex", alignItems: "center", gap: 10, padding: c ? 0 : "0 18px", justifyContent: c ? "center" : "flex-start", borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <Icon name="wallet" size={18} style={{ color: "#fff" }} />
        </div>
        {!c && <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>FlowLedger</span>}
      </div>
      {/* nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: c ? "12px 10px" : "12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_PRIMARY.map((it) => <NavItem key={it.id} item={it} collapsed={c} active={route.name === it.id} onClick={() => go(it.id)} />)}
        <div style={{ flex: 1, minHeight: 12 }} />
        <div style={{ height: 1, background: "var(--border)", margin: "6px 4px" }} />
        {NAV_SECONDARY.map((it) => <NavItem key={it.id} item={it} collapsed={c} active={route.name === it.id} onClick={() => go(it.id)} />)}
      </nav>
      {/* user card */}
      <div style={{ borderTop: "1px solid var(--border)", padding: c ? 10 : 12 }}>
        <Menu align="left" width={200} trigger={
          <button className="focus-ring" style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: c ? 0 : "8px", justifyContent: c ? "center" : "flex-start",
            border: "none", background: "transparent", cursor: "pointer", borderRadius: "var(--r-md)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <Avatar name={user.name} size={32} />
            {!c && <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
              <div className="t-body-m" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
              <div className="t-small text-muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
            </div>}
            {!c && <Icon name="chevronDown" size={15} style={{ color: "var(--text-muted)" }} />}
          </button>
        } items={[
          { icon: "user", label: "Profile", onClick: () => go("profile") },
          { icon: "card", label: "Billing", onClick: () => go("billing") },
          { divider: true },
          { icon: "logout", label: "Log out", onClick: () => nav("login"), danger: true },
        ]} />
      </div>
      {!mobile && (
        <button onClick={() => setCollapsed(!collapsed)} className="focus-ring" title="Toggle sidebar"
          style={{ height: 36, border: "none", borderTop: "1px solid var(--border)", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Icon name="panelLeft" size={16} />{!c && <span className="t-small">Collapse</span>}
        </button>
      )}
    </aside>
  );
}

/* ---------- Topbar ---------- */
function Topbar({ onMenu, openPalette }) {
  const { route, theme, toggleTheme, unread } = useApp();
  const [t, sub] = PAGE_TITLES[route.name] || [route.name, ""];
  return (
    <header style={{ height: "var(--header-h)", flexShrink: 0, borderBottom: "1px solid var(--border)", background: "var(--surface)",
      display: "flex", alignItems: "center", gap: 14, padding: "0 20px", position: "sticky", top: 0, zIndex: 40 }}>
      <button className="fl-hamburger focus-ring" onClick={onMenu} style={{ display: "none", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-secondary)", padding: 4 }}>
        <Icon name="menu" size={20} />
      </button>
      <div style={{ minWidth: 0 }}>
        <div className="t-h2" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t}</div>
      </div>
      <div style={{ flex: 1 }} />
      {/* search */}
      <button onClick={openPalette} className="fl-search focus-ring" style={{ display: "flex", alignItems: "center", gap: 10, height: 36, padding: "0 12px", minWidth: 220,
        borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", color: "var(--text-muted)" }}>
        <Icon name="search" size={16} />
        <span className="t-body" style={{ flex: 1, textAlign: "left" }}>Search…</span>
        <kbd style={{ fontSize: 11, fontFamily: "inherit", padding: "1px 6px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--surface)" }}>⌘K</kbd>
      </button>
      <IconButton icon={theme === "dark" ? "sun" : "moon"} title="Toggle theme" onClick={toggleTheme} />
      <IconButton icon="bell" title="Notifications" badge={unread > 0} onClick={() => nav("notifications")} />
      <Menu align="right" trigger={
        <Button icon="plus" iconRight="chevronDown" size="md">New</Button>
      } items={[
        { icon: "trendUp", label: "Add revenue", onClick: () => window.dispatchEvent(new CustomEvent("fl-new", { detail: "income" })) },
        { icon: "receipt", label: "Log expense", onClick: () => window.dispatchEvent(new CustomEvent("fl-new", { detail: "expense" })) },
        { icon: "invoices", label: "New invoice", onClick: () => nav("invoices/new") },
        { icon: "clients", label: "Add client", onClick: () => window.dispatchEvent(new CustomEvent("fl-new", { detail: "client" })) },
      ]} />
    </header>
  );
}

/* ---------- Command palette ---------- */
function CommandPalette({ open, onClose }) {
  const [q, setQ] = useStateS("");
  const inputRef = useRefS(null);
  const [sel, setSel] = useStateS(0);
  useEffectS(() => { if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

  const actions = [
    { icon: "trendUp", label: "Add revenue", kind: "Action", run: () => { onClose(); window.dispatchEvent(new CustomEvent("fl-new", { detail: "income" })); } },
    { icon: "receipt", label: "Log expense", kind: "Action", run: () => { onClose(); window.dispatchEvent(new CustomEvent("fl-new", { detail: "expense" })); } },
    { icon: "invoices", label: "New invoice", kind: "Action", run: () => { onClose(); nav("invoices/new"); } },
    { icon: "clients", label: "Add client", kind: "Action", run: () => { onClose(); window.dispatchEvent(new CustomEvent("fl-new", { detail: "client" })); } },
  ];
  const pages = [...NAV_PRIMARY, ...NAV_SECONDARY, { id: "notifications", label: "Notifications", icon: "bell" }, { id: "profile", label: "Profile", icon: "user" }, { id: "pricing", label: "Plans", icon: "sparkle" }]
    .map((p) => ({ icon: p.icon, label: p.label, kind: "Page", run: () => { onClose(); nav(p.id); } }));
  const clients = FL.clients.filter((c) => !c.archived).map((c) => ({ icon: "clients", label: c.name, sub: c.company, kind: "Client", run: () => { onClose(); nav("clients"); } }));
  const subs = FL.subscriptions.filter((s) => !s.archived).map((s) => ({ icon: "subscriptions", label: s.name, kind: "Subscription", run: () => { onClose(); nav("subscriptions"); } }));
  const all = [...actions, ...pages, ...clients, ...subs];
  const filtered = q ? all.filter((a) => (a.label + " " + (a.sub || "")).toLowerCase().includes(q.toLowerCase())) : all.slice(0, 10);

  useEffectS(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); filtered[sel]?.run(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, filtered, sel, onClose]);

  if (!open) return null;
  return (
    <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, zIndex: 150, background: "color-mix(in srgb, var(--bg) 55%, rgba(0,0,0,.55))", backdropFilter: "blur(2px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "12vh 20px" }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)", overflow: "hidden", animation: "fl-rise var(--dur-slow) var(--ease-out)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Icon name="search" size={18} style={{ color: "var(--text-muted)" }} />
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} placeholder="Search clients, tools, pages, or run an action…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: "var(--text)", fontSize: 15 }} />
          <kbd style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, border: "1px solid var(--border)", color: "var(--text-muted)" }}>Esc</kbd>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: 8 }}>
          {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center" }} className="t-body text-muted">No results for "{q}"</div>}
          {filtered.map((a, i) => (
            <button key={i} onClick={a.run} onMouseEnter={() => setSel(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", border: "none", cursor: "pointer", textAlign: "left",
                borderRadius: "var(--r-md)", background: sel === i ? "var(--surface-hover)" : "transparent", color: "var(--text)" }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-tint)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={a.icon} size={15} />
              </span>
              <span style={{ flex: 1 }}>
                <span className="t-body-m">{a.label}</span>
                {a.sub && <span className="t-small text-muted"> · {a.sub}</span>}
              </span>
              <Badge>{a.kind}</Badge>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AppCtx, useApp, nav, useRoute, Sidebar, Topbar, CommandPalette, PAGE_TITLES, BARE_ROUTES });
