import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

import "../../../styles/VaoComplaints.css";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

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

function useRequireRole(requiredRole) {
  const nav = useNavigate();
  useEffect(() => {
    const token = getToken();
    const role  = getRole();
    if (!token) { nav("/vao/login", { replace: true }); return; }
    if (role !== requiredRole) { nav("/unauthorized", { replace: true }); }
  }, [nav, requiredRole]);
}

/* ════════════════════════════════════════════
   METADATA
════════════════════════════════════════════ */
const STATUS_LIST = [
  "ALL", "SUBMITTED", "AWAITING_ASSIGNMENT", "ASSIGNED",
  "IN_PROGRESS", "RESOLVED", "VERIFIED", "CLOSED",
];

const STATUS_META = {
  SUBMITTED:           { icon: "📝", label: "Submitted",           color: "#2e8ea8", bg: "rgba(35,110,128,.12)",  border: "rgba(35,110,128,.30)" },
  AWAITING_ASSIGNMENT: { icon: "⏳", label: "Awaiting",            color: "#c07818", bg: "rgba(192,120,24,.12)",  border: "rgba(192,120,24,.30)" },
  ASSIGNED:            { icon: "🔗", label: "Assigned",            color: "#7050b8", bg: "rgba(112,80,184,.12)",  border: "rgba(112,80,184,.30)" },
  IN_PROGRESS:         { icon: "⚙️", label: "In Progress",         color: "#b8922e", bg: "rgba(184,146,46,.12)",  border: "rgba(184,146,46,.30)" },
  RESOLVED:            { icon: "✅", label: "Resolved",            color: "#378a55", bg: "rgba(55,138,85,.12)",   border: "rgba(55,138,85,.30)"  },
  VERIFIED:            { icon: "🛡️", label: "Verified",            color: "#2ecc71", bg: "rgba(46,204,113,.12)",  border: "rgba(46,204,113,.30)" },
  CLOSED:              { icon: "🔒", label: "Closed",              color: "#4e6878", bg: "rgba(78,104,120,.12)",  border: "rgba(78,104,120,.30)" },
};

const CATEGORY_ICONS = {
  WATER: "💧", ROAD: "🛣️", ELECTRICITY: "⚡", SANITATION: "🧹",
  DRAINAGE: "🌊", HEALTH: "🏥", EDUCATION: "📚", GARBAGE: "🗑️", OTHER: "📌",
  ROAD_DAMAGE: "🛣️", WATER_SUPPLY: "💧", STREET_LIGHT: "💡",
};

const UNASSIGNED_STATUSES = ["SUBMITTED", "AWAITING_ASSIGNMENT"];
const PAGE_SIZE = 8;

function getCatIcon(cat = "") { return CATEGORY_ICONS[cat?.toUpperCase()] ?? "📌"; }
function formatCat(cat = "")  { return cat.replace(/_/g, " "); }
function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ════════════════════════════════════════════
   STATUS BADGE
════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { icon: "📌", label: status.replace(/_/g, " "), color: "#9e9070", bg: "rgba(158,144,112,.10)", border: "rgba(158,144,112,.26)" };
  return (
    <span className="vc-status-badge" style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}>
      <span className="vc-status-badge__dot" style={{ background: meta.color }} />
      {meta.icon} {meta.label}
    </span>
  );
}

