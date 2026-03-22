import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import "../../../styles/VaoDashboard.css";
import "../../../styles/VaoAnalyticsDashboard.css";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

function getToken()        { return localStorage.getItem("accessToken"); }
function getRefreshToken() { return localStorage.getItem("refreshToken"); }
function getRole()         { return localStorage.getItem("accountType"); }

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
    } catch { return false; }
    finally  { _refreshPromise = null; }
  })();
  return _refreshPromise;
}

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
      err.code = 401; throw err;
    }
  }
  if (res.status === 403) { const err = new Error("You do not have permission to view this page."); err.code = 403; throw err; }
  if (!res.ok) { const err = new Error(`Server error: ${res.status}`); err.code = res.status; throw err; }
  return res.json();
}

function useRequireRole(requiredRole) {
  const nav = useNavigate();
  useEffect(() => {
    const token = getToken();
    const role  = getRole();
    if (!token)                { nav("/vao/login",    { replace: true }); return; }
    if (role !== requiredRole) { nav("/unauthorized", { replace: true }); }
  }, [nav, requiredRole]);
}

const T = {
  gold:   "#b8922e", goldL:  "#d4aa5a",
  green:  "#378a55", red:    "#9e3328",
  amber:  "#c07818", teal:   "#236e80",
  silver: "#9aabbf", violet: "#5e3490",
  orange: "#d05608", sky:    "#3278b8",
};
const CAT_COLORS = [T.teal, T.orange, T.sky, T.violet, T.green, T.amber, T.silver, "#7a5e18"];

function ns(s) { return s ? String(s).toUpperCase().replace(/[\s-]+/g, "_") : ""; }
const STATUS_META = {
  CLOSED:              { label: "Closed",      color: T.green,  light: "#378a5515" },
  RESOLVED:            { label: "Resolved",    color: T.green,  light: "#378a5515" },
  VERIFIED:            { label: "Verified",    color: T.violet, light: "#5e349015" },
  IN_PROGRESS:         { label: "In Progress", color: T.amber,  light: "#c0781815" },
  ASSIGNED:            { label: "Assigned",    color: T.amber,  light: "#c0781815" },
  SUBMITTED:           { label: "Submitted",   color: T.sky,    light: "#3278b815" },
  AWAITING_ASSIGNMENT: { label: "Awaiting",    color: T.red,    light: "#9e332815" },
};
function statusMeta(s) { return STATUS_META[ns(s)] ?? { label: s || "Unknown", color: T.silver, light: "#9aabbf15" }; }

function fmtDate(d)      { return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"; }
function fmtDateShort(d) { return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"; }
function fmtDuration(mins) {
  if (!mins || mins <= 0) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const days = Math.floor(h / 24), rh = h % 24;
  return rh > 0 ? `${days}d ${rh}h` : `${days}d`;
}
function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "Just now"; if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`;
}
function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t || t.startsWith("blob:")) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/")) return `${BASE}${t}`;
  return `${BASE}/${t}`;
}

function Counter({ to, duration = 700 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof to !== "number" || isNaN(to)) { setN(to); return; }
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setN(Math.round(p * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration]);
  return <>{typeof to === "number" ? n : to}</>;
}

function DonutChart({ segments, size = 110, thickness = 14, centerLabel, centerSub }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const R = (size - thickness) / 2, circ = 2 * Math.PI * R;
  let off = -circ / 4;
  return (
    <div className="vaa-donut-wrap" style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
        {segments.filter(d => d.value > 0).map((d, i) => {
          const dash = (d.value / total) * circ;
          const seg = <circle key={i} cx={size/2} cy={size/2} r={R} fill="none" stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={off} strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 4px ${d.color}55)` }} />;
          off -= dash; return seg;
        })}
      </svg>
      <div className="vaa-donut-center">
        {centerLabel !== undefined && <div className="vaa-donut-val">{centerLabel}</div>}
        {centerSub && <div className="vaa-donut-sub">{centerSub}</div>}
      </div>
    </div>
  );
}

