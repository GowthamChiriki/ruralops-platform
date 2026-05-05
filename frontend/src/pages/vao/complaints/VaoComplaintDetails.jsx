import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

import "../../../Styles/VaoComplaintDetails.css";

/* ════════════════════════════════════════════
   BASE URL — single source of truth
════════════════════════════════════════════ */
const BASE = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

/* ════════════════════════════════════════════
   AUTH HELPERS
════════════════════════════════════════════ */
function getToken()        { return localStorage.getItem("accessToken"); }
function getRefreshToken() { return localStorage.getItem("refreshToken"); }
// FIX: was getRole() → localStorage.getItem("role")
// All other files use "accountType" — fixed to match
function getRole()         { return localStorage.getItem("accountType"); }

/* ════════════════════════════════════════════
   SILENT TOKEN REFRESH
   Calls POST /auth/refresh and updates tokens.
   Deduplicates concurrent refresh attempts.
════════════════════════════════════════════ */
let _refreshPromise = null;

async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data?.accessToken)  localStorage.setItem("accessToken",  data.accessToken);
      if (data?.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

/* ════════════════════════════════════════════
   CENTRAL AUTH FETCH
   - Attaches Authorization header automatically
   - Silently refreshes token on 401 and retries
   - Throws typed errors (err.code) on auth failure
   - Returns parsed JSON on success
════════════════════════════════════════════ */
async function authFetch(url, options = {}) {
  const makeReq = (token) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });

  let res = await makeReq(getToken());

  // Silent refresh on 401 — retry once with new token
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await makeReq(getToken());

    if (res.status === 401) {
      localStorage.clear();
      const err = new Error("Session expired. Please log in again.");
      err.code = 401;
      throw err;
    }
  }

  if (res.status === 403) {
    const err = new Error("You do not have permission to view this page.");
    err.code = 403;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err  = new Error(text || `Server error: ${res.status}`);
    err.code   = res.status;
    throw err;
  }

  return res.json();
}

/* ════════════════════════════════════════════
   ROLE GUARD HOOK
   UI-only guard — backend enforces hasRole("VAO")
   on all /vao/** routes independently.
════════════════════════════════════════════ */
function useRequireRole(requiredRole) {
  const nav = useNavigate();
  useEffect(() => {
    const token = getToken();
    const role  = getRole();
    if (!token)                { nav("/vao/login",    { replace: true }); return; }
    if (role !== requiredRole) { nav("/unauthorized", { replace: true }); }
  }, [nav, requiredRole]);
}

/* ════════════════════════════════════════════
   STATUS / CATEGORY METADATA
   Matches ComplaintStatus enum values exactly
════════════════════════════════════════════ */
const STATUS_META = {
  SUBMITTED:           { cls: "submitted",   label: "Submitted",           icon: "📝" },
  AWAITING_ASSIGNMENT: { cls: "awaiting",    label: "Awaiting Assignment", icon: "⏳" },
  ASSIGNED:            { cls: "assigned",    label: "Assigned",            icon: "🔗" },
  IN_PROGRESS:         { cls: "in-progress", label: "In Progress",         icon: "⚙️" },
  RESOLVED:            { cls: "resolved",    label: "Resolved",            icon: "✅" },
  VERIFIED:            { cls: "verified",    label: "Verified",            icon: "🛡️" },
  CLOSED:              { cls: "closed",      label: "Closed",              icon: "🔒" },
};

// ComplaintCategory enum values
const CATEGORY_ICONS = {
  WATER:       "💧",
  ROAD:        "🛣️",
  ELECTRICITY: "⚡",
  SANITATION:  "🧹",
  DRAINAGE:    "🌊",
  HEALTH:      "🏥",
  EDUCATION:   "📚",
  GARBAGE:     "🗑️",
  OTHER:       "📌",
};

function getCatIcon(cat = "") {
  return CATEGORY_ICONS[String(cat).toUpperCase()] ?? "📌";
}

/* ════════════════════════════════════════════
   UTILITIES
════════════════════════════════════════════ */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return "Just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t || t.startsWith("blob:")) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/")) return `${BASE}${t}`;
  return `${BASE}/${t}`;
}

