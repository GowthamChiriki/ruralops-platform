import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../Styles/ActivationRequest.css";

/* ─────────────────────────────────────────
   ACCOUNT TYPE CONFIG
───────────────────────────────────────── */
const ACCOUNT_TYPES = {
  RLOC: { label: "Citizen",               badge: "ar-type-badge--citizen", icon: "📜" },
  RLOW: { label: "Field Worker",          badge: "ar-type-badge--worker",  icon: "⚒️" },
  RLOV: { label: "Village Admin Officer", badge: "ar-type-badge--vao",     icon: "🏰" },
  RLOM: { label: "Mandal Admin Officer",  badge: "ar-type-badge--mao",     icon: "⚜️" },
};
const detectType  = (id) => ACCOUNT_TYPES[id.substring(0, 4).toUpperCase()] ?? null;
const toBackendType = (id) => ({ RLOC:"CITIZEN", RLOW:"WORKER", RLOV:"VAO", RLOM:"MAO" }[id.substring(0,4).toUpperCase()] ?? null);

/* ─────────────────────────────────────────
   TOAST SYSTEM
───────────────────────────────────────── */
let _tid = 0;

function ToastItem({ t, onDone }) {
  const [leaving, setLeaving] = useState(false);
  const [width,   setWidth]   = useState(100);
  const raf   = useRef(null);
  const start = useRef(Date.now());
  const dur   = t.duration ?? 5000;

  const dismiss = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setLeaving(true);
    setTimeout(() => onDone(t.id), 420);
  }, [t.id, onDone]);

  useEffect(() => {
    const tick = () => {
      const pct = Math.max(0, 100 - ((Date.now() - start.current) / dur) * 100);
      setWidth(pct);
      if (pct <= 0) { dismiss(); return; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [dismiss, dur]);

  return (
    <div className={`ar-toast ar-toast--${t.type}${leaving ? " leaving" : ""}`}>
      <div className="ar-toast-topline" />
      <div className="ar-toast-shine" />
      <div className="ar-toast-icon-wrap">{t.icon}</div>
      <div className="ar-toast-content">
        <span className="ar-toast-title">{t.title}</span>
        <span className="ar-toast-msg">{t.msg}</span>
      </div>
      <button className="ar-toast-close" onClick={dismiss} tabIndex={-1}>✕</button>
      <div className="ar-toast-progress" style={{ width: `${width}%` }} />
    </div>
  );
}

function ToastPortal({ toasts, remove }) {
  return (
    <div className="ar-toast-portal">
      {toasts.map(t => <ToastItem key={t.id} t={t} onDone={remove} />)}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push    = useCallback((type, title, msg, icon, dur) =>
    setToasts(p => [...p, { id: ++_tid, type, title, msg, icon, duration: dur }]), []);
  const remove  = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  const success = (title, msg, icon = "✉️", dur)       => push("success", title, msg, icon, dur);
  const error   = (title, msg, icon = "🛡️", dur)       => push("error",   title, msg, icon, dur);
  const warning = (title, msg, icon = "⚠️", dur = 6000) => push("warning", title, msg, icon, dur);
  return { toasts, remove, success, error, warning };
}

/* ─────────────────────────────────────────
   SVG GRADIENT DEFS
───────────────────────────────────────── */
const SvgDefs = () => (
  <svg width="0" height="0" style={{ position:"absolute", pointerEvents:"none" }}>
    <defs>
      <linearGradient id="arGold"  x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#f5d76e" stopOpacity="0.48" />
        <stop offset="100%" stopColor="#8b6914" stopOpacity="0.02" />
      </linearGradient>
      <linearGradient id="arGreen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#52b874" stopOpacity="0.48" />
        <stop offset="100%" stopColor="#246644" stopOpacity="0.02" />
      </linearGradient>
      <linearGradient id="arRed"   x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#f87171" stopOpacity="0.48" />
        <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.02" />
      </linearGradient>
    </defs>
  </svg>
);

/* ═══════════════════════════════════════════
   CHART COMPONENTS
═══════════════════════════════════════════ */

/* 1. RADIAL GAUGE — Daily quota remaining */
const QuotaGauge = ({ used, total }) => {
  const remaining = total - used;
  const pct       = remaining / total;
  const R = 22, C = 28, circ = 2 * Math.PI * R;
  const dash = pct * circ;
  const color = pct > 0.4 ? "var(--ar-gold)" : pct > 0.2 ? "#fbbf24" : "#f87171";
  const cls   = pct > 0.4 ? "ar-gauge-fill--gold" : pct > 0.2 ? "ar-gauge-fill--orange" : "ar-gauge-fill--red";
  return (
    <div className="ar-chart-area">
      <div className="ar-gauge-wrap">
        <svg className="ar-gauge-svg" width="56" height="56" viewBox="0 0 56 56">
          <circle className="ar-gauge-track" cx={C} cy={C} r={R} />
          <circle className={`ar-gauge-fill ${cls}`} cx={C} cy={C} r={R}
            strokeDasharray={`${dash.toFixed(1)} ${(circ - dash).toFixed(1)}`}
            strokeDashoffset={circ * 0.25}
          />
          <text className="ar-gauge-center" x={C} y={C - 2} fill={color} fontSize="10">{remaining}</text>
          <text className="ar-gauge-sub"    x={C} y={C + 8} fill="var(--ar-text-faint)" fontSize="5">LEFT</text>
        </svg>
        <div className="ar-gauge-legend">
          <div className="ar-gauge-leg-item">
            <div className="ar-gauge-leg-dot" style={{ background:"var(--ar-gold)" }} />
            <span className="ar-gauge-leg-lbl">Limit</span>
            <span className="ar-gauge-leg-val">{total}</span>
          </div>
          <div className="ar-gauge-leg-item">
            <div className="ar-gauge-leg-dot" style={{ background:color }} />
            <span className="ar-gauge-leg-lbl">Left</span>
            <span className="ar-gauge-leg-val" style={{ color }}>{remaining}</span>
          </div>
          <div className="ar-gauge-leg-item">
            <div className="ar-gauge-leg-dot" style={{ background:"#f87171" }} />
            <span className="ar-gauge-leg-lbl">Used</span>
            <span className="ar-gauge-leg-val ar-stat-row-val--red">{used}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* 2. SVG SMOOTH AREA — Avg response time (ms) */
const ResponseTimeChart = ({ data }) => {
  const W = 180, H = 38, PAD = 3;
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [
    PAD + (i / (data.length - 1)) * (W - PAD * 2),
    H - PAD - ((v - min) / rng) * (H - PAD * 2),
  ]);
  const smooth = pts.map((p, i) => {
    if (i === 0) return `M${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx  = (prev[0] + p[0]) / 2;
    return `C${cpx.toFixed(1)},${prev[1].toFixed(1)} ${cpx.toFixed(1)},${p[1].toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  }).join(" ");
  const area = `${smooth} L${pts.at(-1)[0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  const last = pts.at(-1);
  const gridYs = [H * 0.3, H * 0.65];
  return (
    <div className="ar-chart-area">
      <svg className="ar-area-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" height="38">
        {gridYs.map((y, i) => <line key={i} className="ar-area-grid" x1={PAD} y1={y.toFixed(1)} x2={W-PAD} y2={y.toFixed(1)} />)}
        <path className="ar-area-fill" d={area} fill="url(#arGreen)" />
        <path className="ar-area-line ar-area-line--green" d={smooth} />
        <circle className="ar-area-dot ar-area-dot--green" cx={last[0]} cy={last[1]} r="3" />
      </svg>
    </div>
  );
};

/* 3. SEGMENTED TIMELINE — Requests per hour (24h) */
const HourlyTimeline = ({ hourlyData }) => {
  const max = Math.max(...hourlyData, 1);
  const getClass = (v) => {
    const r = v / max;
    return r > 0.65 ? "ar-tbar--peak" : r > 0.30 ? "ar-tbar--mid" : "ar-tbar--low";
  };
  return (
    <div className="ar-chart-area">
      <div className="ar-timeline">
        {hourlyData.map((v, i) => (
          <div key={i} className={`ar-tbar ${getClass(v)}`}
            style={{ height:`${Math.max(4,(v/max)*100)}%`, animationDelay:`${i*25}ms` }}
            title={`${i}:00 — ${v} requests`}
          />
        ))}
      </div>
    </div>
  );
};

/* 4. KEY TYPE BREAKDOWN — horizontal bars */
const KeyTypeChart = ({ counts }) => {
  const total = counts.citizen + counts.worker + counts.vao + counts.mao || 1;
  const rows = [
    { icon:"📜", lbl:"Citizen", pct:(counts.citizen/total)*100, cls:"citizen", val:counts.citizen, delay:700 },
    { icon:"⚒️", lbl:"Worker",  pct:(counts.worker /total)*100, cls:"worker",  val:counts.worker,  delay:820 },
    { icon:"🏰", lbl:"VAO",     pct:(counts.vao    /total)*100, cls:"vao",     val:counts.vao,     delay:940 },
    { icon:"⚜️", lbl:"MAO",     pct:(counts.mao    /total)*100, cls:"mao",     val:counts.mao,     delay:1060},
  ];
  return (
    <div className="ar-chart-area">
      <div className="ar-keytype-rows">
        {rows.map((r, i) => (
          <div className="ar-kt-row" key={i}>
            <span className="ar-kt-icon">{r.icon}</span>
            <div className="ar-kt-track">
              <div className={`ar-kt-fill ar-kt-fill--${r.cls}`}
                style={{ width:`${Math.max(r.pct, 4)}%`, animationDelay:`${r.delay}ms` }} />
            </div>
            <span className="ar-kt-val">{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   STATIC / INITIAL DATA
───────────────────────────────────────── */
const DAILY_QUOTA_MAX = 3; // small so user can easily trigger the live update

const INITIAL_HOURLY = [
  0,0,0,1,0,2,4,8,14,18,22,19,16,21,24,20,18,15,12,9,7,4,2,1
];

const INITIAL_RESP_TIME = [210,195,230,180,165,190,155,170,145,160];

const INITIAL_KEY_COUNTS = { citizen:142, worker:89, vao:34, mao:18 };

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function ActivationKeyRequestPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const toast          = useToast();

  const [accountId,   setAccountId]   = useState(searchParams.get("accountId") || "");
  const [loading,     setLoading]     = useState(false);
  const [touched,     setTouched]     = useState(false);
  const [sent,        setSent]        = useState(false);

  // Live stats
  const [usedToday,   setUsedToday]   = useState(0);
  const [hourlyData,  setHourlyData]  = useState(INITIAL_HOURLY);
  const [respTimes,   setRespTimes]   = useState(INITIAL_RESP_TIME);
  const [keyCounts,   setKeyCounts]   = useState(INITIAL_KEY_COUNTS);
  const [avgResp,     setAvgResp]     = useState(178);
  const [totalSent,   setTotalSent]   = useState(283);

  const detectedType  = accountId.length >= 4 ? detectType(accountId) : null;
  const quotaLeft     = DAILY_QUOTA_MAX - usedToday;
  const quotaExhausted = quotaLeft <= 0;

  /* ── validation ── */
  const idErr = !accountId.trim()             ? "Account ID is required"
              : !toBackendType(accountId)     ? "Prefix must be RLOC · RLOW · RLOV · RLOM"
              : null;

  const fc = () => !touched ? "" : idErr ? "f-error" : "f-ok";

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (idErr)         { toast.error("Invalid Account ID", idErr, "🔰"); return; }
    if (quotaExhausted){ toast.error("Daily Quota Exhausted", "You have reached the 3-request daily limit. Return tomorrow to request again.", "🚫", 7000); return; }

    setLoading(true);
    try {
      const res  = await fetch("https://ruralops-platform-production.up.railway.app/activation/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountType: toBackendType(accountId), accountId }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);

      /* ── update live stats ── */
      const newUsed = usedToday + 1;
      setUsedToday(newUsed);
      setTotalSent(p => p + 1);
      setSent(true);

      // Update hourly bar for current hour
      const hr = new Date().getHours();
      setHourlyData(prev => {
        const next = [...prev];
        next[hr] = (next[hr] || 0) + 1;
        return next;
      });

      // Simulate response time fluctuation
      const newResp = 130 + Math.floor(Math.random() * 90);
      setRespTimes(prev => {
        const next = [...prev.slice(1), newResp];
        setAvgResp(Math.round(next.reduce((a,b) => a+b,0) / next.length));
        return next;
      });

      // Update key type count
      if (detectedType) {
        const roleKey = { "📜":"citizen","⚒️":"worker","🏰":"vao","⚜️":"mao" }[detectedType.icon] || "citizen";
        setKeyCounts(prev => ({ ...prev, [roleKey]: prev[roleKey] + 1 }));
      }

      const remaining = DAILY_QUOTA_MAX - newUsed;

      if (remaining === 0) {
        toast.warning(
          "Last Key Dispatched",
          `Activation key sent to your registered contact. ⚠ Daily limit reached — no more requests today.`,
          "⚠️", 8000
        );
      } else if (remaining <= 2) {
        toast.success(
          "Key Dispatched!",
          `Activation key sent successfully. Only ${remaining} request${remaining > 1 ? "s" : ""} remaining today.`,
          "✉️"
        );
        // Also fire a warning toast after a short delay
        setTimeout(() => {
          toast.warning(
            `${remaining} Request${remaining > 1 ? "s" : ""} Left Today`,
            `You are approaching your daily limit of ${DAILY_QUOTA_MAX} activation key requests. Use them wisely.`,
            "🕯️"
          );
        }, 600);
      } else {
        toast.success(
          "Key Dispatched to the Realm",
          `Activation key sent to your registered contact. ${remaining} request${remaining > 1 ? "s" : ""} remaining today.`,
          "✉️"
        );
      }

    } catch (err) {
      toast.error("Dispatch Failed", err.message || "The ravens could not carry your message. Try again.", "🛡️");
    }
    setLoading(false);
  };

  return (
    <>
      <SvgDefs />
      <ToastPortal toasts={toast.toasts} remove={toast.remove} />
      <Navbar />

      <div className="ar-page">
        <div className="ar-main">

          {/* ══ LEFT PANEL ══ */}
          <div className="ar-left">

            <div className="ar-left-header">
              <div className="ar-eyebrow">⚔ RuralOps Key Dispatch Chamber</div>
              <h1>Summon Your<br /><span>Activation Key</span></h1>
              <p>
                Keys are forged by the council when your account is created.
                If yours expired or was never received, invoke a fresh dispatch
                to your registered contact below.
              </p>
            </div>

            {/* Steps */}
            <div className="ar-steps">
              {[
                { n:"1", text:"Enter your Account ID in the form" },
                { n:"2", text:"The realm dispatches a key to your contact" },
                { n:"3", text:"Use the key on the Activate Account page" },
                { n:"4", text:"Gain access to your sovereign dashboard" },
              ].map((s,i) => (
                <div className="ar-step" key={i}>
                  <span className="ar-step-num">{s.n}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>

            {/* Prefix guide */}
            <div className="ar-prefix-guide">
              <div className="ar-prefix-title">Account ID Prefixes</div>
              <div className="ar-prefix-grid">
                <span className="ar-prefix-badge ar-prefix-badge--citizen">📜 RLOC — Citizen</span>
                <span className="ar-prefix-badge ar-prefix-badge--worker">⚒️ RLOW — Field Worker</span>
                <span className="ar-prefix-badge ar-prefix-badge--vao">🏰 RLOV — VAO Officer</span>
                <span className="ar-prefix-badge ar-prefix-badge--mao">⚜️ RLOM — Mandal Officer</span>
              </div>
            </div>

            {/* ── LIVE STAT CARDS ── */}
            <div className="ar-stat-grid">

              {/* Card 1 — Radial quota gauge (LIVE) */}
              <div className={`ar-stat-card${quotaLeft <= 2 && usedToday > 0 ? " ar-stat-card--warning" : ""}`}>
                <div className="ar-stat-eyebrow">Daily Quota</div>
                <div className={`ar-stat-value${quotaLeft <= 1 && usedToday > 0 ? " ar-stat-value--red ar-stat-value--blink" : quotaLeft <= 2 ? " ar-stat-value--red" : ""}`}>
                  {quotaLeft}/{DAILY_QUOTA_MAX}
                </div>
                <div className="ar-stat-label">Requests Remaining</div>
                <QuotaGauge used={usedToday} total={DAILY_QUOTA_MAX} />
                <div className="ar-stat-row">
                  <span className="ar-stat-row-label">Used Today</span>
                  <span className={`ar-stat-row-val${usedToday > 0 ? " ar-stat-row-val--orange" : ""}`}>{usedToday}</span>
                </div>
              </div>

              {/* Card 2 — Avg response time (smooth line) */}
              <div className="ar-stat-card">
                <div className="ar-stat-eyebrow">Avg Response</div>
                <div className="ar-stat-value ar-stat-value--green">{avgResp}ms</div>
                <div className="ar-stat-label">Key Delivery Time</div>
                <ResponseTimeChart data={respTimes} />
                <div className="ar-stat-row">
                  <span className="ar-stat-row-label">Last Request</span>
                  <span className="ar-stat-row-val ar-stat-row-val--green">{respTimes.at(-1)}ms</span>
                </div>
              </div>

              {/* Card 3 — Hourly timeline bars (LIVE) */}
              <div className="ar-stat-card">
                <div className="ar-stat-eyebrow">Requests Today</div>
                <div className="ar-stat-value">{totalSent}</div>
                <div className="ar-stat-label">Keys Dispatched (24h)</div>
                <HourlyTimeline hourlyData={hourlyData} />
                <div className="ar-stat-row">
                  <span className="ar-stat-row-label">Peak Hour</span>
                  <span className="ar-stat-row-val">{hourlyData.indexOf(Math.max(...hourlyData))}:00</span>
                </div>
              </div>

              {/* Card 4 — Key type breakdown (LIVE) */}
              <div className="ar-stat-card">
                <div className="ar-stat-eyebrow">By Account Type</div>
                <div className="ar-stat-value ar-stat-value--green">{Object.values(keyCounts).reduce((a,b)=>a+b,0)}</div>
                <div className="ar-stat-label">Total Keys This Month</div>
                <KeyTypeChart counts={keyCounts} />
                <div className="ar-stat-row">
                  <span className="ar-stat-row-label">Most Common</span>
                  <span className="ar-stat-row-val">Citizen</span>
                </div>
              </div>

            </div>
          </div>

          {/* ══ RIGHT — FORM CARD ══ */}
          <div className="ar-card">
            <div className="ar-card-header">
              <h2>Request Key</h2>
              {detectedType
                ? <span className={`ar-type-badge ${detectedType.badge}`}>{detectedType.icon} {detectedType.label}</span>
                : <span className="ar-type-badge ar-type-badge--unknown">? Unrecognised</span>}
            </div>

            <p className="ar-card-desc">
              Enter your Account ID and a fresh activation key will be dispatched by raven to your registered contact.
            </p>

            <form onSubmit={handleSubmit} className="ar-form" noValidate>
              <div className="ar-form-section-label">⚜ Account Identity</div>

              <div className="ar-field">
                <label htmlFor="accountId">Account ID</label>
                <input id="accountId" type="text"
                  placeholder="e.g. RLOW-ALKP-9828-2CAB"
                  value={accountId}
                  onChange={e => { setAccountId(e.target.value); setSent(false); }}
                  onBlur={() => setTouched(true)}
                  className={fc()}
                  disabled={quotaExhausted}
                />
                {touched && idErr && <span className="ar-field-err">⚠ {idErr}</span>}
                {!idErr && detectedType && (
                  <span className="ar-field-hint">
                    {detectedType.icon} Recognised as {detectedType.label} account
                  </span>
                )}
              </div>

              {/* Quota warning banner — appears when ≤2 left */}
              {quotaLeft <= 2 && usedToday > 0 && !quotaExhausted && (
                <div className="ar-quota-banner">
                  <span className="ar-quota-banner-icon">⚠️</span>
                  <span>
                    Only <strong>{quotaLeft}</strong> request{quotaLeft !== 1 ? "s" : ""} remaining today.
                    The daily limit resets at midnight.
                  </span>
                </div>
              )}

              {/* Exhausted banner */}
              {quotaExhausted && (
                <div className="ar-quota-banner">
                  <span className="ar-quota-banner-icon">🚫</span>
                  <span>
                    Daily limit of <strong>{DAILY_QUOTA_MAX}</strong> requests reached.
                    Return tomorrow when the realm resets its wards.
                  </span>
                </div>
              )}

              {/* Success inline */}
              {sent && !quotaExhausted && (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 13px", borderRadius:9, background:"rgba(20,83,45,.22)", border:"1px solid rgba(34,197,94,.30)", color:"#4ade80", fontFamily:"var(--ar-f-body)", fontSize:13 }}>
                  <span>✉️</span>
                  <span>Key dispatched. Check your registered email or phone.</span>
                </div>
              )}

              <button
                type="submit"
                className={`ar-submit-btn${quotaExhausted ? " ar-submit-btn--exhausted" : ""}`}
                disabled={loading || quotaExhausted}
              >
                {loading        ? "⚔ Dispatching Key…"
                : quotaExhausted ? "🚫 Daily Limit Reached"
                :                  "✉ Dispatch Activation Key"}
              </button>
            </form>

            <div className="ar-alt">
              <span>Already have a key?</span>
              <button className="ar-alt-link"
                onClick={() => navigate(`/activate-account?accountId=${accountId}`)}>
                Activate Account →
              </button>
            </div>
          </div>

        </div>{/* /ar-main */}

        {/* ── FOOTER ── */}
        <footer className="ar-footer">
          <div className="ar-footer-left">
            <strong>RuralOps Platform</strong>
            <span>Digital Infrastructure for Rural Governance</span>
          </div>
          <div className="ar-footer-center">© 2026 RuralOps — AKSHAY PODENDLA</div>
          <div className="ar-footer-links">
            <a href="#">Privacy</a>
            <a href="#">Security</a>
            <a href="#">Support</a>
          </div>
        </footer>
      </div>
    </>
  );
}