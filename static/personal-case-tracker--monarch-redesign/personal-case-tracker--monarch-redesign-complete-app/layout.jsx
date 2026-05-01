/* global React */

const { IconHome, IconCalendar, IconCheckSq, IconDoc, IconQuestion,
  IconSettings, IconSearch, IconPlus, IconBell, IconLink, IconShield,
  IconLogout, IconHeart2, IconChev, IconClock, IconMore } = window;

// ============================================================
// Sidebar — K-1 case nav
// ============================================================
function Sidebar({ active = "dashboard" }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: IconHome },
    { id: "timeline",  label: "Timeline",  icon: IconCalendar },
    { id: "tasks",     label: "Tasks",     icon: IconCheckSq, count: 7 },
    { id: "evidence",  label: "Evidence",  icon: IconDoc, count: 24 },
    { id: "questions", label: "Questions", icon: IconQuestion, count: 4 },
    { id: "links",     label: "Quick links", icon: IconLink },
  ];
  return (
    <aside style={{
      width: 240, padding: "28px 20px",
      background: "var(--bg)",
      borderRight: "1px solid var(--hairline)",
      display: "flex", flexDirection: "column", gap: 28,
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 8px" }}>
        <img src="monarch-logo.png" alt="Monarch" width="40" height="32" style={{ flexShrink: 0, display: "block", objectFit: "contain" }} />
        <div className="display" style={{ fontSize: 24, lineHeight: 1, letterSpacing: "-0.01em" }}>monarch</div>
      </div>

      <div>
        <div className="eyebrow" style={{ padding: "0 16px 10px" }}>Our case</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map(it => {
            const I = it.icon;
            return (
              <div key={it.id} className={`nav-item ${active === it.id ? "active" : ""}`}>
                <I size={18} />
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.count != null && (
                  <span className="mono" style={{
                    fontSize: 11,
                    background: active === it.id ? "oklch(0.30 0.02 270)" : "var(--surface-3)",
                    padding: "2px 7px",
                    borderRadius: 999,
                    color: active === it.id ? "var(--butter-fill)" : "var(--ink-2)",
                  }}>{it.count}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="eyebrow" style={{ padding: "0 16px 10px" }}>Account</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="nav-item"><IconSettings size={18} /><span>Settings</span></div>
        </div>
      </div>

      <div style={{ marginTop: "auto" }}>
        <div className="card-tight" style={{
          background: "var(--peri)", border: "1px solid transparent",
          padding: 14,
        }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Next step</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
            USCIS biometrics
          </div>
          <div className="mono" style={{ fontSize: 11, color: "oklch(0.32 0.13 265)" }}>
            <IconClock size={11} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            Mon, May 18 · 9:30 AM
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "16px 8px 0", marginTop: 12,
          borderTop: "1px solid var(--hairline)",
        }}>
          <div style={{ display: "flex" }}>
            <div className="avatar sm sage" style={{ border: "2px solid var(--bg)" }}>K</div>
            <div className="avatar sm blush" style={{ border: "2px solid var(--bg)", marginLeft: -8 }}>A</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Kyle &amp; Sally</div>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>private · 2 members</div>
          </div>
          <IconLogout size={14} style={{ color: "var(--ink-3)" }} />
        </div>
      </div>
    </aside>
  );
}

// ============================================================
// Topbar
// ============================================================
function Topbar({ children, placeholder = "Search tasks, evidence, questions…" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "20px 32px",
      borderBottom: "1px solid var(--hairline)",
      background: "var(--bg)",
    }}>
      <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
        <IconSearch size={16} style={{
          position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
          color: "var(--ink-3)",
        }} />
        <input className="input" style={{ paddingLeft: 44 }} placeholder={placeholder} />
        <span className="mono" style={{
          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: 11, color: "var(--ink-3)",
          background: "var(--surface-3)", padding: "2px 6px", borderRadius: 6,
        }}>⌘K</span>
      </div>
      {children}
      <button className="btn ghost" style={{ width: 44, padding: 0, justifyContent: "center" }}>
        <IconBell size={18} />
      </button>
      <button className="btn primary"><IconPlus size={16} /> Add</button>
    </div>
  );
}

// ============================================================
// Status pill — semantic shorthand
// ============================================================
function StatusPill({ status, children }) {
  const map = {
    done:    { cls: "s-done",    label: "Done" },
    urgent:  { cls: "s-urgent",  label: "Urgent" },
    waiting: { cls: "s-waiting", label: "Waiting" },
    active:  { cls: "s-active",  label: "In progress" },
    note:    { cls: "s-note",    label: "Note" },
  };
  const m = map[status] || map.note;
  return <span className={`pill ${m.cls}`}>{children || m.label}</span>;
}

// ============================================================
// Sparkline & Bar
// ============================================================
function Sparkline({ values, color = "var(--ink)", height = 36, fill = false }) {
  const w = 100, h = 100;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h * 0.9 - h * 0.05;
    return [x, y];
  });
  const path = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      {fill && <path d={area} fill={color} opacity="0.18" />}
      <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ============================================================
// Page header
// ============================================================
function PageHeader({ eyebrow, title, sub, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, gap: 24, flexWrap: "wrap" }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 12 }}>{eyebrow}</div>}
        <h1 className="display" style={{ fontSize: 56, lineHeight: 1 }}>{title}</h1>
        {sub && <p style={{ color: "var(--ink-2)", marginTop: 12, fontSize: 15, maxWidth: 560, lineHeight: 1.5, textWrap: "pretty" }}>{sub}</p>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>{children}</div>
    </div>
  );
}

// ============================================================
// Couple avatars (subtle "added by")
// ============================================================
function ByAvatar({ who }) {
  // who: 'k' or 'a'
  const cls = who === 'k' ? 'sage' : 'blush';
  const ltr = who === 'k' ? 'K' : 'A';
  return <div className={`avatar sm ${cls}`} style={{ width: 22, height: 22, fontSize: 10 }}>{ltr}</div>;
}

Object.assign(window, { Sidebar, Topbar, StatusPill, Sparkline, PageHeader, ByAvatar });
