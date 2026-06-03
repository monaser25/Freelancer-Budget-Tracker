/* ============================================================
   FlowLedger — core component library
   Exposes primitives to window. Uses tokens.css variables.
   ============================================================ */
const { useState, useEffect, useRef, createContext, useContext, useCallback } = React;

/* ---------------- Button ---------------- */
function Button({ variant = "primary", size = "md", loading, disabled, icon, iconRight, children, style, ...rest }) {
  const h = { sm: 32, md: 36, lg: 40 }[size];
  const pad = { sm: "0 12px", md: "0 14px", lg: "0 18px" }[size];
  const base = {
    height: h, padding: children ? pad : 0, width: children ? "auto" : h,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: "var(--r-md)", border: "1px solid transparent",
    fontSize: size === "lg" ? 14 : 14, fontWeight: 500, cursor: disabled || loading ? "not-allowed" : "pointer",
    whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-out), border-color var(--dur-fast), opacity var(--dur-fast)",
    opacity: disabled ? 0.5 : 1, userSelect: "none", position: "relative",
  };
  const variants = {
    primary:    { background: "var(--accent)", color: "var(--accent-fg)" },
    secondary:  { background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)" },
    ghost:      { background: "transparent", color: "var(--text-secondary)" },
    destructive:{ background: "var(--negative)", color: "#fff" },
  };
  const hoverBg = {
    primary: "var(--accent-hover)", secondary: "var(--surface-hover)",
    ghost: "var(--surface-hover)", destructive: "color-mix(in srgb, var(--negative) 88%, #000)",
  };
  const [hov, setHov] = useState(false);
  const vs = variants[variant];
  const bg = hov && !disabled && !loading ? (hoverBg[variant] || vs.background) : vs.background;
  return (
    <button {...rest} disabled={disabled || loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="focus-ring"
      style={{ ...base, ...vs, background: bg, ...style }}>
      {loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
      {!loading && icon && <Icon name={icon} size={size === "sm" ? 15 : 16} />}
      {children}
      {!loading && iconRight && <Icon name={iconRight} size={size === "sm" ? 15 : 16} />}
    </button>
  );
}

function IconButton({ icon, size = 34, active, title, badge, style, ...rest }) {
  const [hov, setHov] = useState(false);
  return (
    <button {...rest} title={title} aria-label={title} className="focus-ring"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--r-md)", border: "1px solid transparent", cursor: "pointer", position: "relative",
        background: active ? "var(--accent-tint)" : hov ? "var(--surface-hover)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        transition: "background var(--dur-fast)", ...style,
      }}>
      <Icon name={icon} size={18} />
      {badge ? <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: 99, background: "var(--negative)", boxShadow: "0 0 0 2px var(--surface)" }} /> : null}
    </button>
  );
}

/* ---------------- Field / Input / Select / Textarea ---------------- */
function Field({ label, hint, error, children, style }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && <span className="t-body-m" style={{ color: "var(--text-secondary)" }}>{label}</span>}
      {children}
      {error ? <span className="t-small" style={{ color: "var(--negative)" }}>{error}</span>
        : hint ? <span className="t-small" style={{ color: "var(--text-muted)" }}>{hint}</span> : null}
    </label>
  );
}

function inputBase(error, focus) {
  return {
    height: 38, width: "100%", padding: "0 12px", borderRadius: "var(--r-sm)",
    border: `1px solid ${error ? "var(--negative)" : focus ? "var(--border-strong)" : "var(--border)"}`,
    background: "var(--surface)", color: "var(--text)", fontSize: 14, outline: "none",
    boxShadow: focus && !error ? "0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent)" : error && focus ? "0 0 0 3px color-mix(in srgb, var(--negative) 18%, transparent)" : "none",
    transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
  };
}

