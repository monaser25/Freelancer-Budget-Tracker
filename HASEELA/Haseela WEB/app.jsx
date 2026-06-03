/* ============================================================
   FlowLedger — app root: provider, routing, mount
   ============================================================ */
const { useState: useStateA, useEffect: useEffectA, useCallback: useCbA } = React;

function NotBuilt({ name }) {
  return <EmptyState icon="sparkle" title={`${name} screen`} body="This screen is part of the build and will appear here." />;
}

function AppProvider({ children }) {
  const [theme, setTheme] = useStateA(() => localStorage.getItem("fl-theme") || "dark");
  const [currency, setCurrencyState] = useStateA(() => localStorage.getItem("fl-currency") || "USD");
  const [collapsed, setCollapsed] = useStateA(() => localStorage.getItem("fl-collapsed") === "1");
  const route = useRoute();

  useEffectA(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("fl-theme", theme);
  }, [theme]);
  useEffectA(() => { FL.setCurrency(currency); localStorage.setItem("fl-currency", currency); }, [currency]);
  useEffectA(() => { localStorage.setItem("fl-collapsed", collapsed ? "1" : "0"); }, [collapsed]);

  const unread = FL.notifications.filter((n) => !n.read).length;
  const api = {
    theme, toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")), setTheme,
    currency, setCurrency: setCurrencyState,
    collapsed, setCollapsed, route, user: FL.user, unread,
  };
  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>;
}

function AppShell() {
  const { route } = useApp();
  const [palette, setPalette] = useStateA(false);
  const [mobileNav, setMobileNav] = useStateA(false);

  useEffectA(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  useEffectA(() => { setMobileNav(false); }, [route.name]);

  const Screen = window.SCREENS[route.name] || (() => <NotBuilt name={route.name} />);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "var(--bg)", color: "var(--text)" }}>
      <div className="fl-sidebar-desktop"><Sidebar /></div>
      {mobileNav && (
        <div className="fl-sidebar-mobile" onMouseDown={() => setMobileNav(false)}
          style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.5)", animation: "fl-fade var(--dur-base)" }}>
          <div onMouseDown={(e) => e.stopPropagation()} style={{ height: "100%", width: 260, animation: "fl-slide-right var(--dur-base)" }}>
            <Sidebar mobile onClose={() => setMobileNav(false)} />
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        <Topbar onMenu={() => setMobileNav(true)} openPalette={() => setPalette(true)} />
        <main className="fl-content" style={{ flex: 1, overflowY: "auto", padding: "24px", background: "var(--bg)" }}>
          <div style={{ maxWidth: "var(--content-max)", margin: "0 auto", width: "100%" }} key={route.name + (route.param || "")}>
            <Screen />
          </div>
        </main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

function Root() {
  const route = useRoute();
  const isBare = BARE_ROUTES.includes(route.name);
  if (isBare) {
    const Screen = window.SCREENS[route.name] || (() => <NotBuilt name={route.name} />);
    return <Screen />;
  }
  return <AppShell />;
}

function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <Root />
        <GlobalModals />
      </AppProvider>
    </ToastProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
