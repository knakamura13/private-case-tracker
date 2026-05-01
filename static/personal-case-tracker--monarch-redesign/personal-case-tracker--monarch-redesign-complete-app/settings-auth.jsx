/* global React */
const { Sidebar, Topbar, PageHeader, ByAvatar,
  IconShield, IconLogout, IconPlus, IconCheck, IconHeart2,
  IconCalendar, IconClock, IconChev, IconSettings, IconLink } = window;

// ============================================================
// Settings
// ============================================================
function SettingsView() {
  return (
    <div className="bloom" style={{ display: "flex", minHeight: 1080, background: "var(--bg)" }}>
      <Sidebar active="settings" />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar />
        <div style={{ padding: "32px 32px 48px", flex: 1, maxWidth: 880 }}>
          <PageHeader eyebrow="Account" title="Settings" sub="Just the two of you. No one else can see this case." />

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Members */}
            <div className="card" style={{ padding: 28 }}>
              <div className="display" style={{ fontSize: 24, marginBottom: 16 }}>Members</div>
              {[
                { who: "k", n: "Kyle Nakamura", e: "kyle@nakamura.co", role: "Petitioner · admin" },
                { who: "a", n: "Sally Vidal",     e: "sally.vidal@gmail.com", role: "Beneficiary" },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderTop: i > 0 ? "1px solid var(--hairline)" : "none" }}>
                  <ByAvatar who={m.who} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{m.n}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{m.e}</div>
                  </div>
                  <span className="pill">{m.role}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "var(--surface-2)", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
                <IconShield size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
                This case is locked to 2 members. New invites are disabled.
              </div>
            </div>

            {/* Case */}
            <div className="card" style={{ padding: 28 }}>
              <div className="display" style={{ fontSize: 24, marginBottom: 16 }}>Case details</div>
              {[
                { l: "Case type",    v: "K-1 fiancé(e) visa" },
                { l: "Filed on",     v: "March 14, 2026" },
                { l: "Receipt #",    v: "EAC-26-145-22817", mono: true },
                { l: "Service center", v: "Vermont" },
                { l: "Lawyer",       v: "Sandra Liu · Liu & Park PLLC" },
              ].map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 16, padding: "12px 0", borderTop: i > 0 ? "1px solid var(--hairline)" : "none", alignItems: "center" }}>
                  <div className="eyebrow" style={{ marginBottom: 0 }}>{r.l}</div>
                  <div style={{ fontSize: 13, fontFamily: r.mono ? "var(--font-mono)" : "var(--font-ui)" }}>{r.v}</div>
                  <button className="btn ghost sm">Edit</button>
                </div>
              ))}
            </div>

            {/* Privacy */}
            <div className="card tinted-sage" style={{ padding: 28 }}>
              <div className="display" style={{ fontSize: 24, marginBottom: 8 }}>Privacy</div>
              <p style={{ fontSize: 13, color: "oklch(0.32 0.10 150)", lineHeight: 1.55, marginBottom: 16 }}>
                Your case data is encrypted at rest. Only authenticated members can read or write. Backups happen nightly.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn">Download backup</button>
                <button className="btn">Export to PDF</button>
              </div>
            </div>

            {/* Danger */}
            <div className="card" style={{ padding: 28 }}>
              <div className="display" style={{ fontSize: 22, marginBottom: 14, color: "var(--blush-d)" }}>Sign out</div>
              <button className="btn"><IconLogout size={15} /> Sign out of this device</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Auth — Login
