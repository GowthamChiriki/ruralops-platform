import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

import "../../../styles/VaoComplaintsByStatus.css";

/* ════════════════════════════════════════════
   BASE URL — single source of truth
════════════════════════════════════════════ */
const BASE = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

/* ════════════════════════════════════════════
   AUTH HELPERS
════════════════════════════════════════════ */
function getToken() { return localStorage.getItem("accessToken"); }
function getRole()  { return localStorage.getItem("accountType"); }

/**
 * Central fetch wrapper.
 * - Auto-attaches Authorization header (fresh on every call).
 * - Throws typed errors for 401 / 403.
 */
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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Server error: ${res.status}`);
  }

  if (res.status === 204) return null;

const text = await res.text();
return text ? JSON.parse(text) : null;
}

/* ════════════════════════════════════════════
   ROLE GUARD HOOK — only ROLE_VAO may enter
════════════════════════════════════════════ */
function useRequireRole(requiredRole) {
  const nav = useNavigate();

  useEffect(() => {
    const token = getToken();
    const role  = getRole();

    if (!token) {
      nav("/vao/login", { replace: true });
      return;
    }
    if (role !== requiredRole) {
      nav("/unauthorized", { replace: true });
    }
  }, [nav, requiredRole]);
}

/* ════════════════════════════════════════════
   STATUS / CATEGORY METADATA
════════════════════════════════════════════ */
const STATUS_LIST = [
  "SUBMITTED", "AWAITING_ASSIGNMENT", "ASSIGNED",
  "IN_PROGRESS", "RESOLVED", "VERIFIED", "CLOSED",
];

const STATUS_META = {
  SUBMITTED:           { icon: "📝", label: "Submitted",           cls: "submitted" },
  AWAITING_ASSIGNMENT: { icon: "⏳", label: "Awaiting Assignment", cls: "awaiting-assignment" },
  ASSIGNED:            { icon: "🔗", label: "Assigned",            cls: "assigned" },
  IN_PROGRESS:         { icon: "⚙️", label: "In Progress",         cls: "in-progress" },
  RESOLVED:            { icon: "✅", label: "Resolved",            cls: "resolved" },
  VERIFIED:            { icon: "🛡️", label: "Verified",            cls: "verified" },
  CLOSED:              { icon: "🔒", label: "Closed",              cls: "closed" },
};

const CATEGORY_ICONS = {
  WATER: "💧", ROAD: "🛣️", ELECTRICITY: "⚡", SANITATION: "🧹",
  DRAINAGE: "🌊", HEALTH: "🏥", EDUCATION: "📚", GARBAGE: "🗑️", OTHER: "📌",
};

function getCatIcon(cat = "") {
  return CATEGORY_ICONS[cat?.toUpperCase()] ?? "📌";
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/* ════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { icon: "📌", label: status, cls: "submitted" };
  return (
    <span className={`vcs-status-badge vcs-status-badge--${meta.cls}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

