import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

import "../../../styles/VaoAreaComplaints.css";

/* ════════════════════════════════════════════
   BASE URL — single source of truth
════════════════════════════════════════════ */
const BASE = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

/* ════════════════════════════════════════════
   AUTH HELPERS
════════════════════════════════════════════ */
function getToken()        { return localStorage.getItem("accessToken"); }
function getRefreshToken() { return localStorage.getItem("refreshToken"); }
function getRole()         { return localStorage.getItem("accountType"); }

/* ════════════════════════════════════════════
   SILENT TOKEN REFRESH
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
    const err = new Error(`Server error: ${res.status}`);
    err.code = res.status;
    throw err;
  }

  return res.json();
}

/* ════════════════════════════════════════════
   ROLE GUARD HOOK
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
   UTILITIES
════════════════════════════════════════════ */
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
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

/* ════════════════════════════════════════════
   STATUS PILL
════════════════════════════════════════════ */
function statusClass(status = "") {
  return String(status).toLowerCase().replace(/[\s_-]+/g, "_");
}

function StatusPill({ status }) {
  return (
    <span className={`vaa-status-pill vaa-status-pill--${statusClass(status)}`}>
      <span className="vaa-status-pill__dot" />
      {status}
    </span>
  );
}

/* ════════════════════════════════════════════
   AI SCORE BADGE
════════════════════════════════════════════ */
function AiScoreBadge({ score, verified }) {
  if (score == null) return <span className="vaa-muted">—</span>;
  const cls = score >= 80 ? "good" : score >= 50 ? "warn" : "bad";
  return (
    <span className={`vaa-ai-badge vaa-ai-badge--${cls}`}>
      {score}
      {verified && <span className="vaa-ai-badge__check" title="AI Verified">✓</span>}
    </span>
  );
}

/* ════════════════════════════════════════════
   RATING STARS
════════════════════════════════════════════ */
function RatingStars({ rating }) {
  if (rating == null) return <span className="vaa-muted">—</span>;
  return (
    <span className="vaa-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`vaa-star${i <= rating ? " vaa-star--on" : ""}`}>★</span>
      ))}
    </span>
  );
}

/* ════════════════════════════════════════════
   SKELETON ROWS
════════════════════════════════════════════ */
function SkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <tr key={i} style={{ opacity: 1 - i * 0.12 }}>
      <td><span className="vaa-sk" style={{ width: 90,  height: 22, display: "inline-block" }} /></td>
      <td><span className="vaa-sk" style={{ width: 80,  height: 16, display: "inline-block" }} /></td>
      <td><span className="vaa-sk" style={{ width: 70,  height: 22, borderRadius: 6, display: "inline-block" }} /></td>
      <td><span className="vaa-sk" style={{ width: 100, height: 16, display: "inline-block" }} /></td>
      <td><span className="vaa-sk" style={{ width: 60,  height: 16, display: "inline-block" }} /></td>
      <td><span className="vaa-sk" style={{ width: 40,  height: 16, display: "inline-block" }} /></td>
      <td><span className="vaa-sk" style={{ width: 40,  height: 16, display: "inline-block" }} /></td>
      <td style={{ textAlign: "center" }}><span className="vaa-sk" style={{ width: 68, height: 32, borderRadius: 10, display: "inline-block" }} /></td>
    </tr>
  ));
}

