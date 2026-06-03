/* ============================================================
   FlowLedger — shared form modals + global modal manager
   openModal(kind, record?) dispatches a global event.
   kind: 'income' | 'expense' | 'client' | 'subscription'
   ============================================================ */
const { useState: useStateF, useEffect: useEffectF } = React;

function openModal(kind, record) { window.dispatchEvent(new CustomEvent("fl-modal", { detail: { kind, record } })); }
window.openModal = openModal;

/* ---------- Transaction modal ---------- */
function TransactionModal({ open, record, defaultType, onClose }) {
  const toast = useToast();
  const editing = !!record;
  const [type, setType] = useStateF("income");
  const [name, setName] = useStateF("");
  const [amount, setAmount] = useStateF("");
  const [date, setDate] = useStateF(FL.iso(FL.TODAY));
  const [cat, setCat] = useStateF("");
  const [notes, setNotes] = useStateF("");
  const [saving, setSaving] = useStateF(false);
  const [err, setErr] = useStateF({});

  useEffectF(() => {
    if (!open) return;
    if (record) {
      setType(record.type); setName(record.name); setAmount(String(record.amount));
      setDate(FL.iso(record.date)); setCat(record.category); setNotes(record.notes || "");
    } else {
      setType(defaultType || "income"); setName(""); setAmount(""); setDate(FL.iso(FL.TODAY));
      setCat((defaultType || "income") === "income" ? "Client work" : "Tools"); setNotes("");
    }
    setErr({});
  }, [open, record, defaultType]);

  const cats = FL.CATEGORIES[type] || [];
  const isAuto = record && record.auto;

  const submit = () => {
    const e = {};
    if (!name.trim()) e.name = "Description is required";
    if (!amount || isNaN(+amount) || +amount <= 0) e.amount = "Enter an amount greater than 0";
    setErr(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    setTimeout(() => { setSaving(false); onClose(); toast.success(editing ? "Transaction updated" : (type === "income" ? "Revenue added" : "Expense logged"), name + " · " + FL.money(+amount, 2)); }, 650);
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit transaction" : "Add transaction"} width={480}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={saving}>{editing ? "Save changes" : "Add transaction"}</Button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* type toggle */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {["income", "expense"].map((tp) => {
            const active = type === tp;
            const col = tp === "income" ? "var(--positive)" : "var(--negative)";
            return (
              <button key={tp} onClick={() => { setType(tp); setCat(FL.CATEGORIES[tp][0]); }}
                style={{ height: 44, borderRadius: "var(--r-md)", cursor: "pointer", fontWeight: 600, fontSize: 14, textTransform: "capitalize",
                  border: `1.5px solid ${active ? col : "var(--border)"}`,
                  background: active ? (tp === "income" ? "var(--positive-tint)" : "var(--negative-tint)") : "var(--surface)",
                  color: active ? col : "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all var(--dur-fast)" }}>
                <Icon name={tp === "income" ? "trendUp" : "receipt"} size={16} />{tp === "income" ? "Income" : "Expense"}
              </button>
            );
          })}
        </div>
        {isAuto && (
          <div style={{ display: "flex", gap: 10, padding: 12, borderRadius: "var(--r-md)", background: "var(--warning-tint)", border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)" }}>
            <Icon name="alert" size={16} style={{ color: "var(--warning)", marginTop: 1, flexShrink: 0 }} />
            <span className="t-small" style={{ color: "var(--text-secondary)" }}>This was generated from a recurring source. Saving an edit will mark it as <b style={{ color: "var(--text)" }}>Edited</b>.</span>
          </div>
        )}
        <Field label="Description" error={err.name}><Input value={name} error={err.name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Northwind retainer" autoFocus /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Amount" error={err.amount}><Input value={amount} error={err.amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" inputMode="decimal" prefix={FL.CURRENCIES[FL.getCurrency()].symbol} className="tnum" /></Field>
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="tnum" /></Field>
        </div>
        <Field label="Category"><Select value={cat} onChange={(e) => setCat(e.target.value)}>{cats.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
        <Field label="Notes" hint="Optional"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context…" /></Field>
      </div>
    </Modal>
  );
}

/* ---------- Client modal ---------- */
function ClientModal({ open, record, onClose }) {
  const toast = useToast();
  const editing = !!record;
  const [f, setF] = useStateF({});
  const [saving, setSaving] = useStateF(false);
  const [err, setErr] = useStateF({});
  useEffectF(() => {
    if (!open) return;
    setF(record ? { ...record, payDate: record.nextBilling ? FL.iso(record.nextBilling) : "" } : { name: "", company: "", email: "", type: "Company", status: "Active", payType: "Retainer", amount: "", billingDay: 1, payDate: "" });
    setErr({});
  }, [open, record]);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => {
    const e = {};
    if (!f.name?.trim()) e.name = "Name is required";
    if (!f.amount || isNaN(+f.amount) || +f.amount <= 0) e.amount = "Enter an amount";
    setErr(e); if (Object.keys(e).length) return;
    setSaving(true); setTimeout(() => { setSaving(false); onClose(); toast.success(editing ? "Client updated" : "Client added", f.name); }, 650);
  };
  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit client" : "Add client"} width={480}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={saving}>{editing ? "Save changes" : "Add client"}</Button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Name" error={err.name}><Input value={f.name || ""} error={err.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" autoFocus /></Field>
          <Field label="Company"><Input value={f.company || ""} onChange={(e) => set("company", e.target.value)} placeholder="Optional" /></Field>
        </div>
        <Field label="Email"><Input type="email" value={f.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="name@company.com" prefix="" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Client type"><Select value={f.type} onChange={(e) => set("type", e.target.value)}><option>Company</option><option>Individual</option></Select></Field>
          <Field label="Status"><Select value={f.status} onChange={(e) => set("status", e.target.value)}><option>Active</option><option>Prospect</option><option>Completed</option><option>Inactive</option></Select></Field>
        </div>
        <Field label="Payment type">
          <Segmented options={[{ value: "Retainer", label: "Retainer" }, { value: "One-time", label: "One-time" }]} value={f.payType} onChange={(v) => set("payType", v)} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={f.payType === "Retainer" ? "Monthly amount" : "Amount"} error={err.amount}><Input value={f.amount || ""} error={err.amount} onChange={(e) => set("amount", e.target.value)} prefix={FL.CURRENCIES[FL.getCurrency()].symbol} suffix={f.payType === "Retainer" ? "/mo" : ""} className="tnum" placeholder="0" /></Field>
          {f.payType === "Retainer"
            ? <Field label="Next billing"><Input type="date" value={f.payDate} onChange={(e) => set("payDate", e.target.value)} className="tnum" /></Field>
            : <Field label="Payment date"><Input type="date" value={f.payDate} onChange={(e) => set("payDate", e.target.value)} className="tnum" /></Field>}
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Subscription modal ---------- */
function SubscriptionModal({ open, record, onClose }) {
  const toast = useToast();
  const editing = !!record;
  const [f, setF] = useStateF({});
  const [saving, setSaving] = useStateF(false);
  const [err, setErr] = useStateF({});
  useEffectF(() => {
    if (!open) return;
    setF(record ? { ...record, nb: record.nextBilling ? FL.iso(record.nextBilling) : "" } : { name: "", amount: "", cycle: "Monthly", nb: FL.iso(FL.TODAY), status: "Active", notes: "" });
    setErr({});
  }, [open, record]);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => {
    const e = {};
    if (!f.name?.trim()) e.name = "Name is required";
    if (!f.amount || isNaN(+f.amount) || +f.amount <= 0) e.amount = "Enter an amount";
    setErr(e); if (Object.keys(e).length) return;
    setSaving(true); setTimeout(() => { setSaving(false); onClose(); toast.success(editing ? "Subscription updated" : "Subscription added", f.name); }, 650);
  };
  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit subscription" : "Add subscription"} width={480}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={saving}>{editing ? "Save changes" : "Add subscription"}</Button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Name" error={err.name}><Input value={f.name || ""} error={err.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Figma" autoFocus /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Amount" error={err.amount}><Input value={f.amount || ""} error={err.amount} onChange={(e) => set("amount", e.target.value)} prefix={FL.CURRENCIES[FL.getCurrency()].symbol} className="tnum" placeholder="0" /></Field>
          <Field label="Billing cycle"><Select value={f.cycle} onChange={(e) => set("cycle", e.target.value)}><option>Monthly</option><option>Quarterly</option><option>Yearly</option></Select></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Next billing"><Input type="date" value={f.nb} onChange={(e) => set("nb", e.target.value)} className="tnum" /></Field>
          <Field label="Status"><Select value={f.status} onChange={(e) => set("status", e.target.value)}><option>Active</option><option>Inactive</option></Select></Field>
        </div>
        <Field label="Notes" hint="Optional"><Textarea value={f.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Plan details…" /></Field>
      </div>
    </Modal>
  );
}

/* ---------- Confirm dialog (archive vs delete) ---------- */
function ConfirmDialog({ open, onClose, title, body, impact, confirmLabel = "Delete", onConfirm, archiveLabel, onArchive, tone = "destructive" }) {
  const [busy, setBusy] = useStateF(false);
  return (
    <Modal open={open} onClose={onClose} title={title} width={460}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        {archiveLabel && <Button variant="secondary" onClick={() => { onArchive && onArchive(); onClose(); }}>{archiveLabel}</Button>}
        <Button variant={tone} loading={busy} onClick={() => { setBusy(true); setTimeout(() => { setBusy(false); onConfirm && onConfirm(); onClose(); }, 500); }}>{confirmLabel}</Button>
      </>}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 99, background: "var(--negative-tint)", color: "var(--negative)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="alert" size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="t-body" style={{ color: "var(--text-secondary)" }}>{body}</div>
          {impact && <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: "var(--r-sm)", background: "var(--surface-hover)" }} className="t-small text-secondary"><Icon name="info" size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />{impact}</div>}
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Global manager ---------- */
function GlobalModals() {
  const [state, setState] = useStateF({ kind: null, record: null });
  useEffectF(() => {
    const h = (e) => setState({ kind: e.detail.kind, record: e.detail.record || null });
    window.addEventListener("fl-modal", h);
    const legacy = (e) => setState({ kind: e.detail, record: null });
    window.addEventListener("fl-new", legacy);
    return () => { window.removeEventListener("fl-modal", h); window.removeEventListener("fl-new", legacy); };
  }, []);
  const close = () => setState({ kind: null, record: null });
  const k = state.kind;
  return (
    <>
      <TransactionModal open={k === "income" || k === "expense" || k === "transaction"} defaultType={k === "expense" ? "expense" : "income"} record={k === "transaction" ? state.record : (state.record && (k === "income" || k === "expense") ? state.record : null)} onClose={close} />
      <ClientModal open={k === "client"} record={state.record} onClose={close} />
      <SubscriptionModal open={k === "subscription"} record={state.record} onClose={close} />
    </>
  );
}

Object.assign(window, { TransactionModal, ClientModal, SubscriptionModal, ConfirmDialog, GlobalModals, openModal });
