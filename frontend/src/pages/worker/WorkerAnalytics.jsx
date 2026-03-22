import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";  // ✅ removed useParams — worker identity from JWT
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/WorkerAnalytics.css";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

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

  return res;
}

/* ════════════════════════════════════════════
   ROLE GUARD HOOK — only ROLE_WORKER may enter
════════════════════════════════════════════ */
function useRequireRole(requiredRole) {
  const nav = useNavigate();

  useEffect(() => {
    const token = getToken();
    const role  = getRole();

    if (!token) {
      nav("/login", { replace: true });
      return;
    }
    if (role !== requiredRole) {
      nav("/unauthorized", { replace: true });
    }
  }, [nav, requiredRole]);
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════════════════════ */
const STATUS_ORDER = ["ASSIGNED","IN_PROGRESS","RESOLVED","VERIFIED","CLOSED"];

const CATEGORY_CFG = {
  GARBAGE:       { icon:"🗑",  color:"#c8982a", label:"Garbage"       },
  DRAINAGE:      { icon:"🌊", color:"#3bbcd4", label:"Drainage"       },
  ROAD_DAMAGE:   { icon:"🛤",  color:"#c47818", label:"Road Damage"   },
  STREET_LIGHT:  { icon:"💡", color:"#d4b020", label:"Street Light"   },
  WATER_SUPPLY:  { icon:"💧", color:"#3b9ed4", label:"Water Supply"   },
  PUBLIC_HEALTH: { icon:"⚕",  color:"#c94444", label:"Public Health"  },
  OTHER:         { icon:"📋", color:"#7a8fa6", label:"Other"          },
};
const catOf  = c => CATEGORY_CFG[c] || CATEGORY_CFG.OTHER;

const STATUS_CFG = {
  ASSIGNED:    { color:"#a78bfa", label:"Assigned"    },
  IN_PROGRESS: { color:"#fbbf24", label:"In Progress" },
  RESOLVED:    { color:"#34d399", label:"Resolved"    },
  VERIFIED:    { color:"#52b874", label:"Verified"    },
  CLOSED:      { color:"#c8982a", label:"Closed"      },
};

function durStr(mins) {
  if (!mins || mins <= 0) return "—";
  if (mins < 60)   return `${Math.round(mins)}m`;
  if (mins < 1440) return `${(mins/60).toFixed(1)}h`;
  return `${(mins/1440).toFixed(1)}d`;
}
function pct(a, b) { return b === 0 ? 0 : Math.round((a/b)*100); }
function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }

/* ═══════════════════════════════════════════════════════
   COMPUTE ALL METRICS
═══════════════════════════════════════════════════════ */
function computeMetrics(complaints) {
  if (!complaints.length) return null;

  const total     = complaints.length;
  const closed    = complaints.filter(c => c.status === "CLOSED");
  const resolved  = complaints.filter(c => ["RESOLVED","VERIFIED","CLOSED"].includes(c.status));
  const verified  = complaints.filter(c => ["VERIFIED","CLOSED"].includes(c.status));
  const active    = complaints.filter(c => ["ASSIGNED","IN_PROGRESS"].includes(c.status));
  const inProg    = complaints.filter(c => c.status === "IN_PROGRESS");
  const assigned  = complaints.filter(c => c.status === "ASSIGNED");

  const resTimes = resolved.map(c => {
    const from = c.assignedAt;
    if (!from || !c.resolvedAt) return null;
    return (new Date(c.resolvedAt) - new Date(from)) / 60000;
  }).filter(v => v != null && v > 0);

  const avgResMin   = resTimes.length ? resTimes.reduce((a,b)=>a+b,0)/resTimes.length : null;
  const medianRes   = (() => {
    if (!resTimes.length) return null;
    const s = [...resTimes].sort((a,b)=>a-b);
    const m = Math.floor(s.length/2);
    return s.length%2===0 ? (s[m-1]+s[m])/2 : s[m];
  })();
  const fastestRes  = resTimes.length ? Math.min(...resTimes) : null;
  const slowestRes  = resTimes.length ? Math.max(...resTimes) : null;

  const scored      = complaints.filter(c => c.aiCleanScore != null);
  const scores      = scored.map(c => c.aiCleanScore);
  const avgScore    = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null;
  const highScore   = scores.length ? Math.max(...scores) : null;
  const lowScore    = scores.length ? Math.min(...scores) : null;
  const scoreDistrib = [0,0,0,0,0];
  scores.forEach(s => { scoreDistrib[Math.min(4, Math.floor(s/20))]++; });

  const byCategory = {};
  complaints.forEach(c => {
    const cat = c.category || "OTHER";
    if (!byCategory[cat]) byCategory[cat] = { total:0, closed:0, scores:[], resTimes:[] };
    byCategory[cat].total++;
    if (c.status === "CLOSED") byCategory[cat].closed++;
    if (c.aiCleanScore != null) byCategory[cat].scores.push(c.aiCleanScore);
    const from = c.assignedAt;
    if (from && c.resolvedAt) {
      const m = (new Date(c.resolvedAt)-new Date(from))/60000;
      if (m > 0) byCategory[cat].resTimes.push(m);
    }
  });

  const byStatus = {};
  STATUS_ORDER.forEach(s => { byStatus[s] = complaints.filter(c => c.status===s).length; });

  const now = new Date();
  const months = Array.from({length:6},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1);
    return { label: d.toLocaleString("en-IN",{month:"short"}), year: d.getFullYear(), month: d.getMonth(), submitted:0, closed:0 };
  });
  complaints.forEach(c => {
    if (!c.createdAt) return;
    const d = new Date(c.createdAt);
    const mi = months.findIndex(m => m.year===d.getFullYear() && m.month===d.getMonth());
    if (mi >= 0) { months[mi].submitted++; if (c.status==="CLOSED") months[mi].closed++; }
  });

  const weekdays = Array(7).fill(0);
  complaints.forEach(c => { if (c.createdAt) weekdays[new Date(c.createdAt).getDay()]++; });

  const hours = Array(24).fill(0);
  complaints.forEach(c => { if (c.createdAt) hours[new Date(c.createdAt).getHours()]++; });

  const slaBreaches = resolved.filter(c => {
    const from = c.assignedAt;
    if (!from || !c.resolvedAt) return false;
    return (new Date(c.resolvedAt)-new Date(from)) > 48*3600000;
  }).length;

  const firstResponseTimes = complaints.filter(c=>c.assignedAt&&c.startedAt).map(c=>(new Date(c.startedAt)-new Date(c.assignedAt))/60000).filter(v=>v>0);
  const avgFirstResponse = firstResponseTimes.length ? firstResponseTimes.reduce((a,b)=>a+b,0)/firstResponseTimes.length : null;

  let rating = 0;
  const closureRate = pct(closed.length, total);
  const verifyRate  = pct(verified.length, total);
  rating += (closureRate / 100) * 25;
  rating += (verifyRate / 100) * 20;
  if (avgScore != null) rating += (avgScore / 100) * 25;
  if (avgResMin != null) {
    const speedScore = clamp(1 - (avgResMin - 240) / (2880 - 240), 0, 1);
    rating += speedScore * 20;
  }
  const slaCompliance = total > 0 ? 1 - (slaBreaches / total) : 1;
  rating += slaCompliance * 10;
  rating = Math.round(clamp(rating, 0, 100));

  const ratingLabel = rating >= 90 ? "Legendary" : rating >= 75 ? "Elite" : rating >= 60 ? "Veteran" : rating >= 45 ? "Soldier" : "Recruit";
  const ratingColor = rating >= 90 ? "#e8c96a" : rating >= 75 ? "#34d399" : rating >= 60 ? "#52b874" : rating >= 45 ? "#fbbf24" : "#f87171";

  return {
    total, closed, resolved, verified, active, inProg, assigned,
    closureRate, verifyRate,
    avgResMin, medianRes, fastestRes, slowestRes,
    avgScore, highScore, lowScore, scores, scoreDistrib, scored,
    byCategory, byStatus, months, weekdays, hours,
    slaBreaches, avgFirstResponse,
    rating, ratingLabel, ratingColor,
  };
}

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTER
═══════════════════════════════════════════════════════ */
function Counter({ value, decimals=0, suffix="" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (value == null || isNaN(value)) return;
    const dur = 1200, start = performance.now();
    const animate = (now) => {
      const t = Math.min(1,(now-start)/dur);
      const ease = t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
      setDisplay(parseFloat((ease * value).toFixed(decimals)));
      if (t < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value, decimals]);
  if (value == null || isNaN(value)) return <span>—</span>;
  return <span>{display.toFixed(decimals)}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════
   MINI BAR CHART
═══════════════════════════════════════════════════════ */
function BarChart({ data, color="#c8982a", height=80 }) {
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div className="wa-barchart" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="wa-barchart__col">
          <div className="wa-barchart__bar-wrap" style={{ height: height - 22 }}>
            <div
              className="wa-barchart__bar"
              style={{
                height: `${pct(d.value, max)}%`,
                background: typeof color === "function" ? color(d, i) : color,
                animationDelay: `${0.1 + i * 0.06}s`,
              }}
            />
          </div>
          {d.label && <span className="wa-barchart__lbl">{d.label}</span>}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DUAL BAR
═══════════════════════════════════════════════════════ */
function DualBar({ data }) {
  const max = Math.max(...data.map(d => Math.max(d.a, d.b)), 1);
  return (
    <div className="wa-dualbar">
      {data.map((d, i) => (
        <div key={i} className="wa-dualbar__group">
          <div className="wa-dualbar__bars">
            <div className="wa-dualbar__bar-wrap">
              <div className="wa-dualbar__bar wa-dualbar__bar--a"
                style={{ height: `${pct(d.a, max)}%`, animationDelay: `${0.1+i*0.08}s` }}
                title={`Submitted: ${d.a}`} />
            </div>
            <div className="wa-dualbar__bar-wrap">
              <div className="wa-dualbar__bar wa-dualbar__bar--b"
                style={{ height: `${pct(d.b, max)}%`, animationDelay: `${0.15+i*0.08}s` }}
                title={`Closed: ${d.b}`} />
            </div>
          </div>
          <span className="wa-dualbar__lbl">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RING / DONUT CHART
═══════════════════════════════════════════════════════ */
function RingChart({ segments, size=120, strokeWidth=14, label, sublabel }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s,d)=>s+d.value, 0) || 1;
  let offset = circ * 0.25;
  return (
    <div className="wa-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(140,110,60,0.10)" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const dashLen = (seg.value / total) * circ;
          const el = (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
              stroke={seg.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dashLen - 2} ${circ - dashLen + 2}`}
              strokeDashoffset={-offset + circ * 0.25}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 4px ${seg.color}60)` }}
            />
          );
          offset += dashLen;
          return el;
        })}
      </svg>
      {label && (
        <div className="wa-ring__center">
          <span className="wa-ring__val">{label}</span>
          {sublabel && <span className="wa-ring__sub">{sublabel}</span>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HEAT MAP
═══════════════════════════════════════════════════════ */
function HeatRow({ label, values, max }) {
  return (
    <div className="wa-heat__row">
      <span className="wa-heat__row-lbl">{label}</span>
      <div className="wa-heat__cells">
        {values.map((v, i) => {
          const intensity = max > 0 ? v / max : 0;
          return (
            <div key={i} className="wa-heat__cell"
              style={{ background: `rgba(200,152,42,${0.06 + intensity * 0.78})` }}
              title={`${label} ${i}:00 — ${v} complaints`}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SPARKLINE
═══════════════════════════════════════════════════════ */
function Sparkline({ values, color="#c8982a", width=120, height=32 }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} className="wa-sparkline">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${height} ${pts} ${width},${height}`}
        fill={`url(#spark-fill-${color.replace("#","")})`} stroke="none" opacity="0.18" />
      <defs>
        <linearGradient id={`spark-fill-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   SCORE DISTRIBUTION BANDS
═══════════════════════════════════════════════════════ */
const SCORE_BANDS = [
  { label:"0–19",  color:"#ef4444" },
  { label:"20–39", color:"#f97316" },
  { label:"40–59", color:"#fbbf24" },
  { label:"60–79", color:"#34d399" },
  { label:"80–100",color:"#52b874" },
];

/* ═══════════════════════════════════════════════════════
   GAUGE
═══════════════════════════════════════════════════════ */
function Gauge({ value, max=100, color="#c8982a", size=110 }) {
  const r = size * 0.38;
  const cx = size/2, cy = size * 0.62;
  const angleRange = Math.PI * 1.2;
  const startAngle = Math.PI + (Math.PI - angleRange) / 2;
  const endAngle = startAngle + angleRange;
  const valueAngle = startAngle + (value/max) * angleRange;
  const polar = (ang) => ({ x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) });
  const trackStart = polar(startAngle), trackEnd = polar(endAngle);
  const valEnd = polar(valueAngle);
  const arcPct = (value/max) * (angleRange / (2*Math.PI));
  return (
    <svg width={size} height={size * 0.72} className="wa-gauge">
      <path d={`M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 1 1 ${trackEnd.x} ${trackEnd.y}`}
        fill="none" stroke="rgba(140,110,60,0.12)" strokeWidth={8} strokeLinecap="round" />
      <path d={`M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 ${arcPct > 0.5 ? 1 : 0} 1 ${valEnd.x} ${valEnd.y}`}
        fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
      <circle cx={valEnd.x} cy={valEnd.y} r={4} fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════════════════ */
function Sk({ w="100%", h, r=8 }) {
  return <div className="wa-sk" style={{ width:w, height:h, borderRadius:r }} />;
}

/* ═══════════════════════════════════════════════════════
   SECTION HEADER
═══════════════════════════════════════════════════════ */
function SectionHead({ icon, title, sub, idx=0 }) {
  return (
    <div className="wa-section-head" style={{ animationDelay: `${0.05 + idx*0.04}s` }}>
      <div className="wa-section-head__icon">{icon}</div>
      <div>
        <h2 className="wa-section-head__title">{title}</h2>
        {sub && <p className="wa-section-head__sub">{sub}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function WorkerAnalytics() {
  // ✅ worker identity comes from JWT — no useParams needed
  const navigate = useNavigate();

  // ── Role guard ──
  useRequireRole("WORKER");

  const [complaints, setComplaints] = useState([]);
  const [worker,     setWorker]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [authError,  setAuthError]  = useState(null);
  const [visible,    setVisible]    = useState(false);

  const fetchData = useCallback(async () => {
    setError(null); setAuthError(null); setLoading(true);
    try {
      const [cRes, wRes] = await Promise.allSettled([
        authFetch(`${API}/workers/complaints`),
        authFetch(`${API}/worker/profile`),
      ]);

      if (cRes.status === "rejected") throw cRes.reason;
      setComplaints(await cRes.value.json().then(d => Array.isArray(d) ? d : []));

      if (wRes.status === "fulfilled") {
        setWorker(await wRes.value.json().catch(() => null));
      }
    } catch (e) {
      if (e.code === 401) {
        setAuthError(e.message);
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } else if (e.code === 403) {
        setAuthError(e.message);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);  // ✅ removed workerId — it no longer exists

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (!loading && !error && !authError) {
      const t = setTimeout(() => setVisible(true), 60);
      return () => clearTimeout(t);
    }
  }, [loading, error, authError]);

  const m = useMemo(() => computeMetrics(complaints), [complaints]);

  // ✅ fixed: removed workerId fallback — worker identity from JWT/profile only
  const workerName = worker?.firstName
    ? `${worker.firstName} ${worker.lastName ?? ""}`.trim()
    : "Worker";

  /* ─── LOADING ─── */
  if (loading) return (
    <>
      <Navbar />
      <div className="wa-page">
        <div className="wa-ambient"><div className="wa-orb wa-orb--1"/><div className="wa-orb wa-orb--2"/><div className="wa-orb wa-orb--3"/></div>
        <div className="wa-wrap">
          <Sk h={22} w={240} r={4} /><br/><br/>
          <Sk h={220} r={18} /><br/>
          <div className="wa-grid-4"><Sk h={110} r={12}/><Sk h={110} r={12}/><Sk h={110} r={12}/><Sk h={110} r={12}/></div><br/>
          <div className="wa-grid-3"><Sk h={260} r={12}/><Sk h={260} r={12}/><Sk h={260} r={12}/></div>
        </div>
      </div>
      <Footer />
    </>
  );

  /* ─── AUTH ERROR ─── */
  if (authError) return (
    <>
      <Navbar />
      <div className="wa-page wa-page--center">
        <div className="wa-err-box">
          <span style={{fontSize:44}}>🔒</span>
          <h2 className="wa-err-box__t">Access Denied</h2>
          <p className="wa-err-box__m">{authError}</p>
          {authError.includes("expired") && (
            <button className="wa-btn wa-btn--gold"
              onClick={() => navigate("/login", { replace: true })}>
              Go to Login
            </button>
          )}
        </div>
      </div>
      <Footer />
    </>
  );

  /* ─── ERROR ─── */
  if (error) return (
    <>
      <Navbar />
      <div className="wa-page wa-page--center">
        <div className="wa-err-box">
          <span style={{fontSize:44}}>⚠️</span>
          <h2 className="wa-err-box__t">Raven Lost</h2>
          <p className="wa-err-box__m">{error}</p>
          <button className="wa-btn wa-btn--gold" onClick={fetchData}>↺ Retry</button>
        </div>
      </div>
      <Footer />
    </>
  );

  /* ─── NO DATA ─── */
  if (!m) return (
    <>
      <Navbar />
      <div className="wa-page wa-page--center">
        <div className="wa-err-box">
          <span style={{fontSize:44}}>🏰</span>
          <h2 className="wa-err-box__t">No Campaigns Yet</h2>
          <p className="wa-err-box__m">No complaint data found for this warrior.</p>
          {/* ✅ fixed: removed /${workerId} */}
          <button className="wa-btn wa-btn--ghost" onClick={()=>navigate(`/worker/dashboard`)}>← Dashboard</button>
        </div>
      </div>
      <Footer />
    </>
  );

  /* ════════════════════════════════════════════════════════
     DERIVED CHART DATA
  ════════════════════════════════════════════════════════ */
  const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const weekdayData = DAY_LABELS.map((label,i)=>({ label, value: m.weekdays[i] }));

  const catEntries = Object.entries(m.byCategory)
    .map(([cat, d]) => ({
      cat, cfg: catOf(cat), ...d,
      avgScore: d.scores.length ? Math.round(d.scores.reduce((a,b)=>a+b,0)/d.scores.length) : null,
      avgRes:   d.resTimes.length ? d.resTimes.reduce((a,b)=>a+b,0)/d.resTimes.length : null,
      rate:     pct(d.closed, d.total),
    }))
    .sort((a,b)=>b.total-a.total);

  const statusSegments = STATUS_ORDER
    .filter(s => m.byStatus[s] > 0)
    .map(s => ({ label:s, value:m.byStatus[s], color: STATUS_CFG[s].color }));

  const totalScored = m.scoreDistrib.reduce((a,b)=>a+b,0) || 1;

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <>
      <Navbar />
      <div className="wa-page">
        <div className="wa-ambient" aria-hidden="true">
          <div className="wa-orb wa-orb--1"/><div className="wa-orb wa-orb--2"/><div className="wa-orb wa-orb--3"/>
          <div className="wa-dot-grid"/>
        </div>

        <div className={`wa-wrap${visible?" wa-wrap--visible":""}`}>

          {/* ══════════ BREADCRUMB ══════════ */}
          {/* ✅ fixed: removed /${workerId} from nav; removed workerId display span */}
          <nav className="wa-breadcrumb">
            <button className="wa-bc__btn" onClick={()=>navigate(`/worker/dashboard`)}>🏰 Command Post</button>
            <span className="wa-bc__sep">›</span>
            <span className="wa-bc__cur">📊 War Analytics</span>
            <button className="wa-btn wa-btn--ghost wa-btn--sm" style={{marginLeft:"auto"}} onClick={fetchData}>↺ Refresh</button>
          </nav>

          {/* ── AUTH ERROR BANNER (401 / 403) ── */}
          {authError && (
            <div className="wa-auth-banner">
              🔒 {authError}
              {authError.includes("expired") && (
                <button onClick={() => navigate("/login", { replace: true })}>Go to Login</button>
              )}
            </div>
          )}

          {/* ══════════ HERO ══════════ */}
          <header className="wa-hero">
            <div className="wa-hero__bg"/><div className="wa-hero__scanlines"/>
            <div className="wa-hero__inner">
              <div className="wa-hero__left">
                <p className="wa-hero__eyebrow"><span className="wa-hero__dot"/>WAR COUNCIL  ·  PERFORMANCE INTELLIGENCE</p>
                <h1 className="wa-hero__h">
                  <span className="wa-hero__h-sm">Field</span>
                  <span className="wa-hero__h-lg">Analytics</span>
                </h1>
                <p className="wa-hero__sub">
                  Complete intelligence on <strong>{workerName}</strong>'s battlefield performance —
                  {m.total} campaigns tracked across {Object.keys(m.byCategory).length} categories.
                </p>
                <div className="wa-hero__acts">
                  {/* ✅ fixed: removed /${workerId} from all hero nav buttons */}
                  <button className="wa-btn wa-btn--gold"  onClick={()=>navigate(`/worker/dashboard`)}>🏰 Dashboard</button>
                  <button className="wa-btn wa-btn--red"   onClick={()=>navigate(`/worker/tasks`)}>⚔ Tasks</button>
                  <button className="wa-btn wa-btn--ghost" onClick={()=>navigate(`/worker/activity`)}>🕒 Activity</button>
                </div>
              </div>

              <div className="wa-rating-orb">
                <div className="wa-rating-orb__ring" style={{"--rc": m.ratingColor}}>
                  <div className="wa-rating-orb__inner">
                    <Gauge value={m.rating} color={m.ratingColor} size={120}/>
                    <div className="wa-rating-orb__nums">
                      <span className="wa-rating-orb__val" style={{color:m.ratingColor}}>
                        <Counter value={m.rating}/>
                      </span>
                      <span className="wa-rating-orb__denom">/100</span>
                    </div>
                    <span className="wa-rating-orb__label" style={{color:m.ratingColor}}>{m.ratingLabel}</span>
                  </div>
                </div>
                <p className="wa-rating-orb__title">Performance Rating</p>
                <div className="wa-rating-orb__factors">
                  {[
                    { l:"Closure",   v:`${m.closureRate}%` },
                    { l:"Verified",  v:`${m.verifyRate}%`  },
                    { l:"AI Score",  v: m.avgScore!=null?`${m.avgScore}/100`:"N/A" },
                    { l:"Avg Speed", v: durStr(m.avgResMin) },
                  ].map(({l,v})=>(
                    <div key={l} className="wa-rating-orb__factor">
                      <span className="wa-rating-orb__fv">{v}</span>
                      <span className="wa-rating-orb__fl">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {/* ══════════ KPI STRIP ══════════ */}
          <div className="wa-kpi-grid">
            {[
              { icon:"📋", label:"Total Campaigns",  val:m.total,                          accent:"gold",    counter:true },
              { icon:"⚔",  label:"Active Tasks",      val:m.active.length,                 accent:"violet",  counter:true },
              { icon:"✅", label:"Resolved",           val:m.resolved.length,               accent:"green",   counter:true },
              { icon:"🏁", label:"Closed",             val:m.closed.length,                 accent:"amber",   counter:true },
              { icon:"🔮", label:"AI Verified",        val:m.verified.length,               accent:"emerald", counter:true },
              { icon:"📈", label:"Closure Rate",       val:`${m.closureRate}%`,             accent:"gold",    counter:false },
              { icon:"🤖", label:"Avg AI Score",       val: m.avgScore!=null?`${m.avgScore}/100`:"N/A", accent:"blue", counter:false },
              { icon:"⏱",  label:"Avg Resolution",    val: durStr(m.avgResMin),             accent:"steel",   counter:false },
            ].map(({icon,label,val,accent,counter},i)=>(
              <div key={label} className={`wa-kpi wa-kpi--${accent}`} style={{animationDelay:`${0.07+i*0.04}s`}}>
                <div className={`wa-kpi__icon wa-kpi__icon--${accent}`}>{icon}</div>
                <div className="wa-kpi__val">{counter && typeof val==="number" ? <Counter value={val}/> : val}</div>
                <div className="wa-kpi__lbl">{label}</div>
                <Sparkline values={counter?[0,Math.round(val*0.3),Math.round(val*0.6),Math.round(val*0.8),val]:[]} color={accent==="gold"?"#c8982a":accent==="green"?"#34d399":accent==="violet"?"#a78bfa":"#c8982a"} width={80} height={24}/>
              </div>
            ))}
          </div>

          {/* ══════════ SECTION 1: MISSION OUTCOME ══════════ */}
          <SectionHead icon="🎯" title="Mission Outcomes" sub="Task completion pipeline and verification rates" idx={0}/>
          <div className="wa-grid-3">
            <div className="wa-card">
              <h3 className="wa-card__t">Status Pipeline</h3>
              <p className="wa-card__sub">Distribution across all task states</p>
              <div className="wa-ring-center">
                <RingChart segments={statusSegments} size={150} strokeWidth={16} label={String(m.total)} sublabel="tasks" />
              </div>
              <div className="wa-legend">
                {statusSegments.map(s=>(
                  <div key={s.label} className="wa-legend__item">
                    <span className="wa-legend__dot" style={{background:s.color, boxShadow:`0 0 6px ${s.color}80`}}/>
                    <span className="wa-legend__name">{STATUS_CFG[s.label].label}</span>
                    <span className="wa-legend__val">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="wa-card">
              <h3 className="wa-card__t">Completion Funnel</h3>
              <p className="wa-card__sub">Tasks flowing through each stage</p>
              <div className="wa-funnel">
                {[
                  { label:"Assigned",  val:m.total,            color:"#a78bfa" },
                  { label:"Started",   val:m.total-m.assigned.length, color:"#fbbf24" },
                  { label:"Resolved",  val:m.resolved.length,  color:"#34d399" },
                  { label:"Verified",  val:m.verified.length,  color:"#52b874" },
                  { label:"Closed",    val:m.closed.length,    color:"#c8982a" },
                ].map((stage,i)=>{
                  const w = 100 - i*12;
                  return (
                    <div key={stage.label} className="wa-funnel__stage" style={{width:`${w}%`, background:`${stage.color}18`, borderColor:`${stage.color}35`, animationDelay:`${0.1+i*0.08}s`}}>
                      <span className="wa-funnel__label" style={{color:stage.color}}>{stage.label}</span>
                      <span className="wa-funnel__val" style={{color:stage.color}}>{stage.val}</span>
                      <span className="wa-funnel__pct">{pct(stage.val,m.total)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="wa-card">
              <h3 className="wa-card__t">SLA & Response</h3>
              <p className="wa-card__sub">Speed and compliance metrics</p>
              <div className="wa-metric-list">
                {[
                  { l:"Avg Resolution Time",    v: durStr(m.avgResMin),       icon:"⏱",  color:"#c8982a" },
                  { l:"Median Resolution",      v: durStr(m.medianRes),       icon:"📊", color:"#a78bfa" },
                  { l:"Fastest Resolution",     v: durStr(m.fastestRes),      icon:"⚡", color:"#34d399" },
                  { l:"Slowest Resolution",     v: durStr(m.slowestRes),      icon:"🐢", color:"#f87171" },
                  { l:"Avg First Response",     v: durStr(m.avgFirstResponse),icon:"🔔", color:"#fbbf24" },
                  { l:"SLA Breaches (>48h)",    v: String(m.slaBreaches),     icon:"⚠",  color: m.slaBreaches>0?"#f87171":"#34d399" },
                ].map(({l,v,icon,color})=>(
                  <div key={l} className="wa-metric-row">
                    <span className="wa-metric-row__icon" style={{color}}>{icon}</span>
                    <span className="wa-metric-row__label">{l}</span>
                    <span className="wa-metric-row__val" style={{color}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════ SECTION 2: AI INTELLIGENCE ══════════ */}
          <SectionHead icon="🤖" title="AI Intelligence" sub="Cleanliness scores and verification analysis" idx={1}/>
          <div className="wa-grid-2-1">
            <div className="wa-card">
              <h3 className="wa-card__t">AI Score Distribution</h3>
              <p className="wa-card__sub">{m.scored.length} verified tasks · avg {m.avgScore ?? "N/A"}/100</p>
              <div className="wa-score-distrib">
                {SCORE_BANDS.map((band,i)=>{
                  const count = m.scoreDistrib[i];
                  const width = pct(count, totalScored);
                  return (
                    <div key={band.label} className="wa-sd__row">
                      <span className="wa-sd__band">{band.label}</span>
                      <div className="wa-sd__track">
                        <div className="wa-sd__fill" style={{ width:`${width}%`, background:band.color, boxShadow:`0 0 8px ${band.color}50`, animationDelay:`${0.1+i*0.1}s` }} />
                      </div>
                      <span className="wa-sd__count" style={{color:band.color}}>{count}</span>
                      <span className="wa-sd__pct">{width}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="wa-score-trio">
                {[
                  { label:"Highest", val:m.highScore, color:"#34d399" },
                  { label:"Average", val:m.avgScore,  color:m.avgScore!=null?`hsl(${m.avgScore*1.2},70%,55%)`:"var(--wa-t3)" },
                  { label:"Lowest",  val:m.lowScore,  color:"#f87171" },
                ].map(({label,val,color})=>(
                  <div key={label} className="wa-score-trio__item">
                    <span className="wa-score-trio__val" style={{color}}>{val ?? "—"}</span>
                    <span className="wa-score-trio__label">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="wa-card">
              <h3 className="wa-card__t">Score Gauge</h3>
              <p className="wa-card__sub">Average AI cleanliness score</p>
              <div className="wa-gauge-center">
                <Gauge value={m.avgScore ?? 0} color={m.avgScore!=null?`hsl(${(m.avgScore/100)*120},65%,50%)`:"#5d785d"} size={140}/>
                <div className="wa-gauge-label">
                  <span className="wa-gauge-label__val" style={{color:m.avgScore!=null?`hsl(${(m.avgScore/100)*120},65%,55%)`:"var(--wa-t3)"}}>
                    {m.avgScore ?? "N/A"}
                  </span>
                  <span className="wa-gauge-label__sub">/ 100 avg</span>
                </div>
              </div>
              <div className="wa-score-insight">
                <p className="wa-score-insight__text">
                  {m.avgScore == null ? "No AI scores yet." :
                   m.avgScore >= 75 ? "🏆 Exceptional cleanliness standards maintained consistently." :
                   m.avgScore >= 55 ? "✅ Good scores — room to push toward elite tier." :
                   "⚠ Scores indicate cleanliness focus needed on resolutions."}
                </p>
              </div>
            </div>
          </div>

          {/* ══════════ SECTION 3: CATEGORY INTELLIGENCE ══════════ */}
          <SectionHead icon="🗂" title="Category Intelligence" sub="Performance breakdown across complaint categories" idx={2}/>
          <div className="wa-card wa-card--full">
            <div className="wa-cat-table-wrap">
              <table className="wa-cat-table">
                <thead>
                  <tr>
                    <th>Category</th><th>Total</th><th>Closed</th><th>Closure Rate</th>
                    <th>Avg AI Score</th><th>Avg Resolution</th><th>Volume Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {catEntries.map(({cat,cfg,total,closed,rate,avgScore,avgRes})=>{
                    const maxTotal = Math.max(...catEntries.map(e=>e.total),1);
                    return (
                      <tr key={cat} className="wa-cat-table__row">
                        <td>
                          <div className="wa-cat-table__cat">
                            <span className="wa-cat-table__icon" style={{color:cfg.color}}>{cfg.icon}</span>
                            <span className="wa-cat-table__name" style={{color:cfg.color}}>{cfg.label}</span>
                          </div>
                        </td>
                        <td className="wa-cat-table__num">{total}</td>
                        <td className="wa-cat-table__num">{closed}</td>
                        <td>
                          <div className="wa-cat-table__rate-wrap">
                            <div className="wa-cat-table__rate-bar" style={{width:`${rate}%`, background:cfg.color, boxShadow:`0 0 6px ${cfg.color}50`}}/>
                            <span className="wa-cat-table__rate-txt" style={{color:cfg.color}}>{rate}%</span>
                          </div>
                        </td>
                        <td>
                          {avgScore!=null
                            ? <span style={{color:`hsl(${avgScore*1.2},65%,55%)`, fontFamily:"var(--wa-ff-display)", fontWeight:900}}>{avgScore}</span>
                            : <span style={{color:"var(--wa-t4)"}}>—</span>}
                        </td>
                        <td className="wa-cat-table__num" style={{color:"var(--wa-t2)"}}>{durStr(avgRes)}</td>
                        <td>
                          <div className="wa-cat-table__vol-bar" style={{width:`${pct(total,maxTotal)}%`, background:`${cfg.color}50`, borderColor:cfg.color}}/>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══════════ SECTION 4: TEMPORAL PATTERNS ══════════ */}
          <SectionHead icon="📅" title="Temporal Patterns" sub="When complaints arrive and how workload fluctuates" idx={3}/>
          <div className="wa-grid-2">
            <div className="wa-card">
              <h3 className="wa-card__t">Monthly Trend</h3>
              <p className="wa-card__sub">Submitted vs closed over last 6 months</p>
              <div className="wa-dual-legend">
                <span className="wa-dual-legend__a">■ Submitted</span>
                <span className="wa-dual-legend__b">■ Closed</span>
              </div>
              <DualBar data={m.months.map(mo=>({ label:mo.label, a:mo.submitted, b:mo.closed }))} />
            </div>

            <div className="wa-card">
              <h3 className="wa-card__t">Weekly Load Pattern</h3>
              <p className="wa-card__sub">Complaint volume by day of week</p>
              <BarChart
                data={weekdayData}
                color={(d)=>{
                  const m2 = Math.max(...weekdayData.map(x=>x.value),1);
                  const p = d.value/m2;
                  return `rgba(200,152,42,${0.25+p*0.75})`;
                }}
                height={110}
              />
            </div>
          </div>

          <div className="wa-card wa-card--full">
            <h3 className="wa-card__t">24-Hour Activity Heatmap</h3>
            <p className="wa-card__sub">Complaint volume by hour of day — brighter = more activity</p>
            <div className="wa-heat">
              <div className="wa-heat__hour-labels">
                {Array.from({length:24},(_,i)=>(
                  <span key={i} className="wa-heat__hlbl">{i%3===0?`${i}h`:""}</span>
                ))}
              </div>
              <HeatRow label="Complaints" values={m.hours} max={Math.max(...m.hours,1)}/>
            </div>
            <div className="wa-heat__peak">
              Peak hour: <strong>{m.hours.reduce((bi,v,i)=>v>m.hours[bi]?i:bi,0)}:00</strong> · {Math.max(...m.hours)} complaints
            </div>
          </div>

          {/* ══════════ SECTION 5: SPEED ANALYSIS ══════════ */}
          <SectionHead icon="⚡" title="Speed Analysis" sub="Resolution velocity and performance percentiles" idx={4}/>
          <div className="wa-grid-3">
            <div className="wa-card">
              <h3 className="wa-card__t">Resolution Speed</h3>
              <p className="wa-card__sub">Avg vs target (4 hours)</p>
              <div className="wa-gauge-center">
                <Gauge
                  value={m.avgResMin!=null ? Math.round(clamp(100 - ((m.avgResMin-240)/2640)*100,0,100)) : 0}
                  color={m.avgResMin!=null && m.avgResMin<=240?"#34d399":m.avgResMin!=null&&m.avgResMin<=720?"#fbbf24":"#f87171"}
                  size={140}
                />
                <div className="wa-gauge-label">
                  <span className="wa-gauge-label__val" style={{color:m.avgResMin!=null&&m.avgResMin<=240?"#34d399":m.avgResMin!=null&&m.avgResMin<=720?"#fbbf24":"#f87171"}}>
                    {durStr(m.avgResMin)}
                  </span>
                  <span className="wa-gauge-label__sub">average</span>
                </div>
              </div>
              <div className="wa-speed-targets">
                {[
                  { label:"Target",  val:"≤ 4h",  color:"#34d399" },
                  { label:"Warning", val:"4–12h",  color:"#fbbf24" },
                  { label:"Breach",  val:"> 48h",  color:"#f87171" },
                ].map(({label,val,color})=>(
                  <div key={label} className="wa-speed-target">
                    <span style={{color}} className="wa-speed-target__dot">●</span>
                    <span className="wa-speed-target__l">{label}</span>
                    <span className="wa-speed-target__v" style={{color}}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="wa-card">
              <h3 className="wa-card__t">Resolution Breakdown</h3>
              <p className="wa-card__sub">Fast / medium / slow task distribution</p>
              {(() => {
                const fast   = m.resolved.filter(c=>{const f=c.assignedAt;return f&&c.resolvedAt&&(new Date(c.resolvedAt)-new Date(f))/60000<=240}).length;
                const medium = m.resolved.filter(c=>{const f=c.assignedAt;const d=f&&c.resolvedAt?(new Date(c.resolvedAt)-new Date(f))/60000:null;return d&&d>240&&d<=720}).length;
                const slow   = m.resolved.filter(c=>{const f=c.assignedAt;return f&&c.resolvedAt&&(new Date(c.resolvedAt)-new Date(f))/60000>720}).length;
                const tot    = fast+medium+slow||1;
                return (
                  <div className="wa-res-bands">
                    {[
                      {l:"⚡ Fast (≤4h)",    v:fast,   c:"#34d399"},
                      {l:"🕐 Medium (4-12h)", v:medium, c:"#fbbf24"},
                      {l:"🐢 Slow (>12h)",   v:slow,   c:"#f87171"},
                    ].map(({l,v,c})=>(
                      <div key={l} className="wa-res-band">
                        <div className="wa-res-band__top">
                          <span className="wa-res-band__label">{l}</span>
                          <span className="wa-res-band__val" style={{color:c}}>{v}</span>
                        </div>
                        <div className="wa-res-band__track">
                          <div className="wa-res-band__fill" style={{width:`${pct(v,tot)}%`, background:c, boxShadow:`0 0 8px ${c}50`}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="wa-card">
              <h3 className="wa-card__t">SLA Compliance</h3>
              <p className="wa-card__sub">Tasks resolved within 48h threshold</p>
              <div className="wa-ring-center">
                {(() => {
                  const compliant = m.resolved.length - m.slaBreaches;
                  const slaSegs = [
                    { value:compliant,     color:"#34d399", label:"On-time"  },
                    { value:m.slaBreaches, color:"#f87171", label:"Breached" },
                  ].filter(s=>s.value>0);
                  const slaRate = pct(compliant, m.resolved.length||1);
                  return (
                    <>
                      <RingChart segments={slaSegs} size={140} strokeWidth={16} label={`${slaRate}%`} sublabel="on-time"/>
                      <div className="wa-legend" style={{marginTop:12}}>
                        {slaSegs.map(s=>(
                          <div key={s.label} className="wa-legend__item">
                            <span className="wa-legend__dot" style={{background:s.color}}/>
                            <span className="wa-legend__name">{s.label}</span>
                            <span className="wa-legend__val">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ══════════ SECTION 6: PERFORMANCE RADAR ══════════ */}
          <SectionHead icon="🌐" title="Performance Dimensions" sub="Multi-axis capability assessment" idx={5}/>
          <div className="wa-grid-2">
            <div className="wa-card">
              <h3 className="wa-card__t">Performance Radar</h3>
              <p className="wa-card__sub">6-dimensional capability profile</p>
              {(() => {
                const dims = [
                  { label:"Closure",     val: m.closureRate },
                  { label:"AI Score",    val: m.avgScore ?? 0 },
                  { label:"Speed",       val: m.avgResMin!=null?clamp(100-(m.avgResMin/2880)*100,0,100):0 },
                  { label:"Volume",      val: Math.min(100, m.total * 2) },
                  { label:"SLA",         val: m.resolved.length?pct(m.resolved.length-m.slaBreaches,m.resolved.length):100 },
                  { label:"Verify Rate", val: m.verifyRate },
                ];
                const N = dims.length;
                const cx = 120, cy = 120, R = 88;
                const pts = dims.map((d,i) => {
                  const angle = (2*Math.PI*i/N) - Math.PI/2;
                  const r = (d.val/100)*R;
                  return { x: cx+r*Math.cos(angle), y: cy+r*Math.sin(angle) };
                });
                const polygon = pts.map(p=>`${p.x},${p.y}`).join(" ");
                const gridPolygons = [0.25,0.5,0.75,1].map(scale=>(
                  dims.map((_,i)=>{
                    const angle = (2*Math.PI*i/N) - Math.PI/2;
                    return `${cx+scale*R*Math.cos(angle)},${cy+scale*R*Math.sin(angle)}`;
                  }).join(" ")
                ));
                const axes = dims.map((_,i)=>{
                  const angle = (2*Math.PI*i/N) - Math.PI/2;
                  return { x: cx+R*Math.cos(angle), y: cy+R*Math.sin(angle) };
                });
                const labelPts = dims.map((d,i)=>{
                  const angle = (2*Math.PI*i/N) - Math.PI/2;
                  return { ...d, x: cx+(R+20)*Math.cos(angle), y: cy+(R+20)*Math.sin(angle) };
                });
                return (
                  <div className="wa-radar-wrap">
                    <svg width={240} height={240} className="wa-radar">
                      {gridPolygons.map((pg,i)=>(
                        <polygon key={i} points={pg} fill="none" stroke="rgba(140,110,60,0.14)" strokeWidth={1}/>
                      ))}
                      {axes.map((a,i)=>(
                        <line key={i} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke="rgba(140,110,60,0.12)" strokeWidth={1}/>
                      ))}
                      <polygon points={polygon} fill="rgba(200,152,42,0.14)" stroke="#c8982a" strokeWidth={2}
                        style={{filter:"drop-shadow(0 0 8px rgba(200,152,42,0.30))"}}/>
                      {pts.map((p,i)=>(
                        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#c8982a"
                          style={{filter:"drop-shadow(0 0 4px #c8982a)"}}/>
                      ))}
                      {labelPts.map((p,i)=>(
                        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                          fontSize={9} fill="rgba(195,180,145,0.70)" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="0.08em">
                          {p.label}
                        </text>
                      ))}
                    </svg>
                    <div className="wa-radar-dims">
                      {dims.map(d=>(
                        <div key={d.label} className="wa-radar-dim">
                          <div className="wa-radar-dim__track">
                            <div className="wa-radar-dim__fill" style={{width:`${d.val}%`}}/>
                          </div>
                          <span className="wa-radar-dim__val">{Math.round(d.val)}%</span>
                          <span className="wa-radar-dim__lbl">{d.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="wa-card">
              <h3 className="wa-card__t">Performance Rating Breakdown</h3>
              <p className="wa-card__sub">How your score of {m.rating}/100 is calculated</p>
              <div className="wa-rating-breakdown">
                {[
                  { l:"Closure Rate",   weight:25, val:Math.round((m.closureRate/100)*25),   color:"#c8982a", raw:`${m.closureRate}%`   },
                  { l:"Verify Rate",    weight:20, val:Math.round((m.verifyRate/100)*20),    color:"#a78bfa", raw:`${m.verifyRate}%`   },
                  { l:"AI Score",       weight:25, val:m.avgScore!=null?Math.round((m.avgScore/100)*25):0, color:"#52b874", raw:m.avgScore!=null?`${m.avgScore}/100`:"N/A" },
                  { l:"Speed Score",    weight:20, val:Math.round(clamp(1-(((m.avgResMin||99999)-240)/(2640)),0,1)*20), color:"#fbbf24", raw:durStr(m.avgResMin) },
                  { l:"SLA Compliance", weight:10, val:Math.round((m.resolved.length?pct(m.resolved.length-m.slaBreaches,m.resolved.length):100)/100*10), color:"#34d399", raw:`${m.slaBreaches} breach${m.slaBreaches!==1?"es":""}` },
                ].map(({l,weight,val,color,raw})=>(
                  <div key={l} className="wa-rb__row">
                    <div className="wa-rb__head">
                      <span className="wa-rb__label">{l}</span>
                      <span className="wa-rb__raw">{raw}</span>
                      <span className="wa-rb__pts" style={{color}}>{val}/{weight} pts</span>
                    </div>
                    <div className="wa-rb__track">
                      <div className="wa-rb__fill" style={{width:`${(val/weight)*100}%`, background:color, boxShadow:`0 0 8px ${color}50`}}/>
                    </div>
                  </div>
                ))}
                <div className="wa-rb__total">
                  <span>Total Score</span>
                  <span style={{color:m.ratingColor, fontFamily:"var(--wa-ff-display)", fontSize:28}}>{m.rating}/100</span>
                  <span style={{color:m.ratingColor, fontFamily:"var(--wa-ff-title)", fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase"}}>{m.ratingLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════ SECTION 7: CATEGORY SCORE HEATMAP ══════════ */}
          <SectionHead icon="🔥" title="Category Score Heatmap" sub="AI cleanliness performance per category" idx={6}/>
          <div className="wa-card wa-card--full">
            <div className="wa-cat-heat-grid">
              {catEntries.map(({cat,cfg,avgScore,total,rate})=>(
                <div key={cat} className="wa-cat-heat-cell"
                  style={{
                    background:avgScore!=null?`rgba(${avgScore>=70?"52,211,153":avgScore>=40?"251,191,36":"248,113,113"},${0.06+((avgScore??0)/100)*0.18})`:"rgba(93,120,93,0.06)",
                    borderColor:avgScore!=null?`rgba(${avgScore>=70?"52,211,153":avgScore>=40?"251,191,36":"248,113,113"},0.28)`:"var(--wa-border)",
                  }}>
                  <span className="wa-cat-heat-cell__icon" style={{color:cfg.color}}>{cfg.icon}</span>
                  <span className="wa-cat-heat-cell__name">{cfg.label}</span>
                  <span className="wa-cat-heat-cell__score" style={{color:avgScore!=null?`hsl(${avgScore*1.2},65%,55%)`:"var(--wa-t4)"}}>
                    {avgScore!=null?avgScore:"—"}
                  </span>
                  <span className="wa-cat-heat-cell__sub">AI Score</span>
                  <div className="wa-cat-heat-cell__bar-track">
                    <div className="wa-cat-heat-cell__bar-fill" style={{width:`${rate}%`, background:cfg.color}}/>
                  </div>
                  <span className="wa-cat-heat-cell__rate" style={{color:cfg.color}}>{rate}% closed</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════ SECTION 8: ACTIVITY TIMELINE ══════════ */}
          <SectionHead icon="📆" title="Activity Timeline" sub="Closed campaigns plotted over time" idx={7}/>
          <div className="wa-card wa-card--full">
            <h3 className="wa-card__t">Closure Timeline</h3>
            <p className="wa-card__sub">Each column = one month · gold = closed · violet = submitted</p>
            <DualBar data={m.months.map(mo=>({ label:`${mo.label}'${String(mo.year).slice(2)}`, a:mo.submitted, b:mo.closed }))} />
            <div className="wa-dual-legend" style={{marginTop:14}}>
              <span className="wa-dual-legend__a">■ Submitted</span>
              <span className="wa-dual-legend__b">■ Closed</span>
            </div>
          </div>

          {/* ══════════ BOTTOM NAV ══════════ */}
          {/* ✅ fixed: removed /${workerId} from all bottom nav buttons */}
          <div className="wa-bottom-nav">
            <button className="wa-btn wa-btn--gold"  onClick={()=>navigate(`/worker/dashboard`)}>🏰 Dashboard</button>
            <button className="wa-btn wa-btn--red"   onClick={()=>navigate(`/worker/tasks`)}>⚔ All Tasks</button>
            <button className="wa-btn wa-btn--ghost" onClick={()=>navigate(`/worker/activity`)}>🕒 Activity Log</button>
            <button className="wa-btn wa-btn--ghost" onClick={()=>navigate(`/worker/tasks?status=ASSIGNED`)}>📋 Assigned Tasks</button>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}