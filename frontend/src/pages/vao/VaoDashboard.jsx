import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ruralopsLogo from "../../assets/ruralops-logo.png";
import VaoProfileModal from "./VaoProfileModal"; /* ← CHANGE 1: new import */
import "../../Styles/VaoDashboard.css";

/* ════════════════════════════════════════════
   BASE URL — single source of truth
════════════════════════════════════════════ */
const BASE = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

/* ════════════════════════════════════════════
   AUTH HELPERS — all read fresh, never stale
════════════════════════════════════════════ */
function getToken()        { return localStorage.getItem("accessToken"); }
function getRefreshToken() { return localStorage.getItem("refreshToken"); }
function getAccountId()    { return localStorage.getItem("accountId"); }
function getAccountType()  { return localStorage.getItem("accountType"); }

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
   AUTH FETCH — with silent refresh on 401
════════════════════════════════════════════ */
async function authFetch(url, options = {}) {
  const makeRequest = (token) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });

  let res = await makeRequest(getToken());

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await makeRequest(getToken());
    if (res.status === 401) {
      localStorage.clear();
      const err = new Error("Session expired. Please log in again.");
      err.code = 401;
      throw err;
    }
  }

  if (res.status === 403) {
    const err = new Error("You do not have permission to perform this action.");
    err.code = 403;
    throw err;
  }

  return res;
}

async function fetchAllPages(urlBase, pageSize = 5) {
  const all = [];
  let page = 0;
  const SAFETY = 500;
  while (page < SAFETY) {
    const res  = await authFetch(`${urlBase}?page=${page}`);
    if (!res.ok) break;
    const raw  = await res.json().catch(() => []);
    const list = Array.isArray(raw) ? raw : (raw?.content ?? raw?.data ?? []);
    if (!list.length) break;
    all.push(...list);
    if (list.length < pageSize) break;
    page++;
  }
  return all;
}

/* ════════════════════════════════════════════
   THEME & UTILITIES
════════════════════════════════════════════ */
const T = {
  gold: "#c9a227", green: "#3d9960", red: "#b03a2e", amber: "#d4881a",
  teal: "#2a7a8c", purple: "#6b3fa0", orange: "#e8630a", violet: "#7c5cfc",
};

const GOVERNANCE_QUOTES = [
  "Accountability is the bedrock of professional administration.",
  "Efficient service delivery is our primary objective.",
  "Integrity in data ensures transparency in governance.",
  "Digital empowerment drives rural development.",
  "Responsive administration leads to resilient communities.",
  "Transparency is the catalyst for public trust.",
];
function getRandomQuote() {
  return GOVERNANCE_QUOTES[Math.floor(Math.random() * GOVERNANCE_QUOTES.length)];
}
function normalizeUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t || t.startsWith("blob:")) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/")) return `${BASE}${t}`;
  return `${BASE}/${t}`;
}
function resolvePhotoUrl(obj)     { return normalizeUrl(obj?.profilePhotoUrl || obj?.profilePhoto || obj?.photoUrl || obj?.photo || null); }
function resolveSignatureUrl(obj) { return normalizeUrl(obj?.signaturePhotoUrl || obj?.signatureUrl || obj?.signature || null); }
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}
function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return "Just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function fmtDate(d)  { return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"; }
function fmtShort(d) { return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"; }
function fmt24Time() { return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }); }
function normalizeStatus(s) {
  if (!s) return "";
  return String(s).toUpperCase().replace(/[\s-]+/g, "_");
}

const UNASSIGNED_STATUSES      = new Set(["SUBMITTED", "AWAITING_ASSIGNMENT"]);
const ACTIVE_WORKER_STATUSES   = new Set(["ACTIVE"]);
const ON_LEAVE_STATUSES        = new Set(["ON_LEAVE", "ON LEAVE"]);
const INACTIVE_WORKER_STATUSES = new Set(["INACTIVE"]);
const PENDING_ACT_STATUSES     = new Set(["PENDING_ACTIVATION", "PENDING ACTIVATION"]);
const IN_PROGRESS_STATUSES     = new Set(["IN_PROGRESS", "IN PROGRESS", "ASSIGNED"]);
const RESOLVED_STATUSES        = new Set(["RESOLVED", "VERIFIED", "CLOSED"]);
const VERIFIED_STATUSES        = new Set(["VERIFIED"]);

/* ════════════════════════════════════════════
   PAGINATION COMPONENT
════════════════════════════════════════════ */
const PAGE_SIZE = 5;

function Pagination({ total, page, onPage }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 0; i < totalPages; i++) pages.push(i);
  return (
    <div className="vd-pagination">
      <button className="vd-page-btn" onClick={() => onPage(page - 1)} disabled={page === 0}>‹ Prev</button>
      <div className="vd-page-nums">
        {pages.map(p => (
          <button key={p} className={`vd-page-num${page === p ? " active" : ""}`} onClick={() => onPage(p)}>
            {p + 1}
          </button>
        ))}
      </div>
      <button className="vd-page-btn" onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1}>Next ›</button>
      <span className="vd-page-info">
        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════
   CHART & UI SUB-COMPONENTS
════════════════════════════════════════════ */
function Counter({ to = 0, ms = 900 }) {
  const [n, setN] = useState(0);
  const raf = useRef(); const prev = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const from = prev.current; prev.current = to;
    const t0 = performance.now();
    const step = t => {
      const p = Math.min((t - t0) / ms, 1);
      setN(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [to, ms]);
  return <>{n}</>;
}

function DonutChart({ segments, size = 120, thickness = 16, label, sublabel }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const R = size / 2 - thickness / 2, C = size / 2, circ = 2 * Math.PI * R;
  let cum = 0;
  return (
    <div className="chart-donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(201,162,39,0.08)" strokeWidth={thickness} />
        {segments.map((d, i) => {
          if (!d.value) return null;
          const pct = d.value / total, dash = pct * circ, off = -cum * circ;
          cum += pct;
          return <circle key={i} cx={C} cy={C} r={R} fill="none" stroke={d.color}
            strokeWidth={thickness} strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={off} strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }} />;
        })}
      </svg>
      {(label !== undefined || sublabel) && (
        <div className="chart-donut-center">
          {label !== undefined && <div className="chart-donut-val">{label}</div>}
          {sublabel && <div className="chart-donut-sub">{sublabel}</div>}
        </div>
      )}
    </div>
  );
}

