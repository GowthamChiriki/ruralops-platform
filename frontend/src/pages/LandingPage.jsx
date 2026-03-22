import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import SystemIntroSection from "../components/SystemIntroSection";
import RolesSection from "../components/RolesSection";
import ProblemSection from "../components/ProblemSection";
import HowItWorksSection from "../components/HowItWorksSection";
import DesignPromisesSection from "../components/DesignPromisesSection";
import Footer from "../components/Footer";

/* ─────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────── */
const STATS = [
  { value: "45,400+", label: "Villages Connected",  icon: "🏘" },
  { value: "9.2M",   label: "Citizens Registered", icon: "👥" },
  { value: "98.4%",  label: "Uptime SLA",          icon: "⚡" },
  { value: "814+",   label: "Districts Deployed",  icon: "🗺" },
];

const TRUST_LOGOS = [
  { name: "Govt. of Telangana",      abbr: "GoT"  },
  { name: "Govt. of Andhra Pradesh", abbr: "GoAP" },
  { name: "Ministry of Rural Dev.",  abbr: "MoRD" },
  { name: "NABARD",                  abbr: "NAB"  },
  { name: "National Informatics",    abbr: "NIC"  },
  { name: "Digital India Corp.",     abbr: "DIC"  },
  { name: "Govt. of India.",         abbr: "GoI"  },
];

const FEATURE_HIGHLIGHTS = [
  { icon: "🛡", title: "Role-Based Access Control",  desc: "Every officer, field worker, and administrator gets precisely scoped access — no more, no less." },
  { icon: "📡", title: "Real-Time Field Sync",       desc: "Data from VAO inspections and citizen submissions reaches district dashboards within seconds." },
  { icon: "📊", title: "Village-Level Analytics",     desc: "Aggregated health scores, scheme enrollment gaps, and grievance trends — all in one command view." },
  { icon: "📱", title: "Works Offline Too",          desc: "Field staff can collect data in low-connectivity areas. Syncs automatically when network is restored." },
  { icon: "🔔", title: "Escalation Alerts",          desc: "Critical cases — overdue grievances, unassigned VAOs, crisis villages — surface automatically." },
  { icon: "📜", title: "Scheme Compliance Engine",   desc: "Tracks enrollment, disbursement, and eligibility coverage across all active government schemes." },
];

const TESTIMONIALS = [
  {
    quote: "RuralOps gave our district administration real visibility for the first time. Grievances that used to linger for weeks are now tracked and resolved within days.",
    name: "District Administrator",
    role: "Warangal District, Telangana",
    initial: "D",
    color: "#c07818",
  },
  {
    quote: "Being able to see scheme enrollment gaps across all villages in one screen — that's a capability we couldn't have imagined two years ago. Oversight has never been clearer.",
    name: "District Administrator",
    role: "Visakhapatnam District, Andhra Pradesh",
    initial: "D",
    color: "#1e6ea8",
  },
  {
    quote: "The inspection workflow is simple and fast. I can submit VAO reports directly from the field, even without connectivity, and they sync the moment I'm back in range.",
    name: "Village Officer",
    role: "Mandal Revenue Office, Karimnagar",
    initial: "V",
    color: "#2a8a50",
  },
  {
    quote: "Earlier we relied on paper registers and phone calls. Now every village record is digital, every update is instant, and nothing slips through because of missing paperwork.",
    name: "Village Officer",
    role: "Gram Panchayat, Guntur District",
    initial: "V",
    color: "#236e80",
  },
  {
    quote: "The offline sync feature changed everything for us. I collect data in remote areas all day and it all uploads automatically once I reach the mandal office. Zero data loss.",
    name: "Field Worker",
    role: "MGNREGS Supervisor, Nalgonda",
    initial: "F",
    color: "#7c5cfc",
  },
  {
    quote: "I registered my family for PM Awas in under ten minutes and tracked the approval right from my phone. I didn't have to visit any office or follow up with anyone.",
    name: "Citizen User",
    role: "PM Awas Beneficiary, Medak District",
    initial: "C",
    color: "#378a55",
  },
];

