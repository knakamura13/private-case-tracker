/* global React */
const { IconClose, IconPlus, IconCheck, IconImage, IconClip, IconTag,
  IconCalendar, IconEye, IconMore, IconCheckSq, IconQuestion,
  IconLink, IconDoc, ByAvatar, IconCircle } = window;

// ============================================================
// AddEditModal — Trello-style, but in our soft language
// Used for tasks, milestones, questions
// ============================================================
function AddEditModal({ kind = "task", entry, onClose }) {
  // kind: 'task' | 'milestone' | 'question' | 'evidence'
  const config = {
    task: {
      label: "Task",
      title: entry?.title || "Translate Sally's birth certificate",
      list: "This week",
      listColor: "s-active",
      icon: IconCheckSq,
      showSubtasks: true,
      showStatus: true,
      sub: [
        { d: "Find ATA-certified translator", done: true },
        { d: "Send original via email", done: true },
        { d: "Receive translation + notarized affidavit", done: false },
        { d: "File in Evidence → Vital records", done: false },
      ],
      labels: [{ l: "I-129F", c: "s-waiting" }, { l: "translation", c: "s-note" }],
      due: "Apr 25 · 1:52 PM", dueOverdue: true,
    },
    milestone: {
      label: "Milestone",
      title: entry?.title || "I-129F petition mailed to USCIS",
      list: "Filed",
      listColor: "s-done",
      icon: IconCalendar,
      showSubtasks: false,
      labels: [{ l: "I-129F", c: "s-waiting" }, { l: "USCIS", c: "s-note" }],
      due: "Mar 14, 2026 · 11:00 AM",
    },
    question: {
      label: "Question",
      title: entry?.title || "Does Sally need a new passport before consular interview?",
      list: "For the lawyer",
      listColor: "s-waiting",
      icon: IconQuestion,
      showSubtasks: false,
      showThread: true,
      labels: [{ l: "lawyer", c: "s-waiting" }, { l: "passport", c: "s-active" }],
      due: "Asked Apr 22",
    },
  }[kind];

  const I = config.icon;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "20px 28px",
          borderBottom: "1px solid var(--hairline)",
        }}>
          <span className={`pill ${config.listColor}`}>
            <I size={12} /> {config.list}
          </span>
          <div style={{ flex: 1 }} />
          <button className="btn ghost sm" style={{ width: 32, padding: 0, justifyContent: "center" }}><IconImage size={16} /></button>
          <button className="btn ghost sm" style={{ width: 32, padding: 0, justifyContent: "center" }}><IconEye size={16} /></button>
          <button className="btn ghost sm" style={{ width: 32, padding: 0, justifyContent: "center" }}><IconMore size={16} /></button>
          <button className="btn ghost sm" style={{ width: 32, padding: 0, justifyContent: "center" }} onClick={onClose}><IconClose size={16} /></button>
        </div>

        <div style={{ padding: 28, maxHeight: 720, overflowY: "auto" }}>
          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            {kind === 'task'
              ? <div style={{ width: 24, height: 24, borderRadius: 999, border: "2px solid var(--ink-3)", flexShrink: 0 }} />
              : <I size={24} style={{ color: "var(--ink-2)" }} />}
            <div className="display" style={{ fontSize: 32, lineHeight: 1.1, flex: 1 }}>
              {config.title}
            </div>
          </div>

          {/* Action chips row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            <button className="btn sm"><IconPlus size={13} /> Add</button>
            <button className="btn sm"><IconTag size={13} /> Labels</button>
            {config.showSubtasks && <button className="btn sm"><IconCheckSq size={13} /> Sub-tasks</button>}
            <button className="btn sm"><IconClip size={13} /> Attachment</button>
            <button className="btn sm"><IconLink size={13} /> Link</button>
            <button className="btn sm"><IconDoc size={13} /> Evidence</button>
          </div>

          {/* Members + Due */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 24 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Assigned to</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ByAvatar who="k" />
                <ByAvatar who="a" />
                <button style={{
                  width: 22, height: 22, borderRadius: 999,
                  border: "1.5px dashed var(--ink-3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "transparent", color: "var(--ink-3)",
                  cursor: "pointer", marginLeft: 4,
                }}>
                  <IconPlus size={11} />
                </button>
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Due date</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <button className="btn sm"><IconCalendar size={13} /> {config.due}</button>
                {config.dueOverdue && <span className="pill s-urgent" style={{ height: 26 }}>Overdue</span>}
              </div>
            </div>
          </div>

          {/* Labels */}
          <div style={{ marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Labels</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {config.labels.map(l => (
                <span key={l.l} className={`pill ${l.c}`}>{l.l}</span>
              ))}
              <button className="pill" style={{ borderStyle: "dashed", background: "transparent", cursor: "pointer" }}>+ add</button>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div className="eyebrow">Description</div>
            </div>
            <div style={{
              padding: 16, borderRadius: 14,
              background: "var(--surface-2)",
              border: "1px solid var(--hairline)",
              fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55,
              minHeight: 96,
            }}>
              {kind === 'task' && "Sworn translation needed for I-129F filing. Per USCIS, the translator must certify that they're competent to translate from Portuguese (BR) to English and that the translation is accurate."}
              {kind === 'milestone' && "USPS Priority Mail Express, tracking 9405 5036 9930 0098 7714 22. Petition package included Form I-129F, $675 fee, two passport photos, and the bona fide relationship evidence binder (47 pages)."}
              {kind === 'question' && "Sally's current Brazilian passport expires Feb 2027. The K-1 visa, if approved, would be issued for 6 months — does it need to remain valid 6 months past entry? Worth renewing now or waiting?"}
            </div>
          </div>

          {/* Sub-tasks */}
          {config.showSubtasks && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <IconCheckSq size={14} />
                  <div className="eyebrow" style={{ marginBottom: 0 }}>Sub-tasks</div>
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>2 of 4</span>
                </div>
                <button className="btn ghost sm">Hide checked</button>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: "var(--surface-3)", marginBottom: 14 }}>
                <div style={{ width: "50%", height: "100%", borderRadius: 4, background: "var(--sage-fill)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {config.sub.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 10, background: "var(--surface-2)" }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: "1.5px solid " + (s.done ? "var(--sage-d)" : "var(--ink-3)"),
                      background: s.done ? "var(--sage-fill)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {s.done && <IconCheck size={11} stroke={2.4} />}
                    </div>
                    <span style={{ fontSize: 13, color: s.done ? "var(--ink-3)" : "var(--ink)", textDecoration: s.done ? "line-through" : "none" }}>{s.d}</span>
                  </div>
                ))}
                <button className="btn sm" style={{ alignSelf: "flex-start", marginTop: 6 }}>+ Add a sub-task</button>
              </div>
            </div>
          )}

          {/* Activity / thread */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Activity</div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <ByAvatar who="k" />
              <input className="input" placeholder="Write a comment…" style={{ flex: 1 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { who: "k", txt: kind === 'question' ? "Drafted this after checking the DS-160 instructions — let's bring it up Tuesday." : "Found a translator on the USCIS approved list, $90/page." },
                { who: "a", txt: kind === 'question' ? "Mine expires Feb '27 — there's also a renewal queue of 3 weeks at the consulate right now." : "Mailed the original this morning, photo is in evidence folder." },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <ByAvatar who={c.who} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                      {c.who === 'k' ? 'Kyle' : 'Sally'} <span className="mono" style={{ fontWeight: 400, color: "var(--ink-3)", marginLeft: 6 }}>2d ago</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{c.txt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 28px",
          borderTop: "1px solid var(--hairline)",
          background: "var(--surface-2)",
        }}>
          <button className="btn ghost sm" style={{ color: "var(--blush-d)" }}>Delete</button>
          <div style={{ flex: 1 }} />
          <button className="btn sm" onClick={onClose}>Cancel</button>
          <button className="btn primary sm">Save changes</button>
        </div>
      </div>
    </div>
  );
}