function BarChart({ data, barAreaH = 130 }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const VAL_H = 16, LBL_H = 52, TOTAL_H = barAreaH + LBL_H + VAL_H;
  const barW = 34, gap = 14, totalW = data.length * (barW + gap) - gap;
  return (
    <div className="chart-bar-root">
      <svg width={totalW} height={TOTAL_H} viewBox={`0 0 ${totalW} ${TOTAL_H}`} style={{ display: "block", overflow: "visible", width: "100%" }}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={0} y1={VAL_H + barAreaH * (1 - f)} x2={totalW} y2={VAL_H + barAreaH * (1 - f)}
            stroke="rgba(201,162,39,0.07)" strokeWidth="1" strokeDasharray="3,6" />
        ))}
        {data.map((d, i) => {
          const bh = Math.max((d.value / max) * barAreaH, d.value > 0 ? 4 : 0);
          const cx = i * (barW + gap) + barW / 2, x = i * (barW + gap), y = VAL_H + barAreaH - bh;
          const c = d.color || "#c9a227";
          return (
            <g key={i}>
              {d.value > 0 && <text x={cx} y={Math.max(y - 5, VAL_H - 2)} textAnchor="middle" fill={c} fontSize="9" fontFamily="Cinzel,serif" fontWeight="800">{d.value}</text>}
              <rect x={x} y={y} width={barW} height={bh} rx="4" fill={c} opacity="0.90" style={{ filter: `drop-shadow(0 3px 8px ${c}55)` }}>
                <animate attributeName="height" from="0" to={bh} dur={`${0.45 + i * 0.07}s`} begin="0s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
                <animate attributeName="y" from={VAL_H + barAreaH} to={y} dur={`${0.45 + i * 0.07}s`} begin="0s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
              </rect>
              <rect x={x} y={y} width={barW * 0.4} height={bh} rx="4" fill="rgba(255,255,255,0.12)" style={{ pointerEvents: "none" }}>
                <animate attributeName="height" from="0" to={bh} dur={`${0.45 + i * 0.07}s`} begin="0s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
                <animate attributeName="y" from={VAL_H + barAreaH} to={y} dur={`${0.45 + i * 0.07}s`} begin="0s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
              </rect>
              <text transform={`translate(${cx},${VAL_H + barAreaH + 8}) rotate(-40)`} textAnchor="end" fill={c} fillOpacity="0.75" fontSize="7.5" fontFamily="Cinzel,serif" fontWeight="600" style={{ letterSpacing: "0.04em" }}>{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HBar({ label, value, max, color, showPct = true }) {
  const pct = max ? Math.max((value / max) * 100, value > 0 ? 1 : 0) : 0;
  return (
    <div className="hbar">
      <div className="hbar__meta">
        <span className="hbar__lbl">{label}</span>
        <div className="hbar__right">
          <span className="hbar__val" style={{ color }}>{value}</span>
          {showPct && <span className="hbar__pct">{Math.round(pct)}%</span>}
        </div>
      </div>
      <div className="hbar__track"><div className="hbar__fill" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

function ComplianceRing({ score }) {
  const R = 34, circ = 2 * Math.PI * R;
  const dash = (score / 100) * circ, offset = circ / 4;
  const color = score >= 80 ? "#3d9960" : score >= 50 ? "#d4881a" : "#b03a2e";
  const label = score >= 80 ? "EXCELLENT" : score >= 50 ? "MODERATE" : "CRITICAL";
  return (
    <svg viewBox="0 0 88 88" width="88" height="88" className="compliance-ring">
      <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(201,162,39,0.09)" strokeWidth="7" />
      <circle cx="44" cy="44" r={R} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset}
        strokeLinecap={score >= 100 ? "butt" : "round"}
        style={{ transition: "stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)" }} />
      <text x="44" y="40" textAnchor="middle" fill="#e8dfc8" fontSize="15" fontWeight="800" fontFamily="Cinzel,serif">{score}%</text>
      <text x="44" y="54" textAnchor="middle" fill="#6a5a38" fontSize="5.5" fontFamily="Cinzel,serif" letterSpacing="0.08">{label}</text>
    </svg>
  );
}

function Sparkline({ data, color = "#c9a227", height = 28, width = 80 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 3px ${color}60)` }} />
      <circle cx={data.map((_, i) => (i / (data.length - 1)) * width).pop()} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="2.5" fill={color} />
    </svg>
  );
}

function KpiCard({ icon, label, value, sub, color, delta, spark, onClick, delay = 0 }) {
  return (
    <div className="kpi-card" style={{ "--kc": color, animationDelay: `${delay}s` }}
      onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="kpi-card__accent" />
      <div className="kpi-card__top">
        <div className="kpi-card__icon" style={{ background: `${color}18`, color }}>{icon}</div>
        <div className="kpi-card__body">
          <div className="kpi-card__val" style={{ color }}><Counter to={value} /></div>
          <div className="kpi-card__lbl">{label}</div>
        </div>
        {spark && <div className="kpi-card__spark"><Sparkline data={spark} color={color} /></div>}
      </div>
      {(sub || delta !== undefined) && (
        <div className="kpi-card__foot">
          {sub && <span className="kpi-card__sub">{sub}</span>}
          {delta !== undefined && <span className={`kpi-card__delta ${delta >= 0 ? "pos" : "neg"}`}>{delta >= 0 ? "↑" : "↓"}{Math.abs(delta)}%</span>}
        </div>
      )}
    </div>
  );
}

function StatPanelCard({ title, icon, total, segments, color, onClick }) {
  return (
    <div className="stat-panel" style={{ "--pc": color }} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="stat-panel__accent" />
      <div className="stat-panel__hdr">
        <span className="stat-panel__ic">{icon}</span>
        <span className="stat-panel__title" style={{ color }}>{title}</span>
        <span className="stat-panel__total" style={{ color }}>{total}</span>
      </div>
      <div className="stat-panel__body">
        <DonutChart size={80} thickness={10} segments={segments} label={total} sublabel="total" />
        <div className="stat-panel__legend">
          {segments.map((s, i) => (
            <div key={i} className="stat-panel__leg">
              <span className="stat-panel__leg-dot" style={{ background: s.color }} />
              <span className="stat-panel__leg-lbl">{s.label}</span>
              <span className="stat-panel__leg-val" style={{ color: s.color }}>{s.value}</span>
              <span className="stat-panel__leg-pct">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VaoPhoto({ src, alt, className, fallback }) {
  return (
    <>
      <img key={src} src={src} alt={alt ?? ""} className={className}
        onLoad={e => e.currentTarget.classList.add("loaded")}
        onError={e => { e.currentTarget.style.display = "none"; const s = e.currentTarget.nextElementSibling; if (s) s.style.display = ""; }} />
      {fallback && <span style={{ display: "none" }}>{fallback}</span>}
    </>
  );
}

function Pill({ status }) {
  const ns = normalizeStatus(status);
  const map = { ACTIVE: ["p-green", "Active"], INACTIVE: ["p-red", "Inactive"], ON_LEAVE: ["p-amber", "On Leave"], PENDING: ["p-blue", "Pending"], PENDING_ACTIVATION: ["p-blue", "Pending"] };
  const [cls, lbl] = map[ns] ?? ["p-muted", status ?? "—"];
  return <span className={`vd-pill ${cls}`}>{lbl}</span>;
}

function CitPill({ status }) {
  const ns = normalizeStatus(status);
  const map = { ACTIVE: ["p-green", "Active"], INACTIVE: ["p-red", "Inactive"], PENDING: ["p-amber", "Pending"], PENDING_ACTIVATION: ["p-sky", "Activating"], REJECTED: ["p-red", "Rejected"] };
  const [cls, lbl] = map[ns] ?? ["p-muted", status ?? "—"];
  return <span className={`vd-pill ${cls}`}>{lbl}</span>;
}

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="vd-toasts">
      {toasts.map(t => (
        <div key={t.id} className={`vd-toast vd-toast--${t.type}`}>
          <span className="vd-toast__ic">{t.type === "success" ? "✓" : "✕"}</span>
          <span>{t.msg}</span>
          <button onClick={() => onDismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

function CitizenModal({ open, onClose, loading, citizen }) {
  useEffect(() => {
    if (!open) return;
    const h = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  const c = citizen ?? {};
  return (
    <div className="vd-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vd-modal" role="dialog" aria-modal="true">
        <div className="vd-modal__hdr">
          <div className="vd-modal__hdr-l">
            <div className="vd-modal__av">{(c.fullName || "?")[0].toUpperCase()}</div>
            <div><h2 className="vd-modal__name">{c.fullName || "Citizen"}</h2><p className="vd-modal__sub2">#{c.citizenId || "—"}</p></div>
          </div>
          <div className="vd-modal__hdr-r">
            {!loading && !c._error && <CitPill status={c.status} />}
            <button className="vd-modal__x" onClick={onClose}>✕</button>
          </div>
        </div>
        {loading ? (
          <div className="vd-modal__loading"><div className="vd-spin" /><p>Loading…</p></div>
        ) : c._error ? (
          <div className="vd-modal__err">{c._authError ? "🔒" : "⚠️"} {c._error}</div>
        ) : (
          <div className="vd-modal__body">
            <div className="vd-modal__grid">
              {[["👤 Name", c.fullName], ["🪪 ID", c.citizenId], ["📧 Email", c.email], ["📱 Phone", c.phone || c.mobileNumber], ["🏡 Village", c.villageName || c.village], ["⚧ Gender", c.gender], ["🎂 DOB", c.dateOfBirth], ["🔒 Aadhaar", c.aadhaarNumber ? "••••" + String(c.aadhaarNumber).slice(-4) : null], ["📅 Registered", fmtDate(c.createdAt)], ["📊 Status", c.status]].filter(([, v]) => v).map(([l, v]) => (
                <div key={l} className="vd-modal__row"><span className="vd-modal__rl">{l}</span><span className="vd-modal__rv">{v}</span></div>
              ))}
            </div>
            {(c.address || c.permanentAddress) && (
              <div className="vd-modal__addr-wrap"><p className="vd-modal__addr-ttl">📍 Address</p><p className="vd-modal__addr">{c.address || c.permanentAddress}</p></div>
            )}
          </div>
        )}
        <div className="vd-modal__foot"><button className="vd-btn vd-btn--ghost" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

function AreaModal({ open, onClose, vaoId, onSuccess }) {
  const [areas, setAreas]             = useState([]);
  const [areaLoading, setAreaLoading] = useState(false);
  const [areaErr, setAreaErr]         = useState(null);
  const [newName, setNewName]         = useState("");
  const [creating, setCreating]       = useState(false);
  const [createErr, setCreateErr]     = useState(null);

  const load = useCallback(async () => {
    if (!vaoId) return;
    setAreaLoading(true); setAreaErr(null);
    try {
      const res = await authFetch(`${BASE}/vao/areas`);
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setAreas(Array.isArray(data) ? data : []);
    } catch (e) {
      setAreaErr(e.code === 401 ? "Session expired — please reload and log in again."
                : e.code === 403 ? "You do not have permission to manage areas."
                : e.message);
    } finally { setAreaLoading(false); }
  }, [vaoId]);

  useEffect(() => { if (open) { load(); setNewName(""); setCreateErr(null); } }, [open, load]);
  useEffect(() => {
    if (!open) return;
    const h = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) { setCreateErr("Area name cannot be empty."); return; }
    if (name.length > 120) { setCreateErr("Name must be under 120 characters."); return; }
    setCreating(true); setCreateErr(null);
    try {
      const res = await authFetch(`${BASE}/vao/areas`, { method: "POST", body: JSON.stringify({ name }) });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body?.message || `Failed (${res.status})`); }
      setNewName(""); await load(); if (onSuccess) onSuccess();
    } catch (e) {
      setCreateErr(e.code === 401 ? "Session expired — please log in again."
                 : e.code === 403 ? "You do not have permission to create areas."
                 : e.message);
    } finally { setCreating(false); }
  };

  if (!open) return null;
  return (
    <div className="vd-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vd-modal vd-modal--areas" role="dialog" aria-modal="true">
        <div className="vd-modal__hdr">
          <div className="vd-modal__hdr-l">
            <div className="vd-modal__av vd-modal__av--area">🗺</div>
            <div><h2 className="vd-modal__name">Village Areas</h2><p className="vd-modal__sub2">Streets, wards &amp; localities</p></div>
          </div>
          <div className="vd-modal__hdr-r">
            <span className="vd-pill p-green">{areas.length} Areas</span>
            <button className="vd-modal__x" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="vd-area-create">
          <div className="vd-area-create__row">
            <div className="vd-search-wrap vd-area-input-wrap">
              <span className="vd-search__ic">⚔</span>
              <input className="vd-search" placeholder="New area name…" value={newName}
                onChange={e => { setNewName(e.target.value); setCreateErr(null); }}
                onKeyDown={e => e.key === "Enter" && handleCreate()} maxLength={120} style={{ width: "100%" }} />
              {newName && <button className="vd-search__clr" onClick={() => setNewName("")}>✕</button>}
            </div>
            <button className="vd-btn vd-btn--teal" onClick={handleCreate} disabled={creating || !newName.trim()} style={{ whiteSpace: "nowrap", minWidth: 130 }}>
              {creating ? <><div className="vd-spin vd-spin--sm" /> Processing…</> : "+ Register Area"}
            </button>
          </div>
          {createErr && <p className="vd-area-create__err">⚠ {createErr}</p>}
        </div>
        <div className="vd-modal__body vd-area-list-body">
          {areaLoading ? <div className="vd-modal__loading"><div className="vd-spin" /><p>Loading…</p></div>
          : areaErr ? <div className="vd-modal__err">⚠️ {areaErr} <button className="vd-errbar__btn" onClick={load}>↻ Retry</button></div>
          : areas.length === 0 ? <div className="vd-empty" style={{ padding: "32px 20px" }}><p className="vd-empty__ic">🗺</p><p className="vd-empty__t">No areas registered yet</p></div>
          : (
            <div className="vd-area-grid">
              {areas.map((a, i) => (
                <div key={a.id} className="vd-area-card" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="vd-area-card__icon">🏘</div>
                  <div className="vd-area-card__info"><p className="vd-area-card__name">{a.name}</p><p className="vd-area-card__id">Area #{a.id}</p></div>
                  <span className="vd-pill p-green" style={{ fontSize: 9 }}>Active</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="vd-modal__foot">
          <span style={{ fontFamily: "var(--fh)", fontSize: 10, color: "var(--t3)", letterSpacing: ".06em" }}>{areas.length} {areas.length === 1 ? "area" : "areas"}</span>
          <button className="vd-btn vd-btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function SectionHdr({ title, sub, action, actionLabel }) {
  return (
    <div className="vd-sec-hdr">
      <div><h3 className="vd-sec-title">{title}</h3>{sub && <p className="vd-sec-sub">{sub}</p>}</div>
      {action && <button className="vd-sec-act" onClick={action}>{actionLabel}</button>}
    </div>
  );
}

function CommandBanner({ vaoName, quote }) {
  const nameParts = (vaoName || "Officer").trim().split(" ");
  return (
    <div className="vd-command-banner">
      <div className="vd-command-banner__bg" />
      <p className="vd-command-banner__eyebrow">
        <span className="vd-command-banner__dot" />
        Official Portal · Village Administrative Officer · Dashboard
      </p>
      <h2 className="vd-command-banner__title">
        <span className="vd-reveal-greeting"><span className="word">{getGreeting()},&nbsp;</span></span>
        <span className="vd-reveal-name">
          {nameParts.map((word, i) => (
            <span key={i} className={i === nameParts.length - 1 ? "vd-reveal-name__surname word" : "vd-reveal-name__first"}
              style={{ marginRight: i < nameParts.length - 1 ? "0.18em" : 0 }}>{word}</span>
          ))}
        </span>
      </h2>
      <p className="vd-command-banner__quote">{quote}</p>
      <div className="vd-command-banner__divider" />
    </div>
  );
}

function IDCard({ name, id, village, photo, signature, active }) {
  const [flip, setFlip] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef();
  const yr = new Date().getFullYear();
  const initials = name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";
  const issueDate = new Date().toLocaleDateString("en-IN", { month: "2-digit", year: "numeric" });
  const expDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 4); return d.toLocaleDateString("en-IN", { month: "2-digit", year: "numeric" }); })();
  function onMove(e) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setTilt({ x: ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * -7, y: ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 7 });
  }
  return (
    <div className="idc-scene">
      <div ref={ref} className={`idc-wrap${flip ? " idc-flip" : ""}`}
        style={{ transform: flip ? `perspective(1200px) rotateY(180deg)` : `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        onMouseMove={!flip ? onMove : undefined} onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        onClick={() => setFlip(f => !f)} role="button" tabIndex={0} aria-label={`ID Card for ${name}`}
        onKeyDown={e => e.key === "Enter" && setFlip(f => !f)}>
        <div className="idc-face idc-front">
          <div className="idc-tribar"><div style={{ background: "#FF9933" }} /><div style={{ background: "#fff" }} /><div style={{ background: "#138808" }} /></div>
          <div className="idc-bg-pattern" /><div className="idc-watermark"><img src={ruralopsLogo} alt="" aria-hidden="true" /></div>
          <div className="idc-front__hdr">
            <div className="idc-brand">
              <svg viewBox="0 0 30 30" fill="none" width="24" height="24"><circle cx="15" cy="15" r="13" stroke="rgba(201,162,39,0.85)" strokeWidth="1.5" /><circle cx="15" cy="15" r="7.5" stroke="rgba(201,162,39,0.50)" strokeWidth="1" /><circle cx="15" cy="15" r="2.8" fill="rgba(245,215,110,0.90)" /><line x1="15" y1="2" x2="15" y2="28" stroke="rgba(201,162,39,0.28)" strokeWidth="0.9" /><line x1="2" y1="15" x2="28" y2="15" stroke="rgba(201,162,39,0.28)" strokeWidth="0.9" /></svg>
              <div><p className="idc-brand__name">RURAL OPS</p><p className="idc-brand__sub">VILLAGE ADMINISTRATIVE OFFICER</p></div>
            </div>
          </div>
          <div className="idc-front__rule" />
          <div className="idc-front__body">
            <div className="idc-front__pbox">
              {photo ? <VaoPhoto src={photo} alt={name ?? ""} className="idc-front__photo" fallback={<div className="idc-front__nophoto">{initials}</div>} /> : <div className="idc-front__nophoto">{initials}</div>}
            </div>
            <div className="idc-front__info">
              <p className="idc-front__name">{name || "—"}</p>
              <p className="idc-front__role">VILLAGE ADMINISTRATIVE OFFICER</p>
              <div className="idc-front__rows">
                {[["VILLAGE", village || "—"], ["DEPT.", "Revenue & Rural Dev."], ["ISSUED", issueDate], ["VALID", expDate]].map(([l, v]) => (
                  <div key={l} className="idc-front__row"><span className="idc-front__rl">{l}</span><span className="idc-front__sep">:</span><span className="idc-front__rv">{v}</span></div>
                ))}
              </div>
            </div>
            <div className="idc-front__right">
              <div className={`idc-badge${active ? " idc-badge--active" : " idc-badge--pending"}`}><span className="idc-badge__dot" />{active ? "ACTIVE" : "PENDING"}</div>
              <div className="idc-chip"><div className="idc-chip__inner"><div className="idc-chip__lines">{[...Array(5)].map((_, i) => <div key={i} />)}</div><div className="idc-chip__center" /></div></div>
            </div>
          </div>
          <div className="idc-front__mrz"><span>IND&lt;&lt;VAO</span>{(id || "").split("-").map((s, i) => <span key={i}>&lt;{s}</span>)}<span style={{ marginLeft: "auto" }}>{yr}</span></div>
          <div className="idc-top-line" /><div className="idc-bottom-line" />
        </div>
        <div className="idc-face idc-back">
          <div className="idc-back__bg" /><div className="idc-back__pattern" />
          <div className="idc-back-watermark"><img src={ruralopsLogo} alt="" aria-hidden="true" /></div>
          <div className="idc-back__mag" />
          <div className="idc-back__header">
            <svg viewBox="0 0 22 22" fill="none" width="16" height="16"><circle cx="11" cy="11" r="10" stroke="rgba(201,162,39,0.70)" strokeWidth="1.3" /><circle cx="11" cy="11" r="2.5" fill="rgba(245,215,110,0.80)" /></svg>
            <div><p className="idc-back__issuer">RURAL OPERATIONS PLATFORM</p><p className="idc-back__sub">GOVERNMENT OF INDIA · RURAL DEVELOPMENT</p></div>
          </div>
          <div className="idc-back__sig">
            <div className="idc-back__sigbox">
              <p className="idc-back__siglbl">AUTHORISED SIGNATURE</p>
              <div className="idc-back__siglines">{signature ? <VaoPhoto src={signature} alt="sig" className="idc-back__photo" fallback={<><div /><div /><div /></>} /> : <><div /><div /><div /></>}</div>
            </div>
          </div>
          <div className="idc-back__rows">
            {[["VAO ID", id, true], ["NAME", name, false], ["VILLAGE", village, false], ["DEPT", "Revenue & Rural Development", false], ["STATUS", active ? "ACTIVE & VERIFIED" : "PENDING", false, active ? "#3d9960" : "#d4881a"], ["ISSUED", issueDate, true], ["EXPIRES", expDate, true], ["ISSUED BY", "District Collector's Office", false]].map(([lbl, val, mono, color]) => (
              <div className="idc-back__row" key={lbl}><span className="idc-back__rl">{lbl}</span><span className={`idc-back__rv${mono ? " idc-back__rv--mono" : ""}`} style={color ? { color } : {}}>{val || "—"}</span></div>
            ))}
          </div>
          <div className="idc-back__foot">
            <div className="idc-barcode">{Array.from({ length: 28 }).map((_, i) => (<div key={i} className="idc-barcode__bar" style={{ height: `${8 + Math.sin(i * 1.35) * 6}px`, width: i % 3 === 0 ? "2px" : "1px", background: `rgba(201,162,39,${0.15 + (Math.sin(i) * 0.5 + 0.5) * 0.18})` }} />))}</div>
            <p className="idc-back__legal">Property of Govt. of India. If found, return to nearest District Collector's Office.</p>
          </div>
        </div>
      </div>
      <p className="idc-hint">Click to flip · Hover to tilt</p>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(fmt24Time());
  useEffect(() => { const t = setInterval(() => setTime(fmt24Time()), 1000); return () => clearInterval(t); }, []);
  return <span className="vd-live-clock">{time}</span>;
}

function VerifiedReviewBanner({ count, onClick }) {
  if (!count || count < 1) return null;
  return (
    <div className="vd-verified-banner" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && onClick()}>
      <div className="vd-verified-banner__pulse" />
      <span className="vd-verified-banner__icon">🛡️</span>
      <div className="vd-verified-banner__body">
        <p className="vd-verified-banner__title">{count} complaint{count !== 1 ? "s" : ""} ready to close</p>
        <p className="vd-verified-banner__sub">Workers have completed these tasks and they've been verified. Review each case and close them to finalise the records.</p>
      </div>
      <div className="vd-verified-banner__cta">Review &amp; Close →</div>
    </div>
  );
}

/* ════════════════════════════════════════════
   OVERVIEW ANALYTICS
════════════════════════════════════════════ */
function OverviewAnalytics({ citizens, workers, complaints, areas, complianceData, onCitizens, onWorkers, onComplaints, goToApprovals, goToUnassigned, goToVerified }) {
  const { total: cTotal, approved: cApp, pending: cPend, rejected: cRej } = citizens;
  const { total: wTotal, active: wAct, onLeave: wLeave, inactive: wInact, pendingAct: wPend } = workers;
  const { total: coTotal, unassigned: coUna, inProgress: coInPro, resolved: coRes, verified: coVerif } = complaints;
  const { total: aTotal } = areas;
  const score = complianceData?.score ?? 0;
  const approvalRate   = (cApp + cRej + cPend) > 0 ? Math.round((cApp / (cApp + cRej + cPend)) * 100) : 0;
  const resolutionRate = coTotal > 0 ? Math.round((coRes / coTotal) * 100) : 0;
  const workerUtilRate = wTotal  > 0 ? Math.round((wAct  / wTotal)  * 100) : 0;
  return (
    <div className="overview-analytics">
      <div className="kpi-strip">
        <KpiCard icon="👥" label="Citizens"   value={cTotal}  sub={`${approvalRate}% approved`}  color="#c9a227" onClick={onCitizens}    delay={0} />
        <KpiCard icon="⚒"  label="Workers"    value={wTotal}  sub={`${workerUtilRate}% active`}  color="#3d9960" onClick={onWorkers}     delay={0.05} />
        <KpiCard icon="📋" label="Complaints" value={coTotal} sub={`${resolutionRate}% resolved`} color="#b03a2e" onClick={onComplaints}  delay={0.10} />
        <KpiCard icon="🗺" label="Areas"      value={aTotal}  sub="Jurisdictions mapped"          color="#2a7a8c"                         delay={0.15} />
        <KpiCard icon="⏳" label="Pending"    value={cPend}   sub="Awaiting approval"             color="#d4881a" onClick={goToApprovals} delay={0.20} />
        <KpiCard icon="🚨" label="Unassigned" value={coUna}   sub="No worker assigned"            color="#e8630a" onClick={goToUnassigned} delay={0.25} />
      </div>
      <div className="analytics-grid-3">
        <StatPanelCard title="Citizens"   icon="👥" total={cTotal}  color="#c9a227" onClick={onCitizens}   segments={[{ label: "Approved", value: cApp, color: "#3d9960" }, { label: "Pending", value: cPend, color: "#d4881a" }, { label: "Rejected", value: cRej, color: "#b03a2e" }]} />
        <StatPanelCard title="Workers"    icon="⚒"  total={wTotal}  color="#3d9960" onClick={onWorkers}    segments={[{ label: "Active", value: wAct, color: "#3d9960" }, { label: "On Leave", value: wLeave, color: "#d4881a" }, { label: "Inactive", value: wInact, color: "#b03a2e" }, { label: "Pending", value: wPend, color: "#6b3fa0" }]} />
        <StatPanelCard title="Complaints" icon="📋" total={coTotal} color="#b03a2e" onClick={onComplaints} segments={[{ label: "Unassigned", value: coUna, color: "#e8630a" }, { label: "In Progress", value: coInPro, color: "#c9a227" }, { label: "Resolved", value: coRes, color: "#3d9960" }]} />
      </div>
      <div className="analytics-grid-2">
        <div className="chart-panel">
          <div className="chart-panel__hdr"><h4 className="chart-panel__title">Distribution Overview</h4><span className="chart-panel__sub">Citizens · Workers · Complaints</span></div>
          <div className="chart-panel__body chart-panel__body--bar">
            <BarChart barAreaH={120} data={[
              { label: "C.Approved", value: cApp, color: "#3d9960" }, { label: "C.Pending", value: cPend, color: "#d4881a" }, { label: "C.Rejected", value: cRej, color: "#b03a2e" },
              { label: "W.Active", value: wAct, color: "#52c87a" }, { label: "W.Leave", value: wLeave, color: "#e8a840" }, { label: "W.Inactive", value: wInact, color: "#d05050" },
              { label: "Unassigned", value: coUna, color: "#e8630a" }, { label: "InProgress", value: coInPro, color: "#c9a227" }, { label: "Resolved", value: coRes, color: "#4db870" },
            ]} />
          </div>
          <div className="chart-legend-row">
            {[{ c: "#3d9960", l: "Citizens · Approved" }, { c: "#d4881a", l: "Citizens · Pending" }, { c: "#52c87a", l: "Workers · Active" }, { c: "#e8630a", l: "Complaints · Unassigned" }, { c: "#4db870", l: "Complaints · Resolved" }]
              .map(x => (<span key={x.l} className="chart-legend-item"><span style={{ background: x.c }} />{x.l}</span>))}
          </div>
        </div>
        <div className="chart-panel">
          <div className="chart-panel__hdr"><h4 className="chart-panel__title">Governance Metrics</h4><span className="chart-panel__sub">Performance indicators</span></div>
          <div className="chart-panel__body chart-panel__body--compliance">
            <div className="compliance-block"><ComplianceRing score={score} /><div className="compliance-block__info"><p className="compliance-block__title">Governance Score</p><p className="compliance-block__sub">Based on 6 key indicators</p></div></div>
            <div className="rate-bars">
              <HBar label="Approval Rate"      value={approvalRate}   max={100} color="#c9a227" showPct={false} />
              <HBar label="Worker Utilization" value={workerUtilRate} max={100} color="#3d9960" showPct={false} />
              <HBar label="Resolution Rate"    value={resolutionRate} max={100} color="#b03a2e" showPct={false} />
              <HBar label="Areas Covered"      value={Math.min(aTotal * 10, 100)} max={100} color="#2a7a8c" showPct={false} />
            </div>
          </div>
        </div>
      </div>
      {(cPend > 0 || coUna > 0 || coVerif > 0) && (
        <div className="alert-row">
          {cPend  > 0 && (<div className="alert-card alert-card--amber"><div className="alert-card__icon">⏳</div><div className="alert-card__body"><p className="alert-card__title">{cPend} Citizen{cPend !== 1 ? "s" : ""} Awaiting Approval</p><p className="alert-card__sub">Administrative action required · Awaiting review</p></div><button className="vd-btn vd-btn--amber vd-btn--sm" onClick={goToApprovals}>Review →</button></div>)}
          {coUna  > 0 && (<div className="alert-card alert-card--rose"><div className="alert-card__icon">🚨</div><div className="alert-card__body"><p className="alert-card__title">{coUna} Complaint{coUna !== 1 ? "s" : ""} Without Worker</p><p className="alert-card__sub">SUBMITTED &amp; AWAITING_ASSIGNMENT — needs assignment</p></div><button className="vd-btn vd-btn--crimson vd-btn--sm" onClick={goToUnassigned}>Assign →</button></div>)}
          {coVerif > 0 && (<div className="alert-card alert-card--violet"><div className="alert-card__icon">🛡️</div><div className="alert-card__body"><p className="alert-card__title">{coVerif} Complaint{coVerif !== 1 ? "s" : ""} Ready to Close</p><p className="alert-card__sub">Workers completed · Verified — your sign-off required</p></div><button className="vd-btn vd-btn--violet vd-btn--sm" onClick={goToVerified}>Review &amp; Close →</button></div>)}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   ANALYTICS TAB
════════════════════════════════════════════ */
function AnalyticsTab({ citizens, workers, complaints, areas, complianceData, goToComplaints, goToAnalytics }) {
  const { total: cTotal, approved: cApp, pending: cPend, rejected: cRej } = citizens;
  const { total: wTotal, active: wAct, onLeave: wLeave, inactive: wInact, pendingAct: wPend } = workers;
  const { total: coTotal, unassigned: coUna, inProgress: coInPro, resolved: coRes } = complaints;
  const { total: aTotal } = areas;
  const score   = complianceData?.score   ?? 0;
  const factors = complianceData?.factors ?? [];

  const approvalRate   = (cApp + cRej + cPend) > 0 ? Math.round((cApp / (cApp + cRej + cPend)) * 100) : 0;
  const resolutionRate = coTotal > 0 ? Math.round((coRes / coTotal) * 100) : 0;
  const workerUtilRate = wTotal  > 0 ? Math.round((wAct  / wTotal)  * 100) : 0;
  const pendingRate    = coTotal > 0 ? Math.round(((coUna + coInPro) / coTotal) * 100) : 0;

  return (
    <div className="analytics-deep">
      <div className="kpi-strip">
        <KpiCard icon="📊" label="Approval Rate"  value={approvalRate}   sub="Citizens approved %"   color="#3d9960" delay={0} />
        <KpiCard icon="🛡"  label="Compliance"     value={score}          sub="Governance health"      color="#6b3fa0" delay={0.05} />
        <KpiCard icon="⚒"  label="Worker Util."   value={workerUtilRate} sub="Active workforce %"     color="#2a7a8c" delay={0.10} />
        <KpiCard icon="✅" label="Resolution"     value={resolutionRate} sub="Complaints resolved %"  color="#3d9960" delay={0.15} />
        <KpiCard icon="⏳" label="Pending Rate"   value={pendingRate}    sub="Open issues %"          color="#d4881a" delay={0.20} />
        <KpiCard icon="🗺" label="Areas"          value={aTotal}         sub="Active Areas"           color="#2a7a8c" delay={0.25} />
      </div>

      <div className="analytics-grid-3-wide">
        <div className="chart-panel chart-panel--tall">
          <div className="chart-panel__hdr"><h4 className="chart-panel__title">👥 Citizen Analysis</h4><span className="chart-panel__sub">{cTotal} total registered</span></div>
          <div className="chart-panel__body" style={{ flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <DonutChart size={100} thickness={13} segments={[{ value: cApp, color: "#3d9960" }, { value: cPend, color: "#d4881a" }, { value: cRej, color: "#b03a2e" }]} label={cTotal} sublabel="total" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <HBar label="Approved" value={cApp}  max={cTotal + cRej + cPend} color="#3d9960" />
                <HBar label="Pending"  value={cPend} max={cTotal + cRej + cPend} color="#d4881a" />
                <HBar label="Rejected" value={cRej}  max={cTotal + cRej + cPend} color="#b03a2e" />
              </div>
            </div>
            <div className="stat-row-mini">
              <div className="stat-mini"><span style={{ color: "#3d9960" }}>{approvalRate}%</span><span>Approval Rate</span></div>
              <div className="stat-mini"><span style={{ color: "#d4881a" }}>{cPend}</span><span>Awaiting</span></div>
              <div className="stat-mini"><span style={{ color: "#b03a2e" }}>{cRej}</span><span>Rejected</span></div>
            </div>
          </div>
        </div>

        <div className="chart-panel chart-panel--tall">
          <div className="chart-panel__hdr"><h4 className="chart-panel__title">⚒ Worker Analysis</h4><span className="chart-panel__sub">{wTotal} total workers</span></div>
          <div className="chart-panel__body" style={{ flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <DonutChart size={100} thickness={13} segments={[{ value: wAct, color: "#3d9960" }, { value: wLeave, color: "#d4881a" }, { value: wInact, color: "#b03a2e" }, { value: wPend, color: "#6b3fa0" }]} label={wTotal} sublabel="total" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <HBar label="Active"   value={wAct}   max={wTotal} color="#3d9960" />
                <HBar label="On Leave" value={wLeave} max={wTotal} color="#d4881a" />
                <HBar label="Inactive" value={wInact} max={wTotal} color="#b03a2e" />
                <HBar label="Pending"  value={wPend}  max={wTotal} color="#6b3fa0" />
              </div>
            </div>
            <div className="stat-row-mini">
              <div className="stat-mini"><span style={{ color: "#3d9960" }}>{workerUtilRate}%</span><span>Utilization</span></div>
              <div className="stat-mini"><span style={{ color: "#d4881a" }}>{wLeave}</span><span>On Leave</span></div>
              <div className="stat-mini"><span style={{ color: "#6b3fa0" }}>{wPend}</span><span>Pending</span></div>
            </div>
          </div>
        </div>

        <div className="chart-panel chart-panel--tall">
          <div className="chart-panel__hdr"><h4 className="chart-panel__title">📋 Complaint Analysis</h4><span className="chart-panel__sub">{coTotal} total complaints</span></div>
          <div className="chart-panel__body" style={{ flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <DonutChart size={100} thickness={13} segments={[{ value: coUna, color: "#e8630a" }, { value: coInPro, color: "#c9a227" }, { value: coRes, color: "#3d9960" }]} label={coTotal} sublabel="total" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <HBar label="Unassigned"  value={coUna}   max={coTotal} color="#e8630a" />
                <HBar label="In Progress" value={coInPro} max={coTotal} color="#c9a227" />
                <HBar label="Resolved"    value={coRes}   max={coTotal} color="#3d9960" />
              </div>
            </div>
            <div className="stat-row-mini">
              <div className="stat-mini"><span style={{ color: "#3d9960" }}>{resolutionRate}%</span><span>Resolved</span></div>
              <div className="stat-mini"><span style={{ color: "#e8630a" }}>{coUna}</span><span>Unassigned</span></div>
              <div className="stat-mini"><span style={{ color: "#c9a227" }}>{coInPro}</span><span>In Progress</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-panel" style={{ marginTop: 14 }}>
        <div className="chart-panel__hdr"><h4 className="chart-panel__title">⚒ Worker Performance Board</h4><span className="chart-panel__sub">{wTotal} workers · ranked by status</span></div>
        <div className="chart-panel__body chart-panel__body--worker-perf">
          {wTotal === 0 ? (
            <div style={{ padding: "20px", color: "var(--t3)", fontFamily: "var(--fh)", fontSize: 10, textAlign: "center" }}>No workers provisioned yet</div>
          ) : (
            <div className="worker-perf-grid">
              {[{ n: wAct, l: "Active", pts: "Currently serving", c: "#3d9960" }, { n: wLeave, l: "On Leave", pts: "Temporarily absent", c: "#d4881a" }, { n: wInact, l: "Inactive", pts: "Not operational", c: "#b03a2e" }, { n: wPend, l: "Pending", pts: "Awaiting activation", c: "#6b3fa0" }]
                .map(({ n, l, pts, c }) => (
                  <div key={l} className="worker-perf-stat" style={{ "--wpc": c }}>
                    <div className="worker-perf-stat__ring">
                      <svg viewBox="0 0 60 60" width="60" height="60">
                        <circle cx="30" cy="30" r="24" fill="none" stroke={`${c}18`} strokeWidth="5" />
                        <circle cx="30" cy="30" r="24" fill="none" stroke={c} strokeWidth="5"
                          strokeDasharray={`${wTotal > 0 ? (n / wTotal) * 150.8 : 0} 150.8`}
                          strokeDashoffset="37.7" strokeLinecap="round"
                          style={{ transition: "stroke-dasharray 1s ease" }} />
                        <text x="30" y="34" textAnchor="middle" fill={c} fontSize="12" fontWeight="800" fontFamily="Cinzel,serif">{wTotal > 0 ? Math.round((n / wTotal) * 100) : 0}%</text>
                      </svg>
                    </div>
                    <div className="worker-perf-stat__info">
                      <span className="worker-perf-stat__n" style={{ color: c }}>{n}</span>
                      <span className="worker-perf-stat__l">{l}</span>
                      <span className="worker-perf-stat__pts">{pts}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="analytics-grid-2" style={{ marginTop: 14 }}>
        <div className="chart-panel">
          <div className="chart-panel__hdr"><h4 className="chart-panel__title">📊 Comparative Metrics</h4><span className="chart-panel__sub">Key performance indicators</span></div>
          <div className="chart-panel__body" style={{ flexDirection: "column", gap: 0, padding: 0 }}>
            {[
              { icon: "👥", label: "Citizen Approval Rate",  value: approvalRate,   max: 100, color: "#c9a227", sub: `${cApp} approved of ${cApp + cRej + cPend} total`,    good: approvalRate >= 70,   warn: approvalRate >= 40 },
              { icon: "⚒",  label: "Worker Utilization",    value: workerUtilRate, max: 100, color: "#3d9960", sub: `${wAct} active of ${wTotal} total`,                  good: workerUtilRate >= 70, warn: workerUtilRate >= 40 },
              { icon: "✅", label: "Complaint Resolution",  value: resolutionRate, max: 100, color: "#2a7a8c", sub: `${coRes} resolved of ${coTotal} total`,               good: resolutionRate >= 70, warn: resolutionRate >= 40 },
              { icon: "🛡",  label: "Governance Score",      value: score,          max: 100, color: "#6b3fa0", sub: score >= 80 ? "Excellent standing" : score >= 50 ? "Moderate standing" : "Needs improvement", good: score >= 80, warn: score >= 50 },
              { icon: "⏳", label: "Pending Backlog",       value: pendingRate,    max: 100, color: "#e8630a", sub: `${coUna + coInPro} open issues`,                     good: pendingRate <= 20,    warn: pendingRate <= 50, invert: true },
            ].map((m, i) => {
              const status = m.invert ? (m.good ? "good" : m.warn ? "warn" : "bad") : (m.good ? "good" : m.warn ? "warn" : "bad");
              const statusColor = status === "good" ? "#3d9960" : status === "warn" ? "#d4881a" : "#b03a2e";
              return (
                <div key={i} className="cmetric-row">
                  <div className="cmetric-row__left">
                    <span className="cmetric-row__icon" style={{ background: `${m.color}18`, color: m.color }}>{m.icon}</span>
                    <div className="cmetric-row__text"><span className="cmetric-row__label">{m.label}</span><span className="cmetric-row__sub">{m.sub}</span></div>
                  </div>
                  <div className="cmetric-row__right">
                    <div className="cmetric-row__bar-outer">
                      <div className="cmetric-row__bar-track"><div className="cmetric-row__bar-fill" style={{ width: `${m.value}%`, background: `linear-gradient(90deg,${statusColor}99,${statusColor})`, boxShadow: `0 0 8px ${statusColor}55` }} /></div>
                      <span className="cmetric-row__badge" style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44` }}>{status === "good" ? "✓" : status === "warn" ? "⚠" : "✗"}</span>
                    </div>
                    <span className="cmetric-row__val" style={{ color: statusColor }}>{m.value}<span className="cmetric-row__unit">%</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-panel">
          <div className="chart-panel__hdr"><h4 className="chart-panel__title">🛡 Compliance Breakdown</h4><span className="chart-panel__sub">Governance health score</span></div>
          <div className="chart-panel__body chart-panel__body--compliance">
            <ComplianceRing score={score} />
            <div className="compliance-items">
              {factors.map(r => (
                <div key={r.l} className="comp-item">
                  <div className={`comp-item__ic${r.ok ? " ok" : ""}`}>{r.ok ? "✓" : "✗"}</div>
                  <div className="comp-item__info"><span className="comp-item__l">{r.l}</span><span className="comp-item__d">{r.d}</span></div>
                  <div className="comp-item__score"><span className={`comp-item__pts${r.ok ? " ok" : ""}`}>+{r.earned}</span><span className="comp-item__max">/{r.max}</span></div>
                </div>
              ))}
              {factors.length > 0 && (
                <div className="comp-item comp-item--total">
                  <div className="comp-item__ic ok">Σ</div>
                  <div className="comp-item__info"><span className="comp-item__l">Total Score</span><span className="comp-item__d">Sum of all factors</span></div>
                  <div className="comp-item__score"><span className="comp-item__pts ok" style={{ fontSize: 14 }}>{score}</span><span className="comp-item__max">/100</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="vd-btn vd-btn--crimson" onClick={goToAnalytics}>📈 Full Complaint Analytics →</button>
        <button className="vd-btn vd-btn--ghost"   onClick={goToComplaints}>📋 All Complaints →</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════ */
export default function VaoDashboard() {
  const nav = useNavigate();
  const { vaoId: urlVaoId } = useParams();

  const storedId   = getAccountId();
  const storedType = getAccountType();
  const vaoId = (urlVaoId && getToken() && storedId === urlVaoId && storedType === "VAO") ? urlVaoId : null;

  const [profile,       setProfile]       = useState(null);
  const [dash,          setDash]          = useState(null);
  const [workers,       setWorkers]       = useState([]);
  const [pending,       setPending]       = useState([]);
  const [allCits,       setAllCits]       = useState([]);
  const [citStats,      setCitStats]      = useState(null);
  const [areas,         setAreas]         = useState([]);
  const [complaints,    setComplaints]    = useState([]);
  const [selCitizen,    setSelCitizen]    = useState(null);
  const [citModal,      setCitModal]      = useState(false);
  const [citLoading,    setCitLoading]    = useState(false);
  const [areaModal,     setAreaModal]     = useState(false);
  const [profileModal,  setProfileModal]  = useState(false); /* ← CHANGE 2: new state */
  const [loading,       setLoading]       = useState(true);
  const [err,           setErr]           = useState(null);
  const [authError,     setAuthError]     = useState(null);
  const [visible,       setVisible]       = useState(false);
  const [wFilter,       setWFilter]       = useState("ALL");
  const [cFilter,       setCFilter]       = useState("ALL");
  const [citSearch,     setCitSearch]     = useState("");
  const [activeTab,     setActiveTab]     = useState("overview");
  const [refreshed,     setRefreshed]     = useState(null);
  const [toasts,        setToasts]        = useState([]);
  const [motto,         setMotto]         = useState("");
  const [revealKey,     setRevealKey]     = useState(0);

  const [workerPage,    setWorkerPage]    = useState(0);
  const [citPage,       setCitPage]       = useState(0);
  const [complaintPage, setComplaintPage] = useState(0);

  const addToast = useCallback((type, msg) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  const goToApprovals        = useCallback(() => nav(`/vao/${vaoId}/citizens/approvals`),            [nav, vaoId]);
  const goToComplaints       = useCallback(() => nav(`/vao/${vaoId}/complaints`),                    [nav, vaoId]);
  const goToUnassigned       = useCallback(() => nav(`/vao/${vaoId}/complaints/unassigned`),         [nav, vaoId]);
  const goToStatus           = useCallback((s) => nav(`/vao/${vaoId}/complaints/status/${s}`),       [nav, vaoId]);
  const goToVerified         = useCallback(() => nav(`/vao/${vaoId}/complaints/status/VERIFIED`),    [nav, vaoId]);
  const goToWorkers          = useCallback(() => nav(`/vao/${vaoId}/workers/add`),                   [nav, vaoId]);
  const goToAreaComplaints   = useCallback((aId) => nav(`/vao/${vaoId}/complaints/area/${aId}`),     [nav, vaoId]);
  const goToComplaintDetail  = useCallback((cId) => nav(`/vao/${vaoId}/complaints/view/${cId}`),     [nav, vaoId]);
  const goToAnalytics        = useCallback(() => nav(`/vao/${vaoId}/complaints/analytics`),          [nav, vaoId]);
  const goToComplaintsByArea = useCallback(() => nav(`/vao/${vaoId}/complaints/by-area`),            [nav, vaoId]);

  const openCitizen = useCallback(async (citizenId) => {
    setCitModal(true); setCitLoading(true); setSelCitizen(null);
    try {
      const res = await authFetch(`${BASE}/vao/citizens/${citizenId}`);
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setSelCitizen(await res.json());
    } catch (e) {
      setSelCitizen({ _error: e.message, _authError: e.code === 401 || e.code === 403 });
    } finally { setCitLoading(false); }
  }, []);

  const fetchAreas = useCallback(async () => {
    if (!vaoId) return;
    try {
      const res = await authFetch(`${BASE}/vao/areas`);
      if (!res.ok) return;
      const data = await res.json();
      setAreas(Array.isArray(data) ? data : []);
    } catch (_) {}
  }, [vaoId]);

  const fetchComplaints = useCallback(async () => {
    if (!vaoId) return;
    try {
      const res = await authFetch(`${BASE}/vao/complaints/village`);
      if (!res.ok) return;
      const data = await res.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (_) {}
  }, [vaoId]);

  const fetchAll = useCallback(async (showLoader = false) => {
    if (!vaoId) { setLoading(false); return; }
    if (showLoader) setLoading(true);
    setErr(null); setAuthError(null);
    try {
      const pr = await authFetch(`${BASE}/vao/profile`);
      if (!pr.ok) throw new Error(`Profile failed (${pr.status})`);
      const pj = await pr.json();
      const rp = { ...pj, profilePhotoUrl: resolvePhotoUrl(pj), signaturePhotoUrl: resolveSignatureUrl(pj) };
      setProfile(rp);
      if (rp?.villageId) localStorage.setItem("villageId", rp.villageId);
      setMotto(getRandomQuote());
      setRevealKey(k => k + 1);
      if (rp?.profileCompleted !== true && showLoader) { setLoading(false); return; }

      const [dR, wR, pR, aR, sR] = await Promise.allSettled([
        authFetch(`${BASE}/vao/dashboard`),
        authFetch(`${BASE}/workers/village`),
        fetchAllPages(`${BASE}/vao/citizens/pending`),
        fetchAllPages(`${BASE}/vao/citizens/all`),
        authFetch(`${BASE}/vao/citizens/stats`),
      ]);

      if (dR.status === "fulfilled" && dR.value.ok) setDash(await dR.value.json().catch(() => null));
      if (wR.status === "fulfilled" && wR.value.ok) {
        const d = await wR.value.json().catch(() => []);
        setWorkers(Array.isArray(d) ? d : (d?.content ?? d?.data ?? []));
      }
      if (pR.status === "fulfilled") setPending(Array.isArray(pR.value) ? pR.value : []);
      if (aR.status === "fulfilled") setAllCits(Array.isArray(aR.value) ? aR.value : []);
      if (sR.status === "fulfilled" && sR.value.ok) setCitStats(await sR.value.json().catch(() => null));

      await fetchAreas();
      await fetchComplaints();
      setRefreshed(new Date());
    } catch (e) {
      if (e.code === 401) { setAuthError(e.message); setTimeout(() => nav("/vao/login", { replace: true }), 2000); }
      else if (e.code === 403) { setAuthError(e.message); }
      else { setErr(e.message); }
    } finally { setLoading(false); }
  }, [vaoId, fetchAreas, fetchComplaints, nav]);

  useEffect(() => { fetchAll(true); }, [fetchAll]);
  useEffect(() => { const t = setInterval(() => fetchAll(false), 30000); return () => clearInterval(t); }, [fetchAll]);
  useEffect(() => { if (!loading) { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); } }, [loading]);

  /* ── DERIVED STATE ── */
  const p           = profile ?? {};
  const vaoName     = p.fullName || "";
  const villageName = p.villageName || dash?.villageName || "";
  const photo       = p.profilePhotoUrl || null;
  const signature   = p.signaturePhotoUrl || null;
  const isComplete  = p.profileCompleted === true;
  const d = dash ?? {}, cs = citStats ?? {};

  const allActiveCits = allCits.filter(c => !["REJECTED"].includes(normalizeStatus(c.status)));
  const totalCitz  = cs.total !== undefined ? (cs.total - (cs.rejected || 0)) : allActiveCits.length > 0 ? allActiveCits.length : (d.totalCitizens ?? 0);
  const pendCnt    = cs.pending !== undefined ? cs.pending : pending.length > 0 ? pending.length : (d.pendingCitizenApprovals ?? 0);
  const appCitz    = cs.active !== undefined ? cs.active : allCits.filter(c => ["ACTIVE", "PENDING_ACTIVATION"].includes(normalizeStatus(c.status))).length;
  const rejCitz    = cs.rejected !== undefined ? cs.rejected : allCits.filter(c => normalizeStatus(c.status) === "REJECTED").length;

  const totalWork  = workers.length > 0 ? workers.length : (d.workersInVillage ?? 0);
  const activeWrk  = workers.filter(w => ACTIVE_WORKER_STATUSES.has(normalizeStatus(w.status))).length;
  const onLeave    = workers.filter(w => ON_LEAVE_STATUSES.has(normalizeStatus(w.status))).length;
  const inactWrk   = workers.filter(w => INACTIVE_WORKER_STATUSES.has(normalizeStatus(w.status))).length;
  const pendActWrk = workers.filter(w => PENDING_ACT_STATUSES.has(normalizeStatus(w.status))).length;

  const totalComplaints      = complaints.length;
  const unassignedComplaints = complaints.filter(c => UNASSIGNED_STATUSES.has(normalizeStatus(c.status)));
  const unassignedCount      = unassignedComplaints.length;
  const inProgressCount      = complaints.filter(c => IN_PROGRESS_STATUSES.has(normalizeStatus(c.status))).length;
  const resolvedCount        = complaints.filter(c => RESOLVED_STATUSES.has(normalizeStatus(c.status))).length;
  const verifiedCount        = complaints.filter(c => VERIFIED_STATUSES.has(normalizeStatus(c.status))).length;
  const verifiedComplaints   = complaints.filter(c => VERIFIED_STATUSES.has(normalizeStatus(c.status)));
  const totalAreas           = areas.length;

  const workerActiveRate = totalWork > 0 ? Math.round((activeWrk / totalWork) * 100) : 0;

  const complianceData = (() => {
    if (!isComplete) return { score: 0, factors: [] };
    const fProfile    = { l: "Profile Complete",   max: 15, earned: 15, ok: true, d: "Done" };
    const wEarned     = totalWork > 0 ? Math.min(20, Math.round((activeWrk / totalWork) * 20)) : 0;
    const fWorkers    = { l: "Workers Active",      max: 20, earned: wEarned, ok: wEarned >= 15, d: totalWork > 0 ? `${activeWrk}/${totalWork} active` : "No workers" };
    const cDenom      = appCitz + rejCitz + pendCnt;
    const cEarned     = cDenom > 0 ? Math.min(20, Math.round((appCitz / cDenom) * 20)) : 0;
    const fCitizens   = { l: "Citizens Approved",   max: 20, earned: cEarned, ok: cEarned >= 15, d: cDenom > 0 ? `${appCitz} approved (${Math.round((appCitz / cDenom) * 100)}%)` : "None registered" };
    const coEarned    = totalComplaints === 0 ? 20 : totalComplaints <= 2 ? 16 : totalComplaints <= 5 ? 12 : totalComplaints <= 10 ? 7 : 2;
    const fComplaints = { l: "Complaint Load",       max: 20, earned: coEarned, ok: coEarned >= 16, d: totalComplaints === 0 ? "Clear" : `${totalComplaints} open (−${20 - coEarned} pts)` };
    const uEarned     = Math.max(0, 15 - unassignedCount * 3);
    const fUnassigned = { l: "No Unassigned",        max: 15, earned: uEarned, ok: uEarned >= 15, d: unassignedCount === 0 ? "Clear" : `${unassignedCount} unassigned (−${15 - uEarned} pts)` };
    const pEarned     = pendCnt === 0 ? 10 : pendCnt < 3 ? 8 : pendCnt < 5 ? 6 : pendCnt < 10 ? 3 : 0;
    const fPending    = { l: "Approval Backlog",     max: 10, earned: pEarned, ok: pEarned >= 8, d: pendCnt === 0 ? "Clear" : `${pendCnt} pending (−${10 - pEarned} pts)` };
    const total = fProfile.earned + fWorkers.earned + fCitizens.earned + fComplaints.earned + fUnassigned.earned + fPending.earned;
    return { score: Math.min(total, 100), factors: [fProfile, fWorkers, fCitizens, fComplaints, fUnassigned, fPending] };
  })();
  const complianceScore = complianceData.score;

  const filteredCits = allCits
    .filter(c => cFilter === "ALL" || normalizeStatus(c.status) === cFilter)
    .filter(c => !citSearch.trim() || (c.fullName || "").toLowerCase().includes(citSearch.toLowerCase()) || (c.citizenId || "").toLowerCase().includes(citSearch.toLowerCase()) || (c.phone || "").includes(citSearch) || (c.email || "").toLowerCase().includes(citSearch.toLowerCase()));

  const filteredW = wFilter === "ALL" ? workers : workers.filter(w => normalizeStatus(w.status) === wFilter);

  const pagedWorkers    = filteredW.slice(workerPage * PAGE_SIZE, (workerPage + 1) * PAGE_SIZE);
  const pagedCits       = filteredCits.slice(citPage * PAGE_SIZE, (citPage + 1) * PAGE_SIZE);
  const pagedComplaints = complaints.slice(complaintPage * PAGE_SIZE, (complaintPage + 1) * PAGE_SIZE);

  useEffect(() => { setWorkerPage(0); }, [wFilter]);
  useEffect(() => { setCitPage(0); }, [cFilter, citSearch]);
  useEffect(() => { setComplaintPage(0); }, [complaints]);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  /* ── EARLY RETURNS ── */
  if (!vaoId) return (
    <><Navbar />
      <div className="vd-page">
        <div className="vd-ambient"><div className="vd-orb vd-orb-1" /><div className="vd-orb vd-orb-2" /><div className="vd-grid" /></div>
        <div className="vd-unauth">
          <div className="vd-unauth__icon">🔒</div><div className="vd-unauth__code">401</div>
          <h2 className="vd-unauth__title">Unauthorised Access</h2>
          <p className="vd-unauth__msg">You do not have authorization to access this portal.</p>
          <div className="vd-unauth__btns"><a href="/login" className="vd-btn vd-btn--primary">→ Login</a><a href="/" className="vd-btn vd-btn--ghost">← Home</a></div>
        </div>
      </div><Footer /></>
  );

  if (authError) return (
    <><Navbar />
      <div className="vd-page">
        <div className="vd-ambient"><div className="vd-orb vd-orb-1" /><div className="vd-orb vd-orb-2" /><div className="vd-grid" /></div>
        <div className="vd-unauth">
          <div className="vd-unauth__icon">🔒</div>
          <h2 className="vd-unauth__title">Access Denied</h2>
          <p className="vd-unauth__msg">{authError}</p>
          <div className="vd-unauth__btns">
            {authError.includes("expired") && <a href="/vao/login" className="vd-btn vd-btn--primary">→ Log In Again</a>}
            <a href="/" className="vd-btn vd-btn--ghost">← Home</a>
          </div>
        </div>
      </div><Footer /></>
  );

  if (loading) return (
    <><Navbar />
      <div className="vd-page">
        <div className="vd-ambient"><div className="vd-orb vd-orb-1" /><div className="vd-orb vd-orb-2" /><div className="vd-orb vd-orb-3" /><div className="vd-grid" /></div>
        <div className="vd-loadscreen"><div className="vd-spin vd-spin--lg" /><p>Initialising Dashboard…</p></div>
      </div><Footer /></>
  );

  if (!isComplete && !dash) return (
    <><Navbar />
      <div className="vd-page">
        <div className="vd-ambient"><div className="vd-orb vd-orb-1" /><div className="vd-orb vd-orb-2" /><div className="vd-grid" /></div>
        <div className={`vd-dash${visible ? " vd-dash--vis" : ""}`}>
          <div className="vd-setup">
            <div className="vd-setup__icon">⚙️</div>
            <h2>Profile Incomplete</h2>
            <p>Complete your VAO profile to access administrative tools.</p>
            <button className="vd-btn vd-btn--primary vd-btn--lg" onClick={() => nav(`/vao/profile/${vaoId}`)}>Complete Profile Setup →</button>
          </div>
        </div>
      </div><Footer /></>
  );

  const TABS = [
    { k: "overview",   l: "Overview",   ic: "⬡" },
    { k: "analytics",  l: "Analytics",  ic: "📊" },
    { k: "citizens",   l: "Citizens",   ic: "👥", badge: totalCitz },
    { k: "workers",    l: "Workers",    ic: "⚒",  badge: totalWork },
    { k: "areas",      l: "Areas",      ic: "🗺",  badge: totalAreas },
    { k: "pending",    l: "Approvals",  ic: "⏳",  badge: pendCnt,         hot: pendCnt > 0 },
    { k: "complaints", l: "Complaints", ic: "📋",  badge: totalComplaints, hot: unassignedCount > 0 || verifiedCount > 0 },
  ];

  const citizenProps   = { total: totalCitz,        approved: appCitz,           pending: pendCnt,        rejected: rejCitz };
  const workerProps    = { total: totalWork,         active: activeWrk,           onLeave,                 inactive: inactWrk,  pendingAct: pendActWrk };
  const complaintProps = { total: totalComplaints,   unassigned: unassignedCount, inProgress: inProgressCount, resolved: resolvedCount, verified: verifiedCount };
  const areaProps      = { total: totalAreas,        compliance: complianceScore, complianceData };

  return (
    <><Navbar />
      <ToastStack toasts={toasts} onDismiss={id => setToasts(t => t.filter(x => x.id !== id))} />
      <CitizenModal open={citModal} onClose={() => { setCitModal(false); setSelCitizen(null); }} loading={citLoading} citizen={selCitizen} />
      <AreaModal open={areaModal} onClose={() => setAreaModal(false)} vaoId={vaoId} onSuccess={() => { fetchAreas(); addToast("success", "Area registered successfully!"); }} />

      {/* ← CHANGE 3B: Profile modal — opens on profile button click, Update button navigates to form */}
      <VaoProfileModal
        open={profileModal}
        onClose={() => setProfileModal(false)}
        profile={profile}
        vaoId={vaoId}
        onUpdateProfile={() => nav(`/vao/profile/${vaoId}`)}
      />

      <div className="vd-page">
        <div className="vd-ambient"><div className="vd-orb vd-orb-1" /><div className="vd-orb vd-orb-2" /><div className="vd-orb vd-orb-3" /><div className="vd-grid" /></div>

        <div className={`vd-dash${visible ? " vd-dash--vis" : ""}`}>
          <CommandBanner key={revealKey} vaoName={vaoName} quote={motto} />
          {err && !authError && <div className="vd-errbar">⚠️ {err}<button onClick={() => fetchAll(true)} className="vd-errbar__btn">↻ Retry</button></div>}
          <VerifiedReviewBanner count={verifiedCount} onClick={goToVerified} />

          <header className="vd-header">
            <div className="vd-header__topbar">
              <button className="vd-ctrl" onClick={() => fetchAll(false)}>↻ Refresh</button>

              {/* ← CHANGE 3A: now opens profile modal instead of navigating */}
              <button className="vd-btn vd-btn--profile" onClick={() => setProfileModal(true)}>
                <span className="vd-btn-profile__av">
                  {photo ? <img src={photo} alt={vaoName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                         : <span style={{ fontFamily: "var(--fh)", fontSize: 11, fontWeight: 800, color: "var(--gold)" }}>{(vaoName || "V").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}</span>}
                </span>
                <span className="vd-btn-profile__text">
                  <span className="vd-btn-profile__name">{(vaoName || "").split(" ")[0]}</span>
                  <span className="vd-btn-profile__sub">{isComplete ? "✓ View Profile" : "⚠ Complete Profile"}</span>
                </span>
              </button>

              <button className="vd-btn vd-btn--teal"    onClick={() => setAreaModal(true)}>🗺 Areas{totalAreas > 0 && <span className="vd-btn__badge">{totalAreas}</span>}</button>
              <button className="vd-btn vd-btn--amber"   onClick={goToUnassigned}>⏳ Unassigned{unassignedCount > 0 && <span className="vd-btn__badge">{unassignedCount}</span>}</button>
              <button className="vd-btn vd-btn--crimson" onClick={goToComplaints}>📋 Complaints{totalComplaints > 0 && <span className="vd-btn__badge">{totalComplaints}</span>}</button>
              {verifiedCount > 0 && <button className="vd-btn vd-btn--violet" onClick={goToVerified}>🛡️ Close Verified<span className="vd-btn__badge">{verifiedCount}</span></button>}
              <button className="vd-btn vd-btn--emerald" onClick={goToWorkers}>⚡ Add Worker</button>
              <button className="vd-btn vd-btn--outline" onClick={goToApprovals}>Approvals{pendCnt > 0 && <span className="vd-btn__badge">{pendCnt}</span>}</button>
            </div>
            <div className="vd-header__body">
              <div className="vd-header__left">
                <div className="vd-eyebrow"><span className="vd-eyebrow__dot" />Rural Ops · VAO Official Portal</div>
                <div className="vd-header__namerow">
                  <h1 className="vd-header__name">
                    <span>{(vaoName || "").split(" ").slice(0, -1).join(" ")}</span>
                    {(vaoName || "").split(" ").length > 1 && <span className="vd-header__name-hl"> {(vaoName || "").split(" ").slice(-1)[0]}</span>}
                  </h1>
                </div>
                <div className="vd-identity-bar">
                  {villageName && (<div className="vd-identity-item vd-identity-item--village"><span className="vd-identity-item__ic">📍</span><span className="vd-identity-item__val">{villageName}</span></div>)}
                  <div className="vd-identity-sep" />
                  <div className="vd-identity-item"><span className="vd-identity-item__ic">🪪</span><span className="vd-identity-item__lbl">VAO ID</span><span className="vd-identity-item__val vd-identity-item__val--mono">{vaoId}</span></div>
                  <div className="vd-identity-sep" />
                  <div className="vd-identity-item"><span className="vd-identity-item__ic">📅</span><span className="vd-identity-item__val">{today}</span></div>
                  <div className="vd-identity-sep" />
                  <div className="vd-identity-item vd-identity-item--clock"><span className="vd-identity-item__ic">🕐</span><LiveClock />{refreshed && <span className="vd-identity-item__upd">· Synced {timeAgo(refreshed)}</span>}</div>
                </div>
                <div className="vd-header__chips">
                  <span className="chip chip--live"><span className="chip__dot" />Operational</span>
                  {isComplete && <span className="chip chip--ok">✓ Verified</span>}
                  <span className="chip chip--score" style={{ color: complianceScore >= 80 ? "#3d9960" : complianceScore >= 50 ? "#d4881a" : "#b03a2e", background: complianceScore >= 80 ? "rgba(61,153,96,.12)" : complianceScore >= 50 ? "rgba(212,136,26,.12)" : "rgba(176,58,46,.12)", borderColor: complianceScore >= 80 ? "rgba(61,153,96,.3)" : complianceScore >= 50 ? "rgba(212,136,26,.3)" : "rgba(176,58,46,.3)" }}>
                    🛡 {complianceScore}/100
                  </span>
                  {verifiedCount > 0 && <button className="chip chip--verified-action" onClick={goToVerified}>🛡️ {verifiedCount} ready to close</button>}
                </div>
              </div>
              <div className="vd-header__right">
                <IDCard name={vaoName} id={vaoId} village={villageName} photo={photo} signature={signature} active={isComplete} />
              </div>
            </div>
          </header>

          <nav className="vd-nav">
            {TABS.map(({ k, l, ic, badge, hot }) => (
              <button key={k} className={`vd-navtab${activeTab === k ? " on" : ""}`} onClick={() => setActiveTab(k)}>
                <span>{ic}</span><span className="vd-navtab__l">{l}</span>
                {badge > 0 && <span className={`vd-navbadge${hot ? " hot" : ""}`}>{badge}</span>}
              </button>
            ))}
          </nav>

          {activeTab === "overview" && (
            <div className="vd-content">
              <OverviewAnalytics
                citizens={citizenProps} workers={workerProps} complaints={complaintProps} areas={areaProps} complianceData={complianceData}
                onCitizens={() => setActiveTab("citizens")} onWorkers={() => setActiveTab("workers")} onComplaints={() => setActiveTab("complaints")}
                goToApprovals={goToApprovals} goToUnassigned={goToUnassigned} goToVerified={goToVerified}
              />
              <div className="vd-profile-card">
                <div className="vd-profile-card__av-wrap">
                  <div className="vd-profile-card__av">
                    {photo ? <img src={photo} alt={vaoName} className="vd-profile-card__img" /> : <span className="vd-profile-card__initials">{(vaoName || "V").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}</span>}
                    <span className={`vd-profile-card__status-dot${isComplete ? " ok" : ""}`} />
                  </div>
                </div>
                <div className="vd-profile-card__info">
                  <p className="vd-profile-card__name">{vaoName || "Unknown Officer"}</p>
                  <p className="vd-profile-card__role">Village Administrative Officer · {villageName || "Unknown Village"}</p>
                  <div className="vd-profile-card__chips">
                    {isComplete ? <span className="chip chip--ok">✓ Verified</span> : <span className="chip chip--warn">⚠ Incomplete</span>}
                    {vaoId && <span className="chip chip--id">ID: {vaoId}</span>}
                    <span className="chip chip--score" style={{ color: complianceScore >= 80 ? "#3d9960" : complianceScore >= 50 ? "#d4881a" : "#b03a2e", background: complianceScore >= 80 ? "rgba(61,153,96,.12)" : complianceScore >= 50 ? "rgba(212,136,26,.12)" : "rgba(176,58,46,.12)", borderColor: complianceScore >= 80 ? "rgba(61,153,96,.3)" : complianceScore >= 50 ? "rgba(212,136,26,.3)" : "rgba(176,58,46,.3)" }}>
                      🛡 {complianceScore}/100 {complianceScore >= 80 ? "EXCELLENT" : complianceScore >= 50 ? "MODERATE" : "CRITICAL"}
                    </span>
                  </div>
                </div>
                <button className="vd-profile-card__btn" onClick={() => setProfileModal(true)}>
                  <span className="vd-profile-card__btn-ic">👤</span>
                  <span>View Profile</span>
                </button>
              </div>
              <div className="vd-two-col">
                <div className="vd-panel">
                  <SectionHdr title="⚒ Recent Workers" sub={`${totalWork} total · ${activeWrk} active`} action={() => setActiveTab("workers")} actionLabel="View All →" />
                  <div className="vd-panel__body">
                    {workers.length === 0 ? (
                      <div className="vd-empty-sm"><p>No workers yet</p><button className="vd-btn vd-btn--emerald vd-btn--sm" style={{ marginTop: 8 }} onClick={goToWorkers}>⚡ Add First Worker</button></div>
                    ) : (
                      <div className="vd-worker-list">
                        {workers.slice(0, 6).map((w, i) => (<div key={w.workerId || i} className="vd-wrow"><div className="vd-wrow__av">{(w.name || "?")[0]}</div><div className="vd-wrow__info"><p className="vd-wrow__name">{w.name}</p><p className="vd-wrow__area">{w.areaName || "—"}</p></div><Pill status={w.status} /></div>))}
                        {totalWork > 6 && <button className="vd-more-btn" onClick={() => setActiveTab("workers")}>+{totalWork - 6} more →</button>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="vd-panel">
                  <SectionHdr title="🗺 Areas" sub={`${totalAreas} areas registered`} action={() => setAreaModal(true)} actionLabel="+ Add" />
                  <div className="vd-panel__body">
                    {totalAreas === 0 ? (
                      <div className="vd-empty-sm"><p>No areas registered yet</p><button className="vd-btn vd-btn--teal vd-btn--sm" style={{ marginTop: 8 }} onClick={() => setAreaModal(true)}>+ Register First Area</button></div>
                    ) : (
                      <div className="vd-area-chips-compact">
                        {areas.slice(0, 10).map((a, i) => (<button key={a.id} className="vd-area-chip-sm" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => goToAreaComplaints(a.id)}>🏘 {a.name}</button>))}
                        {totalAreas > 10 && <button className="vd-area-chip-sm vd-area-chip-sm--more" onClick={() => setActiveTab("areas")}>+{totalAreas - 10} more</button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="vd-content">
              <AnalyticsTab citizens={citizenProps} workers={workerProps} complaints={complaintProps} areas={areaProps} complianceData={complianceData} goToComplaints={goToComplaints} goToAnalytics={goToAnalytics} />
            </div>
          )}

          {activeTab === "citizens" && (
            <div className="vd-content">
              <div className="vd-full-panel">
                <div className="vd-full-panel__hdr">
                  <div><h3 className="vd-card-ttl">All Citizens</h3><p className="vd-card-sub">{totalCitz} registered · {appCitz} approved · {pendCnt} pending</p></div>
                  <div className="vd-cit-controls">
                    <div className="vd-search-wrap"><span className="vd-search__ic">🔍</span><input className="vd-search" placeholder="Search name, ID, phone…" value={citSearch} onChange={e => setCitSearch(e.target.value)} />{citSearch && <button className="vd-search__clr" onClick={() => setCitSearch("")}>✕</button>}</div>
                    <div className="vd-tabs">{[["ALL", "All"], ["ACTIVE", "Active"], ["PENDING", "Pending"], ["PENDING_ACTIVATION", "Activating"], ["REJECTED", "Rejected"]].map(([k, l]) => (<button key={k} className={`vd-tab${cFilter === k ? " on" : ""}`} onClick={() => setCFilter(k)}>{l}</button>))}</div>
                  </div>
                </div>
                <div className="vd-cit-statstrip">
                  {[{ k: "total", l: "Total", c: "#c9a227", v: totalCitz }, { k: "active", l: "Approved", c: "#3d9960", v: appCitz }, { k: "pending", l: "Pending", c: "#d4881a", v: pendCnt }, { k: "rejected", l: "Rejected", c: "#b03a2e", v: rejCitz }].map(({ k, l, c, v }) => (
                    <div key={k} className="vd-cit-stat" onClick={() => setCFilter(k === "total" ? "ALL" : k.toUpperCase())}><span className="vd-cit-stat__n" style={{ color: c }}><Counter to={v} /></span><span className="vd-cit-stat__l">{l}</span></div>
                  ))}
                </div>
                {filteredCits.length === 0 ? (
                  <div className="vd-empty"><p className="vd-empty__ic">👥</p><p className="vd-empty__t">{allCits.length === 0 ? "No citizens yet" : citSearch ? "No match found" : "None with this status"}</p></div>
                ) : (
                  <>
                    <div className="vd-tbl-wrap"><table className="vd-tbl">
                      <thead><tr><th>Citizen</th><th>ID</th><th>Contact</th><th>Village</th><th>Status</th><th>Registered</th><th>Action</th></tr></thead>
                      <tbody>{pagedCits.map((c, i) => (
                        <tr key={c.citizenId || i} className="vd-trow" style={{ animationDelay: `${i * 0.04}s` }}>
                          <td><div className="vd-wkr"><div className="vd-wkr__av cit">{(c.fullName || "?")[0].toUpperCase()}</div><div><p className="vd-wkr__name">{c.fullName || "—"}</p><p className="vd-wkr__id">{c.email || "—"}</p></div></div></td>
                          <td><code className="vd-cid">{c.citizenId || "—"}</code></td>
                          <td><span className="vd-muted">{c.phone || c.mobileNumber || "—"}</span></td>
                          <td><span className="vd-muted">{c.villageName || c.village || "—"}</span></td>
                          <td><CitPill status={c.status} /></td>
                          <td><span className="vd-muted">{fmtShort(c.createdAt)}</span></td>
                          <td><button className="vd-act act-view" onClick={() => openCitizen(c.citizenId)}>View</button></td>
                        </tr>
                      ))}</tbody>
                    </table></div>
                    <Pagination total={filteredCits.length} page={citPage} onPage={p => { setCitPage(p); }} />
                    <div className="vd-tbl-foot">Showing {pagedCits.length} of {filteredCits.length} filtered · {allCits.length} total{citSearch && <> · "<strong>{citSearch}</strong>"</>}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "workers" && (
            <div className="vd-content">
              <div className="kpi-strip">
                <KpiCard icon="⚒"  label="Total Workers"  value={totalWork}        sub="All assigned"        color="#c9a227" delay={0} />
                <KpiCard icon="🟢" label="Active"          value={activeWrk}        sub="Currently serving"   color="#3d9960" delay={0.05} />
                <KpiCard icon="🟡" label="On Leave"        value={onLeave}          sub="Temporary absence"   color="#d4881a" delay={0.10} />
                <KpiCard icon="🔴" label="Inactive"        value={inactWrk}         sub="Not active"          color="#b03a2e" delay={0.15} />
                <KpiCard icon="⏳" label="Pending"         value={pendActWrk}       sub="Awaiting activation" color="#6b3fa0" delay={0.20} />
                <KpiCard icon="📊" label="Util. Rate"      value={workerActiveRate} sub="Active percentage"   color="#2a7a8c" delay={0.25} />
              </div>
              <div className="vd-full-panel">
                <div className="vd-full-panel__hdr">
                  <div><h3 className="vd-card-ttl">Village Workers</h3><p className="vd-card-sub">{totalWork} assigned · {villageName}</p></div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div className="vd-tabs">{[["ALL", "All"], ["ACTIVE", "Active"], ["INACTIVE", "Inactive"], ["ON_LEAVE", "On Leave"], ["PENDING_ACTIVATION", "Pending"]].map(([k, l]) => (<button key={k} className={`vd-tab${wFilter === k ? " on" : ""}`} onClick={() => setWFilter(k)}>{l}</button>))}</div>
                    <button className="vd-btn vd-btn--emerald" style={{ fontSize: 11, padding: "7px 16px" }} onClick={goToWorkers}>⚡ Add Worker</button>
                  </div>
                </div>
                {filteredW.length === 0 ? (
                  <div className="vd-empty"><p className="vd-empty__ic">⚒</p><p className="vd-empty__t">{workers.length === 0 ? "No workers yet" : "No match"}</p>{workers.length === 0 && <button onClick={goToWorkers} className="vd-btn vd-btn--emerald" style={{ marginTop: 14 }}>⚡ Add First Worker →</button>}</div>
                ) : (
                  <>
                    <div className="vd-tbl-wrap"><table className="vd-tbl">
                      <thead><tr><th>Worker</th><th>Worker ID</th><th>Area</th><th>Status</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
                      <tbody>{pagedWorkers.map((w, i) => (
                        <tr key={w.workerId || i} style={{ animationDelay: `${i * 0.05}s` }} className="vd-trow">
                          <td><div className="vd-wkr"><div className="vd-wkr__av">{(w.name || "?")[0]}</div><div><p className="vd-wkr__name">{w.name}</p></div></div></td>
                          <td><code className="vd-cid">{w.workerId || "—"}</code></td>
                          <td><span className="vd-muted">{w.areaName || "—"}</span></td>
                          <td><Pill status={w.status} /></td>
                          <td><span className="vd-muted">{w.email || "—"}</span></td>
                          <td><span className="vd-muted">{w.phone || "—"}</span></td>
                          <td><div className="vd-acts"><button className="vd-act act-view" onClick={() => nav(`/vao/${vaoId}/complaints/worker/${w.workerId}`)}>Complaints</button></div></td>
                        </tr>
                      ))}</tbody>
                    </table></div>
                    <Pagination total={filteredW.length} page={workerPage} onPage={p => setWorkerPage(p)} />
                    <div className="vd-tbl-foot">Showing {pagedWorkers.length} of {filteredW.length} workers</div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "areas" && (
            <div className="vd-content">
              <div className="kpi-strip">
                <KpiCard icon="🗺" label="Total Areas" value={totalAreas} sub="Streets & wards" color="#2a7a8c" delay={0} />
                <KpiCard icon="👥" label="Citizens"    value={totalCitz}  sub="Across all areas" color="#c9a227" delay={0.05} />
                <KpiCard icon="⚒"  label="Workers"    value={totalWork}  sub="Covering realm"   color="#3d9960" delay={0.10} />
              </div>
              <div className="vd-full-panel">
                <div className="vd-full-panel__hdr"><div><h3 className="vd-card-ttl">🗺 Village Jurisdictions</h3><p className="vd-card-sub">{totalAreas} areas · {villageName || "your village"}</p></div><button className="vd-btn vd-btn--teal" onClick={() => setAreaModal(true)}>+ Register Area</button></div>
                {totalAreas === 0 ? (
                  <div className="vd-empty" style={{ padding: "60px 20px" }}><p className="vd-empty__ic">🗺</p><p className="vd-empty__t">No areas registered yet</p><button className="vd-btn vd-btn--teal" style={{ marginTop: 18 }} onClick={() => setAreaModal(true)}>+ Register First Area</button></div>
                ) : (
                  <div className="vd-areas-tab-grid">
                    {areas.map((a, i) => (
                      <div key={a.id} className="vd-area-full-card" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="vd-area-full-card__top"><div className="vd-area-full-card__icon">🏘</div><span className="vd-pill p-green" style={{ fontSize: 9 }}>Active</span></div>
                        <p className="vd-area-full-card__name">{a.name}</p>
                        <p className="vd-area-full-card__id">Area #{a.id}</p>
                        <button className="vd-act act-view" style={{ marginTop: 8, width: "100%", justifyContent: "center", display: "flex" }} onClick={() => goToAreaComplaints(a.id)}>📋 Complaints</button>
                      </div>
                    ))}
                    <button className="vd-area-full-card vd-area-full-card--add" onClick={() => setAreaModal(true)}><div className="vd-area-full-card__add-ic">+</div><p className="vd-area-full-card__add-lbl">Register Area</p></button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "pending" && (
            <div className="vd-content">
              <div className="vd-full-panel">
                <div className="vd-full-panel__hdr">
                  <div><h3 className="vd-card-ttl">⚡ Pending Approvals</h3><p className="vd-card-sub">{pendCnt} citizens await decision</p></div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {pendCnt > 0 && <span className="vd-urgent-badge">Action Required</span>}
                    <button className="vd-btn vd-btn--primary" onClick={goToApprovals}>Open Approvals Page →</button>
                  </div>
                </div>
                {pending.length === 0 ? (
                  <div className="vd-empty vd-empty--success"><p className="vd-empty__ic">✅</p><p className="vd-empty__t">All caught up! No pending approvals.</p></div>
                ) : (
                  <div className="vd-pending-list">
                    {pending.map((c, i) => (
                      <div key={c.citizenId || c.citizenInternalId || i} className="vd-pend-row vd-pend-row--full" style={{ animationDelay: `${i * 0.07}s` }}>
                        <div className="vd-pend-av">{(c.fullName || "?")[0].toUpperCase()}</div>
                        <div className="vd-pend-info"><p className="vd-pend-name">{c.fullName || "—"}</p><p className="vd-pend-meta">{c.citizenId && <code className="vd-cid sm">{c.citizenId}</code>}{c.phone && <span>📱 {c.phone}</span>}{c.email && <span>✉️ {c.email}</span>}{c.createdAt && <span>🕐 {timeAgo(c.createdAt)}</span>}</p></div>
                        <button className="vd-act act-view" onClick={goToApprovals}>Review</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "complaints" && (
            <div className="vd-content">
              <div className="kpi-strip">
                <KpiCard icon="📋" label="Total"         value={totalComplaints} sub="All complaints"        color="#b03a2e" onClick={goToComplaints}               delay={0} />
                <KpiCard icon="⏳" label="Unassigned"    value={unassignedCount} sub="SUBMITTED + AWAITING"  color="#e8630a" onClick={goToUnassigned}               delay={0.05} />
                <KpiCard icon="⚙"  label="In Progress"   value={inProgressCount} sub="Being worked"          color="#c9a227" onClick={() => goToStatus("IN_PROGRESS")} delay={0.10} />
                <KpiCard icon="✅" label="Resolved"      value={resolvedCount}   sub="Completed"             color="#3d9960" onClick={() => goToStatus("RESOLVED")}     delay={0.15} />
                <KpiCard icon="🛡️" label="Needs Closing" value={verifiedCount}   sub="Verified — close now"  color="#7c5cfc" onClick={goToVerified}                 delay={0.20} />
              </div>
              {verifiedCount > 0 && (
                <div className="vd-full-panel vd-full-panel--violet">
                  <div className="vd-full-panel__hdr">
                    <div><h3 className="vd-card-ttl" style={{ color: "#c0b0ff" }}>🛡️ Tasks Completed by Workers — Ready to Close</h3><p className="vd-card-sub">Workers resolved these complaints and they have been verified. Review and close each one.</p></div>
                    <button className="vd-btn vd-btn--violet" onClick={goToVerified}>Open Verified Queue →</button>
                  </div>
                  <div className="vd-tbl-wrap"><table className="vd-tbl">
                    <thead><tr><th>ID</th><th>Area</th><th>Category</th><th>Worker</th><th>Filed</th><th>Action</th></tr></thead>
                    <tbody>{verifiedComplaints.slice(0, 6).map((c, i) => (
                      <tr key={c.complaintId || i} className="vd-trow" style={{ animationDelay: `${i * 0.04}s` }}>
                        <td><code className="vd-cid">{c.complaintId}</code></td>
                        <td><span className="vd-muted">{c.areaName || "—"}</span></td>
                        <td><span className="vd-muted">{c.category || "—"}</span></td>
                        <td><span className="vd-muted">{c.workerName || "—"}</span></td>
                        <td><span className="vd-muted">{fmtShort(c.createdAt)}</span></td>
                        <td><div className="vd-acts"><button className="vd-act act-view" onClick={() => goToComplaintDetail(c.complaintId)}>View</button><button className="vd-act act-close" onClick={goToVerified}>Close →</button></div></td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                  {verifiedCount > 6 && <div className="vd-tbl-foot"><button className="vd-sec-btn" onClick={goToVerified}>View all {verifiedCount} verified →</button></div>}
                </div>
              )}
              {unassignedCount > 0 && (
                <div className="vd-full-panel">
                  <div className="vd-full-panel__hdr"><div><h3 className="vd-card-ttl">⏳ Unassigned Complaints</h3><p className="vd-card-sub">{unassignedCount} without a worker</p></div><button className="vd-btn vd-btn--amber" onClick={goToUnassigned}>View All →</button></div>
                  <div className="vd-tbl-wrap"><table className="vd-tbl">
                    <thead><tr><th>ID</th><th>Area</th><th>Category</th><th>Description</th><th>Status</th><th>Filed</th><th>Action</th></tr></thead>
                    <tbody>{unassignedComplaints.slice(0, 8).map((c, i) => (
                      <tr key={c.complaintId || i} className="vd-trow" style={{ animationDelay: `${i * 0.04}s` }}>
                        <td><code className="vd-cid">{c.complaintId}</code></td>
                        <td><span className="vd-muted">{c.areaName || "—"}</span></td>
                        <td><span className="vd-muted">{c.category}</span></td>
                        <td><span className="vd-muted">{c.description ? (c.description.slice(0, 45) + (c.description.length > 45 ? "…" : "")) : "—"}</span></td>
                        <td><span className={`vd-pill ${normalizeStatus(c.status) === "SUBMITTED" ? "p-sky" : "p-amber"}`}>{c.status}</span></td>
                        <td><span className="vd-muted">{fmtShort(c.createdAt)}</span></td>
                        <td><button className="vd-act act-view" onClick={() => goToComplaintDetail(c.complaintId)}>Inspect</button></td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                  {unassignedCount > 8 && <div className="vd-tbl-foot"><button className="vd-sec-btn" onClick={goToUnassigned}>View all {unassignedCount} →</button></div>}
                </div>
              )}

              <div className="vd-full-panel">
                <div className="vd-full-panel__hdr">
                  <div><h3 className="vd-card-ttl">📋 All Complaints</h3><p className="vd-card-sub">{totalComplaints} total records</p></div>
                  <button className="vd-btn vd-btn--crimson" onClick={goToComplaints}>Open Full View →</button>
                </div>
                {complaints.length === 0 ? (
                  <div className="vd-empty"><p className="vd-empty__ic">📋</p><p className="vd-empty__t">No complaints yet</p></div>
                ) : (
                  <>
                    <div className="vd-tbl-wrap"><table className="vd-tbl">
                      <thead><tr><th>ID</th><th>Area</th><th>Category</th><th>Worker</th><th>Status</th><th>Filed</th><th>Action</th></tr></thead>
                      <tbody>{pagedComplaints.map((c, i) => (
                        <tr key={c.complaintId || i} className="vd-trow" style={{ animationDelay: `${i * 0.04}s` }}>
                          <td><code className="vd-cid">{c.complaintId}</code></td>
                          <td><span className="vd-muted">{c.areaName || "—"}</span></td>
                          <td><span className="vd-muted">{c.category || "—"}</span></td>
                          <td><span className="vd-muted">{c.workerName || "—"}</span></td>
                          <td><span className={`vd-pill ${normalizeStatus(c.status) === "SUBMITTED" ? "p-sky" : normalizeStatus(c.status) === "VERIFIED" ? "p-purple" : normalizeStatus(c.status) === "CLOSED" ? "p-green" : normalizeStatus(c.status) === "RESOLVED" ? "p-green" : "p-amber"}`}>{c.status}</span></td>
                          <td><span className="vd-muted">{fmtShort(c.createdAt)}</span></td>
                          <td><button className="vd-act act-view" onClick={() => goToComplaintDetail(c.complaintId)}>View</button></td>
                        </tr>
                      ))}</tbody>
                    </table></div>
                    <Pagination total={complaints.length} page={complaintPage} onPage={p => setComplaintPage(p)} />
                    <div className="vd-tbl-foot">Showing {pagedComplaints.length} of {totalComplaints} complaints</div>
                  </>
                )}
              </div>

              <div className="vd-full-panel">
                <div className="vd-full-panel__hdr"><div><h3 className="vd-card-ttl">Navigate Complaints</h3><p className="vd-card-sub">Filter &amp; route to specific views</p></div></div>
                <div style={{ padding: "18px 20px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}>
                  {[
                    { l: "All Complaints", ic: "📋", sub: "Full list",          c: "#b03a2e", a: goToComplaints },
                    { l: "Unassigned",     ic: "⏳", sub: "No worker assigned",  c: "#e8630a", a: goToUnassigned },
                    { l: "Submitted",      ic: "📝", sub: "Freshly filed",       c: "#3b82c4", a: () => goToStatus("SUBMITTED") },
                    { l: "In Progress",    ic: "⚙",  sub: "Being resolved",      c: "#c9a227", a: () => goToStatus("IN_PROGRESS") },
                    { l: "Resolved",       ic: "✅", sub: "Work completed",      c: "#3d9960", a: () => goToStatus("RESOLVED") },
                    { l: "Verified",       ic: "🛡️", sub: "Ready to close",     c: "#7c5cfc", a: goToVerified, featured: true, featureTag: "Action Needed" },
                    { l: "Closed",         ic: "🔒", sub: "Archived",            c: "#5d7a8a", a: () => goToStatus("CLOSED") },
                    { l: "By Area",        ic: "🗺", sub: "View by territory",   c: "#236e80", a: goToComplaintsByArea },
                    { l: "Analytics",      ic: "📈", sub: "Full stats",          c: "#c9a227", a: goToAnalytics },
                  ].map(({ l, ic, c, sub, a, featured, featureTag }) => (
                    <button key={l} className={`vd-action-tile${featured ? " vd-action-tile--featured vd-action-tile--violet-featured" : ""}`} style={{ "--ac": c, padding: "14px 14px 12px" }} onClick={a}>
                      <span className="vd-action-tile__ic" style={{ fontSize: 22 }}>{ic}</span>
                      <span className="vd-action-tile__l">{l}</span>
                      <span style={{ fontFamily: "var(--fb)", fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{sub}</span>
                      {featured && <span className="vd-action-tile__tag vd-action-tile__tag--violet">{featureTag}{verifiedCount > 0 ? ` (${verifiedCount})` : ""}</span>}
                    </button>
                  ))}
                </div>
                {totalAreas > 0 && (
                  <div className="vd-area-complaint-row">
                    <div className="vd-area-complaint-row__hdr"><span className="vd-area-complaint-row__title">🗺 Complaints by Area</span><span className="vd-area-complaint-row__sub">Quick access — tap area to view its complaints</span></div>
                    <div className="vd-area-complaint-row__chips">
                      {areas.map(a => {
                        const cnt = complaints.filter(co => co.areaId === a.id || co.areaName === a.name).length;
                        return (
                          <button key={a.id} className="vd-area-complaint-chip" onClick={() => goToAreaComplaints(a.id)}>
                            <span className="vd-area-complaint-chip__name">🏘 {a.name}</span>
                            {cnt > 0 && <span className="vd-area-complaint-chip__cnt">{cnt}</span>}
                          </button>
                        );
                      })}
                      <button className="vd-area-complaint-chip vd-area-complaint-chip--all" onClick={goToComplaintsByArea}><span>View All Areas →</span></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}