/* ════════════════════════════════════════════
   SUMMARY STATS
════════════════════════════════════════════ */
function SummaryStrip({ complaints }) {
  const total      = complaints.length;
  const resolved   = complaints.filter(c => ["CLOSED", "RESOLVED", "VERIFIED"].includes(String(c.status).toUpperCase())).length;
  const inProgress = complaints.filter(c => ["IN_PROGRESS", "ASSIGNED"].includes(String(c.status).toUpperCase())).length;
  const unassigned = complaints.filter(c => ["SUBMITTED", "AWAITING_ASSIGNMENT"].includes(String(c.status).toUpperCase())).length;
  const resRate    = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <div className="vaa-summary-strip">
      {[
        { label: "Total",       value: total,         cls: "total"      },
        { label: "Resolved",    value: resolved,      cls: "resolved"   },
        { label: "In Progress", value: inProgress,    cls: "inprogress" },
        { label: "Unassigned",  value: unassigned,    cls: "unassigned" },
        { label: "Res. Rate",   value: `${resRate}%`, cls: "rate"       },
      ].map(({ label, value, cls }) => (
        <div key={label} className={`vaa-summary-item vaa-summary-item--${cls}`}>
          <span className="vaa-summary-item__val">{value}</span>
          <span className="vaa-summary-item__lbl">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function VaoAreaComplaints() {
  const { vaoId, areaId } = useParams();
  const nav = useNavigate();

  useRequireRole("VAO");

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [authError,  setAuthError]  = useState(null);

  /* ────────────────────────────────────────────
     FETCH — guarded against undefined areaId
  ──────────────────────────────────────────── */
  const fetchAreaComplaints = useCallback(async () => {

    // ── GUARD 2: validate before any network call ──
    if (!areaId || areaId === "undefined") {
      setError("Invalid area ID — please navigate here from a valid area link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setAuthError(null);

    try {
      const data = await authFetch(`${BASE}/vao/complaints/area/${areaId}`);
      setComplaints(Array.isArray(data) ? data : []);
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

  }, [areaId, nav]);

  // ── GUARD 1: don't fire until router provides areaId ──
  useEffect(() => {
    if (!areaId) return;
    fetchAreaComplaints();
  }, [fetchAreaComplaints, areaId]);

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <>
      <Navbar />

      <div className="vaa-page">

        <div className="vaa-ambient" aria-hidden="true">
          <div className="vaa-orb vaa-orb--1" />
          <div className="vaa-orb vaa-orb--2" />
          <div className="vaa-dot-grid" />
        </div>

        <div className="vaa-wrap">

          {/* ── Header ── */}
          <header className="vaa-header">
            <button
              className="vaa-back"
              onClick={() => nav(`/vao/${vaoId}/complaints`)}
              aria-label="Back to complaints"
            >
              ← Complaints
            </button>

            <div className="vaa-header__info">
              <h1 className="vaa-title">Area Complaints</h1>
              <p className="vaa-sub">
                Area ID: <code style={{ fontFamily: "monospace", fontSize: 12 }}>{areaId}</code>
                {complaints[0]?.areaName && (
                  <> · <strong>{complaints[0].areaName}</strong></>
                )}
              </p>
            </div>

            {!loading && !authError && (
              <div className="vaa-count-badge">
                <span className="vaa-count-badge__num">{complaints.length}</span>
                <span className="vaa-count-badge__lbl">
                  {complaints.length === 1 ? "Record" : "Records"}
                </span>
              </div>
            )}
          </header>

          {/* ── Auth Error Banner ── */}
          {authError && (
            <div className="vaa-error-banner vaa-error-banner--auth">
              🔒 {authError}
              {authError.includes("expired") && (
                <button
                  className="vaa-error-banner__btn"
                  onClick={() => nav("/vao/login", { replace: true })}
                >
                  Go to Login
                </button>
              )}
            </div>
          )}

          {/* ── General Error Banner ── */}
          {error && !authError && (
            <div className="vaa-error-banner">
              ⚠️ {error}
              <button className="vaa-error-banner__btn" onClick={fetchAreaComplaints}>
                ↻ Retry
              </button>
            </div>
          )}

          {/* ── Summary Strip ── */}
          {!loading && !authError && complaints.length > 0 && (
            <SummaryStrip complaints={complaints} />
          )}

          {/* ── Table ── */}
          <div className="vaa-table-wrap">
            <table className="vaa-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Worker</th>
                  <th>Citizen ID</th>
                  <th>AI Score</th>
                  <th>Rating</th>
                  <th>Filed</th>
                  <th>Resolved</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading && <SkeletonRows />}

                {!loading && !authError && complaints.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <div className="vaa-empty">
                        <div className="vaa-empty__icon">⚔</div>
                        <div className="vaa-empty__title">No Complaints Found</div>
                        <div className="vaa-empty__sub">
                          This area has no recorded complaints yet.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && !authError && complaints.map(c => (
                  <tr key={c.complaintId} className="vaa-table__row">

                    <td>
                      <span className="vaa-id-code">{c.complaintId}</span>
                    </td>

                    <td>
                      <span className="vaa-category">
                        {c.category ? String(c.category) : "—"}
                      </span>
                    </td>

                    <td>
                      <StatusPill status={c.status} />
                    </td>

                    <td>
                      {c.workerName ? (
                        <span className="vaa-worker">
                          <span className="vaa-worker__dot" />
                          {c.workerName}
                        </span>
                      ) : (
                        <span className="vaa-worker vaa-worker--none">Unassigned</span>
                      )}
                    </td>

                    <td>
                      <code className="vaa-citizen-id">
                        {c.citizenId || "—"}
                      </code>
                    </td>

                    <td>
                      <AiScoreBadge score={c.aiCleanScore} verified={c.aiVerified} />
                    </td>

                    <td>
                      <RatingStars rating={c.workerRating} />
                    </td>

                    <td>
                      <span className="vaa-date" title={timeAgo(c.createdAt)}>
                        {fmtDate(c.createdAt)}
                      </span>
                    </td>

                    <td>
                      {c.resolvedAt ? (
                        <span className="vaa-date vaa-date--resolved" title={timeAgo(c.resolvedAt)}>
                          {fmtDate(c.resolvedAt)}
                        </span>
                      ) : (
                        <span className="vaa-muted">—</span>
                      )}
                    </td>

                    <td>
                      <button
                        className="vaa-view"
                        onClick={() => nav(`/vao/${vaoId}/complaints/view/${c.complaintId}`)}
                        aria-label={`Inspect complaint ${c.complaintId}`}
                      >
                        Inspect →
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}