function WorkerCell({ name }) {
  if (!name) return <span className="vcs-unassigned">⚠ Unassigned</span>;
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="vcs-worker">
      <div className="vcs-worker__av">{initials}</div>
      <span className="vcs-worker__name">{name}</span>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function VaoComplaintsByStatus() {
  const { vaoId, status } = useParams();
  const nav = useNavigate();

  // ── Role guard ──
  useRequireRole("VAO");

  const [complaints,    setComplaints]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [authError,     setAuthError]     = useState(null);
  const [closingId,     setClosingId]     = useState(null);
  const [confirmId,     setConfirmId]     = useState(null);
  const [reviewNote,    setReviewNote]    = useState("");
  const [verifiedCount, setVerifiedCount] = useState(null);

  /* ── FETCH COMPLAINTS BY STATUS ──
     Backend: GET /vao/complaints/village/status/{status}
     Village is resolved from JWT principal on the backend — no villageId in URL.
  */
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(null);

    try {
      const data = await authFetch(
        `${BASE}/vao/complaints/village/status/${status}`
      );
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
  }, [status, nav]);

  /* ── FETCH VERIFIED COUNT (background / silent) ──
     Backend: GET /vao/complaints/village/status/VERIFIED
     Village is resolved from JWT principal — no villageId in URL.
  */
  const fetchVerifiedCount = useCallback(async () => {
    try {
      const data = await authFetch(
        `${BASE}/vao/complaints/village/status/VERIFIED`
      );
      setVerifiedCount(Array.isArray(data) ? data.length : 0);
    } catch (e) {
      if (e.code === 401) {
        setAuthError(e.message);
        setTimeout(() => nav("/vao/login", { replace: true }), 2000);
      }
      // 403 / other errors: silently ignore — badge is non-critical
    }
  }, [nav]);

  useEffect(() => {
    fetchComplaints();
    if (status !== "VERIFIED") fetchVerifiedCount();
  }, [fetchComplaints, fetchVerifiedCount, status]);

  /* ── CLOSE COMPLAINT ──
     Backend: POST /vao/complaints/{complaintId}/close
     Body: { reviewNote: string | null }  (VaoCloseRequest)
  */
  function requestClose(id) {
    setConfirmId(id);
    setReviewNote("");
  }

  function cancelClose() {
    setConfirmId(null);
    setReviewNote("");
  }

  async function confirmClose(id) {
    setConfirmId(null);
    setClosingId(id);
    setError(null);
    setAuthError(null);

    const note = reviewNote.trim();

    try {
      await authFetch(`${BASE}/vao/complaints/${id}/close`, {
        method: "POST",
        body: JSON.stringify({ reviewNote: note || null }),
      });

      await fetchComplaints();
      if (status !== "VERIFIED") await fetchVerifiedCount();

    } catch (e) {
      if (e.code === 401) {
        setAuthError(e.message);
        setTimeout(() => nav("/vao/login", { replace: true }), 2000);
      } else if (e.code === 403) {
        setAuthError("You do not have permission to close this complaint.");
      } else {
        setError("Failed to close complaint: " + e.message);
      }
    } finally {
      setClosingId(null);
      setReviewNote("");
    }
  }

  const meta = STATUS_META[status] ?? { icon: "📌", label: status, cls: "submitted" };

  /* ── Loading ── */
  if (loading) return (
    <>
      <Navbar />
      <div className="vcs-loading">
        <div className="vcs-spinner" />
        <p>Loading complaints…</p>
      </div>
      <Footer />
    </>
  );

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <>
      <Navbar />
      <div className="vcs-page">
        <div className="vcs-bg-grid" />

        <div className="vcs-inner">

          {/* ── BREADCRUMB ── */}
          <nav className="vcs-breadcrumb">
            <button className="vcs-breadcrumb__link" onClick={() => nav(`/vao/dashboard/${vaoId}`)}>
              ⬡ Dashboard
            </button>
            <span className="vcs-breadcrumb__sep">›</span>
            <button className="vcs-breadcrumb__link" onClick={() => nav(`/vao/${vaoId}/complaints`)}>
              Complaints
            </button>
            <span className="vcs-breadcrumb__sep">›</span>
            <span className="vcs-breadcrumb__cur">{meta.label}</span>
          </nav>

          {/* ── HEADER BANNER ── */}
          <header className="vcs-header">
            <div className="vcs-header__nav">
              <button className="vcs-back" onClick={() => nav(`/vao/${vaoId}/complaints`)}>
                ← All Complaints
              </button>
              <button className="vcs-dashboard-btn" onClick={() => nav(`/vao/dashboard/${vaoId}`)}>
                ⬡ Dashboard
              </button>
            </div>
            <div className="vcs-header__center">
              <div className="vcs-eyebrow">
                <div className="vcs-eyebrow__dot" />
                Lifecycle Stage Monitoring
              </div>
              <h1 className="vcs-title">
                <span>{meta.icon}</span>
                {meta.label} Complaints
              </h1>
            </div>
            <div className="vcs-count-badge">
              <span className="vcs-count-badge__n">{complaints.length}</span>
              record{complaints.length !== 1 ? "s" : ""}
            </div>
          </header>

          {/* ── STATUS TABS ── */}
          <div className="vcs-tabs-wrap">
            <div className="vcs-tabs">
              {STATUS_LIST.map(s => {
                const sm       = STATUS_META[s] ?? { icon: "📌", label: s };
                const isVerif  = s === "VERIFIED";
                const badgeN   = isVerif
                  ? (status === "VERIFIED" ? complaints.length : verifiedCount)
                  : null;
                const showBadge = isVerif && badgeN !== null && badgeN > 0;

                return (
                  <button
                    key={s}
                    className={`vcs-tab${status === s ? " active" : ""}${showBadge ? " vcs-tab--alerted" : ""}`}
                    onClick={() => nav(`/vao/${vaoId}/complaints/status/${s}`)}
                  >
                    <span className="vcs-tab__ic">{sm.icon}</span>
                    {sm.label}
                    {showBadge && <span className="vcs-tab-badge">{badgeN}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── PENDING REVIEW ALERT BAR ── */}
          {status !== "VERIFIED" && verifiedCount !== null && verifiedCount > 0 && (
            <div className="vcs-review-alert">
              <span className="vcs-review-alert__pulse" />
              <span className="vcs-review-alert__icon">🛡️</span>
              <div className="vcs-review-alert__text">
                <span className="vcs-review-alert__title">
                  {verifiedCount} complaint{verifiedCount !== 1 ? "s" : ""} awaiting your review
                </span>
                <span className="vcs-review-alert__sub">
                  Workers have completed these tasks — review and close them to finalise the records.
                </span>
              </div>
              <button
                className="vcs-review-alert__cta"
                onClick={() => nav(`/vao/${vaoId}/complaints/status/VERIFIED`)}
              >
                Review Now →
              </button>
            </div>
          )}

          {/* ── VERIFIED STAGE NOTICE ── */}
          {status === "VERIFIED" && complaints.length > 0 && (
            <div className="vcs-stage-notice vcs-stage-notice--verified">
              <span className="vcs-stage-notice__icon">🛡️</span>
              <div>
                <p className="vcs-stage-notice__title">VAO Action Required</p>
                <p className="vcs-stage-notice__body">
                  The complaints below have been verified by AI. Review each case and use{" "}
                  <strong>Close</strong> to finalise and archive the record. The review note
                  you enter will be permanently saved to the complaint and visible in the
                  complaint details page.
                </p>
              </div>
            </div>
          )}

          {/* ── AUTH ERROR BANNER (401 / 403) ── */}
          {authError && (
            <div className="vcs-error vcs-error--auth">
              🔒 {authError}
              {authError.includes("expired") && (
                <button onClick={() => nav("/vao/login", { replace: true })}>
                  Go to Login
                </button>
              )}
            </div>
          )}

          {/* ── GENERAL ERROR BANNER ── */}
          {error && !authError && (
            <div className="vcs-error">
              <span>⚠</span>
              <span>{error}</span>
              <button onClick={() => { setError(null); fetchComplaints(); }}>Retry</button>
            </div>
          )}

          {/* ── EMPTY ── */}
          {!error && !authError && complaints.length === 0 && (
            <div className="vcs-empty">
              <div className="vcs-empty__icon">{meta.icon}</div>
              <div className="vcs-empty__title">No {meta.label} Complaints</div>
              <div className="vcs-empty__sub">No complaints are currently in this lifecycle stage.</div>
            </div>
          )}

          {/* ── TABLE ── */}
          {!authError && complaints.length > 0 && (
            <div className="vcs-panel">
              <div className="vcs-panel__hdr">
                <span className="vcs-panel__title">{meta.label} Registry</span>
                <span className="vcs-panel__count">{complaints.length} records</span>
              </div>

              <div className="vcs-table-wrap">
                <table className="vcs-table">
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Area</th>
                      <th>Category</th>
                      <th>Assigned Worker</th>
                      <th>Status</th>
                      <th>Filed On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c, i) => (
                      <tr
                        key={c.complaintId}
                        className={`vcs-trow${closingId === c.complaintId ? " vcs-trow--closing" : ""}`}
                        style={{ animationDelay: `${i * 28}ms` }}
                      >
                        <td><code className="vcs-id">{c.complaintId}</code></td>
                        <td>{c.areaName || "—"}</td>
                        <td>
                          <span className="vcs-cat">
                            {getCatIcon(c.category)} {c.category || "—"}
                          </span>
                        </td>
                        <td><WorkerCell name={c.workerName} /></td>
                        <td><StatusBadge status={c.status} /></td>
                        <td>{formatDate(c.createdAt)}</td>

                        {/* ── ACTION CELL ── */}
                        <td className="vcs-actions">
                          <button
                            className="vcs-view"
                            onClick={() => nav(`/vao/${vaoId}/complaints/view/${c.complaintId}`)}
                          >
                            View →
                          </button>

                          {c.status === "VERIFIED" && (
                            <>
                              {/* Idle */}
                              {confirmId !== c.complaintId && closingId !== c.complaintId && (
                                <button
                                  className="vcs-close-btn"
                                  onClick={() => requestClose(c.complaintId)}
                                >
                                  🔒 Close
                                </button>
                              )}

                              {/* Confirming */}
                              {confirmId === c.complaintId && (
                                <div className="vcs-inline-confirm">
                                  <span className="vcs-inline-confirm__label">Finalise case?</span>
                                  <input
                                    className="vcs-inline-confirm__note"
                                    type="text"
                                    placeholder="Review note (optional — saved to complaint)"
                                    maxLength={1000}
                                    value={reviewNote}
                                    onChange={e => setReviewNote(e.target.value)}
                                    autoFocus
                                  />
                                  <button
                                    className="vcs-inline-confirm__yes"
                                    onClick={() => confirmClose(c.complaintId)}
                                  >
                                    Yes, Close
                                  </button>
                                  <button
                                    className="vcs-inline-confirm__no"
                                    onClick={cancelClose}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}

                              {/* In-flight */}
                              {closingId === c.complaintId && (
                                <span className="vcs-close-btn vcs-close-btn--loading">
                                  <span className="vcs-close-btn__spinner" /> Closing…
                                </span>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="vcs-tbl-foot">
                <span>
                  {complaints.length} complaint{complaints.length !== 1 ? "s" : ""} in{" "}
                  <strong style={{ color: "var(--gold)" }}>{meta.label}</strong> stage
                </span>
                <span className="vcs-tbl-foot__right">
                  {new Date().toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}