function RadialProgress({ pct, color, size = 72, thickness = 7, label, sub }) {
  const R = (size - thickness) / 2, circ = 2 * Math.PI * R, fill = Math.min(pct / 100, 1) * circ;
  return (
    <div className="vaa-radial-wrap" style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={`${fill} ${circ - fill}`} strokeDashoffset={circ / 4} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 5px ${color}66)` }} />
      </svg>
      <div className="vaa-radial-center">
        <span className="vaa-radial-val" style={{ color }}>{label}</span>
        {sub && <span className="vaa-radial-sub">{sub}</span>}
      </div>
    </div>
  );
}

function BarChart({ data, color }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(t); }, []);
  const maxVal = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="vaa-barchart">
      {data.map((d, i) => {
        const pct = d.count / maxVal;
        return (
          <div key={`${d.label}-${i}`} className="vaa-bar-col">
            {d.count > 0 && <span className="vaa-bar-num" style={{ color }}>{d.count}</span>}
            <div className="vaa-bar-track">
              <div className="vaa-bar-fill"
                style={{ background: `linear-gradient(180deg,${color}ee,${color}55)`, transform: `scaleY(${ready ? pct : 0})`, boxShadow: d.count > 0 ? `0 -2px 8px ${color}44` : "none" }} />
            </div>
            <span className="vaa-bar-lbl">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color, delay = 0, onClick }) {
  return (
    <div className="kpi-card" style={{ "--kc": color, animationDelay: `${delay}s` }}
      onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="kpi-card__accent" />
      <div className="kpi-card__top">
        <div className="kpi-card__icon" style={{ background: `${color}18`, color }}>{icon}</div>
        <div className="kpi-card__body">
          <div className="kpi-card__val" style={{ color }}><Counter to={typeof value === "number" ? value : value} /></div>
          <div className="kpi-card__lbl">{label}</div>
        </div>
      </div>
      {sub && <div className="kpi-card__foot"><span className="kpi-card__sub">{sub}</span></div>}
    </div>
  );
}

function Panel({ title, sub, children, accent, action, actionLabel, className = "", style }) {
  return (
    <div className={`vaa-panel ${className}`} style={{ "--pa": accent || T.gold, ...style }}>
      <div className="vaa-panel__accent" />
      <div className="vaa-panel__hdr">
        <div>
          <h3 className="vaa-panel__title">{title}</h3>
          {sub && <p className="vaa-panel__sub">{sub}</p>}
        </div>
        {action && <button className="vd-btn vd-btn--ghost vd-btn--sm" onClick={action}>{actionLabel || "View All"}</button>}
      </div>
      <div className="vaa-panel__body">{children}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const m = statusMeta(status);
  return <span className="vaa-pill" style={{ color: m.color, background: m.light, borderColor: `${m.color}35` }}>{m.label}</span>;
}

const catColorCache = {};
function getCatColor(cat, allCats) {
  if (!catColorCache[cat]) { const idx = allCats.indexOf(cat); catColorCache[cat] = CAT_COLORS[idx % CAT_COLORS.length]; }
  return catColorCache[cat];
}
function CatPill({ cat, allCats }) {
  const c = getCatColor(cat, allCats);
  return <span className="vaa-cat-pill" style={{ color: c, background: `${c}14`, borderColor: `${c}32` }}>{cat || "—"}</span>;
}

function AiScoreBadge({ score, verified }) {
  if (score == null) return <span style={{ color: "var(--t4)" }}>—</span>;
  const color = score >= 80 ? T.green : score >= 50 ? T.amber : T.red;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontFamily: "var(--fh)", fontSize: 11, fontWeight: 800, color, background: `${color}14`, border: `1px solid ${color}35`, borderRadius: 5, padding: "1px 6px", letterSpacing: ".04em" }}>{score}</span>
      {verified && <span title="AI Verified" style={{ fontSize: 10, color: T.green }}>✓ AI</span>}
    </span>
  );
}

function RatingStars({ rating }) {
  if (rating == null) return <span style={{ color: "var(--t4)" }}>—</span>;
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 11, color: i <= rating ? T.amber : "rgba(255,255,255,0.12)" }}>★</span>)}
    </span>
  );
}

function RankedRow({ label, value, max, color, rank }) {
  const pct = max ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div className="vaa-ranked-row">
      <div className="vaa-ranked-row__meta">
        <span className="vaa-ranked-row__rank" style={{ color, borderColor: `${color}30`, background: `${color}10` }}>{rank}</span>
        <span className="vaa-ranked-row__label">{label || "—"}</span>
        <span className="vaa-ranked-row__val" style={{ color }}>{value}</span>
      </div>
      <div className="vaa-ranked-row__track">
        <div className="vaa-ranked-row__fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}60,${color})`, boxShadow: `0 0 8px ${color}44` }} />
      </div>
    </div>
  );
}

function Skel({ h = 40, w = "100%", r = 8 }) {
  return <div className="vaa-skel" style={{ height: h, width: w, borderRadius: r }} />;
}

