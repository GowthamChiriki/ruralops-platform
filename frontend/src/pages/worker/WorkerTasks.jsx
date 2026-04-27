import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../styles/WorkerTasks.css";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

/* ─── API base ─── */
const API = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

/* ════════════════════════════════════════════
   AUTH HELPERS
   Keys match saveSession() in LoginPage.jsx.
   Worker identity: JWT → userId → WorkerAccount
   No workerId in URLs — identity is server-side.
════════════════════════════════════════════ */
function getToken()      { return localStorage.getItem("accessToken"); }
function getAccountType(){ return localStorage.getItem("accountType"); }

async function authFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
  return res;
}

/* ─── Status config ─── */
const STATUS_CFG = {
  ASSIGNED:    { label: "Assigned",    icon: "⚔",  color: "#a78bfa", glow: "rgba(167,139,250,0.35)", bg: "rgba(107,63,160,0.12)", border: "rgba(107,63,160,0.40)" },
  IN_PROGRESS: { label: "In Progress", icon: "🔨", color: "#fbbf24", glow: "rgba(251,191,36,0.35)",  bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.38)" },
  RESOLVED:    { label: "Resolved",    icon: "✅", color: "#34d399", glow: "rgba(52,211,153,0.35)",  bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.36)" },
  VERIFIED:    { label: "Verified",    icon: "🔮", color: "#52b874", glow: "rgba(82,184,116,0.35)",  bg: "rgba(82,184,116,0.10)",  border: "rgba(82,184,116,0.36)" },
  CLOSED:      { label: "Closed",      icon: "🏁", color: "#5d785d", glow: "rgba(93,120,93,0.30)",   bg: "rgba(93,120,93,0.10)",   border: "rgba(93,120,93,0.32)" },
};

const CATEGORY_CFG = {
  GARBAGE:       { icon: "🗑", label: "Garbage",       color: "#c8982a" },
  DRAINAGE:      { icon: "🌊", label: "Drainage",      color: "#3bbcd4" },
  ROAD_DAMAGE:   { icon: "🛤",  label: "Road Damage",   color: "#c47818" },
  STREET_LIGHT:  { icon: "💡", label: "Street Light",  color: "#d4b020" },
  WATER_SUPPLY:  { icon: "💧", label: "Water Supply",  color: "#3bbcd4" },
  PUBLIC_HEALTH: { icon: "⚕",  label: "Public Health", color: "#c94444" },
  OTHER:         { icon: "📋", label: "Other",          color: "#7a8fa6" },
};

/* ─── Helpers ─── */
function formatDateShort(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function ageLabel(ts) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts);
  if (diff < 0) return "—";
  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0)  return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function getCfg(key, map) {
  return map[key] || map.OTHER || Object.values(map)[0];
}

/* ─── Counter animation ─── */
function Counter({ value }) {
  const [n, setN] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) { setN(0); return; }
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / 800, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{n}</>;
}

/* ─── StatusPill ─── */
function StatusPill({ status }) {
  const cfg = getCfg(status, STATUS_CFG);
  return (
    <span className="wt-pill" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <span className="wt-pill__dot" style={{ background: cfg.color, boxShadow: `0 0 5px ${cfg.glow}` }} />
      {cfg.icon} {cfg.label}
    </span>
  );
}