function Input({ error, prefix, suffix, style, className, ...rest }) {
  const [focus, setFocus] = useState(false);
  if (prefix || suffix) {
    return (
      <div style={{ display: "flex", alignItems: "center", ...inputBase(error, focus), padding: 0, overflow: "hidden" }}>
        {prefix && <span className="t-body" style={{ paddingLeft: 12, color: "var(--text-muted)" }}>{prefix}</span>}
        <input {...rest} onFocus={(e) => { setFocus(true); rest.onFocus && rest.onFocus(e); }} onBlur={(e) => { setFocus(false); rest.onBlur && rest.onBlur(e); }}
          style={{ border: "none", outline: "none", background: "transparent", color: "var(--text)", height: "100%", flex: 1, padding: "0 12px", fontSize: 14, ...style }} />
        {suffix && <span className="t-body" style={{ paddingRight: 12, color: "var(--text-muted)" }}>{suffix}</span>}
      </div>
    );
  }
  return <input {...rest} onFocus={(e) => { setFocus(true); rest.onFocus && rest.onFocus(e); }} onBlur={(e) => { setFocus(false); rest.onBlur && rest.onBlur(e); }} style={{ ...inputBase(error, focus), ...style }} className={className} />;
}

function Select({ error, children, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select {...rest} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ ...inputBase(error, focus), appearance: "none", paddingRight: 34, cursor: "pointer", ...style }}>
        {children}
      </select>
      <Icon name="chevronDown" size={16} style={{ position: "absolute", right: 11, top: 11, color: "var(--text-muted)", pointerEvents: "none" }} />
    </div>
  );
}

function Textarea({ error, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  return <textarea {...rest} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
    style={{ ...inputBase(error, focus), height: "auto", minHeight: 80, padding: "10px 12px", lineHeight: "20px", resize: "vertical", ...style }} />;
}

function Switch({ checked, onChange, disabled }) {
  return (
    <button role="switch" aria-checked={checked} disabled={disabled} onClick={() => !disabled && onChange(!checked)} className="focus-ring"
      style={{ width: 38, height: 22, borderRadius: 99, border: "none", padding: 2, cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "var(--accent)" : "var(--border-strong)", transition: "background var(--dur-base)", opacity: disabled ? .5 : 1, flexShrink: 0 }}>
      <span style={{ display: "block", width: 18, height: 18, borderRadius: 99, background: "#fff",
        transform: checked ? "translateX(16px)" : "translateX(0)", transition: "transform var(--dur-base) var(--ease-out)", boxShadow: "0 1px 2px rgba(0,0,0,.3)" }} />
    </button>
  );
}

/* ---------------- Badge / Chip ---------------- */
function Badge({ tone = "neutral", icon, children, style }) {
  const tones = {
    neutral:  { bg: "var(--surface-hover)", fg: "var(--text-secondary)" },
    accent:   { bg: "var(--accent-tint)", fg: "var(--accent)" },
    positive: { bg: "var(--positive-tint)", fg: "var(--positive)" },
    negative: { bg: "var(--negative-tint)", fg: "var(--negative)" },
    warning:  { bg: "var(--warning-tint)", fg: "var(--warning)" },
    info:     { bg: "color-mix(in srgb, var(--info) 14%, transparent)", fg: "var(--info)" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 22, padding: "0 8px",
      borderRadius: "var(--r-sm)", background: t.bg, color: t.fg, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", ...style }}>
      {icon && <Icon name={icon} size={12} stroke={2} />}{children}
    </span>
  );
}

// status -> tone mapping for clients
const STATUS_TONE = { Active: "positive", Prospect: "info", Completed: "accent", Inactive: "neutral",
  Paid: "positive", Sent: "info", Draft: "neutral", Overdue: "negative", Outstanding: "warning" };

function FilterChip({ active, onClick, children, count }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} className="focus-ring"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ height: 32, padding: "0 12px", borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 500, cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        border: `1px solid ${active ? "transparent" : "var(--border)"}`,
        background: active ? "var(--accent)" : hov ? "var(--surface-hover)" : "var(--surface)",
        color: active ? "var(--accent-fg)" : "var(--text-secondary)", transition: "all var(--dur-fast)" }}>
      {children}
      {count != null && <span style={{ fontSize: 11, opacity: .7 }} className="tnum">{count}</span>}
    </button>
  );
}

