/* ============================================================
   FlowLedger — Offline · 404 / Error (§6.25, 6.26)
   ============================================================ */
window.SCREENS = window.SCREENS || {};
const { useState: useStateU } = React;

function CenteredUtil({ icon, code, title, body, children, tone = "accent" }) {
  const c = tone === "negative" ? "var(--negative)" : "var(--accent)";
  const bg = tone === "negative" ? "var(--negative-tint)" : "var(--accent-tint)";
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        {code && <div className="tnum" style={{ fontSize: 96, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.04em", color: "var(--text)", opacity: .12 }}>{code}</div>}
        <div style={{ width: 64, height: 64, margin: code ? "-30px auto 20px" : "0 auto 20px", borderRadius: 99, background: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}><Icon name={icon} size={30} /></div>
        <div className="t-h1">{title}</div>
        <div className="t-body text-secondary" style={{ marginTop: 8, marginBottom: 24 }}>{body}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>{children}</div>
      </div>
    </div>
  );
}

function Offline() {
  const [trying, setTrying] = useStateU(false);
  return (
    <CenteredUtil icon="wifiOff" title="You're offline" body="We can't reach the network right now. Your most recent data is still available from cache — changes will sync when you reconnect.">
      <Button icon="refresh" loading={trying} onClick={() => { setTrying(true); setTimeout(() => { setTrying(false); nav("overview"); }, 1200); }}>Try again</Button>
    </CenteredUtil>
  );
}

function NotFound() {
  return (
    <CenteredUtil code="404" icon="search" title="Page not found" body="The page you're looking for doesn't exist or may have moved.">
      <Button icon="overview" onClick={() => nav("overview")}>Back to dashboard</Button>
      <Button variant="secondary" icon="alert" onClick={() => nav("overview")}>Report problem</Button>
    </CenteredUtil>
  );
}

window.SCREENS["404"] = NotFound;
window.SCREENS.offline = Offline;