const SECURITY_POINTS = [
  { icon: "🔐", label: "End-to-End Encrypted" },
  { icon: "🏛",  label: "NIC Cloud Hosted"    },
  { icon: "🔍",  label: "Full Audit Logs"     },
];

/* ── Live ticker — all 28 Indian states ── */
const TICKER_ITEMS = [
  { dot: "green", state: "Telangana",         text: "6,400 villages — Field sync completed"                  },
  { dot: "gold",  state: "Andhra Pradesh",    text: "Grievance #GV-2041 resolved — Karimnagar"              },
  { dot: "blue",  state: "Maharashtra",       text: "VAO inspection completed — 24 villages"                },
  { dot: "green", state: "Rajasthan",         text: "348 new citizen registrations processed today"         },
  { dot: "red",   state: "Uttar Pradesh",     text: "Escalation raised — PM Awas delay, Medak"             },
  { dot: "gold",  state: "Karnataka",         text: "District collector reviewed 6 pending approvals"       },
  { dot: "green", state: "Tamil Nadu",        text: "Scheme compliance score updated — 94.2%"              },
  { dot: "blue",  state: "West Bengal",       text: "Grievance portal login spike — 1,240 sessions"        },
  { dot: "green", state: "Madhya Pradesh",    text: "PM Kisan disbursement verified — 4,200 farmers"       },
  { dot: "gold",  state: "Gujarat",           text: "New mandal onboarded — Surat Rural cluster"           },
  { dot: "red",   state: "Bihar",             text: "Overdue grievances flagged — 18 cases escalated"      },
  { dot: "green", state: "Punjab",            text: "Crop survey submitted — 6 villages, Ludhiana"         },
  { dot: "blue",  state: "Haryana",           text: "Field staff activated — 34 new accounts"              },
  { dot: "gold",  state: "Kerala",            text: "Health scheme enrollment hit 98% coverage"            },
  { dot: "green", state: "Odisha",            text: "MGNREGS work orders issued — 890 beneficiaries"       },
  { dot: "red",   state: "Chhattisgarh",      text: "Ration card sync error resolved — 220 records fixed"  },
  { dot: "green", state: "Jharkhand",         text: "Tribal welfare scheme data updated"                   },
  { dot: "blue",  state: "Assam",             text: "Flood relief tracking activated — 12 districts"       },
  { dot: "gold",  state: "Himachal Pradesh",  text: "Mountain village connectivity — 98.4% uptime"         },
  { dot: "green", state: "Uttarakhand",       text: "Revenue officer sync — 44 tehsils updated"            },
  { dot: "red",   state: "Manipur",           text: "Emergency escalation cleared — Imphal East"           },
  { dot: "blue",  state: "Meghalaya",         text: "Census update submitted — 180 villages"               },
  { dot: "green", state: "Tripura",           text: "Land record digitisation — 2,400 entries completed"   },
  { dot: "gold",  state: "Goa",               text: "Coastal village registry updated — 28 entries"        },
  { dot: "green", state: "Sikkim",            text: "Eco-tourism scheme enrollment — 140 applicants"       },
  { dot: "blue",  state: "Nagaland",          text: "Village council database synced"                      },
  { dot: "red",   state: "Arunachal Pradesh", text: "Remote station reconnected — 3 offline nodes cleared" },
  { dot: "gold",  state: "Mizoram",           text: "Digital literacy camp — 600 citizens registered"      },
];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      {/* ══════════════════════════════════════  HERO  ══════════════════════════════════════ */}
      <section className="lp-hero" aria-label="Hero">

        <div className="lp-hero-bg" aria-hidden="true">
          <div className="lp-hero-orb lp-hero-orb--1" />
          <div className="lp-hero-orb lp-hero-orb--2" />
          <div className="lp-hero-orb lp-hero-orb--3" />
          <div className="lp-hero-grid" />
        </div>

        <div className="lp-hero-inner">

          {/* ── LEFT: MONUMENTAL TEXT ── */}
          <div className="lp-hero-content">

            <div className="lp-hero-eyebrow">
              <span className="lp-eyebrow-dot" aria-hidden="true" />
              <span>Government Operations Platform</span>
              <span className="lp-eyebrow-version">v2.4</span>
            </div>

            <h1 className="lp-hero-title">
              RuralOps
              <span className="lp-hero-title-accent">
                The Operating System<br />for Rural Governance
              </span>
            </h1>

            <p className="lp-hero-desc">
              Monitor programs, detect risks early, and coordinate action
              across villages, mandals, and districts — in real time.
            </p>

            {/* 2 primary CTA buttons */}
            <div className="lp-hero-actions">
              <button
                className="lp-hero-cta lp-hero-cta--gold"
                onClick={() => navigate("/citizen/register")}
              >
                <span className="lp-cta-icon">📝</span>
                Register as Citizen
                <svg className="lp-cta-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>

              <button
                className="lp-hero-cta lp-hero-cta--teal"
                onClick={() => navigate("/login")}
              >
                <span className="lp-cta-icon">🔐</span>
                Official Login
                <svg className="lp-cta-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>

            <div className="lp-security-strip" role="list" aria-label="Security certifications">
              {SECURITY_POINTS.map((s) => (
                <span key={s.label} className="lp-security-item" role="listitem">
                  <span aria-hidden="true">{s.icon}</span>{s.label}
                </span>
              ))}
            </div>

          </div>

          {/* ── RIGHT: DASHBOARD VISUAL ── */}
          <div className="lp-hero-visual" aria-label="Live platform activity">

            {/* Live ticker */}
            <div className="lp-live-ticker" aria-label="Live platform updates ticker" aria-live="polite">
              <div className="lp-ticker-badge">
                <span className="lp-ticker-live-dot" aria-hidden="true" />
                Live
              </div>
              <div className="lp-ticker-track">
                <div className="lp-ticker-inner" aria-hidden="true">
                  {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                    <span key={i} className="lp-ticker-item">
                      <span className={`lp-ticker-dot lp-ticker-dot--${item.dot}`} />
                      <span className="lp-ticker-state">{item.state}</span>
                      {item.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Dashboard preview mockup */}
            <div className="lp-dashboard-mockup" aria-label="Dashboard preview">
              <div className="lp-dash-topbar">
                <div className="lp-dash-topbar-left">
                  <span className="lp-dash-dot lp-dash-dot--red" />
                  <span className="lp-dash-dot lp-dash-dot--gold" />
                  <span className="lp-dash-dot lp-dash-dot--green" />
                </div>
                <span className="lp-dash-topbar-title">RuralOps — District Command Centre</span>
                <div className="lp-dash-topbar-right">
                  <span className="lp-dash-live-badge">
                    <span className="lp-dash-live-dot" />
                    Live
                  </span>
                </div>
              </div>

              <div className="lp-dash-body">
                {/* Stat row */}
                <div className="lp-dash-stat-row">
                  {[
                    { label: "Villages Active",  value: "6,400+", color: "green" },
                    { label: "Grievances Open",  value: "142",    color: "gold"  },
                    { label: "Compliance",       value: "94.2%",  color: "green" },
                    { label: "Escalations",      value: "18",     color: "red"   },
                  ].map((s, i) => (
                    <div key={i} className="lp-dash-stat-tile" style={{ animationDelay: `${0.6 + i * 0.10}s` }}>
                      <span className={`lp-dash-stat-val lp-dash-stat-val--${s.color}`}>{s.value}</span>
                      <span className="lp-dash-stat-label">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Chart + sidebar */}
                <div className="lp-dash-main">
                  <div className="lp-dash-chart-panel">
                    <div className="lp-dash-panel-header">
                      <span className="lp-dash-panel-title">Grievance Resolution — Last 30 Days</span>
                      <span className="lp-dash-panel-badge lp-dash-panel-badge--green">↑ 12% this week</span>
                    </div>
                    <div className="lp-dash-chart">
                      {[45, 62, 38, 75, 55, 88, 70, 92, 65, 84, 78, 96, 72, 88, 94].map((h, i) => (
                        <div
                          key={i}
                          className="lp-dash-bar"
                          style={{ height: `${h}%`, animationDelay: `${0.8 + i * 0.05}s` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="lp-dash-side-panel">
                    <div className="lp-dash-panel-header">
                      <span className="lp-dash-panel-title">Recent Activity</span>
                    </div>
                    <div className="lp-dash-activity-list">
                      {[
                        { icon: "📋", text: "GV-2041 resolved",   sub: "Karimnagar",   color: "green", time: "2m"  },
                        { icon: "📡", text: "Field sync done",     sub: "24 villages",  color: "gold",  time: "5m"  },
                        { icon: "⚠️", text: "Escalation raised",  sub: "Medak Dist.",  color: "red",   time: "12m" },
                        { icon: "✅", text: "PM Kisan verified",   sub: "4,200 farmers",color: "green", time: "18m" },
                      ].map((a, i) => (
                        <div key={i} className="lp-dash-activity-row" style={{ animationDelay: `${0.9 + i * 0.10}s` }}>
                          <span className="lp-dash-activity-icon">{a.icon}</span>
                          <div className="lp-dash-activity-body">
                            <span className={`lp-dash-activity-text lp-dash-activity-text--${a.color}`}>{a.text}</span>
                            <span className="lp-dash-activity-sub">{a.sub}</span>
                          </div>
                          <span className="lp-dash-activity-time">{a.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* District compliance bar */}
                <div className="lp-dash-compliance-panel">
                  <div className="lp-dash-panel-header">
                    <span className="lp-dash-panel-title">District Compliance Leaderboard</span>
                  </div>
                  <div className="lp-dash-compliance-rows">
                    {[
                      { name: "Hyderabad",     pct: 97 },
                      { name: "Visakhapatnam", pct: 94 },
                      { name: "Guntur",        pct: 91 },
                      { name: "Karimnagar",    pct: 85 },
                    ].map((d, i) => (
                      <div key={i} className="lp-dash-compliance-row">
                        <span className="lp-dash-compliance-rank">{i + 1}</span>
                        <span className="lp-dash-compliance-name">{d.name}</span>
                        <div className="lp-dash-compliance-track">
                          <div
                            className="lp-dash-compliance-fill"
                            style={{ width: `${d.pct}%`, animationDelay: `${1.1 + i * 0.10}s` }}
                          />
                        </div>
                        <span className="lp-dash-compliance-pct">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="lp-hero-img-caption">
              Live platform data. Actual visibility depends on role and authorization.
            </p>

          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════  STATS BAR  ══════════════════════════════════════ */}
      <section className="lp-stats-bar" aria-label="Platform statistics">
        <div className="lp-stats-inner">
          {STATS.map((s, i) => (
            <div key={s.label} className="lp-stat-item">
              <span className="lp-stat-icon" aria-hidden="true">{s.icon}</span>
              <div className="lp-stat-body">
                <span className="lp-stat-value">{s.value}</span>
                <span className="lp-stat-label">{s.label}</span>
              </div>
              {i < STATS.length - 1 && <div className="lp-stat-divider" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </section>


      {/* ══════════════════════════════════════  TRUST BAR  ══════════════════════════════════════ */}
      <section className="lp-trust-bar" aria-label="Trusted partners">
        <p className="lp-trust-label">Trusted &amp; deployed in partnership with</p>
        <div className="lp-trust-logos" role="list">
          {TRUST_LOGOS.map((l) => (
            <div key={l.abbr} className="lp-trust-logo" role="listitem">
              <span className="lp-trust-crown" aria-hidden="true">♛</span>
              <span className="lp-trust-abbr">{l.abbr}</span>
              <span className="lp-trust-name">{l.name}</span>
            </div>
          ))}
        </div>
      </section>


      {/* ══════════════════════════════════════  SYSTEM INTRO  ══════════════════════════════════════ */}
      <div className="lp-section-sep" aria-hidden="true" />
      <div className="lp-imported-section">
        <SystemIntroSection />
      </div>

      <div className="lp-section-sep" aria-hidden="true" />

      {/* ══════════════════════════════════════  QUICK ACCESS TILES  ══════════════════════════════════════ */}
      <section className="lp-qa-section" aria-labelledby="qa-heading">
        <div className="lp-section-inner">
          <header className="lp-qa-header">
            <div className="lp-section-eyebrow">Get Started</div>
            <h2 id="qa-heading" className="lp-qa-title">
              Where would you like to <span className="lp-title-accent">begin?</span>
            </h2>
          </header>
          <div className="lp-qa-grid" role="list">

            <button className="lp-qa-tile lp-qa-tile--gold" role="listitem" onClick={() => navigate("/citizen/register")}>
              <div className="lp-qa-tile-top">
                <span className="lp-qa-tile-icon">📝</span>
                <svg className="lp-qa-tile-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
              <h3 className="lp-qa-tile-title">Register as Citizen</h3>
              <p className="lp-qa-tile-desc">Create your RuralOps account and access government services and scheme enrollment.</p>
              <span className="lp-qa-tile-cta">Get started →</span>
            </button>

            <button className="lp-qa-tile lp-qa-tile--teal" role="listitem" onClick={() => navigate("/citizen/status")}>
              <div className="lp-qa-tile-top">
                <span className="lp-qa-tile-icon">🔍</span>
                <svg className="lp-qa-tile-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
              <h3 className="lp-qa-tile-title">Check Status</h3>
              <p className="lp-qa-tile-desc">Track your registration, approval progress, and scheme application status in real time.</p>
              <span className="lp-qa-tile-cta">Track now →</span>
            </button>

            <button className="lp-qa-tile lp-qa-tile--green" role="listitem" onClick={() => navigate("/activate-account")}>
              <div className="lp-qa-tile-top">
                <span className="lp-qa-tile-icon">🔑</span>
                <svg className="lp-qa-tile-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
              <h3 className="lp-qa-tile-title">Activate Account</h3>
              <p className="lp-qa-tile-desc">Complete account activation with your official credentials and unlock full platform access.</p>
              <span className="lp-qa-tile-cta">Activate →</span>
            </button>

            <button className="lp-qa-tile lp-qa-tile--violet" role="listitem" onClick={() => navigate("/mobile-app")}>
              <div className="lp-qa-tile-top">
                <span className="lp-qa-tile-icon">📱</span>
                <svg className="lp-qa-tile-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
              <h3 className="lp-qa-tile-title">Download Mobile App</h3>
              <p className="lp-qa-tile-desc">Access RuralOps from the field. Works offline and syncs automatically when reconnected.</p>
              <span className="lp-qa-tile-cta">Download →</span>
            </button>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════  IMPORTED SECTIONS  ══════════════════════════════════════ */}
      <div className="lp-section-sep" aria-hidden="true" />
      <div className="lp-imported-section">
        <ProblemSection />
      </div>

      <div className="lp-section-sep" aria-hidden="true" />
      <div className="lp-imported-section">
        <RolesSection />
      </div>

      <div className="lp-section-sep" aria-hidden="true" />
      <div className="lp-imported-section">
        <HowItWorksSection />
      </div>


      {/* ══════════════════════════════════════  FEATURES  ══════════════════════════════════════ */}
      <div className="lp-section-sep" aria-hidden="true" />
      <section className="lp-features" aria-labelledby="features-heading">
        <div className="lp-section-inner">
          <header className="lp-section-header">
            <div className="lp-section-eyebrow">Platform Capabilities</div>
            <h2 id="features-heading" className="lp-section-title">
              Built for the Complexity of{" "}
              <span className="lp-title-accent">Real-World Governance</span>
            </h2>
            <p className="lp-section-desc">
              Every feature was designed around actual workflows observed across
              mandals, districts, and field teams — not just theoretical requirements.
            </p>
          </header>
          <div className="lp-features-grid" role="list">
            {FEATURE_HIGHLIGHTS.map((f, i) => (
              <article key={i} className="lp-feature-card" role="listitem">
                <div className="lp-feature-icon-wrap" aria-hidden="true">
                  <span className="lp-feature-icon">{f.icon}</span>
                </div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════  TESTIMONIALS  ══════════════════════════════════════ */}
      <section className="lp-testimonials" aria-labelledby="testimonials-heading">
        <div className="lp-section-inner">
          <header className="lp-section-header lp-section-header--center">
            <div className="lp-section-eyebrow">Voices from the Field</div>
            <h2 id="testimonials-heading" className="lp-section-title">
              What Administrators &amp;{" "}
              <span className="lp-title-accent">Programme Leaders Say</span>
            </h2>
          </header>
          <div className="lp-testimonials-grid" role="list">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="lp-testimonial-card" role="listitem">
                <div className="lp-testimonial-quote-mark" aria-hidden="true">"</div>
                <blockquote>
                  <p className="lp-testimonial-text">{t.quote}</p>
                </blockquote>
                <figcaption className="lp-testimonial-author">
                  <div
                    className="lp-testimonial-avatar"
                    style={{ background: `linear-gradient(135deg, ${t.color}cc, ${t.color}55)` }}
                    aria-hidden="true"
                  >
                    {t.initial}
                  </div>
                  <div className="lp-testimonial-meta">
                    <span className="lp-testimonial-name">{t.name}</span>
                    <span className="lp-testimonial-role">{t.role}</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════  DESIGN PROMISES  ══════════════════════════════════════ */}
      <div className="lp-section-sep" aria-hidden="true" />
      <div className="lp-imported-section">
        <DesignPromisesSection />
      </div>


      {/* ══════════════════════════════════════  CTA BANNER  ══════════════════════════════════════ */}
      <section className="lp-cta-banner" aria-label="Call to action">
        <div className="lp-cta-bg" aria-hidden="true">
          <div className="lp-cta-orb lp-cta-orb--1" />
          <div className="lp-cta-orb lp-cta-orb--2" />
          <div className="lp-cta-grid" />
        </div>
        <div className="lp-cta-inner">
          <div className="lp-cta-badge">
            <span className="lp-cta-badge-dot" aria-hidden="true" />
            Ready to Deploy
          </div>
          <h2 className="lp-cta-title">
            Bring Clarity to Your{" "}
            <span>Rural Operations Today</span>
          </h2>
          <p className="lp-cta-desc">
            Whether you're a district collector, a mandal officer, or a field worker —
            RuralOps gives you the tools to do your job better, faster, and with full accountability.
          </p>
          <div className="lp-cta-actions">
            <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={() => navigate("/citizen/register")}>
              Register as a Citizen <ArrowRight />
            </button>
            <button className="lp-btn lp-btn--outline-light lp-btn--lg" onClick={() => navigate("/login")}>
              Official Login &amp; Activation
            </button>
          </div>
          <div className="lp-cta-links">
            <Link to="/activate-account"   className="lp-cta-link">Activate Account</Link>
            <span className="lp-dot-sep" aria-hidden="true">·</span>
            <Link to="/activation/request" className="lp-cta-link">Request Activation Key</Link>
            <span className="lp-dot-sep" aria-hidden="true">·</span>
            <Link to="/citizen/status"     className="lp-cta-link">Check Status</Link>
            <span className="lp-dot-sep" aria-hidden="true">·</span>
            <Link to="/mobile-app"         className="lp-cta-link">Mobile App</Link>
          </div>
          <div className="lp-cta-reassurance" aria-label="Platform guarantees">
            <span>🔐 Secure &amp; government-compliant</span>
            <span className="lp-dot-sep" aria-hidden="true">·</span>
            <span>📱 Available on web &amp; mobile</span>
            <span className="lp-dot-sep" aria-hidden="true">·</span>
            <span>⚡ 24/7 operational support</span>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default LandingPage;