/* ---------------- Avatar ---------------- */
function Avatar({ name = "", size = 32, color, src, style }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: 99, flexShrink: 0,
      background: color ? `color-mix(in srgb, var(${color}) 18%, transparent)` : "var(--accent-tint)",
      color: color ? `var(${color})` : "var(--accent)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 600, letterSpacing: ".01em", ...style }}>
      {initials || "?"}
    </div>
  );
}

/* ---------------- Card / Panel ---------------- */
function Card({ children, pad = 20, hover, onClick, style }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
        padding: pad, cursor: onClick ? "pointer" : "default",
        transition: "transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base), border-color var(--dur-base)",
        transform: hover && h ? "translateY(-2px)" : "none",
        boxShadow: hover && h ? "var(--shadow-md)" : "none",
        borderColor: hover && h ? "var(--border-strong)" : "var(--border)", ...style }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, action, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <div className="t-h3">{title}</div>
        {sub && <div className="t-small text-muted" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Stat card ---------------- */
function DeltaChip({ value }) {
  const up = value >= 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600,
      color: up ? "var(--positive)" : "var(--negative)" }} className="tnum">
      <Icon name={up ? "arrowUp" : "arrowDown"} size={12} stroke={2.5} />{Math.abs(value)}%
    </span>
  );
}

function StatCard({ label, value, delta, tone, sub, sparkline, onClick, icon, animateFrom }) {
  const valColor = tone === "positive" ? "var(--positive)" : tone === "negative" ? "var(--negative)" : "var(--text)";
  return (
    <Card pad={20} hover={!!onClick} onClick={onClick} style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="t-caption text-muted">{label}</span>
        {icon && <span style={{ color: "var(--text-muted)" }}><Icon name={icon} size={16} /></span>}
      </div>
      <div className="t-display tnum" style={{ color: valColor }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 18 }}>
        {delta != null && <DeltaChip value={delta} />}
        {sub && <span className="t-small text-muted">{sub}</span>}
      </div>
      {sparkline}
    </Card>
  );
}