// Faux modal that just renders inline (for canvas display, not interactive)
function ModalDemo({ kind }) {
  return (
    <div style={{ padding: 32, background: "oklch(0.20 0.02 270 / 0.32)", minHeight: 1000 }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 24 }}>
        <div className="modal" style={{ position: "relative" }}>
          <_ModalContents kind={kind} />
        </div>
      </div>
    </div>
  );
}

// Inline (non-portal) version for the canvas
function _ModalContents({ kind }) {
  return <AddEditModal kind={kind} onClose={() => {}} />;
}

// For canvas: render JUST the modal frame, no backdrop
function ModalCard({ kind }) {
  return (
    <div className="bloom" style={{ padding: 40, background: "oklch(0.20 0.02 270 / 0.32)", minHeight: 1000 }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ModalInline kind={kind} />
      </div>
    </div>
  );
}

function ModalInline({ kind }) {
  // Render the modal contents without a fixed backdrop (so it sits inside the artboard)
  return (
    <div className="modal" style={{ width: 640 }}>
      <ModalBody kind={kind} />
    </div>
  );
}

function ModalBody({ kind }) {
  const config = getModalConfig(kind);
  const I = config.icon;
  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "18px 24px",
        borderBottom: "1px solid var(--hairline)",
      }}>
        <span className={`pill ${config.listColor}`}>
          <I size={12} /> {config.list}
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn ghost sm" style={{ width: 32, padding: 0, justifyContent: "center" }}><IconImage size={16} /></button>
        <button className="btn ghost sm" style={{ width: 32, padding: 0, justifyContent: "center" }}><IconEye size={16} /></button>
        <button className="btn ghost sm" style={{ width: 32, padding: 0, justifyContent: "center" }}><IconMore size={16} /></button>
        <button className="btn ghost sm" style={{ width: 32, padding: 0, justifyContent: "center" }}><IconClose size={16} /></button>
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          {kind === 'task'
            ? <div style={{ width: 22, height: 22, borderRadius: 999, border: "2px solid var(--ink-3)", flexShrink: 0 }} />
            : <I size={22} style={{ color: "var(--ink-2)" }} />}
          <div className="display" style={{ fontSize: 28, lineHeight: 1.1, flex: 1 }}>
            {config.title}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          <button className="btn sm"><IconPlus size={13} /> Add</button>
          <button className="btn sm"><IconTag size={13} /> Labels</button>
          {config.showSubtasks && <button className="btn sm"><IconCheckSq size={13} /> Sub-tasks</button>}
          <button className="btn sm"><IconClip size={13} /> Attachment</button>
          <button className="btn sm"><IconLink size={13} /> Link</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Assigned to</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ByAvatar who="k" />
              <ByAvatar who="a" />
              <button style={{ width: 22, height: 22, borderRadius: 999, border: "1.5px dashed var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "var(--ink-3)", cursor: "pointer", marginLeft: 4 }}>
                <IconPlus size={11} />
              </button>
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Due date</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <button className="btn sm"><IconCalendar size={13} /> {config.due}</button>
              {config.dueOverdue && <span className="pill s-urgent" style={{ height: 26 }}>Overdue</span>}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Labels</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {config.labels.map(l => <span key={l.l} className={`pill ${l.c}`}>{l.l}</span>)}
            <button className="pill" style={{ borderStyle: "dashed", background: "transparent", cursor: "pointer" }}>+ add</button>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Description</div>
          <div style={{ padding: 14, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--hairline)", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {config.desc}
          </div>
        </div>
        {config.showSubtasks && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <IconCheckSq size={14} />
              <div className="eyebrow" style={{ marginBottom: 0 }}>Sub-tasks</div>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>2 of 4</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: "var(--surface-3)", marginBottom: 12 }}>
              <div style={{ width: "50%", height: "100%", borderRadius: 4, background: "var(--sage-fill)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {config.sub.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 10, background: "var(--surface-2)" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 5, border: "1.5px solid " + (s.done ? "var(--sage-d)" : "var(--ink-3)"), background: s.done ? "var(--sage-fill)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {s.done && <IconCheck size={10} stroke={2.4} />}
                  </div>
                  <span style={{ fontSize: 12, color: s.done ? "var(--ink-3)" : "var(--ink)", textDecoration: s.done ? "line-through" : "none" }}>{s.d}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 24px", borderTop: "1px solid var(--hairline)", background: "var(--surface-2)" }}>
        <button className="btn ghost sm" style={{ color: "var(--blush-d)" }}>Delete</button>
        <div style={{ flex: 1 }} />
        <button className="btn sm">Cancel</button>
        <button className="btn primary sm">Save changes</button>
      </div>
    </>
  );
}

function getModalConfig(kind) {
  const map = {
    task: {
      list: "This week", listColor: "s-active", icon: IconCheckSq,
      title: "Translate Sally's birth certificate",
      showSubtasks: true,
      sub: [
        { d: "Find ATA-certified translator", done: true },
        { d: "Send original via email", done: true },
        { d: "Receive translation + notarized affidavit", done: false },
        { d: "File in Evidence → Vital records", done: false },
      ],
      labels: [{ l: "I-129F", c: "s-waiting" }, { l: "translation", c: "s-note" }],
      due: "Apr 25 · 1:52 PM", dueOverdue: true,
      desc: "Sworn translation needed for I-129F filing. Per USCIS, the translator must certify they're competent and that the translation is accurate.",
    },
    milestone: {
      list: "Filed", listColor: "s-done", icon: IconCalendar,
      title: "I-129F petition mailed to USCIS",
      labels: [{ l: "I-129F", c: "s-waiting" }, { l: "USCIS", c: "s-note" }],
      due: "Mar 14, 2026 · 11:00 AM",
      desc: "USPS Priority Mail Express, tracking 9405 5036 9930 0098 7714 22. Package included Form I-129F, $675 fee, two passport photos, and the bona fide relationship evidence binder (47 pages).",
    },
    question: {
      list: "For the lawyer", listColor: "s-waiting", icon: IconQuestion,
      title: "Does Sally need a new passport before consular interview?",
      labels: [{ l: "lawyer", c: "s-waiting" }, { l: "passport", c: "s-active" }],
      due: "Asked Apr 22",
      desc: "Sally's current Brazilian passport expires Feb 2027. The K-1 visa, if approved, would be issued for 6 months — does it need to remain valid 6 months past entry? Worth renewing now or waiting?",
    },
  };
  return map[kind] || map.task;
}

Object.assign(window, { AddEditModal, ModalCard, ModalInline });
