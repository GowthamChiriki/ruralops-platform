import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";  // ✅ removed useParams — worker identity from JWT
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../Styles/WorkerActivity.css";

const API = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

/* ════════════════════════════════════════════════════════
   AUTH HELPERS
════════════════════════════════════════════════════════ */
function getToken() { return localStorage.getItem("accessToken"); }
function getRole()  { return localStorage.getItem("accountType"); }

async function authFetch(url, options = {}) {
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    localStorage.clear();
    const err = new Error("Session expired. Please log in again.");
    err.code = 401;
    throw err;
  }

  if (res.status === 403) {
    const err = new Error("You do not have permission to perform this action.");
    err.code = 403;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Server error: ${res.status}`);
  }

  return res;
}

/* ════════════════════════════════════════════════════════
   ROLE GUARD HOOK — only ROLE_WORKER may enter
════════════════════════════════════════════════════════ */
function useRequireRole(requiredRole) {
  const nav = useNavigate();

  useEffect(() => {
    const token = getToken();
    const role  = getRole();

    if (!token) {
      nav("/login", { replace: true });  // ✅ fixed: was "/workers/login"
      return;
    }
    if (role !== requiredRole) {
      nav("/unauthorized", { replace: true });
    }
  }, [nav, requiredRole]);
}

/* ════════════════════════════════════════════════════════
   CONFIG
════════════════════════════════════════════════════════ */
const EVENT_CFG = {
  submitted: { icon: "📜", color: "#a8bdd4", glow: "rgba(168,189,212,0.40)", label: "Complaint Submitted" },
  assigned:  { icon: "⚔",  color: "#a78bfa", glow: "rgba(167,139,250,0.40)", label: "Task Assigned"       },
  started:   { icon: "🔨", color: "#fbbf24", glow: "rgba(251,191,36,0.40)",  label: "Work Commenced"      },
  resolved:  { icon: "✅", color: "#34d399", glow: "rgba(52,211,153,0.40)",  label: "Task Resolved"       },
  verified:  { icon: "🔮", color: "#52b874", glow: "rgba(82,184,116,0.40)",  label: "AI Verified"         },
  closed:    { icon: "🏁", color: "#c8982a", glow: "rgba(200,152,42,0.45)",  label: "Complaint Closed"    },
};

const CATEGORY_CFG = {
  GARBAGE:       { icon: "🗑",  color: "#c8982a", label: "Garbage"      },
  DRAINAGE:      { icon: "🌊", color: "#3bbcd4", label: "Drainage"      },
  ROAD_DAMAGE:   { icon: "🛤",  color: "#c47818", label: "Road Damage"  },
  STREET_LIGHT:  { icon: "💡", color: "#d4b020", label: "Street Light"  },
  WATER_SUPPLY:  { icon: "💧", color: "#3bbcd4", label: "Water Supply"  },
  PUBLIC_HEALTH: { icon: "⚕",  color: "#c94444", label: "Public Health" },
  OTHER:         { icon: "📋", color: "#7a8fa6", label: "Other"         },
};

const catOf      = cat => CATEGORY_CFG[cat] || CATEGORY_CFG.OTHER;
const scoreColor = s => s == null ? "var(--wa-t4)" : s >= 70 ? "#34d399" : s >= 40 ? "#fbbf24" : "#f87171";

/* ════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════ */
function fmt(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}
function ago(ts) {
  if (!ts) return "";
  const d = Date.now() - new Date(ts);
  if (d < 0) return "";
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function resTime(c) {
  if (!c.resolvedAt) return null;
  const from = c.assignedAt;
  if (!from) return null;
  const mins = Math.round((new Date(c.resolvedAt) - new Date(from)) / 60000);
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${(mins / 60).toFixed(1)}h`;
  return `${(mins / 1440).toFixed(1)}d`;
}
function buildTimeline(c) {
  return [
    { type: "submitted", time: c.createdAt  },
    { type: "assigned",  time: c.assignedAt },
    { type: "started",   time: c.startedAt  },
    { type: "resolved",  time: c.resolvedAt },
    { type: "verified",  time: c.verifiedAt },
    { type: "closed",    time: c.closedAt   },
  ].filter(s => s.time).sort((a, b) => new Date(a.time) - new Date(b.time));
}