/* ════════════════════════════════════════════
   PAGINATION
════════════════════════════════════════════ */
function Pagination({ total, page, onPage }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i);
  return (
    <div className="vc-pagination">
      <button className="vc-pg-btn" onClick={() => onPage(page - 1)} disabled={page === 0}>‹ Prev</button>
      <div className="vc-pg-nums">
        {pages.map(p => (
          <button key={p} className={`vc-pg-num${page === p ? " active" : ""}`} onClick={() => onPage(p)}>
            {p + 1}
          </button>
        ))}
      </div>
      <button className="vc-pg-btn" onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1}>Next ›</button>
      <span className="vc-pg-info">
        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function VaoComplaintsDashboard() {
  const { vaoId } = useParams();
  const nav = useNavigate();

  useRequireRole("VAO");

  const [complaints,   setComplaints]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [authError,    setAuthError]    = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page,         setPage]         = useState(0);

  /* Reset page when filter changes */
  useEffect(() => { setPage(0); }, [statusFilter]);

  /* ── FETCH ALL VILLAGE COMPLAINTS ──
     Backend: GET /vao/complaints/village
     Village is resolved from JWT principal — no villageId needed in URL or guard.
  */
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(null);

    try {
      const data = await authFetch(`${BASE}/vao/complaints/village`);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.code === 401)      { setAuthError(e.message); setTimeout(() => nav("/vao/login", { replace: true }), 2000); }
      else if (e.code === 403) { setAuthError(e.message); }
      else                     { setError(e.message); }
    } finally {
      setLoading(false);
    }
  }, [nav]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  /* ── DERIVED ── */
  const filtered        = complaints.filter(c => statusFilter === "ALL" || c.status === statusFilter);
  const paged           = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const unassignedCount = complaints.filter(c => UNASSIGNED_STATUSES.includes(c.status)).length;

  const kpis = [
    { label: "Total",       value: complaints.length,                                                                     icon: "📊", color: "var(--gold)" },
    { label: "Unassigned",  value: unassignedCount,                                                                       icon: "⏳", color: "var(--amb)", warn: unassignedCount > 0 },
    { label: "In Progress", value: complaints.filter(c => c.status === "IN_PROGRESS" || c.status === "ASSIGNED").length, icon: "⚙️", color: "#2e8ea8" },
    { label: "Resolved",    value: complaints.filter(c => ["RESOLVED","VERIFIED","CLOSED"].includes(c.status)).length,   icon: "✅", color: "#378a55" },
  ];

  if (loading) return (
    <>
      <Navbar />
      <div className="vc-page">
        <div className="vc-bg-grid" />
        <div className="vc-loading"><div className="vc-spinner" /><p>Loading complaints…</p></div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <div className="vc-page">
        <div className="vc-bg-grid" />
        <div className="vc-inner">

          {/* ── HEADER ── */}
          <header className="vc-header">
            <div className="vc-header__left">
              <div className="vc-eyebrow"><span className="vc-eyebrow__dot" />Village Administration Office</div>
              <h1 className="vc-title">Complaints Dashboard</h1>
              <p className="vc-sub">Monitor and govern complaint operations for your jurisdiction</p>
            </div>
            <div className="vc-actions">
              <button className="vc-btn" onClick={() => nav(`/vao/dashboard/${vaoId}`)}>← Dashboard</button>
              {/* NOTE: /vao/${vaoId}/complaints/unassigned must call GET /vao/complaints/village/unassigned */}
              <button className="vc-btn" onClick={() => nav(`/vao/${vaoId}/complaints/unassigned`)}>
                ⏳ Unassigned
                {unassignedCount > 0 && <span className="vc-badge vc-badge--warn">{unassignedCount}</span>}
              </button>
              <button className="vc-btn" onClick={() => nav(`/vao/${vaoId}/complaints/analytics`)}>📈 Analytics</button>
              <button className="vc-btn vc-btn-primary" onClick={fetchComplaints}>↻ Refresh</button>
            </div>
          </header>

          {/* ── AUTH ERROR ── */}
          {authError && (
            <div className="vc-error vc-error--auth">
              🔒 {authError}
              {authError.includes("expired") && <button onClick={() => nav("/vao/login", { replace: true })}>Go to Login</button>}
            </div>
          )}

          {/* ── GENERAL ERROR ── */}
          {error && !authError && (
            <div className="vc-error"><span>⚠</span><span>{error}</span><button onClick={fetchComplaints}>↻ Retry</button></div>
          )}

          {/* ── KPI ROW ── */}
          {!authError && (
            <div className="vc-kpi-row">
              {kpis.map((k, i) => (
                <div key={k.label} className={`vc-kpi${k.warn ? " vc-kpi--warn" : ""}`} style={{ "--kc": k.color, animationDelay: `${i * 65}ms` }}>
                  <div className="vc-kpi__corner" />
                  <div className="vc-kpi__top">
                    <div className="vc-kpi__icon">{k.icon}</div>
                    <div className="vc-kpi__val">{k.value}</div>
                  </div>
                  <div className="vc-kpi__lbl">{k.label}</div>
                  <div className="vc-kpi__sub">{k.warn ? "Need attention" : k.label === "Total" ? "All complaints" : k.label === "In Progress" ? "Active cases" : "Completed"}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── QUICK NAV ── */}
          {!authError && (
            <div className="vc-quicknav">
              <span className="vc-quicknav__label">Navigate</span>
              <div className="vc-quicknav__btns">
                {[
                  { l: "Unassigned",  ic: "⏳", fn: () => nav(`/vao/${vaoId}/complaints/unassigned`),              color: "#c07818" },
                  { l: "Submitted",   ic: "📝", fn: () => nav(`/vao/${vaoId}/complaints/status/SUBMITTED`),        color: "#2e8ea8" },
                  { l: "Assigned",    ic: "🔗", fn: () => nav(`/vao/${vaoId}/complaints/status/ASSIGNED`),         color: "#7050b8" },
                  { l: "In Progress", ic: "⚙️", fn: () => nav(`/vao/${vaoId}/complaints/status/IN_PROGRESS`),      color: "#b8922e" },
                  { l: "Resolved",    ic: "✅", fn: () => nav(`/vao/${vaoId}/complaints/status/RESOLVED`),         color: "#378a55" },
                  { l: "Verified",    ic: "🛡️", fn: () => nav(`/vao/${vaoId}/complaints/status/VERIFIED`),        color: "#2ecc71" },
                  { l: "Closed",      ic: "🔒", fn: () => nav(`/vao/${vaoId}/complaints/status/CLOSED`),           color: "#4e6878" },
                  { l: "Analytics",   ic: "📈", fn: () => nav(`/vao/${vaoId}/complaints/analytics`),              color: "#b8922e" },
                ].map(({ l, ic, fn, color }) => (
                  <button key={l} className="vc-qbtn" style={{ "--qc": color }} onClick={fn}>{ic} {l}</button>
                ))}
              </div>
            </div>
          )}

          {/* ── FILTER PILLS ── */}
          {!authError && (
            <div className="vc-filters-section">
              <div className="vc-filters-row">
                <span className="vc-filters-label">Filter by Status</span>
                <div className="vc-filters">
                  {STATUS_LIST.map(s => {
                    const cnt   = s === "ALL" ? complaints.length : complaints.filter(c => c.status === s).length;
                    const meta  = STATUS_META[s];
                    const label = s === "ALL" ? "All" : (meta?.label ?? s.replace(/_/g, " "));
                    const isActive = statusFilter === s;
                    return (
                      <button
                        key={s}
                        className={`vc-filter${isActive ? " active" : ""}`}
                        style={meta ? { "--fc": meta.color, "--fb": meta.bg, "--fbd": meta.border } : {}}
                        onClick={() => setStatusFilter(s)}
                      >
                        {s !== "ALL" && <span className="vc-filter__ic">{meta?.icon}</span>}
                        <span className="vc-filter__label">{label}</span>
                        <span className="vc-filter__cnt">{cnt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TABLE PANEL ── */}
          {!authError && (
            <div className="vc-panel">
              <div className="vc-panel__hdr">
                <div className="vc-panel__hdr-left">
                  <span className="vc-panel__title">Complaints Registry</span>
                  <span className={`vc-panel__count${unassignedCount > 0 && statusFilter === "ALL" ? " hot" : ""}`}>
                    {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                  </span>
                  {statusFilter !== "ALL" && STATUS_META[statusFilter] && (
                    <span className="vc-panel__filter-tag" style={{
                      color: STATUS_META[statusFilter].color,
                      background: STATUS_META[statusFilter].bg,
                      borderColor: STATUS_META[statusFilter].border,
                    }}>
                      {STATUS_META[statusFilter].icon} {STATUS_META[statusFilter].label}
                    </span>
                  )}
                </div>
                <div className="vc-panel__hdr-right">
                  {statusFilter !== "ALL" && (
                    <button className="vc-clear-filter" onClick={() => setStatusFilter("ALL")}>✕ Clear filter</button>
                  )}
                </div>
              </div>

              <div className="vc-table-wrap">
                <table className="vc-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Area</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Worker</th>
                      <th>Filed On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="vc-empty">
                            <div className="vc-empty__icon">🗂️</div>
                            <div className="vc-empty__text">No complaints found</div>
                            <div className="vc-empty__sub">
                              {statusFilter !== "ALL"
                                ? `No "${STATUS_META[statusFilter]?.label ?? statusFilter.replace(/_/g, " ")}" complaints`
                                : "No complaints filed yet"}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paged.map((c, i) => (
                        <tr key={c.complaintId} className="vc-trow" style={{ animationDelay: `${i * 28}ms` }}>
                          <td className="vc-id-cell"><code>{c.complaintId}</code></td>
                          <td><span className="vc-area-cell">{c.areaName || "—"}</span></td>
                          <td>
                            <span className="vc-category">
                              <span>{getCatIcon(c.category)}</span>
                              {formatCat(c.category) || "—"}
                            </span>
                          </td>
                          <td><StatusBadge status={c.status} /></td>
                          <td>
                            <div className="vc-worker">
                              {c.workerName ? (
                                <><div className="vc-worker__av">{getInitials(c.workerName)}</div><span className="vc-worker__name">{c.workerName}</span></>
                              ) : (
                                <><div className="vc-worker__av vc-worker__av--none">—</div><span className="vc-worker__none">Unassigned</span></>
                              )}
                            </div>
                          </td>
                          <td><span className="vc-date">{formatDate(c.createdAt)}</span></td>
                          <td>
                            <button className="vc-view" onClick={() => nav(`/vao/${vaoId}/complaints/view/${c.complaintId}`)}>
                              View →
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filtered.length > 0 && (
                <>
                  <Pagination total={filtered.length} page={page} onPage={p => setPage(p)} />
                  <div className="vc-tbl-foot">
                    <span>Showing {Math.min(paged.length, PAGE_SIZE)} of {filtered.length} filtered · {complaints.length} total</span>
                    {statusFilter !== "ALL" && (
                      <span>· Filtered by <strong style={{ color: STATUS_META[statusFilter]?.color ?? "var(--gold)" }}>{STATUS_META[statusFilter]?.label ?? statusFilter.replace(/_/g, " ")}</strong></span>
                    )}
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