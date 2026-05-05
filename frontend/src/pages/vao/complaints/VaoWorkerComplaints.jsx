import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

import "../../../Styles/VaoWorkerComplaints.css";

/* ════════════════════════════════════════════
   BASE URL — single source of truth
════════════════════════════════════════════ */
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
   METADATA & SUB-COMPONENTS
════════════════════════════════════════════ */
const STATUS_META = {
  SUBMITTED:           { label: "Submitted",           icon: "📝", color: "#2e8ea8" },
  AWAITING_ASSIGNMENT: { label: "Awaiting Assignment", icon: "⏳", color: "#c07818" },
  ASSIGNED:            { label: "Assigned",            icon: "🔗", color: "#7050b8" },
  IN_PROGRESS:         { label: "In Progress",         icon: "⚙️", color: "#b8922e" },
  RESOLVED:            { label: "Resolved",            icon: "✅", color: "#378a55" },
  VERIFIED:            { label: "Verified",            icon: "🛡️", color: "#2ecc71" },
  CLOSED:              { label: "Closed",              icon: "🔒", color: "#4e6878" },
};

const CATEGORY_ICONS = {
  WATER: "💧", ROAD: "🛣️", ELECTRICITY: "⚡", SANITATION: "🧹",
  DRAINAGE: "🌊", HEALTH: "🏥", EDUCATION: "📚", GARBAGE: "🗑️", OTHER: "📌",
  ROAD_DAMAGE: "🛣️", WATER_SUPPLY: "💧", STREET_LIGHT: "💡",
};

function getCatIcon(cat = "") { return CATEGORY_ICONS[cat?.toUpperCase()] ?? "📌"; }
function formatCat(cat = "")  { return cat.replace(/_/g, " "); }
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status.replace(/_/g, " "), icon: "📌", color: "#888" };
  return (
    <span
      className="vaw-status"
      style={{
        background:   meta.color + "20",
        color:        meta.color,
        border:       `1px solid ${meta.color}44`,
        borderRadius: "9999px",
        padding:      "4px 12px",
      }}
    >
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="vaw-stat" style={{ "--sc": color }}>
      <div className="vaw-stat__corner" />
      <div className="vaw-stat__icon">{icon}</div>
      <div className="vaw-stat__val">{value}</div>
      <div className="vaw-stat__lbl">{label}</div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function VaoWorkerComplaints() {
  const { vaoId, workerId } = useParams();
  const nav = useNavigate();

  // ── Role guard ──
  useRequireRole("VAO");

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [authError,  setAuthError]  = useState(null);

  /* ── FETCH WORKER COMPLAINTS ──
     Backend: GET /vao/complaints/worker/{workerId}
     workerId comes from the URL params — correct as-is.
  */
  const fetchWorker = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(null);

    try {
      const data = await authFetch(`${BASE}/vao/complaints/worker/${workerId}`);
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
  }, [workerId, nav]);

  useEffect(() => { fetchWorker(); }, [fetchWorker]);

  /* ── DERIVED COUNTS ── */
  const activeCount   = complaints.filter(c => ["ASSIGNED",  "IN_PROGRESS"                ].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => ["RESOLVED",  "VERIFIED",    "CLOSED"      ].includes(c.status)).length;
  const pendingCount  = complaints.filter(c => ["SUBMITTED", "AWAITING_ASSIGNMENT"        ].includes(c.status)).length;

  /* ── Loading ── */
  if (loading) return (
    <>
      <Navbar />
      <div className="vaw-loading">
        <div className="vaw-spinner" />
        <p>Loading worker tasks…</p>
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
      <div className="vaw-page">
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(184,146,46,.022) 1px, transparent 1px)",
          backgroundSize: "36px 36px", opacity: .50,
        }} />

        <div className="vaw-inner">

          {/* ── HEADER ── */}
          <header className="vaw-header">
            <button className="vaw-back" onClick={() => nav(`/vao/${vaoId}/complaints`)}>
              ← Complaints
            </button>
            <div className="vaw-header__center">
              <div className="vaw-eyebrow">Worker Task Registry</div>
              <h1 className="vaw-title">Worker Complaints</h1>
              <p className="vaw-sub">Worker ID: <code>{workerId}</code></p>
            </div>
            <button className="vaw-btn vaw-btn--refresh" onClick={fetchWorker}>
              ↻ Refresh
            </button>
          </header>

          {/* ── AUTH ERROR BANNER (401 / 403) ── */}
          {authError && (
            <div className="vaw-error vaw-error--auth">
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
            <div className="vaw-error">
              <span>⚠</span>
              <span>{error}</span>
              <button onClick={fetchWorker}>Retry</button>
            </div>
          )}

          {/* ── STAT CARDS ── */}
          {!authError && !error && (
            <div className="vaw-stats">
              <StatCard label="Total"    value={complaints.length} icon="📊" color="var(--gold)" />
              <StatCard label="Active"   value={activeCount}       icon="⚙️" color="#7050b8"     />
              <StatCard label="Resolved" value={resolvedCount}     icon="✅" color="#378a55"     />
              <StatCard label="Pending"  value={pendingCount}      icon="⏳" color="#c07818"     />
            </div>
          )}

          {/* ── EMPTY ── */}
          {!authError && !error && complaints.length === 0 && (
            <div className="vaw-empty">
              <div className="vaw-empty__icon">🗂️</div>
              <div className="vaw-empty__title">No Complaints Assigned</div>
              <div className="vaw-empty__sub">This worker has no complaints assigned yet.</div>
            </div>
          )}

          {/* ── TABLE PANEL ── */}
          {!authError && !error && complaints.length > 0 && (
            <div className="vaw-panel">
              <div className="vaw-panel__hdr">
                <span className="vaw-panel__title">Assigned Tasks</span>
                <span className="vaw-panel__count">
                  {complaints.length} record{complaints.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="vaw-table-wrap">
                <table className="vaw-table">
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Area</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Filed On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c, i) => (
                      <tr
                        key={c.complaintId}
                        className="vaw-trow"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <td className="vaw-id"><code>{c.complaintId}</code></td>
                        <td><span className="vaw-area">{c.areaName || "—"}</span></td>
                        <td>
                          <span className="vaw-cat">
                            <span>{getCatIcon(c.category)}</span>
                            {formatCat(c.category) || "—"}
                          </span>
                        </td>
                        <td><StatusBadge status={c.status} /></td>
                        <td><span className="vaw-date">{formatDate(c.createdAt)}</span></td>
                        <td>
                          {/* Fixed: include vaoId to match app router pattern */}
                          <button
                            className="vaw-view"
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

              <div className="vaw-tbl-foot">
                {complaints.length} complaint{complaints.length !== 1 ? "s" : ""} assigned to this worker
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}