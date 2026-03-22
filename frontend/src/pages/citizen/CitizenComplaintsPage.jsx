import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/CitizenComplaints.css";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"; // Fix 1: consistent env var

/* ════════════════════════════════════════════════════════════
   STATUS CONFIG
════════════════════════════════════════════════════════════ */
const STATUS_CONFIG = {
  SUBMITTED: {
    label:        "Submitted",
    citizenLabel: "Submitted",
    icon:         "📜",
    color:        "#60a5fa",
    bg:           "rgba(96,165,250,.12)",
    group:        "pending",
    hint:         "Your complaint has been received by the system.",
  },
  AWAITING_ASSIGNMENT: {
    label:        "Awaiting Assignment",
    citizenLabel: "Awaiting Assignment",
    icon:         "⏳",
    color:        "#f97316",
    bg:           "rgba(249,115,22,.12)",
    group:        "pending",
    hint:         "No worker is assigned to your area yet. You'll be notified when one becomes available.",
  },
  ASSIGNED: {
    label:        "Assigned",
    citizenLabel: "Worker Assigned",
    icon:         "⚔️",
    color:        "#a78bfa",
    bg:           "rgba(167,139,250,.12)",
    group:        "pending",
    hint:         "A worker has been assigned and will begin work shortly.",
  },
  IN_PROGRESS: {
    label:        "In Progress",
    citizenLabel: "Work In Progress",
    icon:         "🔨",
    color:        "#fbbf24",
    bg:           "rgba(251,191,36,.12)",
    group:        "pending",
    hint:         "The assigned worker is actively resolving your complaint.",
  },
  RESOLVED: {
    label:        "Resolved",
    citizenLabel: "Resolved",
    icon:         "✅",
    color:        "#34d399",
    bg:           "rgba(52,211,153,.12)",
    group:        "resolved",
    hint:         "The worker has completed the task. Awaiting AI or VAO verification.",
  },
  VERIFIED: {
    label:        "Verified",
    citizenLabel: "Verified",
    icon:         "🔮",
    color:        "#818cf8",
    bg:           "rgba(129,140,248,.12)",
    group:        "resolved",
    hint:         "The resolution has been verified by AI or VAO and is being finalised.",
  },
  CLOSED: {
    label:        "Closed",
    citizenLabel: "Closed",
    icon:         "🏁",
    color:        "#5d7a8a",
    bg:           "rgba(93,122,138,.12)",
    group:        "resolved",
    hint:         "This complaint has been archived and closed.",
  },
};

const ALL_STATUSES = [
  "SUBMITTED",
  "AWAITING_ASSIGNMENT",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "VERIFIED",
  "CLOSED",
];

const FILTERS = ["ALL", ...ALL_STATUSES];

const CATEGORY_ICONS = {
  GARBAGE:       "🗑️",
  DRAINAGE:      "🌊",
  ROAD_DAMAGE:   "🛤️",
  STREET_LIGHT:  "💡",
  WATER_SUPPLY:  "💧",
  PUBLIC_HEALTH: "⚕️",
  OTHER:         "📋",
};

const PROGRESS_PCT = {
  SUBMITTED:           10,
  AWAITING_ASSIGNMENT: 22,
  ASSIGNED:            38,
  IN_PROGRESS:         55,
  RESOLVED:            72,
  VERIFIED:            88,
  CLOSED:              100,
};

/* ════════════════════════════════════════════════════════════
   AUTH HELPERS
   Keys match saveSession() in LoginPage.jsx:
     accessToken | accountType | accountId
   TODO: extract to src/lib/apiClient.js — shared with
         CitizenDashboard, WorkerTasks, etc.
════════════════════════════════════════════════════════════ */
async function tryRefresh() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem("accessToken",  data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function apiFetch(url, options = {}, navigateFn) {
  const doRequest = (token) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

  // Fix 3: replace:true prevents back-button returning to broken page
  const clearAuth = () => {
    ["accessToken", "refreshToken", "accountId", "accountType", "villageId", "roles"]
      .forEach((k) => localStorage.removeItem(k));
    navigateFn("/login", { replace: true });
  };

  // Fix 4: trim() prevents "Bearer  null" malformed headers
  let token = localStorage.getItem("accessToken")?.trim();
  if (!token) { clearAuth(); return null; }

  let res = await doRequest(token);

  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (!newToken) { clearAuth(); return null; }
    res = await doRequest(newToken);
    if (res.status === 401) { clearAuth(); return null; }
  }

  return res;
}

