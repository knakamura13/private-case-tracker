/* global React */
const {
    Sidebar,
    Topbar,
    PageHeader,
    Sparkline,
    StatusPill,
    ByAvatar,
    IconCalendar,
    IconCheckSq,
    IconDoc,
    IconQuestion,
    IconLink,
    IconPlus,
    IconChev,
    IconClock,
    IconMore,
    IconFolder,
    IconCheck
} = window;

// ============================================================
// Dashboard — calm direction
// ============================================================
function DashboardCalm() {
    return (
        <div className="bloom" style={{ display: 'flex', minHeight: 1080, background: 'var(--bg)' }}>
            <Sidebar active="dashboard" />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Topbar />
                <div style={{ padding: '32px 32px 48px', flex: 1 }}>
                    <PageHeader
                        eyebrow="Tuesday · April 30, 2026 · Day 47 of K-1"
                        title={
                            <>
                                Hello, <em style={{ fontStyle: 'italic' }}>Kyle</em>
                            </>
                        }
                        sub="You filed the I-129F 47 days ago. USCIS is still processing — average wait at this stage is 4–6 months. In the meantime, here's what you can do."
                    >
                        <span className="pill s-waiting">Waiting on USCIS</span>
                    </PageHeader>

                    <div className="bento">
                        {/* Hero — case progress */}
                        <div className="card span-8" style={{ padding: 36 }}>
                            <div className="eyebrow" style={{ marginBottom: 12 }}>
                                Case progress
                            </div>
                            <h2 className="display" style={{ fontSize: 36, marginBottom: 18 }}>
                                Step 3 of 9 · I-129F under review
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 18 }}>
                                {[
                                    { l: 'Engagement', s: 'done' },
                                    { l: 'I-129F prep', s: 'done' },
                                    { l: 'USCIS review', s: 'active' },
                                    { l: 'NVC handoff', s: 'future' },
                                    { l: 'Embassy interview', s: 'future' },
                                    { l: 'K-1 issued', s: 'future' },
                                    { l: 'Entry to US', s: 'future' },
                                    { l: 'Marriage', s: 'future' },
                                    { l: 'AOS to GC', s: 'future' }
                                ].map((step, i) => (
                                    <React.Fragment key={i}>
                                        <div
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 8,
                                                position: 'relative'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 999,
                                                    background:
                                                        step.s === 'done'
                                                            ? 'var(--sage-fill)'
                                                            : step.s === 'active'
                                                              ? 'var(--ink)'
                                                              : 'var(--surface-3)',
                                                    color: step.s === 'active' ? 'var(--butter-fill)' : 'var(--ink)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    border: step.s === 'active' ? '2px solid var(--butter-fill)' : 'none'
                                                }}
                                            >
                                                {step.s === 'done' ? <IconCheck size={14} stroke={2.4} /> : i + 1}
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: step.s === 'future' ? 'var(--ink-4)' : 'var(--ink-2)',
                                                    textAlign: 'center',
                                                    lineHeight: 1.2,
                                                    fontWeight: step.s === 'active' ? 600 : 400
                                                }}
                                            >
                                                {step.l}
                                            </span>
                                        </div>
                                        {i < 8 && (
                                            <div
                                                style={{
                                                    height: 2,
                                                    flex: 0.5,
                                                    background: i < 2 ? 'var(--sage-fill)' : 'var(--surface-3)',
                                                    marginTop: -22,
                                                    alignSelf: 'center'
                                                }}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
                                <Mini label="Filed on" value="Mar 14, 2026" />
                                <Mini label="Receipt #" value="EAC-26-145-22817" mono />
                                <Mini label="Service center" value="Vermont" />
                            </div>
                        </div>

                        {/* Days waiting */}
                        <div className="card tinted-peri span-4" style={{ padding: 28 }}>
                            <div className="eyebrow" style={{ marginBottom: 10 }}>
                                Time at USCIS
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                                <span className="display" style={{ fontSize: 64, lineHeight: 1 }}>
                                    47
                                </span>
                                <span style={{ fontSize: 14, color: 'oklch(0.32 0.13 265)' }}>days</span>
                            </div>
                            <p style={{ fontSize: 13, color: 'oklch(0.32 0.13 265)', lineHeight: 1.5, marginBottom: 14 }}>
                                Average for Vermont: <strong>5.2 months</strong>. You're on track. No action from you needed.
                            </p>
                            <Sparkline values={[0, 5, 10, 18, 24, 32, 40, 47]} color="oklch(0.42 0.15 265)" fill height={48} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                <span className="mono" style={{ fontSize: 10, color: 'oklch(0.42 0.15 265)' }}>
                                    Mar 14
                                </span>
                                <span className="mono" style={{ fontSize: 10, color: 'oklch(0.42 0.15 265)' }}>
                                    today
                                </span>
                            </div>
                        </div>

                        {/* Tasks this week */}
                        <div className="card span-7" style={{ padding: 28 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                                <div>
                                    <div className="eyebrow" style={{ marginBottom: 8 }}>
                                        This week · 4 of 7
                                    </div>
                                    <h3 className="display" style={{ fontSize: 28 }}>
                                        What we can do now
                                    </h3>
                                </div>
                                <button className="btn sm">
                                    All tasks <IconChev size={14} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { t: "Translate Sally's birth certificate", who: 'k', due: 'Overdue · 5d', urgent: true, done: false },
                                    { t: 'Order new passport photos (both)', who: 'a', due: 'Wed', done: false },
                                    { t: 'Joint Chase account — first deposit', who: 'k', due: 'Fri', done: false },
                                    { t: 'Compile 2025 messages export', who: 'a', due: 'Sat', done: false },
                                    { t: 'Confirm lawyer call · May 5', who: 'k', due: 'May 5', done: true },
                                    { t: 'Save USCIS receipt to Drive', who: 'a', due: 'Mar 22', done: true }
                                ].map((task, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 14,
                                            padding: '12px 14px',
                                            borderRadius: 14,
                                            background: i === 0 ? 'var(--blush)' : 'transparent'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 999,
                                                border:
                                                    '2px solid ' +
                                                    (task.done ? 'var(--sage-d)' : task.urgent ? 'var(--blush-d)' : 'var(--ink-3)'),
                                                background: task.done ? 'var(--sage-fill)' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            {task.done && <IconCheck size={11} stroke={2.4} />}
                                        </div>
                                        <span
                                            style={{
                                                flex: 1,
                                                fontSize: 14,
                                                color: task.done ? 'var(--ink-3)' : 'var(--ink)',
                                                textDecoration: task.done ? 'line-through' : 'none'
                                            }}
                                        >
                                            {task.t}
                                        </span>
                                        <ByAvatar who={task.who} />
                                        <span
                                            className="mono"
                                            style={{
                                                fontSize: 11,
                                                color: task.urgent ? 'var(--blush-d)' : 'var(--ink-3)',
                                                minWidth: 64,
                                                textAlign: 'right'
                                            }}
                                        >
                                            {task.due}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Next milestone — calendar */}
                        <div className="card tinted-butter span-5" style={{ padding: 28 }}>
                            <div className="eyebrow" style={{ marginBottom: 10 }}>
                                Coming up
                            </div>
                            <h3 className="display" style={{ fontSize: 28, marginBottom: 18 }}>
                                The next 60 days
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    { d: 'May', n: '05', t: 'Lawyer check-in call', s: '11:00 · Zoom', tag: 'active' },
                                    { d: 'May', n: '18', t: 'USCIS biometrics (est.)', s: 'Tentative — letter pending', tag: 'waiting' },
                                    { d: 'Jun', n: '01', t: 'RFE response window opens', s: 'If RFE issued, 87d', tag: 'note' },
                                    { d: 'Jun', n: '29', t: 'Approval window starts', s: 'Earliest realistic', tag: 'waiting' }
                                ].map((e, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <div
                                            style={{
                                                width: 48,
                                                height: 56,
                                                flexShrink: 0,
                                                borderRadius: 14,
                                                background: 'var(--surface)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                                                {e.d}
                                            </span>
                                            <span className="display" style={{ fontSize: 22 }}>
                                                {e.n}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{e.t}</div>
                                            <div style={{ fontSize: 12, color: 'oklch(0.40 0.13 80)' }}>{e.s}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Open questions */}
                        <div className="card span-4" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div className="eyebrow">Open questions</div>
                                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                    4
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { q: 'Does Sally need a new passport?', t: 'lawyer', c: 's-waiting' },
                                    { q: 'Joint lease — how soon to sign?', t: 'us', c: 's-note' },
                                    { q: 'What to wear to interview?', t: 'interview', c: 's-active' }
                                ].map((q, i) => (
                                    <div key={i} style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)' }}>
                                        <div style={{ fontSize: 13, lineHeight: 1.4, marginBottom: 6 }}>{q.q}</div>
                                        <span className={`pill ${q.c}`} style={{ height: 22, fontSize: 11 }}>
                                            {q.t}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Evidence progress */}
                        <div className="card span-4" style={{ padding: 24 }}>
                            <div className="eyebrow" style={{ marginBottom: 14 }}>
                                Evidence collected
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                                <span className="display" style={{ fontSize: 48 }}>
                                    24
                                </span>
                                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>/ 38 items</span>
                            </div>
                            <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', marginBottom: 14, marginTop: 4 }}>
                                <div style={{ width: '63%', height: '100%', borderRadius: 4, background: 'var(--sage-fill)' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {[
                                    { l: 'Bona fide relationship', c: 14, t: 18, color: 'var(--sage-fill)' },
                                    { l: 'Forms & supporting', c: 8, t: 12, color: 'var(--butter-fill)' },
                                    { l: 'Vital records', c: 2, t: 8, color: 'var(--blush-fill)' }
                                ].map((c) => (
                                    <div key={c.l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                                        <span className="dot" style={{ background: c.color }} />
                                        <span style={{ flex: 1 }}>{c.l}</span>
                                        <span className="mono" style={{ color: 'var(--ink-3)' }}>
                                            {c.c}/{c.t}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick links */}
                        <div className="card tinted-lilac span-4" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div className="eyebrow">Quick links</div>
                                <IconPlus size={14} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {[
                                    { i: IconFolder, l: 'Case file (Drive)', s: '47 docs' },
                                    { i: IconLink, l: 'USCIS case status', s: 'EAC-26-145…' },
                                    { i: IconLink, l: 'Suffolk County Clerk', s: 'Marriage license' },
                                    { i: IconLink, l: 'São Paulo consulate', s: 'Interview booking' },
                                    { i: IconFolder, l: 'Photos · 2024–2026', s: '612 items' }
                                ].map((l, i) => {
                                    const I = l.i;
                                    return (
                                        <a
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: 10,
                                                borderRadius: 12,
                                                background: 'var(--surface)',
                                                textDecoration: 'none',
                                                color: 'inherit'
                                            }}
                                        >
                                            <I size={16} style={{ color: 'oklch(0.45 0.12 305)' }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600 }}>{l.l}</div>
                                                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                                                    {l.s}
                                                </div>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Mini({ label, value, mono }) {
    return (
        <div style={{ paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
                {label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)' }}>{value}</div>
        </div>
    );
}

// ============================================================
// Dashboard — structured direction (more case-file feel)
// ============================================================
function DashboardStructured() {
    return (
        <div className="bloom" style={{ display: 'flex', minHeight: 1080, background: 'var(--bg)' }}>
            <Sidebar active="dashboard" />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Topbar />
                <div style={{ padding: '32px 32px 48px', flex: 1 }}>
                    <PageHeader
                        eyebrow="Tuesday · April 30, 2026 · Day 47"
                        title={
                            <>
                                Hello, <em style={{ fontStyle: 'italic' }}>Kyle</em>
                            </>
                        }
                        sub="The I-129F has been with USCIS for 47 days. Average wait at this stage is 4–6 months. Here's where things stand."
                    >
                        <span className="pill s-waiting">Awaiting USCIS adjudication</span>
                    </PageHeader>

                    {/* 3-column grid: tasks / milestones / questions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                        {/* Tasks */}
                        <div className="card" style={{ padding: 0 }}>
                            <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--hairline)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <IconCheckSq size={18} />
                                        <div className="display" style={{ fontSize: 22 }}>
                                            Tasks
                                        </div>
                                    </div>
                                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                        4 of 7
                                    </span>
                                </div>
                            </div>
                            <div style={{ padding: '8px 12px 16px' }}>
                                {[
                                    { t: 'Translate birth certificate', who: 'k', due: 'Overdue', urgent: true },
                                    { t: 'Passport photos (both)', who: 'a', due: 'Wed' },
                                    { t: 'Joint Chase deposit', who: 'k', due: 'Fri' },
                                    { t: 'Compile 2025 messages', who: 'a', due: 'Sat' }
                                ].map((t, i) => (
                                    <div
                                        key={i}
                                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10 }}
                                    >
                                        <div
                                            style={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: 999,
                                                border: '1.5px solid ' + (t.urgent ? 'var(--blush-d)' : 'var(--ink-3)')
                                            }}
                                        />
                                        <span style={{ fontSize: 13, flex: 1 }}>{t.t}</span>
                                        <ByAvatar who={t.who} />
                                        <span
                                            className="mono"
                                            style={{ fontSize: 10, color: t.urgent ? 'var(--blush-d)' : 'var(--ink-3)' }}
                                        >
                                            {t.due}
                                        </span>
                                    </div>
                                ))}
                                <button className="btn sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
                                    <IconPlus size={13} /> Add task
                                </button>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="card" style={{ padding: 0 }}>
                            <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--hairline)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <IconCalendar size={18} />
                                        <div className="display" style={{ fontSize: 22 }}>
                                            Milestones
                                        </div>
                                    </div>
                                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                        3 / 9
                                    </span>
                                </div>
                            </div>
                            <div style={{ padding: 16 }}>
                                {[
                                    { d: 'Mar 14', t: 'I-129F mailed', s: 'done' },
                                    { d: 'Apr 03', t: 'NOA1 received', s: 'done' },
                                    { d: 'May ~18', t: 'Biometrics (est.)', s: 'active' },
                                    { d: 'Aug ~', t: 'NOA2 / approval', s: 'future' },
                                    { d: 'Sep ~', t: 'NVC handoff', s: 'future' }
                                ].map((m, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', alignItems: 'center' }}>
                                        <div
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 999,
                                                background:
                                                    m.s === 'done'
                                                        ? 'var(--sage-fill)'
                                                        : m.s === 'active'
                                                          ? 'var(--ink)'
                                                          : 'var(--surface-3)',
                                                flexShrink: 0
                                            }}
                                        />
                                        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', width: 60 }}>
                                            {m.d}
                                        </span>
                                        <span style={{ fontSize: 13, color: m.s === 'future' ? 'var(--ink-3)' : 'var(--ink)' }}>{m.t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="card" style={{ padding: 0 }}>
                            <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--hairline)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <IconQuestion size={18} />
                                        <div className="display" style={{ fontSize: 22 }}>
                                            Open questions
                                        </div>
                                    </div>
                                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                        4
                                    </span>
                                </div>
                            </div>
                            <div style={{ padding: '8px 16px 16px' }}>
                                {[
                                    { q: 'New passport for Sally?', t: 'lawyer', c: 's-waiting' },
                                    { q: 'Joint lease timing?', t: 'us', c: 's-note' },
                                    { q: 'Interview attire?', t: 'interview', c: 's-active' },
                                    { q: 'Tax filing status?', t: 'lawyer', c: 's-waiting' }
                                ].map((q, i) => (
                                    <div key={i} style={{ padding: '10px 12px', borderRadius: 10 }}>
                                        <div style={{ fontSize: 13, lineHeight: 1.4, marginBottom: 4 }}>{q.q}</div>
                                        <span className={`pill ${q.c}`} style={{ height: 22, fontSize: 10 }}>
                                            {q.t}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Evidence + links full width */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginTop: 20 }}>
                        <div className="card" style={{ padding: 28 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <IconDoc size={18} />
                                    <div className="display" style={{ fontSize: 24 }}>
                                        Evidence collection
                                    </div>
                                </div>
                                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                                    24 / 38
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                {[
                                    { l: 'Bona fide relationship', c: 14, t: 18, color: 'var(--sage)', fill: 'var(--sage-fill)' },
                                    { l: 'Forms & supporting', c: 8, t: 12, color: 'var(--butter)', fill: 'var(--butter-fill)' },
                                    { l: 'Vital records', c: 2, t: 8, color: 'var(--blush)', fill: 'var(--blush-fill)' }
                                ].map((c) => (
                                    <div
                                        key={c.l}
                                        className="card-tight"
                                        style={{ background: c.color, border: '1px solid transparent', padding: 16 }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                                            <span className="display" style={{ fontSize: 32 }}>
                                                {c.c}
                                            </span>
                                            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>
                                                / {c.t}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 12, marginBottom: 10 }}>{c.l}</div>
                                        <div style={{ height: 4, borderRadius: 4, background: 'var(--surface)' }}>
                                            <div
                                                style={{
                                                    width: `${(c.c / c.t) * 100}%`,
                                                    height: '100%',
                                                    borderRadius: 4,
                                                    background: c.fill
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <IconLink size={18} />
                                    <div className="display" style={{ fontSize: 22 }}>
                                        Quick links
                                    </div>
                                </div>
                                <button className="btn ghost sm">
                                    <IconPlus size={13} />
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '4px 4px 8px' }}>
                                {[
                                    { kind: 'link', label: 'USCIS', glyph: 'U', color: 'peri', sub: 'case status' },
                                    { kind: 'link', label: 'Drive', glyph: 'D', color: 'butter', sub: '47 docs' },
                                    {
                                        kind: 'folder',
                                        label: 'Government',
                                        color: 'blush',
                                        children: [
                                            { glyph: 'C', color: 'blush' },
                                            { glyph: 'S', color: 'peri' },
                                            { glyph: 'I', color: 'butter' },
                                            { glyph: 'T', color: 'sage' }
                                        ]
                                    },
                                    { kind: 'link', label: 'Embassy', glyph: 'E', color: 'sage', sub: 'interview' },
                                    {
                                        kind: 'folder',
                                        label: 'Translations',
                                        color: 'lilac',
                                        children: [
                                            { glyph: 'B', color: 'blush' },
                                            { glyph: 'M', color: 'butter' },
                                            { glyph: 'P', color: 'peri' }
                                        ]
                                    },
                                    { kind: 'link', label: 'Lawyer', glyph: 'L', color: 'lilac', sub: 'Patel & Co.' },
                                    { kind: 'link', label: 'Tracker', glyph: 'T', color: 'butter', sub: 'case forum' },
                                    { kind: 'add', label: 'Add' }
                                ].map((it, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 8,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {it.kind === 'link' && (
                                            <div
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 16,
                                                    background: `var(--${it.color})`,
                                                    border: `1px solid var(--${it.color}-d)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 1px 0 oklch(1 0 0 / 0.4) inset, 0 2px 6px oklch(0.20 0.02 270 / 0.06)'
                                                }}
                                            >
                                                <span className="display" style={{ fontSize: 26, color: 'var(--ink)', lineHeight: 1 }}>
                                                    {it.glyph}
                                                </span>
                                            </div>
                                        )}
                                        {it.kind === 'folder' && (
                                            <div
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 16,
                                                    background: 'var(--surface-2)',
                                                    border: '1px solid var(--hairline)',
                                                    padding: 6,
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    gridTemplateRows: '1fr 1fr',
                                                    gap: 4,
                                                    boxShadow: '0 2px 6px oklch(0.20 0.02 270 / 0.06)'
                                                }}
                                            >
                                                {[0, 1, 2, 3].map((ci) => {
                                                    const c = it.children[ci];
                                                    return (
                                                        <div
                                                            key={ci}
                                                            style={{
                                                                borderRadius: 5,
                                                                background: c ? `var(--${c.color})` : 'transparent',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            {c && (
                                                                <span
                                                                    style={{
                                                                        fontFamily: 'var(--font-display)',
                                                                        fontSize: 11,
                                                                        color: 'var(--ink)'
                                                                    }}
                                                                >
                                                                    {c.glyph}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {it.kind === 'add' && (
                                            <div
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 16,
                                                    background: 'transparent',
                                                    border: '1.5px dashed var(--ink-3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--ink-3)'
                                                }}
                                            >
                                                <IconPlus size={20} />
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 500,
                                                textAlign: 'center',
                                                lineHeight: 1.2,
                                                maxWidth: 64,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                color: it.kind === 'add' ? 'var(--ink-3)' : 'var(--ink)'
                                            }}
                                        >
                                            {it.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

window.DashboardCalm = DashboardCalm;
window.DashboardStructured = DashboardStructured;
