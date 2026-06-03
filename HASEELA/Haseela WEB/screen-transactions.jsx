/* ============================================================
   FlowLedger — Transactions ledger (§6.8)
   ============================================================ */
const { useState: useStateT, useMemo: useMemoT } = React;

function SourceChip({ t }) {
  if (t.auto) return <Badge tone="neutral" icon="refresh" style={{ height: 18, fontSize: 11 }}>Auto</Badge>;
  return null;
}

function Transactions() {
  const initial = (window.location.hash.includes("?expense")) ? "Expenses" : (window.location.hash.includes("?income")) ? "Revenue" : "All";
  const [filter, setFilter] = useStateT(initial);
  const [q, setQ] = useStateT("");
  const [sort, setSort] = useStateT({ key: "date", dir: "desc" });
  const [sel, setSel] = useStateT([]);
  const [editing, setEditing] = useStateT(null);
  const [density, setDensity] = useStateT("comfortable");
  const toast = useToast();

  const FILTERS = ["All", "Revenue", "Expenses", "Subscriptions", "Clients", "Tools", "Operations"];

  const rows = useMemoT(() => {
    let r = FL.transactions.slice();
    if (filter === "Revenue") r = r.filter((t) => t.type === "income");
    else if (filter === "Expenses") r = r.filter((t) => t.type === "expense");
    else if (filter === "Subscriptions") r = r.filter((t) => t.source === "subscription");
    else if (filter === "Clients") r = r.filter((t) => t.source === "client");
    else if (filter === "Tools" || filter === "Operations") r = r.filter((t) => t.category === filter);
    if (q) r = r.filter((t) => (t.name + t.category + t.notes).toLowerCase().includes(q.toLowerCase()));
    r.sort((a, b) => {
      let av, bv;
      if (sort.key === "date") { av = a.date; bv = b.date; }
      else if (sort.key === "amount") { av = a.type === "income" ? a.amount : -a.amount; bv = b.type === "income" ? b.amount : -b.amount; }
      else { av = a[sort.key]; bv = b[sort.key]; }
      const d = av > bv ? 1 : av < bv ? -1 : 0;
      return sort.dir === "asc" ? d : -d;
    });
    return r;
  }, [filter, q, sort]);

  const toggleSort = (key) => setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
  const allSel = sel.length > 0 && sel.length === rows.length;
  const rowPad = density === "compact" ? "8px 14px" : "13px 14px";

  const Th = ({ k, children, align }) => (
    <th onClick={k ? () => toggleSort(k) : undefined} style={{ padding: "10px 14px", textAlign: align || "left", cursor: k ? "pointer" : "default", userSelect: "none", position: "sticky", top: 0, background: "var(--surface)", zIndex: 1, borderBottom: "1px solid var(--border)" }}>
      <span className="t-caption text-muted" style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
        {children}{k && sort.key === k && <Icon name={sort.dir === "asc" ? "chevronUp" : "chevronDown"} size={12} style={{ color: "var(--accent)" }} />}
      </span>
    </th>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FILTERS.map((f) => <FilterChip key={f} active={filter === f} onClick={() => { setFilter(f); setSel([]); }}>{f}</FilterChip>)}
        </div>
        <Button icon="plus" onClick={() => openModal("transaction")}>Add transaction</Button>
      </div>

      <Card pad={0}>
        {/* search row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, maxWidth: 320 }}>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transactions…" prefix={<Icon name="search" size={15} />} />
          </div>
          <Button variant="secondary" size="sm" icon="calendar">Jan – Jun 2026</Button>
          <div style={{ flex: 1 }} />
          <Segmented size="sm" options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]} value={density} onChange={setDensity} />
        </div>

        {/* bulk bar */}
        {sel.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "var(--accent-tint)", borderBottom: "1px solid var(--border)" }}>
            <span className="t-body-m" style={{ color: "var(--accent)" }}>{sel.length} selected</span>
            <div style={{ flex: 1 }} />
            <Button variant="ghost" size="sm" onClick={() => setSel([])}>Clear</Button>
            <Button variant="destructive" size="sm" icon="trash" onClick={() => { toast.success(sel.length + " transactions deleted"); setSel([]); }}>Delete</Button>
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState icon="transactions" title={`No ${filter === "All" ? "" : filter.toLowerCase() + " "}transactions yet`} body="When you add income or expenses, they'll show up here." action={<Button icon="plus" onClick={() => openModal("transaction")}>Add transaction</Button>} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 0 10px 16px", width: 40, position: "sticky", top: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <Checkbox checked={allSel} onChange={() => setSel(allSel ? [] : rows.map((r) => r.id))} />
                  </th>
                  <Th k="name">Description</Th>
                  <Th k="category">Category</Th>
                  <Th k="date">Date</Th>
                  <Th>Type</Th>
                  <Th k="amount" align="right">Amount</Th>
                  <th style={{ width: 80, borderBottom: "1px solid var(--border)", background: "var(--surface)", position: "sticky", top: 0 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const isSel = sel.includes(t.id);
                  return (
                    <tr key={t.id} className="fl-trow" style={{ borderBottom: "1px solid var(--border)", background: isSel ? "var(--accent-tint)" : "transparent", cursor: "pointer" }}
                      onClick={() => setEditing(t)}
                      onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "var(--surface-hover)"; }}
                      onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                      <td style={{ padding: "0 0 0 16px" }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSel} onChange={() => setSel((s) => isSel ? s.filter((x) => x !== t.id) : [...s, t.id])} />
                      </td>
                      <td style={{ padding: rowPad }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="t-body-m">{t.name}</span>
                          <SourceChip t={t} />
                          {t.edited && <Badge tone="warning" style={{ height: 18, fontSize: 11 }}>Edited</Badge>}
                        </div>
                        {t.notes && density !== "compact" && <div className="t-small text-muted" style={{ marginTop: 2 }}>{t.notes}</div>}
                      </td>
                      <td style={{ padding: rowPad }}><Badge>{t.category}</Badge></td>
                      <td style={{ padding: rowPad }}><span className="t-body tnum text-secondary">{FL.fmtDate(t.date)}</span></td>
                      <td style={{ padding: rowPad }}><Badge tone={t.type === "income" ? "positive" : "negative"}>{t.type === "income" ? "Revenue" : "Expense"}</Badge></td>
                      <td style={{ padding: rowPad, textAlign: "right" }}><MoneyText value={t.amount} type={t.type} decimals={2} /></td>
                      <td style={{ padding: "0 10px 0 0" }} onClick={(e) => e.stopPropagation()}>
                        <div className="fl-rowactions" style={{ display: "flex", gap: 2, justifyContent: "flex-end", opacity: 0, transition: "opacity var(--dur-fast)" }}>
                          <IconButton icon="edit" size={30} title="Edit" onClick={() => setEditing(t)} />
                          <Menu align="right" trigger={<IconButton icon="more" size={30} title="More" />} items={[
                            { icon: "edit", label: "Edit", onClick: () => setEditing(t) },
                            { icon: "download", label: "Export row" },
                            { divider: true },
                            { icon: "trash", label: "Delete", danger: true, onClick: () => toast.success("Transaction deleted") },
                          ]} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            <span className="t-small text-muted">{rows.length} transactions</span>
            <div style={{ display: "flex", gap: 6 }}>
              <Button variant="secondary" size="sm" icon="download">Export view</Button>
            </div>
          </div>
        )}
      </Card>

      {/* edit drawer */}
      <TxnDrawer txn={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function Checkbox({ checked, onChange }) {
  return (
    <button role="checkbox" aria-checked={checked} onClick={onChange} className="focus-ring"
      style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${checked ? "var(--accent)" : "var(--border-strong)"}`,
        background: checked ? "var(--accent)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
      {checked && <Icon name="check" size={12} stroke={3} style={{ color: "#fff" }} />}
    </button>
  );
}

function TxnDrawer({ txn, onClose }) {
  const toast = useToast();
  if (!txn) return null;
  return (
    <Drawer open={!!txn} onClose={onClose} title="Transaction detail"
      footer={<><Button variant="ghost" onClick={onClose}>Close</Button><Button icon="edit" onClick={() => { onClose(); openModal("transaction", txn); }}>Edit</Button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div className="t-display tnum" style={{ color: txn.type === "income" ? "var(--positive)" : "var(--negative)" }}>{txn.type === "income" ? "+" : "−"}{FL.money(txn.amount, 2)}</div>
          <div className="t-body text-muted" style={{ marginTop: 4 }}>{txn.name}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          <Badge tone={txn.type === "income" ? "positive" : "negative"}>{txn.type === "income" ? "Revenue" : "Expense"}</Badge>
          <Badge>{txn.category}</Badge>
          {txn.auto && <Badge icon="refresh">Auto-generated</Badge>}
          {txn.edited && <Badge tone="warning">Edited</Badge>}
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {[["Date", FL.fmtDate(txn.date)], ["Category", txn.category], ["Source", txn.source === "manual" ? "Manual entry" : txn.source === "client" ? "Client payment" : "Subscription"], ["Notes", txn.notes || "—"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <span className="t-body text-muted">{k}</span>
              <span className="t-body-m" style={{ textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
        <Button variant="ghost" icon="trash" style={{ color: "var(--negative)", justifyContent: "center" }} onClick={() => { onClose(); toast.success("Transaction deleted"); }}>Delete transaction</Button>
      </div>
    </Drawer>
  );
}

window.SCREENS.transactions = Transactions;
window.MoneyText = MoneyText;
window.Checkbox = Checkbox;
