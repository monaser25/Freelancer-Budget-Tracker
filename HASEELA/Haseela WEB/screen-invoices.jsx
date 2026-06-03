/* ============================================================
   FlowLedger — Invoices (§6.10–6.12)
   list · create/edit (two-pane) · detail/preview
   ============================================================ */
window.SCREENS = window.SCREENS || {};
const { useState: useStateInv, useMemo: useMemoInv } = React;

function invStatusTone(s) { return STATUS_TONE[s] || "neutral"; }
function invTotal(inv) { const sub = inv.items.reduce((a, it) => a + it.qty * it.rate, 0); return sub + (inv.tax || 0); }

/* ---------- router for the invoices section ---------- */
function Invoices() {
  const { route } = useApp();
  const param = route.param;
  if (param === "new") return <InvoiceEditor />;
  if (param) {
    const inv = FL.invoices.find((i) => i.id === param);
    if (inv) return <InvoiceDetail inv={inv} />;
  }
  return <InvoiceList />;
}

/* ---------- list ---------- */
function InvoiceList() {
  const [filter, setFilter] = useStateInv("All");
  const toast = useToast();
  const invoices = FL.invoices;
  const outstanding = invoices.filter((i) => i.status === "Sent" || i.status === "Overdue").reduce((a, i) => a + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "Overdue").reduce((a, i) => a + i.amount, 0);
  const paidMonth = invoices.filter((i) => i.status === "Paid" && i.issue.getMonth() === 4).reduce((a, i) => a + i.amount, 0);
  const FILTERS = ["All", "Draft", "Sent", "Paid", "Overdue"];
  const rows = filter === "All" ? invoices : invoices.filter((i) => i.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button icon="plus" onClick={() => nav("invoices/new")}>New invoice</Button>
      </div>
      <div className="fl-statgrid3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        <StatCard label="Outstanding" value={FL.money(outstanding)} icon="clock" sub={`${invoices.filter((i) => i.status === "Sent" || i.status === "Overdue").length} unpaid`} />
        <StatCard label="Overdue" value={FL.money(overdue)} tone="negative" icon="alert" sub={`${invoices.filter((i) => i.status === "Overdue").length} invoice`} />
        <StatCard label="Paid in May" value={FL.money(paidMonth)} tone="positive" icon="check" />
      </div>

      <div style={{ display: "flex", gap: 8 }}>{FILTERS.map((f) => <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)} count={f === "All" ? invoices.length : invoices.filter((i) => i.status === f).length}>{f}</FilterChip>)}</div>

      <Card pad={0}>
        {rows.length === 0 ? <EmptyState icon="invoices" title="No invoices here" body="Create your first invoice to bill a client and track payment." action={<Button icon="plus" onClick={() => nav("invoices/new")}>Create your first invoice</Button>} />
          : <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead><tr>
                {["Invoice", "Client", "Issued", "Due", "Status", "Amount", ""].map((h, i) => (
                  <th key={h + i} style={{ padding: "12px 16px", textAlign: i === 5 ? "right" : "left", position: "sticky", top: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <span className="t-caption text-muted">{h}</span>
                  </th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((inv) => {
                  const od = inv.status === "Overdue";
                  return (
                    <tr key={inv.id} className="fl-trow" style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }} onClick={() => nav("invoices/" + inv.id)}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "13px 16px" }}><span className="t-body-m tnum">{inv.id}</span></td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={inv.client} size={28} />
                          <div><div className="t-body-m">{inv.client}</div>{inv.company !== "—" && <div className="t-small text-muted">{inv.company}</div>}</div>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}><span className="t-body tnum text-secondary">{FL.fmtDate(inv.issue)}</span></td>
                      <td style={{ padding: "13px 16px" }}><span className="t-body tnum" style={{ color: od ? "var(--negative)" : "var(--text-secondary)" }}>{FL.fmtDate(inv.due)}</span></td>
                      <td style={{ padding: "13px 16px" }}><Badge tone={invStatusTone(inv.status)} icon={od ? "alert" : null}>{inv.status}</Badge></td>
                      <td style={{ padding: "13px 16px", textAlign: "right" }}><span className="t-body-m tnum">{FL.money(inv.amount)}</span></td>
                      <td style={{ padding: "0 10px 0 0" }} onClick={(e) => e.stopPropagation()}>
                        <div className="fl-rowactions" style={{ display: "flex", gap: 2, justifyContent: "flex-end", opacity: 0, transition: "opacity var(--dur-fast)" }}>
                          <Menu align="right" trigger={<IconButton icon="more" size={30} title="Actions" />} items={[
                            { icon: "eye", label: "View", onClick: () => nav("invoices/" + inv.id) },
                            inv.status !== "Paid" ? { icon: "send", label: "Send" } : null,
                            inv.status !== "Paid" ? { icon: "check", label: "Mark paid", onClick: () => toast.success("Invoice marked paid", inv.id) } : null,
                            { icon: "download", label: "Download PDF" },
                            { divider: true },
                            { icon: "trash", label: "Delete", danger: true, onClick: () => toast.success("Invoice deleted", inv.id) },
                          ].filter(Boolean)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>}
      </Card>
    </div>
  );
}

/* ---------- shared invoice document preview ---------- */
function InvoiceDoc({ inv, items, client, company, issue, due, notes }) {
  const its = items || inv.items;
  const sub = its.reduce((a, it) => a + (it.qty || 0) * (it.rate || 0), 0);
  return (
    <div style={{ background: "#fff", color: "#18181B", borderRadius: "var(--r-md)", padding: 36, boxShadow: "var(--shadow-md)", minHeight: 540 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#6D5EFC", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="wallet" size={16} style={{ color: "#fff" }} /></div>
            <span style={{ fontSize: 15, fontWeight: 600 }}>FlowLedger</span>
          </div>
          <div style={{ fontSize: 12, color: "#71717A", lineHeight: "18px" }}>Maya Okonkwo<br />maya@okonkwo.design</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>Invoice</div>
          <div className="tnum" style={{ fontSize: 13, color: "#71717A", marginTop: 4 }}>{(inv && inv.id) || "INV-XXXX"}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#A1A1AA", marginBottom: 6 }}>Bill to</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{client || "Client name"}</div>
          <div style={{ fontSize: 13, color: "#71717A" }}>{company && company !== "—" ? company : ""}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 13 }}>
          <div style={{ marginBottom: 4 }}><span style={{ color: "#A1A1AA" }}>Issued </span><span className="tnum">{issue ? FL.fmtDate(issue) : "—"}</span></div>
          <div><span style={{ color: "#A1A1AA" }}>Due </span><span className="tnum">{due ? FL.fmtDate(due) : "—"}</span></div>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ borderBottom: "1px solid #E7E7EC" }}>
          <th style={{ textAlign: "left", padding: "8px 0", color: "#A1A1AA", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>Description</th>
          <th style={{ textAlign: "right", padding: "8px 0", color: "#A1A1AA", fontWeight: 500, fontSize: 11, textTransform: "uppercase", width: 50 }}>Qty</th>
          <th style={{ textAlign: "right", padding: "8px 0", color: "#A1A1AA", fontWeight: 500, fontSize: 11, textTransform: "uppercase", width: 90 }}>Rate</th>
          <th style={{ textAlign: "right", padding: "8px 0", color: "#A1A1AA", fontWeight: 500, fontSize: 11, textTransform: "uppercase", width: 90 }}>Amount</th>
        </tr></thead>
        <tbody>
          {its.map((it, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #F4F4F6" }}>
              <td style={{ padding: "11px 0" }}>{it.desc || "—"}</td>
              <td className="tnum" style={{ textAlign: "right" }}>{it.qty}</td>
              <td className="tnum" style={{ textAlign: "right" }}>{FL.money(it.rate)}</td>
              <td className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>{FL.money((it.qty || 0) * (it.rate || 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <div style={{ width: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#52525B" }}><span>Subtotal</span><span className="tnum">{FL.money(sub)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#52525B" }}><span>Tax</span><span className="tnum">{FL.money(0)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", marginTop: 4, borderTop: "2px solid #18181B", fontSize: 16, fontWeight: 600 }}><span>Total</span><span className="tnum">{FL.money(sub)}</span></div>
        </div>
      </div>
      {notes && <div style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid #E7E7EC", fontSize: 12, color: "#71717A" }}>{notes}</div>}
    </div>
  );
}

/* ---------- create / edit ---------- */
function InvoiceEditor() {
  const toast = useToast();
  const [client, setClient] = useStateInv("");
  const [items, setItems] = useStateInv([{ desc: "", qty: 1, rate: "" }]);
  const [issue, setIssue] = useStateInv(FL.iso(FL.TODAY));
  const [due, setDue] = useStateInv(FL.iso(new Date(2026, 5, 17)));
  const [notes, setNotes] = useStateInv("Payment due within 14 days. Thank you!");
  const [saving, setSaving] = useStateInv(false);
  const clientObj = FL.clients.find((c) => c.name === client);

  const setItem = (i, patch) => setItems((its) => its.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const addItem = () => setItems((its) => [...its, { desc: "", qty: 1, rate: "" }]);
  const rmItem = (i) => setItems((its) => its.filter((_, idx) => idx !== i));
  const itemsNum = items.map((it) => ({ ...it, qty: +it.qty || 0, rate: +it.rate || 0 }));

  const save = (action) => { setSaving(action); setTimeout(() => { setSaving(false); toast.success(action === "send" ? "Invoice sent" : "Draft saved", client || "New invoice"); nav("invoices"); }, 800); };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Button variant="ghost" icon="chevronLeft" onClick={() => nav("invoices")}>Invoices</Button>
        <div style={{ flex: 1 }} />
        <Button variant="secondary" icon="download">Download PDF</Button>
        <Button variant="secondary" loading={saving === "draft"} onClick={() => save("draft")}>Save draft</Button>
        <Button icon="send" loading={saving === "send"} onClick={() => save("send")}>Send invoice</Button>
      </div>

      <div className="fl-invoice-2pane" style={{ display: "grid", gridTemplateColumns: "minmax(0,420px) 1fr", gap: 20, alignItems: "start" }}>
        {/* form */}
        <Card pad={22} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <SectionHeader title="Invoice details" />
          <Field label="Client"><Select value={client} onChange={(e) => setClient(e.target.value)}><option value="">Select a client…</option>{FL.clients.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.name}>{c.name}{c.company ? ` · ${c.company}` : ""}</option>)}</Select></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Issue date"><Input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} className="tnum" /></Field>
            <Field label="Due date"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="tnum" /></Field>
          </div>
          <div>
            <div className="t-body-m text-secondary" style={{ marginBottom: 10 }}>Line items</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 48px 80px 28px", gap: 8, alignItems: "center" }}>
                  <Input value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })} placeholder="Description" />
                  <Input value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} className="tnum" style={{ textAlign: "center" }} />
                  <Input value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} placeholder="0" className="tnum" />
                  <IconButton icon="x" size={28} title="Remove" onClick={() => rmItem(i)} style={{ visibility: items.length > 1 ? "visible" : "hidden" }} />
                </div>
              ))}
            </div>
            <Button variant="ghost" icon="plus" size="sm" onClick={addItem} style={{ marginTop: 8 }}>Add line item</Button>
          </div>
          <Field label="Notes / terms"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </Card>

        {/* live preview */}
        <div style={{ position: "sticky", top: 16 }}>
          <div className="t-caption text-muted" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Icon name="eye" size={13} /> Live preview</div>
          <InvoiceDoc inv={null} items={itemsNum} client={client} company={clientObj?.company} issue={new Date(issue)} due={new Date(due)} notes={notes} />
        </div>
      </div>
    </div>
  );
}

/* ---------- detail ---------- */
function InvoiceDetail({ inv }) {
  const toast = useToast();
  const [status, setStatus] = useStateInv(inv.status);
  const timeline = [
    { label: "Created", date: inv.issue, done: true },
    { label: "Sent to client", date: inv.issue, done: status !== "Draft" },
    { label: "Paid", date: inv.due, done: status === "Paid" },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Button variant="ghost" icon="chevronLeft" onClick={() => nav("invoices")}>Invoices</Button>
        <span className="t-h3 tnum">{inv.id}</span>
        <Badge tone={invStatusTone(status)}>{status}</Badge>
        <div style={{ flex: 1 }} />
        <Button variant="secondary" icon="download">Download</Button>
        {status !== "Paid" && <Button icon="check" onClick={() => { setStatus("Paid"); toast.success("Marked paid", `${inv.id} · a ${FL.money(inv.amount)} income transaction was created.`); }}>Mark paid</Button>}
      </div>
      <div className="fl-invoice-2pane" style={{ display: "grid", gridTemplateColumns: "1fr minmax(0,320px)", gap: 20, alignItems: "start" }}>
        <InvoiceDoc inv={inv} client={inv.client} company={inv.company} issue={inv.issue} due={inv.due} notes={inv.notes} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 16 }}>
          <Card pad={20}>
            <div className="t-caption text-muted" style={{ marginBottom: 14 }}>Status timeline</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {timeline.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 99, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.done ? "var(--positive)" : "var(--surface-hover)", color: t.done ? "#fff" : "var(--text-muted)" }}>{t.done ? <Icon name="check" size={12} stroke={3} /> : <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--text-muted)" }} />}</div>
                    {i < timeline.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 22, background: t.done ? "var(--positive)" : "var(--border)" }} />}
                  </div>
                  <div style={{ paddingBottom: 14 }}><div className="t-body-m">{t.label}</div><div className="t-small text-muted tnum">{t.done ? FL.fmtDate(t.date) : "Pending"}</div></div>
                </div>
              ))}
            </div>
          </Card>
          <Card pad={20}>
            <div className="t-caption text-muted" style={{ marginBottom: 12 }}>Client</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={inv.client} size={38} />
              <div><div className="t-body-m">{inv.client}</div>{inv.company !== "—" && <div className="t-small text-muted">{inv.company}</div>}</div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <span className="t-small text-muted">Amount due</span><span className="t-h3 tnum">{FL.money(inv.amount)}</span>
            </div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {status !== "Paid" && <Button variant="secondary" icon="send" style={{ justifyContent: "center" }} onClick={() => toast.success("Invoice sent", inv.client)}>Send to client</Button>}
            <Button variant="secondary" icon="invoices" style={{ justifyContent: "center" }} onClick={() => toast.success("Invoice duplicated")}>Duplicate</Button>
            <Button variant="ghost" icon="trash" style={{ justifyContent: "center", color: "var(--negative)" }} onClick={() => { toast.success("Invoice deleted", inv.id); nav("invoices"); }}>Delete invoice</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SCREENS.invoices = Invoices;
