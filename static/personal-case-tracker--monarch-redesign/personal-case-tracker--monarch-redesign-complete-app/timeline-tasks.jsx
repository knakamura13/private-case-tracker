/* global React */
const {
    Sidebar,
    Topbar,
    PageHeader,
    ByAvatar,
    StatusPill,
    IconCalendar,
    IconCheckSq,
    IconDoc,
    IconQuestion,
    IconClip,
    IconPlus,
    IconChev,
    IconClock,
    IconMore,
    IconCheck,
    IconFilter
} = window;

// ============================================================
// Timeline view — phase-based, with milestones grouped under each phase
// ============================================================
function TimelineView() {
    // Phases in order. Each one has a status that derives from its milestones.
    const phases = [
        {
            id: 'prep',
            title: 'Preparation',
            sub: 'Decide on K-1 vs. CR-1, choose a lawyer, sketch the plan.',
            status: 'done',
            milestones: [
                {
                    date: 'Jan 12, 2026',
                    title: 'Met with Sandra Liu (lawyer)',
                    body: "Initial consultation. Reviewed K-1 vs CR-1 trade-offs. Decided K-1 due to Sally's job timing.",
                    status: 'done',
                    who: 'k',
                    tags: ['lawyer'],
                    att: 1
                },
                {
                    date: 'Jan 04, 2026',
                    title: 'Decided on K-1 fiancé(e) visa',
                    body: 'Faster reunion (3–6 mo. vs 12+) outweighs the second AOS step.',
                    status: 'done',
                    who: 'k',
                    tags: ['decision']
                }
            ]
        },

        {
            id: 'evidence',
            title: 'Relationship evidence',
            sub: 'Photos, messages, trips, joint accounts, letters of support.',
            status: 'done',
            milestones: [
                {
                    date: 'Mar 10, 2026',
                    title: 'Bona fide evidence binder finalized',
                    body: '47 pages: photos with captions, joint travel itineraries, message logs, gift receipts, family letters of support.',
                    status: 'done',
                    who: 'a',
                    tags: ['evidence'],
                    att: 12
                },
                {
                    date: 'Feb 28, 2026',
                    title: 'Engagement (NYC)',
                    body: 'Brooklyn Bridge Park, Sunday morning. Six guests on a video call from São Paulo.',
                    status: 'done',
                    who: 'k',
                    tags: ['bona fide', 'photos'],
                    att: 8
                }
            ]
        },

        {
            id: 'marriage',
            title: 'Marriage license / ceremony',
            sub: 'K-1 path: marry within 90 days of US entry.',
            status: 'future',
            milestones: [
                {
                    date: '—',
                    time: 'after K-1 entry',
                    title: 'Marriage license · Suffolk County',
                    body: 'Apply in person at the County Clerk. 24-hour waiting period before ceremony.',
                    status: 'future',
                    tags: ['marriage']
                },
                {
                    date: '—',
                    time: 'within 90 days of entry',
                    title: 'Civil ceremony',
                    body: 'City Hall + small dinner. Full ceremony in Brazil after AOS.',
                    status: 'future',
                    tags: ['marriage']
                }
            ]
        },

        {
            id: 'drafting',
            title: 'Packet drafting',
            sub: 'Forms, fees, photos, supporting documents — assembled in order.',
            status: 'done',
            milestones: [
                {
                    date: 'Mar 13, 2026',
                    title: 'Form I-129F finalized',
                    body: 'Lawyer-reviewed. Both signed. Cover sheet + table of contents added.',
                    status: 'done',
                    who: 'k',
                    tags: ['I-129F']
                },
                {
                    date: 'Mar 11, 2026',
                    title: 'Passport photos · both',
                    body: 'USCIS-spec, ordered from FedEx. 2 of each.',
                    status: 'done',
                    who: 'a',
                    tags: ['photos'],
                    att: 4
                }
            ]
        },

        {
            id: 'filing',
            title: 'Filing',
            sub: 'Mailed packet, fee paid, tracking opened.',
            status: 'done',
            milestones: [
                {
                    date: 'Mar 14, 2026',
                    title: 'I-129F petition mailed',
                    body: 'USPS Priority Mail Express, tracking 9405 5036 9930 0098 7714 22. Package: I-129F, $675 fee, 2 photos, evidence binder (47p).',
                    status: 'done',
                    who: 'k',
                    tags: ['I-129F'],
                    att: 4
                }
            ]
        },

        {
            id: 'noa',
            title: 'Receipt notices',
            sub: 'USCIS confirms the petition and routes it to a service center.',
            status: 'active',
            milestones: [
                {
                    date: 'Apr 03, 2026',
                    title: 'NOA1 received',
                    body: 'USCIS issued receipt notice for I-129F. Receipt # EAC-26-145-22817. Routed to Vermont Service Center.',
                    status: 'done',
                    who: 'k',
                    tags: ['I-129F', 'USCIS'],
                    att: 1
                },
                {
                    date: '—',
                    time: 'estimated Aug 2026',
                    title: 'NOA2 / approval',
                    body: 'Average 4–6 month adjudication at Vermont SC.',
                    status: 'active',
                    tags: ['USCIS']
                }
            ]
        },

        {
            id: 'bio',
            title: 'Biometrics',
            sub: "Petitioner's fingerprints + photo at a local ASC.",
            status: 'active',
            milestones: [
                {
                    date: '—',
                    time: 'estimated May 18',
                    title: 'Biometrics appointment',
                    body: 'Letter pending. Local ASC likely Albany or NYC.',
                    status: 'active',
                    tags: ['USCIS']
                }
            ]
        },

        {
            id: 'interview',
            title: 'Interview preparation',
            sub: 'DS-160, medical exam, police certificate, document gathering.',
            status: 'future',
            milestones: [
                {
                    date: '—',
                    time: 'after NVC handoff',
                    title: 'DS-160 · online application',
                    body: 'Sally to complete in São Paulo. Photo upload required.',
                    status: 'future',
                    who: 'a',
                    tags: ['DS-160', 'consular']
                },
                {
                    date: '—',
                    time: 'T-2 weeks',
                    title: 'Medical exam · São Paulo panel physician',
                    body: 'Required for K-1. Sealed envelope to bring to interview.',
                    status: 'future',
                    who: 'a',
                    tags: ['medical', 'consular']
                },
                {
                    date: '—',
                    time: 'T-3 weeks',
                    title: 'Police certificate · Brazil',
                    body: 'From Polícia Federal. Apostilled.',
                    status: 'future',
                    who: 'a',
                    tags: ['consular']
                }
            ]
        },

        {
            id: 'post',
            title: 'Post-interview / waiting',
            sub: 'Visa printing, travel booking, packing for the move.',
            status: 'future',
            milestones: [
                {
                    date: '—',
                    time: 'T+1 week',
                    title: 'Visa printed and shipped',
                    body: 'Pickup at SEDEX point in São Paulo or DHL home delivery.',
                    status: 'future',
                    who: 'a',
                    tags: ['visa']
                },
                {
                    date: '—',
                    time: 'before flight',
                    title: 'Book one-way flight to JFK',
                    body: 'Carry sealed visa packet — DO NOT OPEN. Customs officer admits at port of entry.',
                    status: 'future',
                    tags: ['travel']
                }
            ]
        },

        {
            id: 'outcome',
            title: 'Final outcome',
            sub: 'Entry, marriage, AOS — the actual finish line.',
            status: 'future',
            milestones: [
                {
                    date: '—',
                    title: 'POE admission · CBP',
                    body: 'Officer stamps I-94 with K-1 admission. 90-day clock starts.',
                    status: 'future',
                    tags: ['entry']
                },
                {
                    date: '—',
                    time: 'within 90 days',
                    title: 'Marry + file I-485 (AOS)',
                    body: 'Adjustment of Status to permanent resident.',
                    status: 'future',
                    tags: ['AOS']
                }
            ]
        }
    ];

    // Compute summary
    const allMilestones = phases.flatMap((p) => p.milestones);
    const doneCount = allMilestones.filter((m) => m.status === 'done').length;
    const activeCount = allMilestones.filter((m) => m.status === 'active').length;
    const phasesDone = phases.filter((p) => p.status === 'done').length;
    const currentPhase = phases.find((p) => p.status === 'active') || phases.find((p) => p.status === 'future');

    return (
        <div className="bloom" style={{ display: 'flex', minHeight: 1080, background: 'var(--bg)' }}>
            <Sidebar active="timeline" />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Topbar placeholder="Search milestones…" />
                <div style={{ padding: '32px 32px 48px', flex: 1 }}>
                    <PageHeader
                        eyebrow={`${phases.length} phases · ${doneCount} milestones done · ${activeCount} in progress`}
                        title="Timeline"
                        sub="Each phase of the journey has its own set of milestones. Add a milestone to any phase as it happens — filed, received, scheduled, approved."
                    >
                        <button className="btn">
                            <IconFilter size={15} /> Filter
                        </button>
                        <button className="btn primary">
                            <IconPlus size={15} /> Add milestone
                        </button>
                    </PageHeader>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28 }}>
                        {/* Phase rail */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                            {phases.map((phase, pi) => {
                                const phaseDoneCount = phase.milestones.filter((m) => m.status === 'done').length;
                                const isLast = pi === phases.length - 1;
                                return (
                                    <div key={phase.id}>
                                        {/* Phase header */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 14,
                                                padding: '12px 18px',
                                                background:
                                                    phase.status === 'done'
                                                        ? 'var(--sage)'
                                                        : phase.status === 'active'
                                                          ? 'var(--peri)'
                                                          : 'var(--surface-2)',
                                                border: '1px solid',
                                                borderColor:
                                                    phase.status === 'done'
                                                        ? 'var(--sage-d)'
                                                        : phase.status === 'active'
                                                          ? 'var(--peri-d)'
                                                          : 'var(--hairline)',
                                                borderRadius: 'var(--r-md)',
                                                marginBottom: 18
                                            }}
                                        >
                                            <div
                                                className="mono"
                                                style={{
                                                    fontSize: 11,
                                                    color: 'var(--ink-3)',
                                                    width: 28
                                                }}
                                            >
                                                0{pi + 1}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="display" style={{ fontSize: 22, lineHeight: 1.2 }}>
                                                    {phase.title}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>{phase.sub}</div>
                                            </div>
                                            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                                {phaseDoneCount}/{phase.milestones.length}
                                            </span>
                                            <StatusPill
                                                status={phase.status === 'done' ? 'done' : phase.status === 'active' ? 'active' : 'note'}
                                            >
                                                {phase.status === 'done'
                                                    ? 'Complete'
                                                    : phase.status === 'active'
                                                      ? 'In progress'
                                                      : 'Upcoming'}
                                            </StatusPill>
                                        </div>

                                        {/* Milestones rail */}
                                        <div style={{ position: 'relative', paddingLeft: 28, marginLeft: 18 }}>
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: 11,
                                                    top: 8,
                                                    bottom: isLast ? 8 : -28,
                                                    width: 2,
                                                    background: 'var(--surface-3)'
                                                }}
                                            />
                                            {phase.milestones.map((e, i) => (
                                                <div key={i} style={{ position: 'relative', marginBottom: 14 }}>
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            left: -28,
                                                            top: 22,
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: 999,
                                                            background:
                                                                e.status === 'done'
                                                                    ? 'var(--sage-fill)'
                                                                    : e.status === 'active'
                                                                      ? 'var(--ink)'
                                                                      : 'var(--surface-3)',
                                                            border: '3px solid var(--bg)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: e.status === 'active' ? 'var(--butter-fill)' : 'var(--ink)'
                                                        }}
                                                    >
                                                        {e.status === 'done' && <IconCheck size={12} stroke={2.4} />}
                                                        {e.status === 'active' && <IconClock size={12} />}
                                                    </div>

                                                    <div
                                                        className="card"
                                                        style={{
                                                            padding: '18px 22px',
                                                            opacity: e.status === 'future' ? 0.78 : 1,
                                                            background: e.status === 'active' ? 'var(--peri)' : 'var(--surface)',
                                                            borderColor: e.status === 'active' ? 'transparent' : 'var(--hairline)'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                                            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                                                {e.date}
                                                            </span>
                                                            {e.time && (
                                                                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                                                                    · {e.time}
                                                                </span>
                                                            )}
                                                            <div style={{ flex: 1 }} />
                                                            <StatusPill
                                                                status={
                                                                    e.status === 'future'
                                                                        ? 'note'
                                                                        : e.status === 'active'
                                                                          ? 'active'
                                                                          : 'done'
                                                                }
                                                            >
                                                                {e.status === 'done'
                                                                    ? 'Done'
                                                                    : e.status === 'active'
                                                                      ? 'In progress'
                                                                      : 'Est.'}
                                                            </StatusPill>
                                                        </div>
                                                        <h3 className="display" style={{ fontSize: 18, marginBottom: 6, lineHeight: 1.25 }}>
                                                            {e.title}
                                                        </h3>
                                                        <p
                                                            style={{
                                                                fontSize: 13,
                                                                color: 'var(--ink-2)',
                                                                lineHeight: 1.55,
                                                                marginBottom: e.tags?.length ? 10 : 0,
                                                                textWrap: 'pretty'
                                                            }}
                                                        >
                                                            {e.body}
                                                        </p>
                                                        {(e.tags?.length || e.att || e.who) && (
                                                            <div
                                                                style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                                                            >
                                                                {e.tags?.map((t) => (
                                                                    <span
                                                                        key={t}
                                                                        className="pill"
                                                                        style={{
                                                                            height: 22,
                                                                            fontSize: 11,
                                                                            background:
                                                                                e.status === 'active'
                                                                                    ? 'var(--surface)'
                                                                                    : 'var(--surface-2)'
                                                                        }}
                                                                    >
                                                                        {t}
                                                                    </span>
                                                                ))}
                                                                {e.att > 0 && (
                                                                    <span
                                                                        className="pill"
                                                                        style={{
                                                                            height: 22,
                                                                            fontSize: 11,
                                                                            background:
                                                                                e.status === 'active'
                                                                                    ? 'var(--surface)'
                                                                                    : 'var(--surface-2)'
                                                                        }}
                                                                    >
                                                                        <IconClip size={11} /> {e.att}
                                                                    </span>
                                                                )}
                                                                <div style={{ flex: 1 }} />
                                                                {e.who && <ByAvatar who={e.who} />}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Add milestone to phase */}
                                            <button className="btn ghost sm" style={{ marginLeft: 0, color: 'var(--ink-3)' }}>
                                                <IconPlus size={12} /> Add milestone to {phase.title.toLowerCase()}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right rail — phase progress + at-a-glance */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 16,
                                position: 'sticky',
                                top: 24,
                                height: 'fit-content'
                            }}
                        >
                            <div className="card tinted-sage" style={{ padding: 22 }}>
                                <div className="eyebrow" style={{ marginBottom: 8 }}>
                                    Phases complete
                                </div>
                                <div className="display" style={{ fontSize: 48, lineHeight: 1, marginBottom: 6 }}>
                                    {phasesDone}
                                    <span style={{ color: 'oklch(0.32 0.10 150 / 0.5)' }}>/{phases.length}</span>
                                </div>
                                <p style={{ fontSize: 12, color: 'oklch(0.32 0.10 150)', lineHeight: 1.5 }}>
                                    {doneCount} milestones since Jan
                                </p>
                            </div>

                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid var(--hairline)' }}>
                                    <div className="eyebrow">Phase progress</div>
                                </div>
                                <div style={{ padding: '8px 12px' }}>
                                    {phases.map((p, i) => {
                                        const pDone = p.milestones.filter((m) => m.status === 'done').length;
                                        const pTotal = p.milestones.length;
                                        const dot =
                                            p.status === 'done'
                                                ? 'var(--sage-fill)'
                                                : p.status === 'active'
                                                  ? 'var(--ink)'
                                                  : 'var(--surface-3)';
                                        return (
                                            <div
                                                key={p.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    padding: '8px 10px',
                                                    borderRadius: 8,
                                                    fontSize: 12.5,
                                                    background: p.status === 'active' ? 'var(--peri)' : 'transparent'
                                                }}
                                            >
                                                <div style={{ width: 8, height: 8, borderRadius: 999, background: dot, flexShrink: 0 }} />
                                                <span
                                                    style={{
                                                        flex: 1,
                                                        color: p.status === 'future' ? 'var(--ink-3)' : 'var(--ink)',
                                                        fontWeight: p.status === 'active' ? 600 : 400
                                                    }}
                                                >
                                                    {p.title}
                                                </span>
                                                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                                                    {pDone}/{pTotal}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="card tinted-peri" style={{ padding: 22 }}>
                                <div className="eyebrow" style={{ marginBottom: 8 }}>
                                    Now
                                </div>
                                <div className="display" style={{ fontSize: 22, marginBottom: 6, lineHeight: 1.2 }}>
                                    {currentPhase?.title}
                                </div>
                                <p style={{ fontSize: 12, color: 'oklch(0.32 0.13 265)', lineHeight: 1.5 }}>{currentPhase?.sub}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Tasks view — Kanban-ish lists, like Trello
// ============================================================
function TasksView() {
    const lists = [
        {
            title: 'This week',
            color: 's-active',
            items: [
                {
                    t: "Translate Sally's birth certificate",
                    who: 'k',
                    due: 'Overdue · 5d',
                    urgent: true,
                    tags: ['I-129F', 'translation'],
                    sub: '2/4'
                },
                { t: 'Order new passport photos (both)', who: 'a', due: 'Wed Apr 30', tags: ['evidence'], sub: '0/2' },
                { t: 'Joint Chase account · first deposit', who: 'k', due: 'Fri May 02', tags: ['bona fide'] },
                { t: 'Compile 2025 messages export', who: 'a', due: 'Sat May 03', tags: ['evidence'] }
            ]
        },
        {
            title: 'Soon',
            color: 's-note',
            items: [
                { t: 'Confirm lawyer call', who: 'k', due: 'May 05', tags: ['lawyer'] },
                { t: 'Draft cover letter for biometrics', who: 'k', due: 'May 12', tags: ['USCIS'] },
                { t: "Request Sally's police certificate", who: 'a', due: 'May 20', tags: ['consular'] },
                { t: 'Schedule medical exam', who: 'a', due: 'Jun 01', tags: ['consular', 'DS-160'] }
            ]
        },
        {
            title: 'Waiting',
            color: 's-waiting',
            items: [
                { t: 'Biometrics letter from USCIS', who: null, due: '—', tags: ['USCIS'] },
                { t: 'NOA2 approval', who: null, due: 'Aug est.', tags: ['USCIS'] },
                { t: 'NVC case # assignment', who: null, due: 'Sep est.', tags: ['NVC'] }
            ]
        },
        {
            title: 'Done',
            color: 's-done',
            items: [
                { t: 'Mail I-129F packet', who: 'k', due: 'Mar 14', tags: ['I-129F'], done: true },
                { t: 'Receive NOA1', who: 'k', due: 'Apr 03', tags: ['USCIS'], done: true },
                { t: 'Save USCIS receipt', who: 'a', due: 'Mar 22', tags: ['USCIS'], done: true },
                { t: 'Bona fide binder', who: 'a', due: 'Mar 10', tags: ['evidence'], done: true }
            ]
        }
    ];

    return (
        <div className="bloom" style={{ display: 'flex', minHeight: 1080, background: 'var(--bg)' }}>
            <Sidebar active="tasks" />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Topbar placeholder="Search tasks…" />
                <div style={{ padding: '32px 32px 48px', flex: 1 }}>
                    <PageHeader
                        eyebrow="7 open · 4 done"
                        title="Tasks"
                        sub="Drag a card to reorder or move between lists. Click any card to open the full editor."
                    >
                        <button className="btn">
                            <IconFilter size={15} /> Filter
                        </button>
                        <button className="btn primary">
                            <IconPlus size={15} /> Add task
                        </button>
                    </PageHeader>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        {lists.map((list, li) => (
                            <div key={li} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px 6px' }}>
                                    <span className={`pill ${list.color}`}>{list.title}</span>
                                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                        {list.items.length}
                                    </span>
                                    <div style={{ flex: 1 }} />
                                    <IconMore size={14} style={{ color: 'var(--ink-3)' }} />
                                </div>
                                {list.items.map((t, i) => (
                                    <div key={i} className="card" style={{ padding: 16, opacity: t.done ? 0.7 : 1 }}>
                                        {t.urgent && (
                                            <div className="eyebrow" style={{ color: 'var(--blush-d)', marginBottom: 6 }}>
                                                ● overdue
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                marginBottom: 10,
                                                lineHeight: 1.4,
                                                textDecoration: t.done ? 'line-through' : 'none',
                                                color: t.done ? 'var(--ink-3)' : 'var(--ink)'
                                            }}
                                        >
                                            {t.t}
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                                            {t.tags.map((tag) => (
                                                <span key={tag} className="pill" style={{ height: 20, fontSize: 10, padding: '0 8px' }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-3)' }}>
                                            <IconCalendar size={12} />
                                            <span className="mono" style={{ color: t.urgent ? 'var(--blush-d)' : 'var(--ink-3)' }}>
                                                {t.due}
                                            </span>
                                            {t.sub && (
                                                <>
                                                    <div style={{ flex: 1 }} />
                                                    <span className="mono">
                                                        <IconCheckSq size={11} style={{ verticalAlign: -2 }} /> {t.sub}
                                                    </span>
                                                </>
                                            )}
                                            {t.who && (
                                                <>
                                                    {!t.sub && <div style={{ flex: 1 }} />}
                                                    <ByAvatar who={t.who} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    className="btn sm ghost"
                                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--ink-3)' }}
                                >
                                    <IconPlus size={13} /> Add a card
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

window.TimelineView = TimelineView;
window.TasksView = TasksView;
