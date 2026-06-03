/* ============================================================
   FlowLedger — Subscriptions (§6.15)
   ============================================================ */
const { useState: useStateSub } = React;

function SubCard({ s, onRecord, onEdit, onDelete }) {
  const cycleTone = { Monthly: "accent", Quarterly: "info", Yearly: "positive" }[s.cycle];
  return (
    <Card pad={18} style={{ opacity: s.archived ? 0.6 : 1, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <Avatar name={s.letter} size={42} color={s.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="t-h3">{s.name}</span>
            <Badge tone={cycleTone}>{s.cycle}</Badge>
            <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
          </div>
          {s.notes && <div className="t-small text-muted" style={{ marginTop: 2 }}>{s.notes}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="t-h3 tnum">{FL.money(s.monthly)}<span className="text-muted" style={{ fontWeight: 400, fontSize: 13 }}>/mo</span></div>
          {s.cycle !== "Monthly" && <div className="t-small text-muted tnum">{FL.money(s.amount)}/{s.cycle === "Yearly" ? "yr" : "qtr"}</div>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <span className="t-small text-muted">{s.nextBilling ? <>Next billing <span className="tnum" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{FL.fmtDate(s.nextBilling)}</span></> : "Cancelled"}</span>
        {!s.archived ? (
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="sm" variant="secondary" icon="dollar" onClick={() => onRecord(s)}>Record</Button>
            <IconButton icon="edit" size={32} title="Edit" onClick={() => onEdit(s)} />
            <Menu align="right" trigger={<IconButton icon="more" size={32} title="More" />} items={[
              { icon: "edit", label: "Edit", onClick: () => onEdit(s) },
              { divider: true },
              { icon: "archive", label: "Delete / archive", danger: true, onClick: () => onDelete(s) },
            ]} />
          </div>
        ) : <Button size="sm" variant="secondary" icon="refresh" onClick={() => onDelete(s)}>Restore</Button>}
      </div>
    </Card>
  );
}

function Subscriptions() {
  const [showArchived, setShowArchived] = useStateSub(false);
  const [del, setDel] = useStateSub(null);
  const toast = useToast();
  const list = FL.subscriptions.filter((s) => showArchived ? true : !s.archived);
  const active = FL.subscriptions.filter((s) => s.status === "Active" && !s.archived);
  const monthlyTotal = active.reduce((a, s) => a + s.monthly, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <Switch checked={showArchived} onChange={setShowArchived} />
          <span className="t-body-m text-secondary">Show archived</span>
        </label>
        <Button icon="plus" onClick={() => openModal("subscription")}>Add subscription</Button>
      </div>

      {/* hero stat */}
      <Card pad={24} style={{ background: "linear-gradient(135deg, var(--accent-tint), var(--surface) 70%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="t-caption text-muted">Total monthly burden</div>
            <div className="t-display tnum" style={{ marginTop: 6 }}>{FL.money(monthlyTotal)}<span className="text-muted" style={{ fontSize: 20, fontWeight: 400 }}>/mo</span></div>
            <div className="t-small text-muted" style={{ marginTop: 4 }}>{active.length} active tools · {FL.money(monthlyTotal * 12)}/yr normalized</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {active.slice(0, 6).map((s) => <Avatar key={s.id} name={s.letter} size={40} color={s.color} />)}
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
        {list.length === 0
          ? <Card style={{ gridColumn: "1/-1" }}><EmptyState icon="subscriptions" title="No subscriptions yet" body="Track the recurring tools and software you pay for." action={<Button icon="plus" onClick={() => openModal("subscription")}>Add subscription</Button>} /></Card>
          : list.map((s) => <SubCard key={s.id} s={s} onRecord={(x) => toast.success("Payment recorded", x.name + " · " + FL.money(x.amount))} onEdit={(x) => openModal("subscription", x)} onDelete={(x) => x.archived ? toast.success("Subscription restored", x.name) : setDel(x)} />)}
      </div>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={`Delete ${del?.name}?`}
        body="Archive to keep past expense records and stop future billing, or delete it permanently."
        impact={del ? "Past expense transactions for this tool will be kept." : ""}
        archiveLabel="Archive" onArchive={() => toast.success("Subscription archived", del.name)}
        confirmLabel="Delete permanently" onConfirm={() => toast.success("Subscription deleted", del.name)} />
    </div>
  );
}

window.SCREENS.subscriptions = Subscriptions;