/* ════════════════════════════════════════════════════════
   SKELETON
════════════════════════════════════════════════════════ */
function Sk({ w = "100%", h, r = 8, mb = 0 }) {
  return <div className="wa-sk" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />;
}

/* ════════════════════════════════════════════════════════
   CLOSED COMPLAINT CARD
   ✅ removed workerId prop — nav uses JWT-resolved identity
════════════════════════════════════════════════════════ */
function ComplaintCard({ c, navigate, idx }) {
  const [open, setOpen] = useState(false);
  const timeline = buildTimeline(c);
  const cc = catOf(c.category);
  const rt = resTime(c);

  return (
    <div className="wa-card" style={{ animationDelay: `${0.04 + idx * 0.04}s` }}>

      <div className="wa-card__head" onClick={() => setOpen(o => !o)} role="button" tabIndex={0}
        onKeyDown={e => e.key === "Enter" && setOpen(o => !o)}>

        <div className="wa-card__head-left">
          <div className="wa-card__cat-icon"
            style={{ background: `${cc.color}18`, border: `1px solid ${cc.color}30`, color: cc.color }}>
            {cc.icon}
          </div>

          <div className="wa-card__meta">
            <div className="wa-card__id-row">
              <span className="wa-card__id">#{c.complaintId}</span>
              <span className="wa-card__cat-badge"
                style={{ color: cc.color, borderColor: `${cc.color}28`, background: `${cc.color}0d` }}>
                {cc.icon} {cc.label}
              </span>
              <span className="wa-card__closed-pill">🏁 Closed</span>
              {c.aiVerified && <span className="wa-card__verified-pill">🔮 AI Verified</span>}
            </div>
            <p className="wa-card__desc">
              {c.description?.length > 90 ? c.description.slice(0, 90) + "…" : c.description || "No description"}
            </p>
            {c.areaName && <p className="wa-card__area">📍 {c.areaName}</p>}
          </div>
        </div>

        <div className="wa-card__head-right">
          {c.aiCleanScore != null && (
            <div className="wa-card__score-wrap">
              <span className="wa-card__score-num" style={{ color: scoreColor(c.aiCleanScore) }}>
                {c.aiCleanScore}
              </span>
              <span className="wa-card__score-denom">/100</span>
              <span className="wa-card__score-lbl">AI Score</span>
            </div>
          )}
          {rt && (
            <div className="wa-card__rt">
              <span className="wa-card__rt-val">{rt}</span>
              <span className="wa-card__rt-lbl">Time Taken</span>
            </div>
          )}
          <div className="wa-card__closed-on">
            <span className="wa-card__closed-on-val">{fmtDate(c.closedAt)}</span>
            <span className="wa-card__closed-on-lbl">Closed On</span>
          </div>
          <span className={`wa-card__toggle${open ? " wa-card__toggle--open" : ""}`}>›</span>
        </div>
      </div>

      <div className={`wa-card__body${open ? " wa-card__body--open" : ""}`}>
        <div className="wa-card__body-inner">

          <p className="wa-card__tl-title">⚡ Full Journey — {timeline.length} milestones</p>

          <div className="wa-tl">
            {timeline.map((step, i) => {
              const cfg    = EVENT_CFG[step.type];
              const isLast = i === timeline.length - 1;
              return (
                <div key={step.type} className="wa-tl__row">
                  <div className="wa-tl__connector">
                    <div className="wa-tl__node"
                      style={{ background: `${cfg.color}20`, border: `1.5px solid ${cfg.color}55`, boxShadow: `0 0 10px ${cfg.glow}` }}>
                      {cfg.icon}
                    </div>
                    {!isLast && (
                      <div className="wa-tl__line"
                        style={{ background: `linear-gradient(180deg, ${cfg.color}35 0%, transparent 100%)` }} />
                    )}
                  </div>
                  <div className="wa-tl__info">
                    <div className="wa-tl__info-top">
                      <span className="wa-tl__label" style={{ color: cfg.color }}>{cfg.label}</span>
                      {step.type === "verified" && c.aiCleanScore != null && (
                        <span className="wa-tl__ai-score" style={{ color: scoreColor(c.aiCleanScore) }}>
                          AI Score: {c.aiCleanScore}/100
                        </span>
                      )}
                      <span className="wa-tl__ago">{ago(step.time)}</span>
                    </div>
                    <p className="wa-tl__time">{fmt(step.time)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="wa-card__actions">
            {/* ✅ fixed: was /worker/${workerId}/complaint/${c.complaintId} */}
            <button className="wa-act-btn wa-act-btn--details"
              onClick={e => { e.stopPropagation(); navigate(`/worker/complaint/${c.complaintId}`); }}
              type="button">
              👁 View Full Details
            </button>
            <button className="wa-act-btn wa-act-btn--tasks"
              onClick={e => { e.stopPropagation(); navigate(`/worker/tasks`); }}
              type="button">
              ← All Tasks
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function WorkerActivity() {
  // ✅ worker identity comes from JWT — no useParams needed
  const navigate = useNavigate();

  // ── Role guard ──
  useRequireRole("WORKER");

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [authError,  setAuthError]  = useState(null);
  const [visible,    setVisible]    = useState(false);
  const [sortBy,     setSortBy]     = useState("newest");
  const [catFilter,  setCatFilter]  = useState("ALL");

  /*
   * GET /workers/complaints
   * SecurityConfig: hasRole("WORKER") — worker resolved from JWT, NOT from URL path.
   */
  const fetchData = useCallback(async () => {
    setError(null);
    setAuthError(null);
    try {
      const res  = await authFetch(`${API}/workers/complaints`);
      const data = await res.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.code === 401) {
        setAuthError(e.message);
        // ✅ fixed: was "/workers/login"
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } else if (e.code === 403) {
        setAuthError(e.message);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (!loading && !error && !authError) {
      const t = setTimeout(() => setVisible(true), 40);
      return () => clearTimeout(t);
    }
  }, [loading, error, authError]);

  /* ── only CLOSED complaints ── */
  const closed = useMemo(
    () => complaints.filter(c => c.status === "CLOSED"),
    [complaints]
  );

  /* ── category filter options built from actual data ── */
  const categories = useMemo(() => {
    const seen = new Set(closed.map(c => c.category).filter(Boolean));
    return ["ALL", ...Array.from(seen)];
  }, [closed]);

  /* ── final list ── */
  const displayed = useMemo(() => {
    let list = catFilter === "ALL" ? closed : closed.filter(c => c.category === catFilter);
    return [...list].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.closedAt || b.createdAt) - new Date(a.closedAt || a.createdAt);
      if (sortBy === "oldest") return new Date(a.closedAt || a.createdAt) - new Date(b.closedAt || b.createdAt);
      if (sortBy === "score")  return (b.aiCleanScore ?? -1) - (a.aiCleanScore ?? -1);
      return 0;
    });
  }, [closed, catFilter, sortBy]);

  /* ── aggregate stats ── */
  const stats = useMemo(() => {
    const scored   = closed.filter(c => c.aiCleanScore != null);
    const avgScore = scored.length
      ? Math.round(scored.reduce((s, c) => s + c.aiCleanScore, 0) / scored.length)
      : null;
    const verified = closed.filter(c => c.aiVerified === true).length;
    const withTime = closed.filter(c => c.resolvedAt && (c.startedAt || c.assignedAt || c.createdAt));
    let avgRes = null;
    if (withTime.length) {
      const totalMins = withTime.reduce((s, c) => {
        const from = c.assignedAt;
        return s + Math.max(0, (new Date(c.resolvedAt) - new Date(from)) / 60000);
      }, 0);
      const m = Math.round(totalMins / withTime.length);
      avgRes = m < 60 ? `${m}m` : `${(m / 60).toFixed(1)}h`;
    }
    return { total: closed.length, avgScore, verified, avgRes };
  }, [closed]);

  /* ════════════════════
     LOADING
  ════════════════════ */
  if (loading) return (
    <>
      <Navbar />
      <div className="wa-page">
        <div className="wa-ambient"><div className="wa-orb wa-orb--1"/><div className="wa-orb wa-orb--2"/></div>
        <div className="wa-wrap">
          <Sk h={22} w={280} mb={20} r={4} />
          <Sk h={190} r={18} mb={24} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            {[0,1,2,3].map(i => <Sk key={i} h={90} r={10} />)}
          </div>
          {[0,1,2,3].map(i => <Sk key={i} h={100} r={12} mb={12} />)}
        </div>
      </div>
      <Footer />
    </>
  );

  /* ════════════════════
     AUTH ERROR
  ════════════════════ */
  if (authError) return (
    <>
      <Navbar />
      <div className="wa-page wa-page--center">
        <div className="wa-error-box">
          <span style={{ fontSize: 46 }}>🔒</span>
          <h2 className="wa-error-box__title">Access Denied</h2>
          <p className="wa-error-box__msg">{authError}</p>
          {authError.includes("expired") && (
            // ✅ fixed: was "/workers/login"
            <button className="wa-btn wa-btn--gold"
              onClick={() => navigate("/login", { replace: true })} type="button">
              Go to Login
            </button>
          )}
        </div>
      </div>
      <Footer />
    </>
  );

  /* ════════════════════
     ERROR
  ════════════════════ */
  if (error) return (
    <>
      <Navbar />
      <div className="wa-page wa-page--center">
        <div className="wa-error-box">
          <span style={{ fontSize: 46 }}>⚠️</span>
          <h2 className="wa-error-box__title">Failed to Load Activity</h2>
          <p className="wa-error-box__msg">{error}</p>
          <button className="wa-btn wa-btn--gold" onClick={fetchData} type="button">↺ Retry</button>
        </div>
      </div>
      <Footer />
    </>
  );

  /* ════════════════════
     RENDER
  ════════════════════ */
  return (
    <>
      <Navbar />

      <div className="wa-page">
        <div className="wa-ambient" aria-hidden="true">
          <div className="wa-orb wa-orb--1"/>
          <div className="wa-orb wa-orb--2"/>
          <div className="wa-orb wa-orb--3"/>
          <div className="wa-dot-grid"/>
        </div>

        <div className={`wa-wrap${visible ? " wa-wrap--visible" : ""}`}>

          {/* ── BREADCRUMB ── */}
          {/* ✅ fixed: removed /${workerId} from all nav calls; removed workerId display */}
          <nav className="wa-breadcrumb">
            <button className="wa-breadcrumb__item"
              onClick={() => navigate(`/worker/dashboard`)} type="button">
              🏰 Command Post
            </button>
            <span className="wa-breadcrumb__sep">›</span>
            <button className="wa-breadcrumb__item"
              onClick={() => navigate(`/worker/tasks`)} type="button">
              ⚔ Task Board
            </button>
            <span className="wa-breadcrumb__sep">›</span>
            <span className="wa-breadcrumb__current">🕒 Battle Chronicle</span>
          </nav>

          {/* ── AUTH ERROR BANNER (401 / 403) ── */}
          {authError && (
            <div className="wa-error-banner">
              🔒 {authError}
              {authError.includes("expired") && (
                // ✅ fixed: was "/workers/login"
                <button onClick={() => navigate("/login", { replace: true })}>
                  Go to Login
                </button>
              )}
            </div>
          )}

          {/* ── HERO ── */}
          <header className="wa-hero">
            <div className="wa-hero__glow" aria-hidden="true"/>
            <div className="wa-hero__scanlines" aria-hidden="true"/>

            <div className="wa-hero__inner">
              <div className="wa-hero__left">
                <p className="wa-hero__eyebrow">
                  <span className="wa-hero__dot"/>
                  FIELD RECORDS  ·  CLOSED CAMPAIGNS
                </p>
                <h1 className="wa-hero__title">
                  <span className="wa-hero__title-sm">Battle</span>
                  <span className="wa-hero__title-lg">Chronicle</span>
                </h1>
                <p className="wa-hero__tagline">
                  Every closed complaint recorded for the annals — full journey from raven
                  received to gates sealed, with AI verification scores and resolution times.
                </p>
                <div className="wa-hero__actions">
                  {/* ✅ fixed: was /worker/${workerId}/dashboard */}
                  <button className="wa-btn wa-btn--gold"
                    onClick={() => navigate(`/worker/dashboard`)} type="button">
                    🏰 Back to Dashboard
                  </button>
                  <button className="wa-btn wa-btn--red"
                    onClick={() => navigate(`/worker/tasks`)} type="button">
                    ⚔ All Tasks
                  </button>
                  <button className="wa-btn wa-btn--ghost" onClick={fetchData} type="button">
                    ↺ Refresh
                  </button>
                </div>
              </div>

              <div className="wa-hero__sigil">
                <div className="wa-sigil-ring">
                  <div className="wa-sigil-inner">
                    <span className="wa-sigil-num">{stats.total}</span>
                    <span className="wa-sigil-lbl">Closed</span>
                  </div>
                </div>
                <div className="wa-sigil-sub">
                  {stats.avgScore != null && (
                    <span className="wa-sigil-sub__item" style={{ color: scoreColor(stats.avgScore) }}>
                      Avg {stats.avgScore}/100
                    </span>
                  )}
                  {stats.verified > 0 && (
                    <span className="wa-sigil-sub__item" style={{ color: "#52b874" }}>
                      {stats.verified} Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* ── STAT CARDS ── */}
          <div className="wa-stats-grid">
            {[
              { icon: "🏁", label: "Closed Tasks",  val: stats.total,                                              accent: "gold"    },
              { icon: "🔮", label: "AI Verified",    val: stats.verified,                                           accent: "emerald" },
              { icon: "🤖", label: "Avg AI Score",   val: stats.avgScore != null ? `${stats.avgScore}/100` : "N/A", accent: "amber"   },
              { icon: "⏱",  label: "Avg Resolution", val: stats.avgRes ?? "—",                                      accent: "steel"   },
            ].map(({ icon, label, val, accent }) => (
              <div key={label} className={`wa-stat-card wa-stat-card--${accent}`}>
                <div className={`wa-stat-card__icon-wrap wa-stat-card__icon-wrap--${accent}`}>{icon}</div>
                <span className="wa-stat-card__val">{val}</span>
                <span className="wa-stat-card__lbl">{label}</span>
              </div>
            ))}
          </div>

          {/* ── CONTROLS ── */}
          <div className="wa-controls">
            <div className="wa-cat-pills">
              {categories.map(cat => {
                const cfg      = cat === "ALL" ? null : catOf(cat);
                const isActive = catFilter === cat;
                return (
                  <button
                    key={cat}
                    className={`wa-cat-pill${isActive ? " wa-cat-pill--active" : ""}`}
                    onClick={() => setCatFilter(cat)}
                    style={isActive && cfg
                      ? { borderColor: `${cfg.color}50`, color: cfg.color, background: `${cfg.color}12` }
                      : {}}
                    type="button"
                  >
                    {cfg ? `${cfg.icon} ${cfg.label}` : "📋 All"}
                  </button>
                );
              })}
            </div>

            <div className="wa-controls__right">
              <div className="wa-sort">
                <label className="wa-sort__lbl">Sort:</label>
                <select className="wa-sort__sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Newest Closed</option>
                  <option value="oldest">Oldest Closed</option>
                  <option value="score">AI Score ↓</option>
                </select>
              </div>
              <span className="wa-result-count">
                {displayed.length} record{displayed.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* ── CARDS ── */}
          {displayed.length === 0 ? (
            <div className="wa-empty">
              <span className="wa-empty__icon">🏰</span>
              <p className="wa-empty__title">No closed campaigns yet</p>
              <p className="wa-empty__sub">
                Closed complaints will appear here once tasks have been fully resolved and archived.
              </p>
              <button className="wa-btn wa-btn--ghost"
                onClick={() => navigate(`/worker/tasks`)} type="button">
                ⚔ View Active Tasks
              </button>
            </div>
          ) : (
            <div className="wa-cards">
              {/* ✅ fixed: removed workerId={profile?.workerId} prop */}
              {displayed.map((c, idx) => (
                <ComplaintCard
                  key={c.complaintId}
                  c={c}
                  navigate={navigate}
                  idx={idx}
                />
              ))}
            </div>
          )}

          {/* ── BOTTOM NAV ── */}
          <div className="wa-bottom-nav">
            {/* ✅ fixed: was /worker/${workerId}/dashboard */}
            <button className="wa-btn wa-btn--gold"
              onClick={() => navigate(`/worker/dashboard`)} type="button">
              🏰 Back to Dashboard
            </button>
            <button className="wa-btn wa-btn--red"
              onClick={() => navigate(`/worker/tasks`)} type="button">
              ⚔ All Tasks
            </button>
            <button className="wa-btn wa-btn--ghost"
              onClick={() => navigate(`/worker/tasks?status=ASSIGNED`)} type="button">
              📋 Assigned Tasks
            </button>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}