/* ---------------- Segmented control ---------------- */
function Segmented({ options, value, onChange, size = "md" }) {
  const h = size === "sm" ? 32 : 36;
  return (
    <div style={{ display: "inline-flex", padding: 3, gap: 2, background: "var(--surface-hover)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const lab = typeof o === "string" ? o : o.label;
        const active = val === value;
        return (
          <button key={val} onClick={() => onChange(val)} className="focus-ring"
            style={{ height: h - 6, padding: "0 14px", borderRadius: "calc(var(--r-md) - 3px)", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, transition: "all var(--dur-fast)",
              background: active ? "var(--surface)" : "transparent", color: active ? "var(--text)" : "var(--text-secondary)",
              boxShadow: active ? "var(--shadow-sm)" : "none" }}>
            {lab}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Modal ---------------- */
function Modal({ open, onClose, title, children, footer, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "color-mix(in srgb, var(--bg) 55%, rgba(0,0,0,.55))",
      backdropFilter: "blur(2px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "8vh 20px 20px", animation: "fl-fade var(--dur-base)" }}>
      <div onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        style={{ width: "100%", maxWidth: width, background: "var(--surface-elevated)", borderRadius: "var(--r-lg)",
          border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", animation: "fl-rise var(--dur-slow) var(--ease-out)", maxHeight: "84vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <span className="t-h3">{title}</span>
          <IconButton icon="x" title="Close" onClick={onClose} />
        </div>
        <div style={{ padding: 20, overflowY: "auto" }}>{children}</div>
        {footer && <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Drawer (right) ---------------- */
function Drawer({ open, onClose, title, children, footer, width = 440 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "color-mix(in srgb, var(--bg) 50%, rgba(0,0,0,.5))", display: "flex", justifyContent: "flex-end", animation: "fl-fade var(--dur-base)" }}>
      <div onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        style={{ width: "100%", maxWidth: width, height: "100%", background: "var(--surface)", borderLeft: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)", animation: "fl-slide-right var(--dur-slow) var(--ease-out)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <span className="t-h3">{title}</span>
          <IconButton icon="x" title="Close" onClick={onClose} />
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div>
        {footer && <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Dropdown menu ---------------- */
function Menu({ trigger, items, align = "right", width = 180 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", [align]: 0, zIndex: 60, minWidth: width,
          background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-md)",
          boxShadow: "var(--shadow-lg)", padding: 6, animation: "fl-scale-in var(--dur-fast) var(--ease-out)", transformOrigin: "top " + align }}>
          {items.map((it, i) => it.divider ? <div key={i} style={{ height: 1, background: "var(--border)", margin: "6px 0" }} /> : (
            <button key={i} onClick={() => { setOpen(false); it.onClick && it.onClick(); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", border: "none", cursor: "pointer",
                background: "transparent", color: it.danger ? "var(--negative)" : "var(--text)", fontSize: 13, borderRadius: "var(--r-sm)", textAlign: "left" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              {it.icon && <Icon name={it.icon} size={15} style={{ color: it.danger ? "var(--negative)" : "var(--text-secondary)" }} />}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Empty state ---------------- */
function EmptyState({ icon = "sparkle", title, body, action, compact }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: compact ? "36px 20px" : "64px 20px", gap: 6 }}>
      <div style={{ width: 56, height: 56, borderRadius: 99, background: "var(--accent-tint)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Icon name={icon} size={26} />
      </div>
      <div className="t-h3">{title}</div>
      {body && <div className="t-body text-secondary" style={{ maxWidth: 360 }}>{body}</div>}
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  );
}

/* ---------------- Skeleton ---------------- */
function Skel({ w = "100%", h = 14, r = 8, style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/* ---------------- Toasts ---------------- */
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { id, ...t }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.duration || 4000);
  }, []);
  const api = {
    success: (msg, sub) => push({ tone: "positive", icon: "check", msg, sub }),
    error: (msg, sub) => push({ tone: "negative", icon: "alert", msg, sub }),
    info: (msg, sub) => push({ tone: "info", icon: "info", msg, sub }),
  };
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200, display: "flex", flexDirection: "column", gap: 10, width: 320 }}>
        {toasts.map((t) => {
          const c = { positive: "var(--positive)", negative: "var(--negative)", info: "var(--info)" }[t.tone];
          return (
            <div key={t.id} style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-md)",
              boxShadow: "var(--shadow-lg)", padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start", animation: "fl-rise var(--dur-base) var(--ease-out)" }}>
              <span style={{ color: c, marginTop: 1 }}><Icon name={t.icon} size={18} /></span>
              <div style={{ flex: 1 }}>
                <div className="t-body-m">{t.msg}</div>
                {t.sub && <div className="t-small text-muted" style={{ marginTop: 1 }}>{t.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
function useToast() { return useContext(ToastCtx); }

/* ---------------- Password strength ---------------- */
function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0..4
}
function StrengthMeter({ value }) {
  const s = strength(value);
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  const colors = ["var(--negative)", "var(--negative)", "var(--warning)", "var(--info)", "var(--positive)"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2, 3].map((i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < s ? colors[s] : "var(--border)", transition: "background var(--dur-base)" }} />)}
      </div>
      {value && <span className="t-small" style={{ color: colors[s] }}>{labels[s]}</span>}
    </div>
  );
}

Object.assign(window, {
  Button, IconButton, Field, Input, Select, Textarea, Switch,
  Badge, STATUS_TONE, FilterChip, Avatar, Card, SectionHeader,
  StatCard, DeltaChip, Segmented, Modal, Drawer, Menu, EmptyState, Skel,
  ToastProvider, useToast, strength, StrengthMeter,
});