/* ════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const meta = STATUS_META[String(status).toUpperCase()] ?? { cls: "submitted", label: status, icon: "📌" };
  return (
    <span className={`vcd-status-badge vcd-status-badge--${meta.cls}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

/* ════════════════════════════════════════════
   AI CLEAN SCORE RING
   Uses aiCleanScore (Integer 0–100) from DTO
════════════════════════════════════════════ */
function ScoreRing({ score }) {
  const pct   = Math.max(0, Math.min(100, score ?? 0));
  const color = pct >= 70 ? "#4dd87e" : pct >= 40 ? "#d4aa5a" : "#c05040";
  const r     = 15.9;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  return (
    <div className="vcd-score-ring">
      <svg viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="2.8" />
        <circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
        />
      </svg>
      <span style={{ color }}>{score != null ? pct : "—"}</span>
    </div>
  );
}

/* ════════════════════════════════════════════
   WORKER RATING STARS
   Uses workerRating (Integer 1–5) from DTO
════════════════════════════════════════════ */
function RatingStars({ rating }) {
  if (rating == null) return <span className="vcd-muted">Not yet rated</span>;
  return (
    <div className="vcd-rating-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`vcd-star${i <= rating ? " vcd-star--on" : ""}`}>★</span>
      ))}
      <span className="vcd-rating-val">{rating}/5</span>
    </div>
  );
}

