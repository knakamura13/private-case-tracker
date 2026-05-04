/* global React */
const {
    Sidebar,
    Topbar,
    PageHeader,
    ByAvatar,
    StatusPill,
    IconDoc,
    IconQuestion,
    IconClip,
    IconPlus,
    IconChev,
    IconClock,
    IconMore,
    IconCheck,
    IconFilter,
    IconImage,
    IconFolder,
    IconLink,
    IconHeart2,
    IconShield,
    IconEye,
    IconCalendar
} = window;

// ============================================================
// Evidence view
// ============================================================
function EvidenceView() {
    const categories = [
        {
            id: 'bona',
            title: 'Bona fide relationship',
            count: 14,
            total: 18,
            tint: 'sage',
            icon: IconHeart2,
            items: [
                { t: 'Engagement photos · Brooklyn', k: '12 photos', who: 'k', date: 'Feb 28', type: 'image' },
                { t: 'Joint trip itinerary · Lisbon', k: 'PDF · 3p', who: 'a', date: 'Jan 14', type: 'doc' },
                { t: 'Message log · Whatsapp 2025', k: 'PDF · 412p', who: 'a', date: 'Mar 10', type: 'doc' },
                { t: 'Family video call screenshots', k: '8 images', who: 'k', date: 'Feb 28', type: 'image' },
                { t: 'Gift receipts (anniversary)', k: 'PDF · 4p', who: 'k', date: 'Dec 12', type: 'doc' },
                { t: "Letters of support · Sally's mom", k: 'PDF · 2p', who: 'a', date: 'Mar 02', type: 'doc' }
            ]
        },
        {
            id: 'forms',
            title: 'Forms & supporting',
            count: 8,
            total: 12,
            tint: 'butter',
            icon: IconShield,
            items: [
                { t: 'Form I-129F · final signed', k: 'PDF · 14p', who: 'k', date: 'Mar 13', type: 'doc' },
                { t: 'Form G-1145 (e-notification)', k: 'PDF · 1p', who: 'k', date: 'Mar 13', type: 'doc' },
                { t: "Kyle's tax returns 2023–2025", k: 'PDF · 22p', who: 'k', date: 'Mar 08', type: 'doc' },
                { t: 'Letter of intent to marry · Sally', k: 'PDF · 1p', who: 'a', date: 'Mar 09', type: 'doc' }
            ]
        },
        {
            id: 'vital',
            title: 'Vital records',
            count: 2,
            total: 8,
            tint: 'blush',
            icon: IconDoc,
            items: [
                { t: "Kyle's US birth certificate", k: 'PDF · 1p', who: 'k', date: 'Feb 21', type: 'doc' },
                { t: "Kyle's US passport bio page", k: 'Image', who: 'k', date: 'Feb 21', type: 'image' }
            ]
        }
    ];

    return (
        <div className="bloom" style={{ display: 'flex', minHeight: 1080, background: 'var(--bg)' }}>
            <Sidebar active="evidence" />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Topbar placeholder="Search evidence…" />
                <div style={{ padding: '32px 32px 48px', flex: 1 }}>
                    <PageHeader
                        eyebrow="24 of 38 items collected"
                        title="Evidence"
                        sub="Documents, photos, and proof — categorized for I-129F filing and the eventual consular interview."
                    >
                        <button className="btn">
                            <IconFilter size={15} /> Filter
                        </button>
                        <button className="btn primary">
                            <IconPlus size={15} /> Add evidence
                        </button>
                    </PageHeader>

                    {/* Category cards */}
                    <div className="bento" style={{ marginBottom: 12 }}>
                        {categories.map((c) => {
                            const I = c.icon;
                            return (
                                <div
                                    key={c.id}
                                    className={`cat-card card tinted-${c.tint} span-4`}
                                    style={{ padding: 24, position: 'relative' }}
                                >
                                    {/* Hover affordances */}
                                    <div
                                        className="cat-actions"
                                        style={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            display: 'flex',
                                            gap: 4,
                                            opacity: 0,
                                            transition: 'opacity .15s'
                                        }}
                                    >
                                        <button
                                            className="icon-btn"
                                            title="Rename"
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 8,
                                                border: '1px solid var(--hairline)',
                                                background: 'var(--surface)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <svg
                                                width="13"
                                                height="13"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M12 20h9" />
                                                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                            </svg>
                                        </button>
                                        <button
                                            className="icon-btn"
                                            title="Change color"
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 8,
                                                border: '1px solid var(--hairline)',
                                                background: 'var(--surface)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <svg
                                                width="13"
                                                height="13"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                                                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                                                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                                                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            className="icon-btn"
                                            title="Delete category"
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 8,
                                                border: '1px solid var(--hairline)',
                                                background: 'var(--surface)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: 'var(--ink-2)'
                                            }}
                                        >
                                            <svg
                                                width="13"
                                                height="13"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                <path d="M10 11v6M14 11v6" />
                                                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <I size={18} />
                                        <div className="eyebrow">{c.title}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                                        <span className="display" style={{ fontSize: 44, lineHeight: 1 }}>
                                            {c.count}
                                        </span>
                                        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                                            / {c.total} items
                                        </span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 4, background: 'var(--surface)' }}>
                                        <div
                                            style={{
                                                width: `${(c.count / c.total) * 100}%`,
                                                height: '100%',
                                                borderRadius: 4,
                                                background: 'var(--ink)'
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {/* (add-category control moved below — see right-aligned link) */}
                    </div>

                    {/* Tiny right-aligned add control */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                        <button
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                color: 'var(--ink-3)',
                                fontFamily: 'inherit',
                                fontSize: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                            }}
                        >
                            <IconPlus size={11} /> New category
                        </button>
                    </div>
                    <style>{`
            .cat-card:hover .cat-actions { opacity: 1; }
            .cat-actions .icon-btn:hover { background: var(--surface-2) !important; }
            .cat-row:hover .cat-row-actions { opacity: 1; }
            .cat-row .cat-title:hover { background: var(--surface-2); }
            .cat-row .cat-title:focus { background: var(--surface-2); outline: 2px solid var(--ink); outline-offset: 0; }
          `}</style>

                    {/* Items list grouped */}
                    {categories.map((c) => (
                        <div key={c.id} className="cat-row card" style={{ padding: 0, marginBottom: 18, overflow: 'hidden' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '16px 24px',
                                    borderBottom: '1px solid var(--hairline)'
                                }}
                            >
                                <span className="dot" style={{ background: `var(--${c.tint}-fill)` }} />
                                {/* contentEditable title — visible affordance via hover */}
                                <div
                                    className="cat-title"
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        padding: '2px 6px',
                                        margin: '-2px -6px',
                                        borderRadius: 6,
                                        cursor: 'text'
                                    }}
                                    suppressContentEditableWarning
                                >
                                    {c.title}
                                </div>
                                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                    {c.count} / {c.total}
                                </span>
                                <div style={{ flex: 1 }} />
                                <div
                                    className="cat-row-actions"
                                    style={{ display: 'flex', gap: 6, opacity: 0.3, transition: 'opacity .15s' }}
                                >
                                    <button className="btn sm ghost" title="Rename category" style={{ width: 30, padding: 0 }}>
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                        </svg>
                                    </button>
                                    <button className="btn sm ghost" title="Delete category" style={{ width: 30, padding: 0 }}>
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        </svg>
                                    </button>
                                </div>
                                <button className="btn sm">
                                    <IconPlus size={13} /> Add item
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 16 }}>
                                {c.items.map((item, i) => (
                                    <div
                                        key={i}
                                        style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}
                                    >
                                        <div
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 10,
                                                background: `var(--${c.tint})`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            {item.type === 'image' ? <IconImage size={18} /> : <IconDoc size={18} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    marginBottom: 4,
                                                    lineHeight: 1.3,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {item.t}
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    fontSize: 11,
                                                    color: 'var(--ink-3)'
                                                }}
                                            >
                                                <span className="mono">{item.k}</span>
                                                <span>·</span>
                                                <span className="mono">{item.date}</span>
                                                <div style={{ flex: 1 }} />
                                                <ByAvatar who={item.who} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Questions view — three threads
// ============================================================
function QuestionsView() {
    const threads = [
        {
            id: 'lawyer',
            title: 'For the lawyer',
            color: 's-waiting',
            count: 4,
            sub: 'Sandra Liu · next call May 5',
            items: [
                {
                    q: 'Does Sally need a new passport before consular interview?',
                    who: 'k',
                    date: 'Apr 22',
                    replies: 2,
                    tags: ['passport']
                },
                { q: "Tax filing status while she's abroad?", who: 'k', date: 'Apr 18', replies: 0, tags: ['taxes', 'I-864'] },
                { q: "If RFE issued, what's typical evidence ask?", who: 'a', date: 'Apr 14', replies: 3, tags: ['RFE'] },
                { q: 'Should we add joint health insurance now?', who: 'a', date: 'Apr 09', replies: 1, tags: ['bona fide'] }
            ]
        },
        {
            id: 'interview',
            title: 'Interview prep',
            color: 's-active',
            count: 6,
            sub: 'São Paulo consulate · est. Q4 2026',
            items: [
                { q: 'How did you meet?', who: 'k', date: 'Apr 20', replies: 4, tags: ['history'] },
                { q: 'When did you decide to get married?', who: 'a', date: 'Apr 20', replies: 2, tags: ['history'] },
                { q: "Have you met each other's families?", who: 'a', date: 'Apr 19', replies: 3, tags: ['family'] },
                { q: 'What will you do for work in the US?', who: 'a', date: 'Apr 19', replies: 1, tags: ['plans'] }
            ]
        },
        {
            id: 'us',
            title: 'Between us',
            color: 's-note',
            count: 2,
            sub: 'Just for the two of us',
            items: [
                { q: 'When should we sign the joint lease?', who: 'k', date: 'Apr 24', replies: 2, tags: ['bona fide', 'timing'] },
                { q: 'City Hall ceremony, or wait for a real wedding?', who: 'a', date: 'Apr 17', replies: 5, tags: ['wedding'] }
            ]
        }
    ];

    return (
        <div className="bloom" style={{ display: 'flex', minHeight: 1080, background: 'var(--bg)' }}>
            <Sidebar active="questions" />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Topbar placeholder="Search questions…" />
                <div style={{ padding: '32px 32px 48px', flex: 1 }}>
                    <PageHeader
                        eyebrow="3 threads · 12 questions"
                        title="Questions"
                        sub="Things we still need to figure out — sorted by who can answer them."
                    >
                        <button className="btn primary">
                            <IconPlus size={15} /> Add question
                        </button>
                    </PageHeader>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                        {threads.map((thread) => (
                            <div key={thread.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: 24, borderBottom: '1px solid var(--hairline)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                        <span className={`pill ${thread.color}`}>{thread.title}</span>
                                        <div style={{ flex: 1 }} />
                                        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                            {thread.count}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{thread.sub}</div>
                                </div>
                                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {thread.items.map((q, i) => (
                                        <div key={i} style={{ padding: 14, borderRadius: 12, background: 'var(--surface-2)' }}>
                                            <div style={{ fontSize: 13, lineHeight: 1.45, marginBottom: 10, textWrap: 'pretty' }}>
                                                {q.q}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                {q.tags.map((t) => (
                                                    <span
                                                        key={t}
                                                        className="pill"
                                                        style={{ height: 20, fontSize: 10, background: 'var(--surface)' }}
                                                    >
                                                        {t}
                                                    </span>
                                                ))}
                                                <div style={{ flex: 1 }} />
                                                <ByAvatar who={q.who} />
                                                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                                                    {q.date}
                                                </span>
                                                {q.replies > 0 && (
                                                    <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                                                        · {q.replies} replies
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        className="btn sm ghost"
                                        style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--ink-3)' }}
                                    >
                                        <IconPlus size={13} /> Ask a question
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

window.EvidenceView = EvidenceView;
window.QuestionsView = QuestionsView;