/* ─── CategoryBadge ─── */
function CategoryBadge({ category }) {
  const cfg = getCfg(category, CATEGORY_CFG);
  return (
    <span className="wt-cat" style={{ color: cfg.color, borderColor: `${cfg.color}30`, background: `${cfg.color}0d` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

/* ─── ScoreBadge ─── */
function ScoreBadge({ score }) {
  if (score == null) return <span className="wt-score wt-score--na">—</span>;
  const cls = score >= 70 ? "wt-score--hi" : score >= 40 ? "wt-score--mid" : "wt-score--lo";
  return (
    <span className={`wt-score ${cls}`}>
      {score}<span className="wt-score__sub">/100</span>
    </span>
  );
}

/* ─── Summary Stat Card ─── */
function SumCard({ icon, label, value, accent, onClick, delay }) {
  return (
    <div
      className={`wt-sum wt-sum--${accent}${onClick ? " wt-sum--link" : ""}`}
      style={{ animationDelay: delay }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === "Enter" && onClick() : undefined}
    >
      <div className={`wt-sum__icon wt-sum__icon--${accent}`}>{icon}</div>
      <div className="wt-sum__val"><Counter value={value} /></div>
      <div className="wt-sum__label">{label}</div>
    </div>
  );
}

/* ─── Filter Tab ─── */
function FilterTab({ id, label, icon, count, active, onClick }) {
  return (
    <button
      className={`wt-ftab${active ? " wt-ftab--active" : ""}`}
      onClick={() => onClick(id)}
      type="button"
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count > 0 && <span className="wt-ftab__count">{count}</span>}
    </button>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   Architecture: JWT → userId → WorkerAccount → tasks
   No useParams. No workerId in routes.
════════════════════════════════════════════ */
export default function WorkerTasks() {
  // Worker identity comes from JWT — no useParams needed
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isAuthorized = !!(getToken() && getAccountType() === "WORKER");

  const [tasks,         setTasks]    = useState([]);
  const [loading,       setLoading]  = useState(true);
  const [error,         setError]    = useState(null);
  const [authError,     setAuthError]= useState(null);
  const [visible,       setVisible]  = useState(false);
  const [activeFilter,  setFilter]   = useState("ALL");
  const [searchQ,       setSearchQ]  = useState("");
  const [sortBy,        setSortBy]   = useState("newest");
  const [actionLoading, setActL]     = useState({});
  const [actionError,   setActErr]   = useState(null);

  /* read ?status= from URL on mount */
  useEffect(() => {
    const s = searchParams.get("status");
    if (s) setFilter(s);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fetch tasks ──
     GET /workers/complaints — worker resolved from JWT, no ID in path */
  const fetchTasks = useCallback(async () => {
    if (!isAuthorized) return;
    setAuthError(null);
    try {
      const res = await authFetch(`${API}/workers/complaints`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      if (e.code === 401) {
        setAuthError(e.message);
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } else if (e.code === 403) {
        setAuthError(e.message);
      } else {
        setError(e.message);
      }
    }
  }, [isAuthorized, navigate]);

  useEffect(() => {
    async function init() { setLoading(true); await fetchTasks(); setLoading(false); }
    init();
  }, [fetchTasks]);

  useEffect(() => {
    if (!loading && !error && !authError) {
      const t = setTimeout(() => setVisible(true), 40);
      return () => clearTimeout(t);
    }
  }, [loading, error, authError]);

  /* ─ stats ─ */
  const stats = useMemo(() => ({
    all:        tasks.length,
    assigned:   tasks.filter(t => t.status === "ASSIGNED").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    resolved:   tasks.filter(t => t.status === "RESOLVED").length,
    verified:   tasks.filter(t => t.status === "VERIFIED").length,
    closed:     tasks.filter(t => t.status === "CLOSED").length,
    urgent:     tasks.filter(t => t.category === "PUBLIC_HEALTH" && ["ASSIGNED","IN_PROGRESS"].includes(t.status)).length,
  }), [tasks]);

  /* ─ filter + sort + search ─ */
  const displayed = useMemo(() => {
    let list = tasks;
    if (activeFilter !== "ALL") list = list.filter(t => t.status === activeFilter);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(t =>
        String(t.complaintId).includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.areaName    || "").toLowerCase().includes(q) ||
        (t.category    || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "score")  return (b.aiCleanScore ?? -1) - (a.aiCleanScore ?? -1);
      return 0;
    });
  }, [tasks, activeFilter, searchQ, sortBy]);

  /* ─ start task ─
     POST /workers/complaints/{complaintId}/start — worker from JWT */
  async function handleStart(complaintId) {
    setActL(l => ({ ...l, [complaintId]: true }));
    setActErr(null);
    try {
      const res = await authFetch(
        `${API}/workers/complaints/${complaintId}/start`,
        { method: "PATCH" }
      );
      if (!res.ok) throw new Error(`Server ${res.status}`);
      await fetchTasks();
    } catch (e) {
      if (e.code === 401) {
        setAuthError(e.message);
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } else if (e.code === 403) {
        setActErr("You do not have permission to start this task.");
      } else {
        setActErr(`Could not start task: ${e.message}`);
      }
    }
    setActL(l => ({ ...l, [complaintId]: false }));
  }

  const FILTERS = [
    { id: "ALL",         label: "All Tasks",   icon: "📋", count: stats.all        },
    { id: "ASSIGNED",    label: "Assigned",    icon: "⚔",  count: stats.assigned   },
    { id: "IN_PROGRESS", label: "In Progress", icon: "🔨", count: stats.inProgress },
    { id: "RESOLVED",    label: "Resolved",    icon: "✅", count: stats.resolved   },
    { id: "VERIFIED",    label: "Verified",    icon: "🔮", count: stats.verified   },
    { id: "CLOSED",      label: "Closed",      icon: "🏁", count: stats.closed     },
  ];

  /* ════════════════════════════════════════════
     EARLY RETURNS
  ════════════════════════════════════════════ */
  if (!isAuthorized) return (
    <>
      <Navbar />
      <div className="wt-page wt-page--center">
        <div className="wt-error-box">
          <div className="wt-error-box__icon">⚔</div>
          <div className="wt-error-box__code">401</div>
          <h2 className="wt-error-box__title">Unauthorised Access</h2>
          <p className="wt-error-box__msg">You do not have the authority to view these tasks.</p>
          <div className="wt-error-box__btns">
            <a href="/login" className="wt-btn wt-btn--gold">→ Login</a>
            <a href="/"      className="wt-btn wt-btn--ghost">← Home</a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  if (authError) return (
    <>
      <Navbar />
      <div className="wt-page wt-page--center">
        <div className="wt-error-box">
          <div className="wt-error-box__icon">🔒</div>
          <h2 className="wt-error-box__title">Access Denied</h2>
          <p className="wt-error-box__msg">{authError}</p>
          <div className="wt-error-box__btns">
            {authError.includes("expired") && (
              <a href="/login" className="wt-btn wt-btn--gold">→ Log In Again</a>
            )}
            <a href="/" className="wt-btn wt-btn--ghost">← Home</a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  if (loading) return (
    <>
      <Navbar />
      <div className="wt-page">
        <div className="wt-ambient"><div className="wt-orb wt-orb--1"/><div className="wt-orb wt-orb--2"/></div>
        <div className="wt-wrap">
          <div className="wt-sk" style={{ width: "100%", height: 80, borderRadius: 16, marginBottom: 24 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[0,1,2,3,4].map(i => <div key={i} className="wt-sk" style={{ height: 96, borderRadius: 10 }} />)}
          </div>
          <div className="wt-sk" style={{ width: "100%", height: 400, borderRadius: 14 }} />
        </div>
      </div>
      <Footer />
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div className="wt-page wt-page--center">
        <div className="wt-error-box">
          <div className="wt-error-box__icon">⚠️</div>
          <h2 className="wt-error-box__title">Failed to Load Tasks</h2>
          <p className="wt-error-box__msg">{error}</p>
          <button className="wt-btn wt-btn--gold" onClick={fetchTasks}>↺ Retry</button>
        </div>
      </div>
      <Footer />
    </>
  );

  /* ════════════════════════════════════════════
     MAIN RENDER
  ════════════════════════════════════════════ */
  return (
    <>
      <Navbar />

      <div className="wt-page">
        <div className="wt-ambient" aria-hidden="true">
          <div className="wt-orb wt-orb--1"/><div className="wt-orb wt-orb--2"/><div className="wt-orb wt-orb--3"/>
          <div className="wt-dot-grid"/>
        </div>

        <div className={`wt-wrap${visible ? " wt-wrap--visible" : ""}`}>

          {/* ── BREADCRUMB ── */}
          <nav className="wt-breadcrumb">
            <button
              className="wt-breadcrumb__item"
              onClick={() => navigate("/worker/dashboard")}
              type="button"
            >
              🏰 Command Post
            </button>
            <span className="wt-breadcrumb__sep">›</span>
            <span className="wt-breadcrumb__current">⚔ Task Board</span>
          </nav>

          {/* ── PAGE HEADER ── */}
          <header className="wt-hero">
            <div className="wt-hero__left">
              <p className="wt-hero__eyebrow">
                <span className="wt-hero__dot" />
                FIELD OPERATIONS  ·  TASK REGISTRY
              </p>
              <h1 className="wt-hero__title">
                <span className="wt-hero__title-line">War</span>
                <span className="wt-hero__title-accent">Council</span>
              </h1>
              <p className="wt-hero__tagline">
                All complaints sworn to your banner — review assignments, begin fieldwork,
                and record the outcome of each battle.
              </p>
              {stats.urgent > 0 && (
                <div className="wt-urgent-badge">
                  <span>🚨</span>
                  <span>{stats.urgent} urgent task{stats.urgent !== 1 ? "s" : ""} require immediate action</span>
                  <button
                    className="wt-urgent-badge__cta"
                    onClick={() => {
                      const urgentTask = tasks.find(
                        t => t.category === "PUBLIC_HEALTH" &&
                          ["ASSIGNED", "IN_PROGRESS"].includes(t.status)
                      );
                      if (urgentTask) navigate(`/worker/complaint/${urgentTask.complaintId}`);
                    }}
                    type="button"
                  >
                    View →
                  </button>
                </div>
              )}
              <div className="wt-hero__actions">
                <button
                  className="wt-btn wt-btn--gold"
                  onClick={() => navigate("/worker/dashboard")}
                  type="button"
                >
                  ← Back to Dashboard
                </button>
                <button className="wt-btn wt-btn--ghost" onClick={fetchTasks} type="button">
                  ↺ Refresh
                </button>
              </div>
            </div>
            <div className="wt-hero__sigil">
              <div className="wt-sigil-ring">
                <div className="wt-sigil-inner">
                  <span className="wt-sigil-num"><Counter value={stats.all} /></span>
                  <span className="wt-sigil-lbl">Total Tasks</span>
                </div>
              </div>
              <div className="wt-sigil-stats">
                <div className="wt-sigil-stat"><span style={{ color: "#a78bfa" }}>{stats.assigned}</span><span>Assigned</span></div>
                <div className="wt-sigil-stat"><span style={{ color: "#fbbf24" }}>{stats.inProgress}</span><span>Active</span></div>
                <div className="wt-sigil-stat"><span style={{ color: "#34d399" }}>{stats.resolved + stats.verified + stats.closed}</span><span>Done</span></div>
              </div>
            </div>
          </header>

          {/* ── SUMMARY CARDS ── */}
          <section className="wt-sumgrid">
            <SumCard icon="📋" label="Total"       value={stats.all}        accent="gold"   delay="0.06s" onClick={() => setFilter("ALL")} />
            <SumCard icon="⚔"  label="Assigned"    value={stats.assigned}   accent="violet" delay="0.09s" onClick={() => setFilter("ASSIGNED")} />
            <SumCard icon="🔨" label="In Progress"  value={stats.inProgress} accent="amber"  delay="0.12s" onClick={() => setFilter("IN_PROGRESS")} />
            <SumCard icon="✅" label="Resolved"     value={stats.resolved}   accent="green"  delay="0.15s" onClick={() => setFilter("RESOLVED")} />
            <SumCard icon="🔮" label="Verified"     value={stats.verified}   accent="steel"  delay="0.18s" onClick={() => setFilter("VERIFIED")} />
            <SumCard icon="🏁" label="Closed"       value={stats.closed}     accent="dim"    delay="0.21s" onClick={() => setFilter("CLOSED")} />
          </section>

          {/* ── TASK BOARD ── */}
          <section className="wt-board">

            {/* Filter tabs */}
            <div className="wt-board__tabs">
              {FILTERS.map(f => (
                <FilterTab key={f.id} {...f} active={activeFilter === f.id} onClick={setFilter} />
              ))}
              <span className="wt-live" style={{ marginLeft: "auto" }}>
                <span className="wt-live__dot" />Live
              </span>
            </div>

            {/* Controls row */}
            <div className="wt-board__controls">
              <div className="wt-search">
                <span className="wt-search__icon">🔍</span>
                <input
                  className="wt-search__input"
                  placeholder="Search by ID, description, area…"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                />
                {searchQ && (
                  <button className="wt-search__clear" onClick={() => setSearchQ("")} type="button">✕</button>
                )}
              </div>
              <div className="wt-sort">
                <label className="wt-sort__label">Sort:</label>
                <select
                  className="wt-sort__select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="score">AI Score ↓</option>
                </select>
              </div>
              <span className="wt-result-count">
                {displayed.length} task{displayed.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Action error */}
            {actionError && (
              <div className="wt-act-error">
                ⚠ {actionError}
                <button onClick={() => setActErr(null)} type="button">✕</button>
              </div>
            )}

            {/* Table header */}
            <div className="wt-table-head">
              <span style={{ flex: "0 0 36px" }} />
              <span style={{ flex: "0 0 90px" }}>ID</span>
              <span style={{ flex: 1 }}>Task</span>
              <span style={{ flex: "0 0 130px" }}>Category</span>
              <span style={{ flex: "0 0 160px", textAlign: "center" }}>Status</span>
              <span style={{ flex: "0 0 68px", textAlign: "center" }}>Score</span>
              <span style={{ flex: "0 0 110px" }}>Created</span>
              <span style={{ flex: "0 0 50px", textAlign: "center" }}>Age</span>
              <span style={{ flex: "0 0 200px", textAlign: "right" }}>Actions</span>
            </div>

            {/* Task list */}
            <div className="wt-list">
              {displayed.length === 0 ? (
                <div className="wt-empty">
                  <span className="wt-empty__icon">🏰</span>
                  <p className="wt-empty__title">No ravens received</p>
                  <p className="wt-empty__sub">
                    {searchQ ? "No tasks match your search" : "No tasks in this category"}
                  </p>
                </div>
              ) : (
                displayed.map((t, idx) => {
                  const catCfg   = getCfg(t.category, CATEGORY_CFG);
                  const isActive = ["ASSIGNED","IN_PROGRESS"].includes(t.status);
                  const isUrgent = t.category === "PUBLIC_HEALTH" && isActive;
                  const starting = actionLoading[t.complaintId];

                  return (
                    <div
                      key={t.complaintId}
                      className={`wt-row${isActive ? " wt-row--active" : ""}${isUrgent ? " wt-row--urgent" : ""}`}
                      style={{ animationDelay: `${0.03 + idx * 0.02}s` }}
                    >
                      {/* category icon */}
                      <div
                        className="wt-row__cat"
                        style={{ background: `${catCfg.color}18`, border: `1px solid ${catCfg.color}30`, color: catCfg.color }}
                        onClick={() => navigate(`/worker/complaint/${t.complaintId}`)}
                        title={catCfg.label}
                      >
                        {catCfg.icon}
                      </div>

                      {/* ID */}
                      <div className="wt-row__id" onClick={() => navigate(`/worker/complaint/${t.complaintId}`)}>
                        <span className="wt-row__id-num">#{t.complaintId}</span>
                        {isUrgent && <span className="wt-row__urgent-flag">🚨</span>}
                      </div>

                      {/* description */}
                      <div className="wt-row__info" onClick={() => navigate(`/worker/complaint/${t.complaintId}`)}>
                        <p className="wt-row__desc">
                          {(t.description?.length > 72 ? t.description.slice(0, 72) + "…" : t.description) || "No description provided"}
                        </p>
                        {t.areaName && <p className="wt-row__area">📍 {t.areaName}</p>}
                      </div>

                      {/* category */}
                      <div className="wt-row__cat-cell">
                        <CategoryBadge category={t.category} />
                      </div>

                      {/* status */}
                      <div className="wt-row__status-cell">
                        <StatusPill status={t.status} />
                      </div>

                      {/* score */}
                      <div className="wt-row__score-cell">
                        <ScoreBadge score={t.aiCleanScore} />
                      </div>

                      {/* date */}
                      <div className="wt-row__date">
                        {formatDateShort(t.createdAt)}
                      </div>

                      {/* age */}
                      <div className="wt-row__age">
                        <span className="wt-age-badge" style={{
                          color: (() => {
                            const label = ageLabel(t.createdAt);
                            const h = parseInt(label);
                            if (!h || isNaN(h)) return "var(--wt-t3)";
                            return h > 48 ? "#f87171" : h > 12 ? "#fbbf24" : "#34d399";
                          })()
                        }}>
                          {ageLabel(t.createdAt)}
                        </span>
                      </div>

                      {/* actions */}
                      <div className="wt-row__actions">
                        {t.status === "ASSIGNED" && (
                          <button
                            className="wt-act-btn wt-act-btn--start"
                            onClick={e => { e.stopPropagation(); handleStart(t.complaintId); }}
                            disabled={starting}
                            type="button"
                          >
                            {starting ? "…" : "▶ Start"}
                          </button>
                        )}
                        {t.status === "IN_PROGRESS" && (
                          <button
                            className="wt-act-btn wt-act-btn--done"
                            onClick={e => { e.stopPropagation(); navigate(`/worker/complaint/${t.complaintId}?action=complete`); }}
                            type="button"
                          >
                            ✓ Done
                          </button>
                        )}
                        <button
                          className="wt-act-btn wt-act-btn--details"
                          onClick={e => { e.stopPropagation(); navigate(`/worker/complaint/${t.complaintId}`); }}
                          type="button"
                        >
                          Details →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* footer summary */}
            {displayed.length > 0 && (
              <div className="wt-board__foot">
                <span>
                  Showing <strong>{displayed.length}</strong> of <strong>{stats.all}</strong> tasks
                </span>
                {activeFilter !== "ALL" && (
                  <button className="wt-btn wt-btn--ghost wt-btn--sm" onClick={() => setFilter("ALL")} type="button">
                    Clear Filter
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <Footer />
    </>
  );
}