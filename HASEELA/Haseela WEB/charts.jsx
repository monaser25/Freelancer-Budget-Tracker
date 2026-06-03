/* ============================================================
   FlowLedger — charts (hand-built SVG, real rendering)
   BarChart (grouped), DonutChart, HBarChart, Sparkline
   ============================================================ */
const { useState: useStateC, useRef: useRefC, useEffect: useEffectC } = React;

function useTip() {
  const [tip, setTip] = useStateC(null); // {x,y,content}
  return [tip, setTip];
}

function TipBox({ tip, host }) {
  if (!tip) return null;
  return (
    <div style={{ position: "absolute", left: tip.x, top: tip.y, transform: "translate(-50%,-100%)", marginTop: -8,
      pointerEvents: "none", background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
      boxShadow: "var(--shadow-lg)", padding: "8px 10px", whiteSpace: "nowrap", zIndex: 20, animation: "fl-fade 80ms" }}>
      {tip.content}
    </div>
  );
}

/* ---------- Grouped bar: income vs expense ---------- */
function BarChart({ data, height = 240, currency }) {
  const [tip, setTip] = useTip();
  const ref = useRefC(null);
  const [w, setW] = useStateC(640);
  useEffectC(() => {
    const ro = new ResizeObserver((es) => setW(es[0].contentRect.width));
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  if (!data || data.length === 0) return <ChartEmpty height={height} />;
  const max = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);
  const padL = 48, padB = 26, padT = 10;
  const plotH = height - padB - padT;
  const plotW = w - padL - 8;
  const groupW = plotW / data.length;
  const barW = Math.min(18, groupW / 3.2);
  const gap = 5;
  const ticks = 4;
  const niceMax = Math.ceil(max / 1000) * 1000;
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <svg width="100%" height={height} style={{ display: "block", overflow: "visible" }}>
        {/* grid + y labels */}
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = (niceMax / ticks) * i;
          const y = padT + plotH - (v / niceMax) * plotH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={w - 8} y2={y} stroke="var(--border)" strokeDasharray={i === 0 ? "0" : "3 4"} />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)" className="tnum">
                {v >= 1000 ? (v / 1000) + "k" : v}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const gx = padL + groupW * i + groupW / 2;
          const incH = (d.income / niceMax) * plotH;
          const expH = (d.expense / niceMax) * plotH;
          const baseY = padT + plotH;
          const onEnter = (e, type, val) => {
            const r = ref.current.getBoundingClientRect();
            setTip({ x: e.clientX - r.left, y: e.clientY - r.top, content: (
              <div>
                <div className="t-micro text-muted" style={{ marginBottom: 2 }}>{d.label} · {type}</div>
                <div className="t-body-m tnum" style={{ color: type === "Income" ? "var(--positive)" : "var(--negative)" }}>{FL.money(val)}</div>
              </div>
            ) });
          };
          return (
            <g key={i}>
              <rect x={gx - barW - gap / 2} y={baseY - incH} width={barW} height={incH} rx="3" fill="var(--positive)"
                style={{ transition: "height var(--dur-slow) var(--ease-out)", cursor: "pointer" }}
                onMouseMove={(e) => onEnter(e, "Income", d.income)} onMouseLeave={() => setTip(null)} />
              <rect x={gx + gap / 2} y={baseY - expH} width={barW} height={expH} rx="3" fill="var(--negative)"
                style={{ transition: "height var(--dur-slow) var(--ease-out)", cursor: "pointer" }}
                onMouseMove={(e) => onEnter(e, "Expense", d.expense)} onMouseLeave={() => setTip(null)} />
              <text x={gx} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--text-muted)">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <TipBox tip={tip} />
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
        <Legend color="var(--positive)" label="Income" />
        <Legend color="var(--negative)" label="Expenses" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
    <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />{label}
  </span>;
}

/* ---------- Donut ---------- */
function DonutChart({ data, size = 200, thickness = 26, centerLabel, centerValue }) {
  const [tip, setTip] = useTip();
  const [hi, setHi] = useStateC(-1);
  const ref = useRefC(null);
  if (!data || data.length === 0) return <ChartEmpty height={size} />;
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div ref={ref} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * C;
          const off = acc * C;
          acc += frac;
          const col = d.color ? `var(${d.color})` : `var(--viz-${(i % 7) + 1})`;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={hi === i ? thickness + 4 : thickness}
              strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-off} strokeLinecap="butt"
              style={{ transition: "stroke-width var(--dur-fast)", cursor: "pointer", opacity: hi === -1 || hi === i ? 1 : 0.45 }}
              onMouseMove={(e) => { const rr = ref.current.getBoundingClientRect(); setHi(i); setTip({ x: e.clientX - rr.left, y: e.clientY - rr.top, content: (
                <div><div className="t-micro text-muted">{d.name}</div><div className="t-body-m tnum">{FL.money(d.value)} · {Math.round(frac * 100)}%</div></div>
              ) }); }}
              onMouseLeave={() => { setHi(-1); setTip(null); }} />
          );
        })}
      </svg>
      {(centerValue != null) && (
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div className="t-caption text-muted">{centerLabel}</div>
          <div className="t-h2 tnum" style={{ marginTop: 2 }}>{centerValue}</div>
        </div>
      )}
      <TipBox tip={tip} />
    </div>
  );
}

/* ---------- Horizontal bars ---------- */
function HBarChart({ data, currency, maxRows }) {
  const rows = maxRows ? data.slice(0, maxRows) : data;
  if (!rows || rows.length === 0) return <ChartEmpty height={120} />;
  const max = Math.max(...rows.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((d, i) => {
        const col = d.color ? `var(${d.color})` : `var(--viz-${(i % 7) + 1})`;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="t-small" style={{ color: "var(--text-secondary)" }}>{d.name}</span>
              <span className="t-small tnum" style={{ fontWeight: 600 }}>{FL.money(d.value)}</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: "var(--surface-hover)", overflow: "hidden" }}>
              <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", borderRadius: 99, background: col, transition: "width var(--dur-slow) var(--ease-out)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Sparkline ---------- */
function Sparkline({ data, width = 120, height = 36, color = "var(--positive)", fill = true }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - ((v - min) / range) * (height - 4) - 2]);
  const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = path + ` L ${width} ${height} L 0 ${height} Z`;
  const id = "sp" + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.22" /><stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  );
}

function ChartEmpty({ height }) {
  return (
    <div style={{ height, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-muted)" }}>
      <Icon name="pie" size={26} />
      <span className="t-small">No data for this period</span>
    </div>
  );
}

/* ---------- count-up hook (robust: always settles on target) ---------- */
function useCountUp(target, duration = 400, run = true) {
  const [val, setVal] = useStateC(target);
  useEffectC(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!run || reduce) { setVal(target); return; }
    let raf, start;
    setVal(0);
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // safety net: if rAF is throttled (background tab), force the final value
    const fallback = setTimeout(() => setVal(target), duration + 500);
    return () => { cancelAnimationFrame(raf); clearTimeout(fallback); };
  }, [target, run]);
  return val;
}

Object.assign(window, { BarChart, DonutChart, HBarChart, Sparkline, Legend, useCountUp });