/* ════════════════════════════════════════════
   AUTH ERROR FULL-PAGE STATE
════════════════════════════════════════════ */
function AuthErrorPage({ message, onLogin, onBack }) {
  return (
    <>
      <Navbar />
      <div className="vcd-page">
        <div className="vcd-bg-grid" />
        <div className="vcd-error-state">
          <div className="vcd-error-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>{message}</p>
          <div className="vcd-error-btns">
            {onLogin && <button className="vcd-btn" onClick={onLogin}>Go to Login</button>}
            <button className="vcd-btn vcd-btn--ghost" onClick={onBack}>← Go Back</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function VaoComplaintDetails() {
  const { complaintId, vaoId } = useParams();
  const nav = useNavigate();

  // UI-only role guard (backend enforces hasRole("VAO") independently)
  useRequireRole("VAO");

  const [complaint, setComplaint] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [authError, setAuthError] = useState(null);

  /* ────────────────────────────────────────────
     FETCH
     Endpoint: GET /vao/complaints/{complaintId}
     Backend:  VaoComplaintController.getComplaintDetails
     Returns:  ComplaintResponse
     Auth:     hasRole("VAO") via /vao/** security rule

     Cache-Control: no-store ensures the browser
     doesn't serve a stale response after a close
     or note POST has updated the record.
  ──────────────────────────────────────────── */
  const fetchComplaint = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(null);
    try {
      const data = await authFetch(`${BASE}/vao/complaints/${complaintId}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      setComplaint(data);
    } catch (e) {
      if (e.code === 401) {
        setAuthError(e.message);
        setTimeout(() => nav("/vao/login", { replace: true }), 2000);
      } else if (e.code === 403) {
        setAuthError(e.message);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [complaintId, nav]);

  useEffect(() => { fetchComplaint(); }, [fetchComplaint]);

  /* ── Loading ── */
  if (loading) return (
    <>
      <Navbar />
      <div className="vcd-loading">
        <div className="vcd-spinner" />
        <p>Opening complaint record…</p>
      </div>
      <Footer />
    </>
  );

  /* ── Auth Error ── */
  if (authError) return (
    <AuthErrorPage
      message={authError}
      onLogin={authError.includes("expired") ? () => nav("/vao/login", { replace: true }) : null}
      onBack={() => nav(-1)}
    />
  );

  /* ── General Error ── */
  if (error) return (
    <>
      <Navbar />
      <div className="vcd-page">
        <div className="vcd-bg-grid" />
        <div className="vcd-error-state">
          <div className="vcd-error-icon">⚠️</div>
          <h2>Failed to Load</h2>
          <p>{error}</p>
          <div className="vcd-error-btns">
            <button className="vcd-btn" onClick={fetchComplaint}>Try Again</button>
            <button className="vcd-btn vcd-btn--ghost" onClick={() => nav(-1)}>← Go Back</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  /* ────────────────────────────────────────────
     DERIVED STATE
     All field reads match ComplaintResponse DTO.
  ──────────────────────────────────────────── */
  const c = complaint;

  // Normalize image URLs (handles relative paths from backend)
  const beforeImg = normalizeImageUrl(c.beforeImageUrl);
  const afterImg  = normalizeImageUrl(c.afterImageUrl);

  // Timeline — uses all Instant fields from DTO
  // Filter to only events that have actually occurred (non-null)
  const timelineSteps = [
    { label: "Submitted",    time: c.createdAt,   always: true },
    { label: "Assigned",     time: c.assignedAt               },
    { label: "Work Started", time: c.startedAt                },
    { label: "Resolved",     time: c.resolvedAt               },
    { label: "Verified",     time: c.verifiedAt               },
    { label: "Closed",       time: c.closedAt                 },
  ].filter(s => s.always || s.time);

  const statusNorm      = String(c.status || "").toUpperCase();
  const statusInProgress = ["SUBMITTED", "AWAITING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"].includes(statusNorm);
  const isClosed         = statusNorm === "CLOSED";
  const isVerified       = statusNorm === "VERIFIED";
  const hasNote          = Boolean(c.vaoReviewNote?.trim());

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <>
      <Navbar />
      <div className="vcd-page">
        <div className="vcd-bg-grid" />

        <div className="vcd-inner">

          {/* ── BREADCRUMB ── */}
          <nav className="vcd-breadcrumb">
            {vaoId ? (
              <>
                <button className="vcd-breadcrumb__link"
                  onClick={() => nav(`/vao/dashboard/${vaoId}`)}>
                  Dashboard
                </button>
                <span className="vcd-breadcrumb__sep">›</span>
                <button className="vcd-breadcrumb__link"
                  onClick={() => nav(`/vao/${vaoId}/complaints`)}>
                  Complaints
                </button>
              </>
            ) : (
              <span>Dashboard</span>
            )}
            <span className="vcd-breadcrumb__sep">›</span>
            <span className="vcd-breadcrumb__cur">{c.complaintId}</span>
          </nav>

          {/* ── HEADER BANNER ── */}
          <header className="vcd-header">
            <button className="vcd-back" onClick={() => nav(-1)}>← Back</button>
            <div className="vcd-header__center">
              <div className="vcd-eyebrow">
                <div className="vcd-eyebrow__dot" />
                Governance Inspection Record
              </div>
              <h1 className="vcd-title">{c.complaintId}</h1>
            </div>
            <div className="vcd-header__right">
              <StatusBadge status={c.status} />
            </div>
          </header>

          {/* ── META BAR ── */}
          <div className="vcd-meta-bar">
            <div className="vcd-meta-item">
              <span className="vcd-meta-item__ic">🏘️</span>
              <span className="vcd-meta-item__lbl">Village</span>
              {/* villageName from DTO */}
              <span className="vcd-meta-item__val">{c.villageName || "—"}</span>
            </div>
            <div className="vcd-meta-sep" />
            <div className="vcd-meta-item">
              <span className="vcd-meta-item__ic">📍</span>
              <span className="vcd-meta-item__lbl">Area</span>
              {/* areaName from DTO */}
              <span className="vcd-meta-item__val">{c.areaName || "—"}</span>
            </div>
            <div className="vcd-meta-sep" />
            <div className="vcd-meta-item">
              <span className="vcd-meta-item__ic">🪪</span>
              <span className="vcd-meta-item__lbl">Citizen ID</span>
              {/* citizenId — DTO has NO citizenName field */}
              <span className="vcd-meta-item__val vcd-meta-item__val--mono">{c.citizenId || "—"}</span>
            </div>
            <div className="vcd-meta-sep" />
            <div className="vcd-meta-item">
              <span className="vcd-meta-item__ic">⚒</span>
              <span className="vcd-meta-item__lbl">Worker</span>
              {/* workerName — null if unassigned */}
              <span className="vcd-meta-item__val">{c.workerName || "—"}</span>
            </div>
            <div className="vcd-meta-sep" />
            <div className="vcd-meta-item">
              <span className="vcd-meta-item__ic">📅</span>
              <span className="vcd-meta-item__lbl">Filed</span>
              {/* createdAt — Instant → ISO string */}
              <span className="vcd-meta-item__val" title={timeAgo(c.createdAt)}>
                {formatDate(c.createdAt)}
              </span>
            </div>
          </div>

          {/* ── VAO REVIEW NOTE (CLOSED complaints) ── */}
          {/* vaoReviewNote + closedAt from DTO */}
          {isClosed && (
            <div className={`vcd-card vcd-card--review-note${hasNote ? " vcd-card--review-note-filled" : ""}`}>
              <div className="vcd-card__head">
                <h2><span style={{ marginRight: 8 }}>🛡️</span>VAO Review Note</h2>
                <div className="vcd-card__head-right">
                  <span className="vcd-verified-badge verified">🔒 Closed</span>
                </div>
              </div>
              {hasNote ? (
                <div className="vcd-review-note-body">
                  <p className="vcd-review-note-text">{c.vaoReviewNote}</p>
                  {c.closedAt && (
                    <p className="vcd-review-note-meta">
                      Recorded by VAO · {formatDate(c.closedAt)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="vcd-review-note-empty">
                  <span className="vcd-review-note-empty__ic">📋</span>
                  <span className="vcd-review-note-empty__msg">No review note was added at closing.</span>
                </div>
              )}
            </div>
          )}

          {/* ── OVERVIEW CARD ── */}
          <div className="vcd-card">
            <div className="vcd-card__head">
              <h2>Complaint Overview</h2>
              <div className="vcd-card__head-right">
                <StatusBadge status={c.status} />
              </div>
            </div>
            <div className="vcd-grid vcd-grid--3">
              <div className="vcd-field">
                <label>Citizen ID</label>
                {/* citizenId — only citizen identifier in DTO */}
                <p><code>{c.citizenId || "—"}</code></p>
              </div>
              <div className="vcd-field">
                <label>Village</label>
                <p>{c.villageName || "—"}</p>
              </div>
              <div className="vcd-field">
                <label>Area</label>
                <p>{c.areaName || "—"}</p>
              </div>
              <div className="vcd-field">
                <label>Category</label>
                <p>
                  <span className="vcd-cat">
                    {/* category: ComplaintCategory enum → serialized as string */}
                    {getCatIcon(c.category)} {c.category ? String(c.category) : "—"}
                  </span>
                </p>
              </div>
              <div className="vcd-field">
                <label>Current Status</label>
                <StatusBadge status={c.status} />
              </div>
              <div className="vcd-field">
                <label>Assigned Worker</label>
                {/* workerName — from assignedWorker relationship in entity */}
                <p className={!c.workerName ? "vcd-unassigned" : ""}>
                  {c.workerName || "⚠ Unassigned"}
                </p>
              </div>
              <div className="vcd-field">
                <label>Worker ID</label>
                {/* workerId — also exposed in DTO */}
                <p>
                  {c.workerId
                    ? <code>{c.workerId}</code>
                    : <span className="vcd-muted">—</span>}
                </p>
              </div>
              <div className="vcd-field">
                <label>Village ID</label>
                <p><code>{c.villageId || "—"}</code></p>
              </div>
              <div className="vcd-field">
                <label>Area ID</label>
                <p><code>{c.areaId != null ? c.areaId : "—"}</code></p>
              </div>
            </div>
          </div>

          {/* ── DESCRIPTION CARD ── */}
          <div className="vcd-card">
            <div className="vcd-card__head">
              <h2>Description</h2>
              <span className="vcd-card__sub">Citizen's account</span>
            </div>
            <div style={{ padding: "16px 20px 20px" }}>
              <p className="vcd-desc">
                {c.description || <em className="vcd-muted">No description provided.</em>}
              </p>
            </div>
          </div>

          {/* ── EVIDENCE CARD ── */}
          {/* beforeImageUrl + afterImageUrl from DTO */}
          <div className="vcd-card">
            <div className="vcd-card__head">
              <h2>Evidence</h2>
              <span className="vcd-card__sub">Before &amp; after images</span>
            </div>
            <div className="vcd-evidence">
              <div className="vcd-evidence__box">
                <div className="vcd-evidence__label">
                  <span className="vcd-evidence__dot vcd-evidence__dot--before" />
                  Before
                </div>
                {beforeImg ? (
                  <a href={beforeImg} target="_blank" rel="noreferrer">
                    <img src={beforeImg} alt="Before" className="vcd-evidence__img" />
                  </a>
                ) : (
                  <div className="vcd-evidence__placeholder">
                    <span style={{ fontSize: 28, opacity: .4 }}>📷</span>
                    No image uploaded
                  </div>
                )}
              </div>

              <div className="vcd-evidence__divider">→</div>

              <div className="vcd-evidence__box">
                <div className="vcd-evidence__label">
                  <span className="vcd-evidence__dot vcd-evidence__dot--after" />
                  After
                </div>
                {afterImg ? (
                  <a href={afterImg} target="_blank" rel="noreferrer">
                    <img src={afterImg} alt="After" className="vcd-evidence__img" />
                  </a>
                ) : (
                  <div className="vcd-evidence__placeholder">
                    <span style={{ fontSize: 28, opacity: .4 }}>
                      {statusInProgress ? "⏳" : "📷"}
                    </span>
                    {statusInProgress ? "Work not yet completed" : "No image uploaded"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── AI VERIFICATION CARD ── */}
          {/* aiCleanScore (Integer 0–100) + aiVerified (Boolean) from DTO */}
          <div className="vcd-card">
            <div className="vcd-card__head">
              <h2>AI Verification</h2>
              <div className="vcd-card__head-right">
                <span className={`vcd-verified-badge${c.aiVerified ? " verified" : ""}`}>
                  {c.aiVerified ? "✅ AI Verified" : "⏳ Pending"}
                </span>
              </div>
            </div>
            <div className="vcd-ai-row">
              <div className="vcd-ai-score">
                <ScoreRing score={c.aiCleanScore} />
                <div className="vcd-ai-score__meta">
                  <div className="vcd-ai-score__lbl">Clean Score</div>
                  <div className="vcd-ai-score__sub">
                    {c.aiCleanScore != null
                      ? c.aiCleanScore >= 70
                        ? "Good resolution quality"
                        : c.aiCleanScore >= 40
                        ? "Acceptable resolution"
                        : "Needs review"
                      : "Not yet scored"}
                  </div>
                </div>
              </div>

              {/* workerRating (Integer 1–5) from DTO */}
              <div className="vcd-ai-rating">
                <div className="vcd-ai-score__lbl">Worker Rating</div>
                <RatingStars rating={c.workerRating} />
              </div>

              {/* vaoReviewNote — shown when complaint is not yet closed */}
              {!isClosed && (
                c.vaoReviewNote ? (
                  <div className="vcd-review-note">
                    <label>VAO Review Note</label>
                    <p>{c.vaoReviewNote}</p>
                  </div>
                ) : (
                  <div className="vcd-review-note vcd-review-note--empty">
                    <span className="vcd-review-note__ic">📋</span>
                    <span className="vcd-review-note__msg">No Review Note</span>
                    <span className="vcd-review-note__sub">
                      VAO review note will appear here once the complaint is assessed
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ── VERIFIED — READY TO CLOSE BANNER ── */}
          {/* Shown when status is VERIFIED — prompts VAO to close via the close endpoint */}
          {isVerified && (
            <div className="vcd-card vcd-card--verified-cta">
              <div className="vcd-card__head">
                <h2>🛡️ Ready for Closure</h2>
                <span className="vcd-card__sub">This complaint has been verified by AI</span>
              </div>
              <div style={{ padding: "12px 20px 18px" }}>
                <p style={{ fontFamily: "var(--fb, sans-serif)", fontSize: 13, color: "var(--t2)", lineHeight: 1.6, marginBottom: 12 }}>
                  The worker has resolved this complaint and AI has verified the result.
                  Review the evidence above and close this record to finalise it.
            
                </p>
                <button
                  className="vcd-btn vcd-btn--close"
                  onClick={() => nav(`/vao/${vaoId}/complaints/status/VERIFIED`)}
                >
                  🔒 Go to Verified Queue →
                </button>
              </div>
            </div>
          )}

          {/* ── TIMELINE CARD ── */}
          {/* All Instant fields: createdAt, assignedAt, startedAt, resolvedAt, verifiedAt, closedAt */}
          <div className="vcd-card">
            <div className="vcd-card__head">
              <h2>Timeline</h2>
              <span className="vcd-card__sub">{timelineSteps.length} events recorded</span>
            </div>
            <ol className="vcd-timeline">
              {timelineSteps.map((step, i) => (
                <li
                  key={step.label}
                  className={`vcd-tl-step${i === timelineSteps.length - 1 ? " vcd-tl-step--current" : ""}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="vcd-tl-dot" />
                  <div className="vcd-tl-body">
                    <span className="vcd-tl-label">{step.label}</span>
                    <span className="vcd-tl-time">{formatDate(step.time)}</span>
                    <span className="vcd-tl-ago">{timeAgo(step.time)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}