// ============================================================
function AuthLogin() {
  return (
    <div className="bloom" style={{ minHeight: 1000, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
      <div style={{ width: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36, justifyContent: "center" }}>
          <img src="monarch-logo.png" alt="Monarch" width="64" height="52" style={{ display: "block", objectFit: "contain" }} />
          <span className="display" style={{ fontSize: 32 }}>monarch</span>
        </div>

        <p style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "center", marginTop: 0, marginBottom: 20, fontStyle: "italic", lineHeight: 1.5 }}>
          a long migration, mapped together
        </p>

        <div className="card" style={{ padding: 36 }}>
          <h1 className="display" style={{ fontSize: 36, marginBottom: 8 }}>Welcome back.</h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 28 }}>Sign in to continue your K-1 case.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Email</div>
              <input className="input" placeholder="you@email.com" defaultValue="kyle@nakamura.co" />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Password</div>
              <input className="input" type="password" defaultValue="••••••••••••" />
            </div>
            <button className="btn primary lg" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>Sign in</button>
            <button className="btn ghost sm" style={{ alignSelf: "center", color: "var(--ink-3)" }}>Forgot password?</button>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
          This case is private. Only invited members can sign in.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Auth — Invite (acceptance)
// ============================================================
function AuthInvite() {
  return (
    <div className="bloom" style={{ minHeight: 1000, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
      <div style={{ width: 480 }}>
        <div className="card tinted-blush" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <ByAvatar who="k" />
            <span style={{ fontSize: 13 }}>Kyle invited you</span>
          </div>
          <h1 className="display" style={{ fontSize: 40, marginBottom: 14 }}>You're invited to <em style={{ fontStyle: "italic" }}>our</em> case.</h1>
          <p style={{ fontSize: 14, color: "oklch(0.35 0.12 18)", lineHeight: 1.55, marginBottom: 28, textWrap: "pretty" }}>
            Kyle started a private workspace for our K-1 fiancé visa journey. Accept to start tracking it together.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="input" placeholder="Choose a password" type="password" />
            <button className="btn primary lg" style={{ width: "100%", justifyContent: "center" }}>Accept &amp; create account</button>
          </div>
          <p className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 18 }}>
            sally.vidal@gmail.com · expires in 7 days
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Onboarding
// ============================================================
function Onboarding() {
  return (
    <div className="bloom" style={{ minHeight: 1080, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
      <div style={{ width: 720 }}>
        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 36 }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{
              width: s === 2 ? 32 : 8, height: 8, borderRadius: 999,
              background: s <= 2 ? "var(--ink)" : "var(--surface-3)",
            }} />
          ))}
        </div>

        <div className="card" style={{ padding: 48 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Step 2 of 4 · Your case</div>
          <h1 className="display" style={{ fontSize: 44, marginBottom: 14, lineHeight: 1.05 }}>
            Where are you in the process?
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, marginBottom: 32 }}>
            We'll set up the right milestones, evidence categories, and reminders for your stage.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { t: "We're engaged, planning to file", s: "Pre-I-129F · evidence collection",         active: false },
              { t: "I-129F is filed, waiting on USCIS", s: "Receipt received, awaiting biometrics or NOA2", active: true },
              { t: "Approved, at NVC / consulate stage", s: "Case forwarded, scheduling interview",   active: false },
              { t: "Visa issued, planning entry",     s: "K-1 stamped, 6-month entry window",       active: false },
              { t: "In the US, planning AOS",         s: "Married, filing I-485 to green card",     active: false },
            ].map((opt, i) => (
              <label key={i} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "16px 18px", borderRadius: 16,
                background: opt.active ? "var(--peri)" : "var(--surface-2)",
                border: "1px solid " + (opt.active ? "var(--peri-d)" : "var(--hairline)"),
                cursor: "pointer",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 999,
                  border: "2px solid " + (opt.active ? "var(--ink)" : "var(--ink-3)"),
                  background: opt.active ? "var(--ink)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {opt.active && <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--butter-fill)" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{opt.t}</div>
                  <div style={{ fontSize: 12, color: opt.active ? "oklch(0.32 0.13 265)" : "var(--ink-3)" }}>{opt.s}</div>
                </div>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--hairline)" }}>
            <button className="btn ghost">← Back</button>
            <button className="btn primary lg">Continue <IconChev size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SettingsView = SettingsView;
window.AuthLogin = AuthLogin;
window.AuthInvite = AuthInvite;
window.Onboarding = Onboarding;
