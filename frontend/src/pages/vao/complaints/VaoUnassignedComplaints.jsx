import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

import "../../../styles/VaoUnassignedComplaints.css";

/* ════════════════════════════════════════════
   BASE URL — single source of truth
════════════════════════════════════════════ */
const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/* ════════════════════════════════════════════
   AUTH HELPERS
════════════════════════════════════════════ */
function getToken() { return localStorage.getItem("accessToken"); }
function getRole()  { return localStorage.getItem("accountType"); }

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
    const err = new Error("You do not have permission to view this page.");
    err.code = 403;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Server error: ${res.status}`);
  }

  return res.json();
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
   CONSTANTS & SUB-COMPONENTS
════════════════════════════════════════════ */
const UNASSIGNED_STATUSES = ["SUBMITTED", "AWAITING_ASSIGNMENT"];
const PENDING_STATUSES    = ["ASSIGNED"];

const CATEGORY_ICONS = {
  WATER: "💧", ROAD: "🛣️", ELECTRICITY: "⚡", SANITATION: "🧹",
  DRAINAGE: "🌊", HEALTH: "🏥", EDUCATION: "📚", GARBAGE: "🗑️", OTHER: "📌",
};

function getCatIcon(cat = "") {
  return CATEGORY_ICONS[cat.toUpperCase()] ?? "📌";
}

function StatusPill({ status }) {
  const map = {
    SUBMITTED:           { cls: "submitted", label: "Submitted" },
    AWAITING_ASSIGNMENT: { cls: "awaiting",  label: "Awaiting Assignment" },
    ASSIGNED:            { cls: "pending",   label: "Assigned" },
  };
  const m = map[status] ?? { cls: "submitted", label: status.replace(/_/g, " ") };
  return <span className={`vuc-status vuc-status--${m.cls}`}>{m.label}</span>;
}

const TABS = [
  { key: "ALL",        label: "All",        icon: "📊" },
  { key: "UNASSIGNED", label: "Unassigned", icon: "⏳" },
  { key: "PENDING",    label: "Pending",    icon: "🔗" },
];

const TAB_DESC = {
  ALL: (
    <>
      Showing <strong>all complaints</strong> that have not yet been resolved —
      includes unassigned and pending cases.
    </>
  ),
  UNASSIGNED: (
    <>
      Complaints with status <strong>Submitted</strong> or{" "}
      <strong>Awaiting Assignment</strong> — no worker has been assigned yet.
      These need immediate attention.
    </>
  ),
  PENDING: (
    <>
      Complaints with status <strong>Assigned</strong> — a worker is linked but
      work hasn't started or been confirmed yet.
    </>
  ),
};

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function VaoUnassignedComplaints() {
  const { vaoId } = useParams();
  const nav = useNavigate();

  // ── Role guard ──
  useRequireRole("VAO");

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [authError,  setAuthError]  = useState(null);
  const [activeTab,  setActiveTab]  = useState("UNASSIGNED");

  /* ── FETCH UNASSIGNED COMPLAINTS ──
     Backend: GET /vao/complaints/village/unassigned
     Village is resolved from JWT principal — no villageId in URL.
  */
  const fetchUnassigned = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(null);

    try {
      const data = await authFetch(`${BASE}/vao/complaints/village/unassigned`);
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
  }, [nav]);

  useEffect(() => { fetchUnassigned(); }, [fetchUnassigned]);

  /* ── DERIVED STATE ── */
  const tabFiltered = complaints.filter(c => {
    if (activeTab === "ALL")        return true;
    if (activeTab === "UNASSIGNED") return UNASSIGNED_STATUSES.includes(c.status);
    if (activeTab === "PENDING")    return PENDING_STATUSES.includes(c.status);
    return true;
  });

  const totalCount      = complaints.length;
  const unassignedCount = complaints.filter(c => UNASSIGNED_STATUSES.includes(c.status)).length;
  const pendingCount    = complaints.filter(c => PENDING_STATUSES.includes(c.status)).length;

  const kpis = [
    { label: "Total Open",  value: totalCount,      icon: "📊", sub: "All unresolved cases",  color: "var(--gold)",  delay: 0   },
    { label: "Unassigned",  value: unassignedCount, icon: "⏳", sub: "Need worker assignment", color: "var(--amber)", delay: 60,  warn: unassignedCount > 0 },
    { label: "Pending",     value: pendingCount,    icon: "🔗", sub: "Assigned, not started",  color: "#9b72d0",      delay: 120 },
  ];

  function tabCount(key) {
    if (key === "ALL")        return totalCount;
    if (key === "UNASSIGNED") return unassignedCount;
    if (key === "PENDING")    return pendingCount;
    return 0;
  }

  function tabBadgeClass(key) {
    return key === "UNASSIGNED" && unassignedCount > 0
      ? "vuc-tab__badge vuc-tab__badge--warn"
      : "vuc-tab__badge";
  }

  function panelCountClass() {
    return activeTab === "UNASSIGNED" && tabFiltered.length > 0
      ? "vuc-panel__count vuc-panel__count--warn"
      : "vuc-panel__count";
  }

  /* ── Loading ── */
  if (loading) return (
    <>
      <Navbar />
      <div className="vuc-loading">
        <div className="vuc-spinner" />
        <p>Scanning governance gaps…</p>
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
      <div className="vuc-page">
        <div className="vuc-inner">

          {/* ── HEADER ── */}
          <header className="vuc-header">
            <div className="vuc-header__left">
              <div className="vuc-eyebrow">
                <span className="vuc-eyebrow__dot" />
                Governance &amp; Compliance
              </div>
              <h1 className="vuc-title">Open Complaints</h1>
              <p className="vuc-sub">
                Track unassigned and pending complaints across your jurisdiction
              </p>
            </div>
            <div className="vuc-header__actions">
              <button
                className="vuc-btn vuc-btn--back"
                onClick={() => nav(`/vao/${vaoId}/complaints`)}
              >
                ← All Complaints
              </button>
              <button className="vuc-btn vuc-btn--refresh" onClick={fetchUnassigned}>
                ↻ Refresh
              </button>
            </div>
          </header>

          {/* ── AUTH ERROR BANNER (401 / 403) ── */}
          {authError && (
            <div className="vuc-error vuc-error--auth">
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
            <div className="vuc-error">
              <span>⚠</span>
              <span>{error}</span>
              <button onClick={fetchUnassigned}>↻ Retry</button>
            </div>
          )}

          {/* ── KPI ROW ── */}
          {!authError && (
            <div className="vuc-kpi-row">
              {kpis.map(k => (
                <div
                  className={`vuc-kpi${k.warn ? " vuc-kpi--warn" : ""}`}
                  key={k.label}
                  style={{ "--kc": k.color, animationDelay: `${k.delay}ms` }}
                >
                  <div className="vuc-kpi__top">
                    <div className="vuc-kpi__icon">{k.icon}</div>
                    <div className="vuc-kpi__val">{k.value}</div>
                  </div>
                  <div className="vuc-kpi__lbl">{k.label}</div>
                  <div className="vuc-kpi__sub">{k.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── TABS ── */}
          {!authError && (
            <div className="vuc-tabs-wrap">
              <span className="vuc-tabs-label">View</span>
              <div className="vuc-tabs">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    className={`vuc-tab${activeTab === t.key ? " active" : ""}`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                    <span className={tabBadgeClass(t.key)}>{tabCount(t.key)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB DESCRIPTION ── */}
          {!authError && (
            <div className="vuc-tab-desc">{TAB_DESC[activeTab]}</div>
          )}

          {/* ── PANEL ── */}
          {!authError && (
            <div className="vuc-panel">
              <div className="vuc-panel__hdr">
                <span className="vuc-panel__title">
                  {activeTab === "UNASSIGNED" && "Unassigned Complaints"}
                  {activeTab === "PENDING"    && "Pending Complaints"}
                  {activeTab === "ALL"        && "All Open Complaints"}
                </span>
                <div className="vuc-panel__meta">
                  <span className={panelCountClass()}>
                    {tabFiltered.length} record{tabFiltered.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {tabFiltered.length === 0 ? (
                <div className="vuc-empty">
                  <div className="vuc-empty__icon">
                    {activeTab === "UNASSIGNED" ? "✅" : activeTab === "PENDING" ? "🎯" : "🗂️"}
                  </div>
                  <div className="vuc-empty__title">
                    {activeTab === "UNASSIGNED" ? "No Governance Gaps"
                      : activeTab === "PENDING"  ? "No Pending Cases"
                      : "All Clear"}
                  </div>
                  <div className="vuc-empty__sub">
                    {activeTab === "UNASSIGNED"
                      ? "All complaints currently have workers assigned. Great governance!"
                      : activeTab === "PENDING"
                      ? "No complaints are assigned without progress."
                      : "No open complaints matching the current filter."}
                  </div>
                </div>
              ) : (
                <>
                  <div className="vuc-table-wrap">
                    <table className="vuc-table">
                      <thead>
                        <tr>
                          <th>Complaint ID</th>
                          <th>Area</th>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Filed On</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabFiltered.map((c, i) => (
                          <tr
                            className="vuc-trow"
                            key={c.complaintId}
                            style={{ animationDelay: `${i * 30}ms` }}
                          >
                            <td className="vuc-id"><code>{c.complaintId}</code></td>
                            <td><span className="vuc-area">{c.areaName || "—"}</span></td>
                            <td>
                              <span className="vuc-cat">
                                <span>{getCatIcon(c.category)}</span>
                                {c.category}
                              </span>
                            </td>
                            <td>
                              <span className="vuc-desc">
                                {c.description
                                  ? c.description.slice(0, 60) + (c.description.length > 60 ? "…" : "")
                                  : "—"}
                              </span>
                            </td>
                            <td><StatusPill status={c.status} /></td>
                            <td>
                              <span className="vuc-date">
                                {new Date(c.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit", month: "short", year: "numeric",
                                })}
                              </span>
                            </td>
                            <td>
                              {/* Fixed: include vaoId in route to match app router pattern */}
                              <button
                                className="vuc-inspect"
                                onClick={() => nav(`/vao/${vaoId}/complaints/view/${c.complaintId}`)}
                              >
                                Inspect →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="vuc-tbl-foot">
                    Showing {tabFiltered.length} of {totalCount} total open complaints
                    {activeTab !== "ALL" && ` · ${TABS.find(t => t.key === activeTab)?.label} view`}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}