function ComplaintModal({ complaint, onClose }) {
  useEffect(() => {
    if (!complaint) return;
    const h = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [complaint, onClose]);
  if (!complaint) return null;
  const c = complaint;
  const beforeImg = normalizeImageUrl(c.beforeImageUrl);
  const afterImg  = normalizeImageUrl(c.afterImageUrl);
  const timeline  = [
    { label: "Filed",    at: c.createdAt,  color: T.sky },
    { label: "Assigned", at: c.assignedAt, color: T.amber },
    { label: "Started",  at: c.startedAt,  color: T.gold },
    { label: "Resolved", at: c.resolvedAt, color: T.green },
    { label: "Verified", at: c.verifiedAt, color: T.violet },
    { label: "Closed",   at: c.closedAt,   color: T.teal },
  ].filter(t => t.at);
  return (
    <div className="vd-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vd-modal vd-modal--wide" role="dialog" aria-modal="true">
        <div className="vd-modal__hdr">
          <div className="vd-modal__hdr-l">
            <div className="vd-modal__av" style={{ fontSize: 18 }}>📋</div>
            <div>
              <h2 className="vd-modal__name">Complaint #{c.complaintId?.slice(-8) || "—"}</h2>
              <p className="vd-modal__sub2">{c.villageName || "—"} · {c.areaName || "—"}</p>
            </div>
          </div>
          <div className="vd-modal__hdr-r">
            <StatusPill status={c.status} />
            <button className="vd-modal__x" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="vd-modal__body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="vd-modal__grid">
            {[
              ["🪪 Complaint ID", c.complaintId],
              ["👤 Citizen ID",   c.citizenId],
              ["⚒ Worker",        c.workerName ? `${c.workerName} (${c.workerId})` : c.workerId],
              ["🏡 Village",      c.villageName],
              ["📍 Area",         c.areaName],
              ["🏷 Category",     c.category ? String(c.category) : null],
              ["📊 Status",       c.status    ? String(c.status)   : null],
            ].filter(([, v]) => v).map(([l, v]) => (
              <div key={l} className="vd-modal__row"><span className="vd-modal__rl">{l}</span><span className="vd-modal__rv">{v}</span></div>
            ))}
          </div>
          {c.description && (
            <div>
              <p style={{ fontFamily:"var(--fh)", fontSize:10, color:"var(--t3)", letterSpacing:".06em", marginBottom:6 }}>📝 DESCRIPTION</p>
              <p style={{ fontFamily:"var(--fb)", fontSize:13, color:"var(--t1)", lineHeight:1.6 }}>{c.description}</p>
            </div>
          )}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:140, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"10px 14px" }}>
              <p style={{ fontFamily:"var(--fh)", fontSize:9, color:"var(--t3)", letterSpacing:".06em", marginBottom:6 }}>🤖 AI METRICS</p>
              <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                <div><p style={{ fontFamily:"var(--fh)", fontSize:9, color:"var(--t3)" }}>CLEAN SCORE</p><AiScoreBadge score={c.aiCleanScore} verified={c.aiVerified} /></div>
                <div><p style={{ fontFamily:"var(--fh)", fontSize:9, color:"var(--t3)" }}>AI VERIFIED</p><span style={{ fontFamily:"var(--fh)", fontSize:11, color:c.aiVerified ? T.green : T.silver }}>{c.aiVerified == null ? "—" : c.aiVerified ? "✓ Yes" : "✗ No"}</span></div>
              </div>
            </div>
            <div style={{ flex:1, minWidth:140, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"10px 14px" }}>
              <p style={{ fontFamily:"var(--fh)", fontSize:9, color:"var(--t3)", letterSpacing:".06em", marginBottom:6 }}>⭐ GOVERNANCE</p>
              <div><p style={{ fontFamily:"var(--fh)", fontSize:9, color:"var(--t3)" }}>WORKER RATING</p><RatingStars rating={c.workerRating} /></div>
              {c.vaoReviewNote && <p style={{ fontFamily:"var(--fb)", fontSize:11, color:"var(--t2)", marginTop:6, fontStyle:"italic" }}>"{c.vaoReviewNote}"</p>}
            </div>
          </div>
          {(beforeImg || afterImg) && (
            <div>
              <p style={{ fontFamily:"var(--fh)", fontSize:10, color:"var(--t3)", letterSpacing:".06em", marginBottom:8 }}>📸 EVIDENCE</p>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                {beforeImg && <div style={{ flex:1, minWidth:140 }}><p style={{ fontFamily:"var(--fh)", fontSize:9, color:"var(--t4)", marginBottom:4 }}>BEFORE</p><img src={beforeImg} alt="Before" style={{ width:"100%", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", maxHeight:180, objectFit:"cover" }} /></div>}
                {afterImg  && <div style={{ flex:1, minWidth:140 }}><p style={{ fontFamily:"var(--fh)", fontSize:9, color:"var(--t4)", marginBottom:4 }}>AFTER</p> <img src={afterImg}  alt="After"  style={{ width:"100%", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", maxHeight:180, objectFit:"cover" }} /></div>}
              </div>
            </div>
          )}
          {timeline.length > 0 && (
            <div>
              <p style={{ fontFamily:"var(--fh)", fontSize:10, color:"var(--t3)", letterSpacing:".06em", marginBottom:10 }}>📅 TIMELINE</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {timeline.map(t => (
                  <div key={t.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:t.color, boxShadow:`0 0 6px ${t.color}88`, flexShrink:0 }} />
                    <span style={{ fontFamily:"var(--fh)", fontSize:10, color:t.color, minWidth:64, letterSpacing:".04em" }}>{t.label.toUpperCase()}</span>
                    <span style={{ fontFamily:"var(--fb)", fontSize:12, color:"var(--t2)" }}>{fmtDate(t.at)}</span>
                    <span style={{ fontFamily:"var(--fb)", fontSize:11, color:"var(--t4)", marginLeft:"auto" }}>{timeAgo(t.at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="vd-modal__foot">
          <button className="vd-btn vd-btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGINATION COMPONENT
══════════════════════════════════════════ */
const PAGE_SIZE = 5;

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  /* build page numbers: always show first, last, current ±1, with ellipsis gaps */
  const pages = [];
  const add = (n) => { if (!pages.includes(n) && n >= 1 && n <= totalPages) pages.push(n); };
  add(1); add(page - 1); add(page); add(page + 1); add(totalPages);
  pages.sort((a, b) => a - b);

  const btnBase = {
    fontFamily: "var(--fh)", fontSize: 9.5, fontWeight: 700,
    letterSpacing: ".06em", cursor: "pointer",
    border: "1px solid var(--vd-border)",
    borderRadius: "var(--r-md)",
    padding: "5px 11px",
    background: "var(--surface2)",
    color: "var(--t2)",
    transition: "background 120ms ease, border-color 120ms ease, color 120ms ease",
    lineHeight: 1,
  };
  const btnActive = {
    ...btnBase,
    background: "linear-gradient(135deg,#c8a04e,#a87c24,#7a5a14)",
    borderColor: "var(--gold)",
    color: "#060401",
  };
  const btnDisabled = { ...btnBase, opacity: 0.3, cursor: "not-allowed" };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: "1px solid var(--vd-border)" }}>
      {/* left: prev */}
      <button style={page === 1 ? btnDisabled : btnBase} disabled={page === 1} onClick={() => onChange(page - 1)}>← Prev</button>

      {/* center: page numbers with ellipsis */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {pages.map((p, i) => {
          const gap = i > 0 && p - pages[i - 1] > 1;
          return (
            <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              {gap && <span style={{ color: "var(--t4)", fontFamily: "var(--fh)", fontSize: 9, padding: "0 2px" }}>…</span>}
              <button style={p === page ? btnActive : btnBase} onClick={() => onChange(p)}>{p}</button>
            </span>
          );
        })}
      </div>

      {/* right: next */}
      <button style={page === totalPages ? btnDisabled : btnBase} disabled={page === totalPages} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function VaoAnalyticsDashboard() {
  const { vaoId } = useParams();
  const nav = useNavigate();
  useRequireRole("VAO");

  const [complaints,   setComplaints]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [authError,    setAuthError]    = useState(null);
  const [refreshed,    setRefreshed]    = useState(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy,       setSortBy]       = useState("newest");
  const [trendPeriod,  setTrendPeriod]  = useState("monthly");
  const [visible,      setVisible]      = useState(false);
  const [selComplaint, setSelComplaint] = useState(null);

  /* ── NEW: pagination ── */
  const [page, setPage] = useState(1);

  /* reset to page 1 whenever filter / search / sort changes */
  useEffect(() => { setPage(1); }, [search, statusFilter, sortBy]);

  const fetchComplaints = useCallback(async () => {
    setError(null); setAuthError(null);
    try {
      const data = await authFetch(`${BASE}/vao/complaints/village`);
      setComplaints(Array.isArray(data) ? data : []);
      setRefreshed(new Date());
    } catch (e) {
      if (e.code === 401) { setAuthError(e.message); setTimeout(() => nav("/vao/login", { replace: true }), 2000); }
      else if (e.code === 403) setAuthError(e.message);
      else setError(e.message);
    } finally { setLoading(false); setVisible(true); }
  }, [nav]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const metrics = useMemo(() => {
    const total      = complaints.length;
    const resolved   = complaints.filter(c => ["CLOSED","RESOLVED","VERIFIED"].includes(ns(c.status))).length;
    const inProgress = complaints.filter(c => ["IN_PROGRESS","ASSIGNED"].includes(ns(c.status))).length;
    const unassigned = complaints.filter(c => ["SUBMITTED","AWAITING_ASSIGNMENT"].includes(ns(c.status))).length;
    const verified   = complaints.filter(c => ns(c.status) === "VERIFIED").length;
    const resRate    = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const inProgPct  = total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const unassPct   = total > 0 ? Math.round((unassigned / total) * 100) : 0;
    const catMap = {}; complaints.forEach(c => { const cat = c.category ? String(c.category) : "Uncategorized"; catMap[cat] = (catMap[cat] || 0) + 1; });
    const categories  = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const allCatNames = categories.map(([k]) => k);
    const topCategory = categories[0]?.[0] || "—";
    const areaMap = {}; complaints.forEach(c => { const area = c.areaName || "Unknown Area"; areaMap[area] = (areaMap[area] || 0) + 1; });
    const areas = Object.entries(areaMap).sort((a, b) => b[1] - a[1]);
    const workerMap = {}; complaints.forEach(c => { if (!c.workerName) return; workerMap[c.workerName] = (workerMap[c.workerName] || 0) + 1; });
    const workerRanking = Object.entries(workerMap).sort((a, b) => b[1] - a[1]);
    const resolvedWithTime = complaints.filter(c => c.resolvedAt && c.createdAt);
    const avgResolutionMins = resolvedWithTime.length ? Math.round(resolvedWithTime.reduce((sum, c) => sum + ((new Date(c.resolvedAt) - new Date(c.createdAt)) / 60000), 0) / resolvedWithTime.length) : 0;
    const aiVerifiedCount = complaints.filter(c => c.aiVerified === true).length;
    const aiScores = complaints.map(c => c.aiCleanScore).filter(s => s != null);
    const avgAiScore = aiScores.length ? Math.round(aiScores.reduce((s, n) => s + n, 0) / aiScores.length) : null;
    const ratings = complaints.map(c => c.workerRating).filter(r => r != null);
    const avgRating = ratings.length ? (ratings.reduce((s, n) => s + n, 0) / ratings.length).toFixed(1) : null;
    const now = new Date();
    const dailyData = Array.from({length:14},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()-13+i);return{label:d.toLocaleDateString("en-IN",{day:"numeric",month:"short"}),count:complaints.filter(c=>new Date(c.createdAt).toDateString()===d.toDateString()).length};});
    const weeklyData = Array.from({length:8},(_,i)=>{const end=new Date(now);end.setDate(end.getDate()-((7-i)*7));const start=new Date(end);start.setDate(start.getDate()-6);return{label:`W${i+1}`,count:complaints.filter(c=>{const cd=new Date(c.createdAt);return cd>=start&&cd<=end;}).length};});
    const monthlyData = Array.from({length:8},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-7+i,1);return{label:d.toLocaleDateString("en-IN",{month:"short"}),count:complaints.filter(c=>{const cd=new Date(c.createdAt);return cd.getFullYear()===d.getFullYear()&&cd.getMonth()===d.getMonth();}).length};});
    return { total, resolved, inProgress, unassigned, verified, resRate, inProgPct, unassPct, categories, allCatNames, topCategory, areas, worstArea: areas[0]?.[0]||"—", workerRanking, avgResolutionMins, aiVerifiedCount, avgAiScore, avgRating, ratedCount: ratings.length, dailyData, weeklyData, monthlyData, thisMonth: monthlyData[monthlyData.length-1]?.count||0, lastMonth: monthlyData[monthlyData.length-2]?.count||0 };
  }, [complaints]);

  const trendData = useMemo(() => {
    if (trendPeriod === "daily")  return metrics.dailyData;
    if (trendPeriod === "weekly") return metrics.weeklyData;
    return metrics.monthlyData;
  }, [trendPeriod, metrics]);

  const filteredComplaints = useMemo(() => {
    let list = [...complaints];
    if (statusFilter !== "ALL") {
      list = list.filter(c => {
        const n = ns(c.status);
        if (statusFilter === "RESOLVED")    return ["CLOSED","RESOLVED","VERIFIED"].includes(n);
        if (statusFilter === "IN_PROGRESS") return ["IN_PROGRESS","ASSIGNED"].includes(n);
        if (statusFilter === "UNASSIGNED")  return ["SUBMITTED","AWAITING_ASSIGNMENT"].includes(n);
        if (statusFilter === "VERIFIED")    return n === "VERIFIED";
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.description||"").toLowerCase().includes(q) ||
        (c.category ? String(c.category) : "").toLowerCase().includes(q) ||
        (c.areaName||"").toLowerCase().includes(q) ||
        (c.workerName||"").toLowerCase().includes(q) ||
        (c.citizenId||"").toLowerCase().includes(q) ||
        String(c.complaintId||"").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "newest")   return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")   return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "status")   return (a.status||"").localeCompare(b.status||"");
      if (sortBy === "category") return String(a.category||"").localeCompare(String(b.category||""));
      if (sortBy === "area")     return (a.areaName||"").localeCompare(b.areaName||"");
      return 0;
    });
    return list;
  }, [complaints, statusFilter, search, sortBy]);

  /* ── pagination derived values ── */
  const totalPages   = Math.max(1, Math.ceil(filteredComplaints.length / PAGE_SIZE));
  const safePage     = Math.min(page, totalPages);
  const pagedComplaints = filteredComplaints.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const today = new Date().toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  return (
    <>
      <Navbar />
      <ComplaintModal complaint={selComplaint} onClose={() => setSelComplaint(null)} />
      <div className="vaa-page">
        <div className="vaa-ambient">
          <div className="vaa-orb vaa-orb-1" />
          <div className="vaa-orb vaa-orb-2" />
          <div className="vaa-grid" />
        </div>
        <div className={`vaa-dash${visible ? " vaa-dash--vis" : ""}`}>

          <header className="vaa-header">
            <div className="vaa-header__left">
              <div className="vaa-eyebrow"><span className="vaa-eyebrow__dot" />Rural Ops · Complaint Intelligence</div>
              <h1 className="vaa-title">Village Governance<span className="vaa-title__hl"> Analytics</span></h1>
              <p className="vaa-header__date">{today}{refreshed && <span className="vaa-header__upd"> · Updated {timeAgo(refreshed)}</span>}</p>
            </div>
            <div className="vaa-header__right">
              <div className="vaa-header__ctrls">
                <button className="vd-ctrl" onClick={fetchComplaints}>↻ Refresh</button>
                <button className="vd-btn vd-btn--ghost" onClick={() => nav(`/vao/dashboard/${vaoId}`)}>← Command Hall</button>
              </div>
            </div>
          </header>

          {authError && (
            <div className="vd-errbar" style={{ background:"#9e332818", borderColor:"#9e332855" }}>
              🔒 {authError}
              {authError.includes("expired") && <button onClick={() => nav("/vao/login",{replace:true})} className="vd-errbar__btn">Go to Login</button>}
            </div>
          )}
          {error && !authError && (
            <div className="vd-errbar">⚠️ {error}<button onClick={fetchComplaints} className="vd-errbar__btn">↻ Retry</button></div>
          )}

          {loading ? (
            <div className="vaa-skeleton-page" style={{ marginTop:18 }}>
              <div className="kpi-strip">{Array(6).fill(0).map((_,i)=><Skel key={i} h={90}/>)}</div>
              <div className="vaa-grid-3" style={{marginTop:14}}><Skel h={260}/><Skel h={260}/><Skel h={260}/></div>
              <Skel h={300} r={14} style={{marginTop:14}}/>
              <Skel h={360} r={14} style={{marginTop:14}}/>
            </div>
          ) : (
            <>
              <div className="kpi-strip" style={{ marginTop:18 }}>
                <KpiCard icon="📋" label="Total Complaints"   value={metrics.total}      sub="All time"                                          color={T.gold}   delay={0}    />
                <KpiCard icon="🚨" label="Unassigned"         value={metrics.unassigned} sub="Need immediate action"                             color={T.red}    delay={0.05} />
                <KpiCard icon="⚙"  label="In Progress"        value={metrics.inProgress} sub="Being handled"                                    color={T.amber}  delay={0.10} />
                <KpiCard icon="✅" label="Resolved"            value={metrics.resolved}   sub={`${metrics.resRate}% resolution rate`}             color={T.green}  delay={0.15} />
                <KpiCard icon="🛡️" label="Verified"            value={metrics.verified}   sub="Awaiting VAO closure"                             color={T.violet} delay={0.20} />
                <KpiCard icon="⏱"  label="Avg Resolution"     value={fmtDuration(metrics.avgResolutionMins)} sub="Per resolved complaint"        color={T.teal}   delay={0.25} />
              </div>
              <div className="kpi-strip" style={{ marginTop:10 }}>
                <KpiCard icon="🏷"  label="Top Category"      value={metrics.topCategory}  sub={`${metrics.categories[0]?.[1]??0} complaints`}  color={T.teal}   delay={0}    />
                <KpiCard icon="📍"  label="Hotspot Area"      value={metrics.worstArea}    sub={`${metrics.areas[0]?.[1]??0} complaints`}        color={T.orange} delay={0.05} />
                <KpiCard icon="🤖"  label="AI Verified"       value={metrics.aiVerifiedCount} sub={metrics.avgAiScore!=null?`Avg score: ${metrics.avgAiScore}`:"No AI data yet"} color={T.sky} delay={0.10} />
                <KpiCard icon="⭐"  label="Avg Worker Rating"  value={metrics.avgRating!=null?`${metrics.avgRating}/5`:"—"} sub={`${metrics.ratedCount} rated`} color={T.amber} delay={0.15} />
                <KpiCard icon="📅"  label="This Month"        value={metrics.thisMonth}    sub={metrics.lastMonth>0?`vs ${metrics.lastMonth} last month`:"First recorded month"} color={T.silver} delay={0.20} />
                <KpiCard icon="⚒"  label="Active Workers"     value={metrics.workerRanking.length} sub="Unique workers with complaints"          color={T.green}  delay={0.25} />
              </div>

              <div className="vaa-grid-3" style={{ marginTop:14 }}>
                <Panel title="📊 Status Overview" sub={`${metrics.total} complaints total`} accent={T.gold}>
                  <div className="vaa-status-donut-row">
                    <DonutChart size={110} thickness={14}
                      segments={[{value:metrics.resolved,color:T.green},{value:metrics.inProgress,color:T.amber},{value:metrics.unassigned,color:T.red},{value:metrics.verified,color:T.violet}]}
                      centerLabel={metrics.total} centerSub="total" />
                    <div className="vaa-donut-legend">
                      {[{label:"Resolved",val:metrics.resolved,pct:metrics.resRate,color:T.green},{label:"In Progress",val:metrics.inProgress,pct:metrics.inProgPct,color:T.amber},{label:"Unassigned",val:metrics.unassigned,pct:metrics.unassPct,color:T.red},{label:"Verified",val:metrics.verified,pct:metrics.total>0?Math.round((metrics.verified/metrics.total)*100):0,color:T.violet}].map(row=>(
                        <div className="vaa-donut-leg-row" key={row.label}>
                          <span className="vaa-donut-leg-dot" style={{background:row.color,boxShadow:`0 0 5px ${row.color}88`}}/>
                          <span className="vaa-donut-leg-label">{row.label}</span>
                          <span className="vaa-donut-leg-val" style={{color:row.color}}>{row.val}</span>
                          <span className="vaa-donut-leg-pct">{row.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="vaa-radial-trio">
                    <div className="vaa-radial-item"><RadialProgress pct={metrics.resRate}   color={T.green} size={68} thickness={7} label={`${metrics.resRate}%`}   sub="Resolved"   /></div>
                    <div className="vaa-radial-item"><RadialProgress pct={metrics.inProgPct} color={T.amber} size={68} thickness={7} label={`${metrics.inProgPct}%`} sub="Active"      /></div>
                    <div className="vaa-radial-item"><RadialProgress pct={metrics.unassPct}  color={T.red}   size={68} thickness={7} label={`${metrics.unassPct}%`}  sub="Unassigned"  /></div>
                  </div>
                </Panel>
                <Panel title="🏷 By Category" sub="Complaint types ranked" accent={T.teal}>
                  {metrics.categories.length === 0 ? <div className="vaa-empty">No data yet</div> : (
                    <>
                      <div className="vaa-cat-donut-row">
                        <DonutChart size={90} thickness={18} segments={metrics.categories.slice(0,6).map(([,cnt],i)=>({value:cnt,color:CAT_COLORS[i%CAT_COLORS.length]}))} centerLabel={metrics.categories.length} centerSub="types" />
                        <div className="vaa-cat-donut-legend">
                          {metrics.categories.slice(0,4).map(([cat,cnt],i)=>(
                            <div className="vaa-cat-leg-item" key={cat}>
                              <span className="vaa-cat-leg-dot" style={{background:CAT_COLORS[i%CAT_COLORS.length]}}/>
                              <span className="vaa-cat-leg-label">{cat}</span>
                              <span className="vaa-cat-leg-val" style={{color:CAT_COLORS[i%CAT_COLORS.length]}}>{cnt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{marginTop:10}}>{metrics.categories.slice(0,5).map(([cat,cnt],i)=><RankedRow key={cat} label={cat} value={cnt} max={metrics.categories[0][1]} color={CAT_COLORS[i%CAT_COLORS.length]} rank={i+1}/>)}</div>
                    </>
                  )}
                </Panel>
                <Panel title="📍 By Area" sub="Hotspot identification" accent={T.orange}>
                  {metrics.areas.length === 0 ? <div className="vaa-empty">No area data</div> : (
                    <>
                      <div className="vaa-cat-donut-row">
                        <DonutChart size={90} thickness={18} segments={metrics.areas.slice(0,5).map(([,cnt],i)=>({value:cnt,color:[T.orange,T.teal,T.gold,T.sky,T.violet][i]}))} centerLabel={metrics.areas.length} centerSub="areas" />
                        <div className="vaa-cat-donut-legend">
                          {metrics.areas.slice(0,4).map(([area,cnt],i)=>{const c=[T.orange,T.teal,T.gold,T.sky,T.violet][i];return(<div className="vaa-cat-leg-item" key={area}><span className="vaa-cat-leg-dot" style={{background:c}}/><span className="vaa-cat-leg-label">{area}</span><span className="vaa-cat-leg-val" style={{color:c}}>{cnt}</span></div>);})}
                        </div>
                      </div>
                      <div style={{marginTop:10}}>{metrics.areas.slice(0,5).map(([area,cnt],i)=><RankedRow key={area} label={area} value={cnt} max={metrics.areas[0][1]} color={[T.orange,T.teal,T.gold,T.sky,T.violet][i]} rank={i+1}/>)}</div>
                    </>
                  )}
                </Panel>
              </div>

              <div className="vaa-grid-2" style={{ marginTop:14 }}>
                <Panel title="⚒ Worker Ranking" sub="By complaints handled" accent={T.green}>
                  {metrics.workerRanking.length === 0 ? <div className="vaa-empty">No assigned workers yet</div> : (
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {metrics.workerRanking.slice(0,6).map(([name,cnt],i)=><RankedRow key={name} label={name} value={cnt} max={metrics.workerRanking[0][1]} color={T.green} rank={i+1}/>)}
                    </div>
                  )}
                </Panel>
                <Panel title="🤖 AI & Quality Metrics" sub="Score, verification and ratings" accent={T.sky}>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
                      <div style={{flex:1,minWidth:100,display:"flex",flexDirection:"column",alignItems:"center"}}><RadialProgress pct={metrics.avgAiScore??0} color={T.sky} size={72} thickness={7} label={metrics.avgAiScore!=null?`${metrics.avgAiScore}`:"—"} sub="Avg AI Score"/></div>
                      <div style={{flex:1,minWidth:100,display:"flex",flexDirection:"column",alignItems:"center"}}><RadialProgress pct={metrics.total>0?Math.round((metrics.aiVerifiedCount/metrics.total)*100):0} color={T.green} size={72} thickness={7} label={`${metrics.total>0?Math.round((metrics.aiVerifiedCount/metrics.total)*100):0}%`} sub="AI Verified"/></div>
                      <div style={{flex:1,minWidth:100,display:"flex",flexDirection:"column",alignItems:"center"}}><RadialProgress pct={metrics.avgRating!=null?(parseFloat(metrics.avgRating)/5)*100:0} color={T.amber} size={72} thickness={7} label={metrics.avgRating!=null?`${metrics.avgRating}★`:"—"} sub="Avg Rating"/></div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8,padding:"8px 0 0"}}>
                      {[{label:"AI Verified Complaints",value:metrics.aiVerifiedCount,max:metrics.total,color:T.green},{label:"Avg Clean Score",value:metrics.avgAiScore??0,max:100,color:T.sky},{label:"Complaints Rated",value:metrics.ratedCount,max:metrics.total,color:T.amber}].map(row=>(
                        <div key={row.label}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <span style={{fontFamily:"var(--fh)",fontSize:10,color:"var(--t3)"}}>{row.label}</span>
                            <span style={{fontFamily:"var(--fh)",fontSize:10,color:row.color}}>{row.value}</span>
                          </div>
                          <div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${row.max>0?(row.value/row.max)*100:0}%`,background:row.color,borderRadius:2,transition:"width 1s ease"}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>
              </div>

              <Panel title="📈 Complaint Trend"
                sub={trendPeriod==="daily"?"Last 14 days":trendPeriod==="weekly"?"Last 8 weeks":"Last 8 months"}
                accent={T.gold} style={{marginTop:14}}>
                <div className="vaa-trend-tabs">
                  {[{id:"daily",label:"Daily"},{id:"weekly",label:"Weekly"},{id:"monthly",label:"Monthly"}].map(t=>(
                    <button key={t.id} className={`vaa-trend-tab${trendPeriod===t.id?" on":""}`} onClick={()=>setTrendPeriod(t.id)}>{t.label}</button>
                  ))}
                  <div className="vaa-trend-summary">
                    <span className="vaa-trend-summary__item"><span style={{color:T.gold,fontFamily:"var(--fh)",fontWeight:800,fontSize:16}}>{trendData.reduce((s,d)=>s+d.count,0)}</span><span className="vaa-trend-summary__lbl">Total in period</span></span>
                    <span className="vaa-trend-summary__item"><span style={{color:T.teal,fontFamily:"var(--fh)",fontWeight:800,fontSize:16}}>{Math.max(...trendData.map(d=>d.count))||0}</span><span className="vaa-trend-summary__lbl">Peak</span></span>
                    <span className="vaa-trend-summary__item"><span style={{color:T.silver,fontFamily:"var(--fh)",fontWeight:800,fontSize:16}}>{trendData.length>0?(trendData.reduce((s,d)=>s+d.count,0)/trendData.length).toFixed(1):0}</span><span className="vaa-trend-summary__lbl">Avg</span></span>
                  </div>
                </div>
                <BarChart data={trendData} color={T.gold} />
              </Panel>

              {/* ══ COMPLAINT TABLE WITH PAGINATION ══ */}
              <Panel title="📋 All Complaints"
                sub={`${filteredComplaints.length} of ${metrics.total} shown · page ${safePage} of ${totalPages}`}
                accent={T.amber} style={{marginTop:14}}>
                <div className="vaa-table-ctrls">
                  <div className="vaa-search-wrap">
                    <span className="vaa-search__ic">⚔</span>
                    <input className="vaa-search" placeholder="Search ID, description, area, category, worker, citizen ID…"
                      value={search} onChange={e=>setSearch(e.target.value)} />
                    {search && <button className="vaa-search__clr" onClick={()=>setSearch("")}>✕</button>}
                  </div>
                  <div className="vaa-table-filters">
                    {[{id:"ALL",label:"All"},{id:"UNASSIGNED",label:"Unassigned",c:T.red},{id:"IN_PROGRESS",label:"In Progress",c:T.amber},{id:"RESOLVED",label:"Resolved",c:T.green},{id:"VERIFIED",label:"Verified",c:T.violet}].map(f=>(
                      <button key={f.id} className={`vaa-filter-btn${statusFilter===f.id?" on":""}`}
                        style={statusFilter===f.id&&f.c?{background:`${f.c}14`,borderColor:`${f.c}40`,color:f.c}:undefined}
                        onClick={()=>setStatusFilter(f.id)}>{f.label}</button>
                    ))}
                    <select className="vaa-sort-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="status">By Status</option>
                      <option value="category">By Category</option>
                      <option value="area">By Area</option>
                    </select>
                  </div>
                </div>

                {filteredComplaints.length === 0 ? (
                  <div className="vaa-empty">No complaints match your filters</div>
                ) : (
                  <>
                    <div className="vaa-table-wrap">
                      <table className="vaa-table">
                        <thead>
                          <tr>
                            <th>#</th><th>Description</th><th>Category</th><th>Area</th>
                            <th>Worker</th><th>Citizen ID</th><th>AI Score</th>
                            <th>Rating</th><th>Status</th><th>Filed</th><th>Resolved</th><th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedComplaints.map((c, i) => (
                            <tr key={c.complaintId || i} className="vaa-table__row">
                              <td className="vaa-table__id">#{String(c.complaintId||i+1).slice(-8)}</td>
                              <td className="vaa-table__desc">{c.description?(c.description.length>50?c.description.slice(0,50)+"…":c.description):"—"}</td>
                              <td><CatPill cat={c.category?String(c.category):"—"} allCats={metrics.allCatNames}/></td>
                              <td className="vaa-table__area">{c.areaName||"—"}</td>
                              <td className="vaa-table__worker">{c.workerName?<span style={{color:T.green}}>{c.workerName}</span>:<span style={{color:T.red,fontSize:10}}>Unassigned</span>}</td>
                              <td><code style={{fontFamily:"var(--fm, monospace)",fontSize:10,color:"var(--t3)"}}>{c.citizenId||"—"}</code></td>
                              <td><AiScoreBadge score={c.aiCleanScore} verified={c.aiVerified}/></td>
                              <td><RatingStars rating={c.workerRating}/></td>
                              <td><StatusPill status={c.status}/></td>
                              <td className="vaa-table__date">{fmtDateShort(c.createdAt)}</td>
                              <td className="vaa-table__date">{c.resolvedAt?<span style={{color:T.green}}>{fmtDateShort(c.resolvedAt)}</span>:<span style={{color:"var(--t4)"}}>—</span>}</td>
                              <td><button className="vd-act act-view" onClick={()=>setSelComplaint(c)}>View</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ── PAGINATION ── */}
                    <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
                  </>
                )}

                <div className="vaa-table-foot">
                  Showing {pagedComplaints.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredComplaints.length)} of {filteredComplaints.length} complaints
                  {search && <> · "<strong>{search}</strong>"</>}
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}