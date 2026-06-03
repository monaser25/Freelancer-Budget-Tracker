/* ============================================================
   FlowLedger — Clients & Revenue (§6.13)
   ============================================================ */
const { useState: useStateCl } = React;

function ClientCard({ c, onRecord, onEdit, onDelete }) {
  const [open, setOpen] = useStateCl(false);
  const canRecord = c.payType === "Retainer" && c.status === "Active";
  return (
    <Card pad={18} style={{ opacity: c.archived ? 0.6 : 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <Avatar name={c.name} size={44} color={c.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="t-h3">{c.name}</span>
            <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
            <Badge tone="accent">{c.payType}</Badge>
          </div>
          <div className="t-small text-muted" style={{ marginTop: 2 }}>{c.company}{c.company && c.email ? " · " : ""}{c.email}</div>
        </div>
        <Menu align="right" trigger={<IconButton icon="more" size={32} title="Actions" />} items={[
          { icon: "edit", label: "Edit client", onClick: () => onEdit(c) },
          c.history.length ? { icon: "clock", label: open ? "Hide history" : "Show history", onClick: () => setOpen((o) => !o) } : null,
          { divider: true },
          { icon: c.archived ? "refresh" : "archive", label: c.archived ? "Restore" : "Delete / archive", danger: !c.archived, onClick: () => onDelete(c) },
        ].filter(Boolean)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <div>
          <div className="t-caption text-muted">{c.payType === "Retainer" ? "Monthly" : "Project"}</div>
          <div className="t-body-m tnum" style={{ marginTop: 3 }}>{FL.money(c.amount)}{c.payType === "Retainer" ? <span className="text-muted" style={{ fontWeight: 400 }}>/mo</span> : ""}</div>
        </div>
        <div>
          <div className="t-caption text-muted">{c.nextBilling ? "Next payment" : "Last payment"}</div>
          <div className="t-body-m tnum" style={{ marginTop: 3 }}>{c.nextBilling ? FL.fmtDateShort(c.nextBilling) : (c.history[0] ? FL.fmtDateShort(c.history[0].date) : "—")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="t-caption text-muted">Total paid</div>
          <div className="t-body-m tnum pos" style={{ marginTop: 3 }}>{FL.money(c.totalPaid)}</div>
        </div>
      </div>

      {open && c.history.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="t-caption text-muted">Recent payments</div>
          {c.history.slice(0, 3).map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="t-small text-secondary tnum">{FL.fmtDate(h.date)}</span>
              <span className="t-small tnum pos">+{FL.money(h.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {!c.archived && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {canRecord && <Button size="sm" icon="dollar" onClick={() => onRecord(c)} style={{ flex: 1 }}>Record payment</Button>}
          <Button size="sm" variant="secondary" icon="edit" onClick={() => onEdit(c)} style={{ flex: canRecord ? "none" : 1 }}>{canRecord ? "" : "Edit"}</Button>
        </div>
      )}
      {c.archived && <Button size="sm" variant="secondary" icon="refresh" style={{ marginTop: 16, width: "100%" }} onClick={() => onDelete(c)}>Restore client</Button>}
    </Card>
  );
}

function Clients() {
  const [showArchived, setShowArchived] = useStateCl(false);
  const [del, setDel] = useStateCl(null);
  const toast = useToast();
  const list = FL.clients.filter((c) => showArchived ? true : !c.archived);
  const donut = FL.revenueByClient();
  const totalRev = donut.reduce((a, d) => a + d.value, 0);
  const top = donut[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <Switch checked={showArchived} onChange={setShowArchived} />
          <span className="t-body-m text-secondary">Show archived</span>
        </label>
        <Button icon="plus" onClick={() => openModal("client")}>Add client</Button>
      </div>

      <div className="fl-clients-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {list.length === 0
            ? <Card style={{ gridColumn: "1/-1" }}><EmptyState icon="clients" title="No clients yet" body="Add your first client to start tracking revenue and retainers." action={<Button icon="plus" onClick={() => openModal("client")}>Add your first client</Button>} /></Card>
            : list.map((c) => <ClientCard key={c.id} c={c} onRecord={(cl) => toast.success("Payment recorded", cl.name + " · " + FL.money(cl.amount))} onEdit={(cl) => openModal("client", cl)} onDelete={(cl) => cl.archived ? toast.success("Client restored", cl.name) : setDel(cl)} />)}
        </div>

        <div className="fl-clients-side" style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 16 }}>
          <Card pad={20}>
            <SectionHeader title="Revenue by client" />
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <DonutChart data={donut} size={180} centerLabel="Total" centerValue={FL.money(totalRev)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {donut.slice(0, 5).map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: d.color ? `var(${d.color})` : `var(--viz-${i + 1})` }} />
                  <span className="t-small text-secondary" style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</span>
                  <span className="t-small tnum">{Math.round((d.value / totalRev) * 100)}%</span>
                </div>
              ))}
            </div>
          </Card>
          {top && (
            <Card pad={20}>
              <div className="t-caption text-muted" style={{ marginBottom: 12 }}>Top client</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={top.name} size={40} color={top.color} />
                <div><div className="t-h3">{top.name}</div><div className="t-small text-muted">{top.company}</div></div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span className="t-small text-muted">Lifetime value</span><span className="t-h3 tnum pos">{FL.money(top.value)}</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={`Delete ${del?.name}?`}
        body="Choose whether to archive this client (keeps history, stops billing) or permanently delete them."
        impact={del ? `${del.history.length} past payment${del.history.length === 1 ? "" : "s"} totaling ${FL.money(del.totalPaid)} will be kept.` : ""}
        archiveLabel="Archive" onArchive={() => toast.success("Client archived", del.name)}
        confirmLabel="Delete permanently" onConfirm={() => toast.success("Client deleted", del.name)} />
    </div>
  );
}

window.SCREENS.clients = Clients;