/* ─── Status Badge ─── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    citizenLabel: status?.replace(/_/g, " ") || "Unknown",
    icon: "❓", color: "#5d785d", bg: "rgba(93,120,93,.12)",
  };
  return (
    <span
      className="cc-status-badge"
      style={{ "--status-color": cfg.color, "--status-bg": cfg.bg }}
    >
      <span className="cc-status-badge__dot" />
      {cfg.icon} {cfg.citizenLabel}
    </span>
  );
}

/* ─── Complaint Card ─── */
function ComplaintCard({ complaint, onClick }) {
  const cfg  = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.SUBMITTED;
  const icon = CATEGORY_ICONS[complaint.category] || "📋";
  const pct  = PROGRESS_PCT[complaint.status] ?? 0;

  return (
    <div
      className={`cc-card cc-card--${complaint.status}`}
      style={{ "--card-accent": cfg.color, "--progress-pct": `${pct}%`, "--progress-color": cfg.color }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="cc-card__accent" />
      <div className="cc-card__progress-track">
        <div className="cc-card__progress-fill" />
      </div>
      <div className="cc-card__top">
        <div className="cc-card__id-row">
          <span className="cc-card__cat-icon">{icon}</span>
          <span className="cc-card__id">{complaint.complaintId}</span>
        </div>
        <StatusBadge status={complaint.status} />
      </div>
      <p className="cc-card__category">
        {complaint.category?.replace(/_/g, " ")}
      </p>
      <p className="cc-card__desc">{complaint.description}</p>
      <p className="cc-card__hint">{cfg.hint}</p>
      <div className="cc-card__meta">
        <span className="cc-card__date">
          📅{" "}
          {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
          })}
        </span>
        {complaint.workerName && (
          <span className="cc-card__worker" title="Assigned worker">
            ⚔️ {complaint.workerName}
          </span>
        )}
        {complaint.workerRating != null && (
          <span className="cc-card__rating">⭐ {complaint.workerRating}/5</span>
        )}
        <span className="cc-card__arrow">→</span>
      </div>
      {complaint.beforeImageUrl && (
        <div className="cc-card__thumb-wrap">
          <img
            src={complaint.beforeImageUrl}
            alt="Before evidence"
            className="cc-card__thumb"
          />
        </div>
      )}
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState({ filter, onNewComplaint }) {
  const cfg = filter !== "ALL" ? STATUS_CONFIG[filter] : null;
  return (
    <div className="cc-empty">
      <div className="cc-empty__icon">{cfg?.icon || "📜"}</div>
      <h3 className="cc-empty__title">
        {filter === "ALL"
          ? "No Complaints Yet"
          : `No ${cfg?.label || filter.replace(/_/g, " ")} Complaints`}
      </h3>
      <p className="cc-empty__sub">
        {filter === "ALL"
          ? "Your grievances shall appear here once submitted to the realm."
          : `No complaints with status "${cfg?.label || filter.replace(/_/g, " ")}" found in the scrolls.`}
      </p>
      {filter === "ALL" && (
        <button className="cs-btn cs-btn--primary" onClick={onNewComplaint}>
          📜 Lodge a Complaint
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
   Identity: JWT → userId → CitizenAccount — no citizenId in URLs.
════════════════════════════════════════════════════════════ */
export default function CitizenComplaintsPage() {
  const navigate = useNavigate();

  // Fix 2: pre-render auth guard — checked before any state or JSX
  const token = localStorage.getItem("accessToken")?.trim();
  const role  = localStorage.getItem("accountType");
  const isAuthorized = !!(token && role === "CITIZEN");

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [filter,     setFilter]     = useState("ALL");
  const [visible,    setVisible]    = useState(false);

  // Redirect fires in effect (hooks must run before early return)
  useEffect(() => {
    if (!isAuthorized) { navigate("/login", { replace: true }); }
  }, [isAuthorized, navigate]);

  useEffect(() => {
    if (!isAuthorized) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      const res = await apiFetch(`${API}/citizen/complaints/my`, {}, navigate);
      if (!res) return; // auth failed, redirect triggered inside apiFetch

      try {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setComplaints(
          (Array.isArray(data) ? data : []).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [isAuthorized, navigate]);

  // Suppress all JSX for non-citizens — redirect is already in flight
  if (!isAuthorized) return null;

  /* ── Fix 5: memoized counts — only recalculates when complaints change ── */
  const counts = useMemo(() => FILTERS.reduce((acc, f) => {
    acc[f] = f === "ALL"
      ? complaints.length
      : complaints.filter((c) => c.status === f).length;
    return acc;
  }, {}), [complaints]);

  const filtered = filter === "ALL"
    ? complaints
    : complaints.filter((c) => c.status === filter);

  return (
    <>
      <Navbar />

      <div className="cc-page">
        <div className="cc-ambient" aria-hidden="true">
          <div className="cc-orb cc-orb--1" />
          <div className="cc-orb cc-orb--2" />
          <div className="cc-grid" />
        </div>

        <div className={`cc-wrap${visible ? " cc-wrap--visible" : ""}`}>

          <button
            className="cs-back"
            onClick={() => navigate("/citizen/dashboard")}
            type="button"
          >
            <span>←</span>
            <span>Return to Dashboard</span>
          </button>

          {/* ══ HEADER ══ */}
          <header className="cc-header">
            <div>
              <div className="cs-header__badge" style={{ marginBottom: 14 }}>
                <span className="cs-header__badge-dot" />
                📂 Complaint Registry
              </div>
              <h1 className="cc-header__title">My Complaints</h1>
              <p className="cc-header__sub">
                Track every grievance through the realm's full administrative
                pipeline — from submission to closure.
              </p>
            </div>
            <button
              className="cs-btn cs-btn--primary"
              onClick={() => navigate("/citizen/complaint/new")}
              type="button"
            >
              📜 New Complaint
            </button>
          </header>

          {/* ══ LIFECYCLE LEGEND ══ */}
          {!loading && !error && complaints.length > 0 && (
            <div className="cc-lifecycle">
              {ALL_STATUSES.map((s) => (
                <div key={s} className="cc-lifecycle__step">
                  <span
                    className="cc-lifecycle__dot"
                    style={{ background: STATUS_CONFIG[s].color }}
                  />
                  <span className="cc-lifecycle__name">
                    {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ══ FILTER BAR ══
              Fix 6: disabled instead of hidden for zero-count filters —
              prevents layout shift when data loads or changes.        */}
          <div className="cc-filter-bar">
            <button
              className={`cc-filter-btn${filter === "ALL" ? " cc-filter-btn--active" : ""}`}
              style={{ "--filter-color": "#c9a227" }}
              onClick={() => setFilter("ALL")}
              type="button"
            >
              All
              <span className="cc-filter-count">{counts["ALL"]}</span>
            </button>

            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                className={`cc-filter-btn${filter === s ? " cc-filter-btn--active" : ""}${counts[s] === 0 ? " cc-filter-btn--empty" : ""}`}
                style={{ "--filter-color": STATUS_CONFIG[s].color }}
                onClick={() => counts[s] > 0 && setFilter(s)}
                disabled={counts[s] === 0}
                type="button"
              >
                {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                <span className="cc-filter-count">{counts[s]}</span>
              </button>
            ))}
          </div>

          {/* ══ CONTENT ══ */}
          {loading ? (
            <div className="cc-loading">
              <span className="cc-loading__spin" />
              <span>Summoning complaints from the Citadel…</span>
            </div>
          ) : error ? (
            <div className="cc-error">
              <span>🐉</span>
              <div>
                <p className="cc-error__title">The ravens have faltered</p>
                <p className="cc-error__sub">{error}</p>
              </div>
              <button
                className="cs-btn cs-btn--ghost"
                onClick={() => window.location.reload()}
              >
                ↻ Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              filter={filter}
              onNewComplaint={() => navigate("/citizen/complaint/new")}
            />
          ) : (
            <div className="cc-grid-list">
              {filtered.map((c) => (
                <ComplaintCard
                  key={c.complaintId}
                  complaint={c}
                  onClick={() => navigate(`/citizen/complaints/${c.complaintId}`)}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      <Footer />
    </>
  );
}