import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ruralopsLogo from "../../assets/ruralops-logo.png";
import "../../Styles/CitizenDashboard.css";

const API = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

/* ════════════════════════════════════════════════════════════
   HOUSE DETECTION
════════════════════════════════════════════════════════════ */
const HOUSE_MAP = {
  stark:     { house: "stark",     sigil: "🐺", houseLabel: "House Stark" },
  snow:      { house: "snow",      sigil: "❄️", houseLabel: "House Snow" },
  lannister: { house: "lannister", sigil: "🦁", houseLabel: "House Lannister" },
  targaryen: { house: "targaryen", sigil: "🐉", houseLabel: "House Targaryen" },
  baratheon: { house: "default",   sigil: "🦌", houseLabel: "House Baratheon" },
  tyrell:    { house: "default",   sigil: "🌹", houseLabel: "House Tyrell" },
  mormont:   { house: "stark",     sigil: "🐻", houseLabel: "House Mormont" },
};
const HOUSE_MOTTOS = {
  stark:     ["Winter is Coming.", "The North Remembers.", "The lone wolf dies — the pack survives."],
  snow:      ["Winter is Coming.", "The North Remembers.", "You know nothing — yet you stand here."],
  lannister: ["A Lannister always pays his debts.", "Hear me roar.", "A lion does not concern himself with the opinion of sheep."],
  targaryen: ["Fire and Blood.", "Dracarys.", "Those who would harm you will die screaming."],
  default:   ["Governance, Command, Justice.", "The realm is mine to serve.", "In service lies honour."],
};
function detectHouse(fullName = "") {
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  return HOUSE_MAP[parts[parts.length - 1]] || null;
}
function getRandomMotto(house) {
  const pool = HOUSE_MOTTOS[house] || HOUSE_MOTTOS.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ─── Status config ── */
const STATUS_COLOR = {
  SUBMITTED:           "#60a5fa", AWAITING_ASSIGNMENT: "#f97316",
  ASSIGNED:            "#a78bfa", IN_PROGRESS:         "#fbbf24",
  RESOLVED:            "#34d399", VERIFIED:            "#52b874", CLOSED: "#5d785d",
};
const STATUS_ICON = {
  SUBMITTED: "📜", AWAITING_ASSIGNMENT: "⏳", ASSIGNED: "⚔",
  IN_PROGRESS: "🔨", RESOLVED: "✅", VERIFIED: "🔮", CLOSED: "🏁",
};
const CAT_ICON = {
  GARBAGE: "🗑", DRAINAGE: "🌊", ROAD_DAMAGE: "🛤",
  STREET_LIGHT: "💡", WATER_SUPPLY: "💧", PUBLIC_HEALTH: "⚕", OTHER: "📋",
};

/* ════════════════════════════════════════════════════════════
   AUTH HELPERS
   Shared with CitizenComplaintsPage — move to src/utils/api.js
════════════════════════════════════════════════════════════ */
async function tryRefresh() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem("accessToken",  data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function apiFetch(url, options = {}, navigateFn) {
  const doRequest = (token) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

  // FIX 2: clearAuth removes the canonical keys (accountType / accountId)
  const clearAuth = () => {
    ["accessToken", "refreshToken", "accountId", "accountType", "villageId", "roles"]
      .forEach((k) => localStorage.removeItem(k));
    navigateFn("/login", { replace: true });
  };

  // FIX 3: trim() prevents malformed "Bearer  null" headers
  let token = localStorage.getItem("accessToken")?.trim();
  if (!token) { clearAuth(); return null; }

  let res = await doRequest(token);

  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (!newToken) { clearAuth(); return null; }
    res = await doRequest(newToken);
    if (res.status === 401) { clearAuth(); return null; }
  }

  return res;
}

/* ─── Skeleton ── */
function Sk({ w, h, r = 6, mb = 0 }) {
  return <div className="cd-sk" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />;
}

/* ─── Animated Counter ── */
function Counter({ value }) {
  const [n, setN] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) { setN(0); return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 850, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{n}</>;
}

/* ─── Metric Card ── */
function MetricCard({ icon, label, value, accent, sub, index, onClick }) {
  return (
    <div
      className={`cd-metric cd-metric--${accent}${onClick ? " cd-metric--clickable" : ""}`}
      style={{ animationDelay: `${0.06 + index * 0.06}s` }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div className="cd-metric__top">
        <div className={`cd-metric__icon cd-metric__icon--${accent}`}>{icon}</div>
        {onClick && <span className="cd-metric__link">View →</span>}
      </div>
      <div className="cd-metric__val"><Counter value={value} /></div>
      <div className="cd-metric__label">{label}</div>
      {sub && <div className="cd-metric__sub">{sub}</div>}
    </div>
  );
}

/* ─── Profile Modal ── */
function ProfileModal({ dashboard, citizenId, onClose, onNavigate }) {
  const [phase, setPhase] = useState("view");
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const {
    citizenName, villageName, profilePhoto, profileCompleted,
    dateOfBirth, totalComplaints, pendingComplaints, resolvedComplaints,
  } = dashboard;

  const dob = (() => {
    if (!dateOfBirth) return "Not provided";
    const d = new Date(dateOfBirth);
    return isNaN(d.getTime())
      ? String(dateOfBirth)
      : d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  })();

  return (
    <div className="cdm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cdm-modal">
        <button className="cdm-close" onClick={onClose} aria-label="Close">✕</button>

        {phase === "view" ? (
          <>
            <div className="cdm-header">
              <div className="cdm-avatar-wrap">
                <img
                  src={profilePhoto || "/default-avatar.png"} alt={citizenName} className="cdm-avatar"
                  onLoad={e => e.currentTarget.classList.add("loaded")}
                  onError={e => { e.currentTarget.src = "/default-avatar.png"; e.currentTarget.classList.add("loaded"); }}
                />
                {profileCompleted && <span className="cdm-avatar-verified" title="Verified" />}
              </div>
              <div className="cdm-header-info">
                <h2 className="cdm-name">{citizenName}</h2>
                <p className="cdm-village">⚔ {villageName}</p>
                <span className={`cdm-badge${profileCompleted ? " cdm-badge--ok" : " cdm-badge--pending"}`}>
                  {profileCompleted ? "✓ Verified Citizen" : "⏳ Verification Pending"}
                </span>
              </div>
            </div>

            <div className="cdm-divider" />

            <div className="cdm-fields">
              {[
                ["Citizen ID",     citizenId,   true],
                ["Full Name",      citizenName, false],
                ["Village",        villageName, false],
                ["Date of Birth",  dob,         false],
                ["Account Status", profileCompleted ? "Active & Verified" : "Pending Verification", false],
              ].map(([label, val, mono]) => (
                <div className="cdm-field" key={label}>
                  <span className="cdm-field__label">{label}</span>
                  <span className={`cdm-field__val${mono ? " cdm-field__val--mono" : ""}`}>{val || "—"}</span>
                </div>
              ))}
            </div>

            <div className="cdm-stats">
              <div className="cdm-stat-box">
                <span className="cdm-stat-box__val">{totalComplaints}</span>
                <span className="cdm-stat-box__lbl">Total</span>
              </div>
              <div className="cdm-stat-box cdm-stat-box--amber">
                <span className="cdm-stat-box__val">{pendingComplaints}</span>
                <span className="cdm-stat-box__lbl">Pending</span>
              </div>
              <div className="cdm-stat-box cdm-stat-box--green">
                <span className="cdm-stat-box__val">{resolvedComplaints}</span>
                <span className="cdm-stat-box__lbl">Resolved</span>
              </div>
            </div>

            <div className="cdm-footer">
              <button className="cdm-btn cdm-btn--ghost" onClick={onClose} type="button">Close</button>
              <button className="cdm-btn cdm-btn--primary" onClick={() => setPhase("confirm")} type="button">✏ Edit Profile</button>
            </div>
          </>
        ) : (
          <>
            <div className="cdm-confirm">
              <div className="cdm-confirm__icon">✏</div>
              <h3 className="cdm-confirm__title">Update Your Profile</h3>
              <p className="cdm-confirm__text">You will be redirected to the profile editor. Your dashboard data will not be lost.</p>
            </div>
            <div className="cdm-footer">
              <button className="cdm-btn cdm-btn--ghost" onClick={() => setPhase("view")} type="button">← Back</button>
              <button
                className="cdm-btn cdm-btn--primary"
                onClick={() => { onClose(); onNavigate("/citizen/profile"); }}
                type="button"
              >
                Proceed to Editor →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Service Card ── */
function ServiceCard({ icon, title, desc, badge, onClick, accent }) {
  return (
    <button className={`cd-service cd-service--${accent}`} onClick={onClick} type="button">
      <div className={`cd-service__icon cd-service__icon--${accent}`}>{icon}</div>
      <div className="cd-service__body">
        <p className="cd-service__title">{title}</p>
        <p className="cd-service__desc">{desc}</p>
      </div>
      {badge > 0 && <span className="cd-service__badge">{badge}</span>}
      <span className="cd-service__arrow">→</span>
    </button>
  );
}

/* ─── Profile Banner ── */
function ProfileBanner({ onNavigate }) {
  const [dismissed, setDismissed] = useState(false);
  const [hiding,    setHiding]    = useState(false);
  const dismiss = () => { setHiding(true); setTimeout(() => setDismissed(true), 280); };
  if (dismissed) return null;
  return (
    <div className={`cd-banner${hiding ? " cd-banner--hiding" : ""}`} role="alert">
      <span className="cd-banner__icon">⚠️</span>
      <div className="cd-banner__body">
        <p className="cd-banner__title">Profile Incomplete — Action Required</p>
        <p className="cd-banner__sub">Complete your citizen profile to unlock full access to services, welfare schemes, and priority complaint handling.</p>
      </div>
      <button className="cd-banner__cta" onClick={() => onNavigate("/citizen/profile")} type="button">Complete Now</button>
      <button className="cd-banner__close" onClick={dismiss} aria-label="Dismiss" type="button">✕</button>
    </div>
  );
}

/* ─── House Reveal ── */
function FlipUnit({ value }) {
  const [display, setDisplay] = useState(value);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    if (value !== display) {
      setAnimate(true);
      const t = setTimeout(() => { setDisplay(value); setAnimate(false); }, 300);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <span style={{ display: "inline-block", position: "relative", overflow: "hidden", minWidth: "0.6em", textAlign: "center" }}>
      <span style={{
        display: "block",
        transform: animate ? "translateY(-100%)" : "translateY(0%)",
        opacity: animate ? 0 : 1,
        transition: animate ? "transform 0.30s cubic-bezier(0.4,0,0.2,1), opacity 0.30s ease" : "none",
      }}>
        {display}
      </span>
      {animate && (
        <span style={{
          display: "block", position: "absolute", top: "100%", left: 0, width: "100%",
          transform: "translateY(-100%)",
          transition: "transform 0.30s cubic-bezier(0.4,0,0.2,1)",
        }}>
          {value}
        </span>
      )}
    </span>
  );
}

function HouseReveal({ citizenName, houseInfo, motto }) {
  const firstName = (citizenName || "").trim().split(/\s+/)[0] || "Citizen";
  const house     = houseInfo?.house || "default";

  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  const HH = pad(time.getHours());
  const MM = pad(time.getMinutes());
  const SS = pad(time.getSeconds());

  const goldBright = "rgba(212,178,78,0.92)";
  const goldMid    = "rgba(158, 125, 41, 0.65)";
  const goldDim    = "rgba(150,118,40,0.38)";

  const sublabelStyle = {
    fontFamily: "Cinzel, serif", fontSize: 7, fontWeight: 700,
    letterSpacing: "0.16em", textTransform: "uppercase",
    color: goldDim, marginTop: 2, textAlign: "center", display: "block",
  };
  const colonStyle = {
    fontFamily: "Cinzel, serif", fontSize: 20, fontWeight: 900,
    color: goldDim, lineHeight: 1,
    alignSelf: "flex-start", paddingTop: 2,
    userSelect: "none", margin: "0 2px",
  };

  const eyebrowText = houseInfo
    ? `${houseInfo.sigil}  ${houseInfo.houseLabel}  ·  Recognised Citizen`
    : `⚔  Citizen Portal  ·  Rural Ops`;

  return (
    <div className={`cd-reveal cd-reveal--${house}`}>
      <div className="cd-reveal__bg" />
      <img src={ruralopsLogo} alt="" aria-hidden="true" style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 170, height: 170,
        objectFit: "contain", opacity: 0.26,
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "relative", zIndex: 1, width: "100%",
        display: "grid", gridTemplateColumns: "160px 1fr 160px",
        alignItems: "center", gap: 0,
      }}>
        {/* LEFT — Date */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "Cinzel, serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: goldDim, lineHeight: 1 }}>The Date</span>
          <p style={{ fontFamily: "Cinzel, serif", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.18em", color: goldMid, margin: 0, lineHeight: 1.2 }}>
            {time.toLocaleDateString("en-IN", { weekday: "long" }).toUpperCase()}
          </p>
          <p style={{ fontFamily: "Cinzel, serif", fontSize: 21, fontWeight: 900, letterSpacing: "0.01em", color: "rgba(110, 195, 225, 0.92)", margin: 0, lineHeight: 1, textShadow: "0 0 14px rgba(90, 180, 220, 0.40)" }}>
            {time.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
          </p>
          <p style={{ fontFamily: "Cinzel, serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: goldMid, margin: 0 }}>{time.getFullYear()}</p>
        </div>

        {/* CENTRE — Welcome */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <p className="cd-reveal__eyebrow">{eyebrowText}</p>
          <h2 style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontWeight: 900, lineHeight: 1.15, letterSpacing: "0.01em", marginBottom: 10, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(110, 195, 225, 0.88)", textShadow: "0 0 18px rgba(90, 180, 220, 0.35)" }}>Welcome Back</span>
            <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: "0.04em", background: "linear-gradient(160deg, #e8c96a 0%, #c8982a 30%, #f0d878 52%, #b07818 72%, #d4a840 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{firstName}</span>
          </h2>
          <p className="cd-reveal__motto">"{motto}"</p>
          <div className="cd-reveal__rule" />
        </div>

        {/* RIGHT — Flip Clock */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          <span style={{ fontFamily: "Cinzel, serif", fontSize: 7, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(102, 204, 255, 0.92)", lineHeight: 1 }}>Current Time</span>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontFamily: "Cinzel, serif", fontSize: 28, fontWeight: 900, color: goldBright, lineHeight: 1, textShadow: "0 0 16px rgba(176,140,48,0.25)", letterSpacing: "0.01em" }}>
                <FlipUnit value={HH[0]} /><FlipUnit value={HH[1]} />
              </span>
              <span style={sublabelStyle}></span>
            </div>
            <span style={colonStyle}>:</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontFamily: "Cinzel, serif", fontSize: 28, fontWeight: 900, color: goldBright, lineHeight: 1, textShadow: "0 0 16px rgba(176,140,48,0.25)", letterSpacing: "0.01em" }}>
                <FlipUnit value={MM[0]} /><FlipUnit value={MM[1]} />
              </span>
              <span style={sublabelStyle}></span>
            </div>
            <span style={colonStyle}>:</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 900, color: "rgba(110, 195, 225, 0.90)", lineHeight: 1, letterSpacing: "0.01em", textShadow: "0 0 12px rgba(90, 180, 220, 0.40)" }}>
                <FlipUnit value={SS[0]} /><FlipUnit value={SS[1]} />
              </span>
              <span style={sublabelStyle}></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Citizen ID Card ── */
function CitizenIDCard({ dashboard, citizenId }) {
  const [flipped, setFlipped] = useState(false);
  const [tilt,    setTilt]    = useState({ x: 0, y: 0 });
  const wrapRef = useRef(null);
  const { citizenName, villageName, profilePhoto, profileCompleted, dateOfBirth } = dashboard;

  const onMove = useCallback((e) => {
    if (!wrapRef.current || flipped) return;
    const r = wrapRef.current.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - (r.top  + r.height / 2)) / (r.height / 2)) * -7,
      y: ((e.clientX - (r.left + r.width  / 2)) / (r.width  / 2)) * 7,
    });
  }, [flipped]);

  const issueDate = new Date().toLocaleDateString("en-IN", { month: "2-digit", year: "numeric" });
  const expDate   = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 5); return d.toLocaleDateString("en-IN", { month: "2-digit", year: "numeric" }); })();
  const dob = (() => {
    if (!dateOfBirth) return "-- / -- / ----";
    const d = new Date(dateOfBirth);
    return isNaN(d.getTime()) ? String(dateOfBirth) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  })();
  const idDisplay = (citizenId || "").replace(/[^A-Z0-9]/gi, "").toUpperCase().match(/.{1,4}/g)?.join("  ") || citizenId;

  return (
    <div className="cid-scene">
      <div
        ref={wrapRef}
        className={`cid-wrap${flipped ? " cid-wrap--flipped" : ""}`}
        style={{ transform: flipped ? `perspective(1100px) rotateY(-180deg)` : `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        onClick={() => setFlipped(f => !f)}
        role="button" tabIndex={0} aria-label="Citizen ID card — click to flip"
        onKeyDown={(e) => e.key === "Enter" && setFlipped(f => !f)}
      >
        {/* FRONT */}
        <div className="cid-face cid-face--front">
          <div className="cid-texture" />
          <div className="cid-watermark"><img src={ruralopsLogo} alt="" aria-hidden="true" /></div>
          <div className="cid-top-bar">
            <div className="cid-brand">
              <svg viewBox="0 0 26 26" fill="none" width="22" height="22">
                <circle cx="13" cy="13" r="11.5" stroke="rgba(170,135,55,0.75)" strokeWidth="1.1"/>
                <circle cx="13" cy="13" r="6"    stroke="rgba(170,135,55,0.35)" strokeWidth="0.8"/>
                <circle cx="13" cy="13" r="2.2"  fill="rgba(200,165,80,0.80)"/>
                <line x1="13" y1="1.5" x2="13" y2="24.5" stroke="rgba(170,135,55,0.18)" strokeWidth="0.7"/>
                <line x1="1.5" y1="13" x2="24.5" y2="13" stroke="rgba(170,135,55,0.18)" strokeWidth="0.7"/>
              </svg>
              <div>
                <p className="cid-brand__name">RURAL OPS</p>
                <p className="cid-brand__sub">CITIZEN IDENTITY CARD</p>
              </div>
            </div>
            <div className="cid-chip">
              <div className="cid-chip__grid"><div/><div/><div/><div/><div/><div/><div/><div/><div/></div>
            </div>
          </div>
          <div className="cid-mid">
            <div className="cid-photo-frame">
              <img
                src={profilePhoto || "/ruralops-logo.png"} alt={citizenName} className="cid-photo"
                onLoad={e => e.currentTarget.classList.add("loaded")}
                onError={e => { e.currentTarget.src = "/ruralops-logo.png"; e.currentTarget.classList.add("loaded"); }}
              />
            </div>
            <div className="cid-details">
              <p className="cid-details__name">{citizenName?.toUpperCase()}</p>
              {[["DOB", dob], ["VILLAGE", villageName], ["VALID", expDate]].map(([l, v]) => (
                <div className="cid-details__row" key={l}>
                  <span className="cid-details__lbl">{l}</span>
                  <span className="cid-details__val">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="cid-bottom">
            <div>
              <p className="cid-idnum__label">CITIZEN ID</p>
              <p className="cid-idnum__val">{idDisplay}</p>
            </div>
            {profileCompleted
              ? <span className="cid-status cid-status--active"><span className="cid-status__dot"/>ACTIVE</span>
              : <span className="cid-status cid-status--pending"><span className="cid-status__dot"/>PENDING</span>
            }
          </div>
        </div>

        {/* BACK */}
        <div className="cid-face cid-face--back">
          <div className="cid-back-wm"><img src={ruralopsLogo} alt="" aria-hidden="true" /></div>
          <div className="cid-mag-stripe" />
          <div className="cid-back__hd">
            <p className="cid-back__issuer">RURAL OPERATIONS PLATFORM</p>
            <p className="cid-back__sub-lbl">GOVERNMENT OF INDIA · CITIZEN REGISTRY</p>
          </div>
          <div className="cid-back__table">
            {[
              ["CITIZEN ID",    citizenId,   true],
              ["FULL NAME",     citizenName, false],
              ["VILLAGE",       villageName, false],
              ["DATE OF BIRTH", dob,         true],
              ["ISSUED",        issueDate,   true],
              ["EXPIRES",       expDate,     true],
              ["STATUS", profileCompleted ? "ACTIVE & VERIFIED" : "PENDING VERIFICATION", false, profileCompleted ? "#3d9960" : "#d4881a"],
            ].map(([lbl, val, mono, color]) => (
              <div className="cid-back__row" key={lbl}>
                <span className="cid-back__lbl">{lbl}</span>
                <span className={`cid-back__val${mono ? " mono" : ""}`} style={color ? { color } : {}}>{val}</span>
              </div>
            ))}
          </div>
          <div className="cid-back__ft">
            <p className="cid-back__legal">Issued under the Rural Ops Citizen Identity Act. Unauthorised use is a punishable offence.</p>
          </div>
        </div>
      </div>
      <p className="cid-hint">Click to flip · Hover to tilt</p>
    </div>
  );
}

/* ─── Recent Complaints Card ── */
function RecentComplaintsCard({ complaints, loading, onNavigate }) {
  return (
    <div className="cd-card">
      <div className="cd-card__header">
        <div>
          <h3 className="cd-card__title">📜 Recent Complaints</h3>
          <p className="cd-card__sub">Latest petitions filed with your local authority</p>
        </div>
        <span className="cd-live-badge"><span className="cd-live-badge__dot"/>Live</span>
      </div>
      <div className="cd-act">
        {loading ? (
          [0, 1, 2].map(i => (
            <div key={i} className="cd-act__row" style={{ gap: 10 }}>
              <Sk w={30} h={30} r={8} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <Sk w="65%" h={11} r={4} /><Sk w="38%" h={9} r={4} />
              </div>
            </div>
          ))
        ) : complaints.length === 0 ? (
          <p className="cd-card__empty" style={{ padding: "18px 20px" }}>
            No complaints filed yet. Use the button below to submit your first.
          </p>
        ) : (
          complaints.slice(0, 5).map((c) => {
            const color = STATUS_COLOR[c.status] || "#c9a227";
            return (
              <div
                key={c.complaintId}
                className="cd-act__row cd-act__row--clickable"
                onClick={() => onNavigate(`/citizen/complaints/${c.complaintId}`)}
                role="button" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onNavigate(`/citizen/complaints/${c.complaintId}`)}
              >
                <div className="cd-act__dot cd-act__dot--gold">{CAT_ICON[c.category] || "📋"}</div>
                <div className="cd-act__body">
                  <p className="cd-act__text">
                    <span className="cd-act__id">#{c.complaintId}</span>
                    {c.description?.length > 52 ? c.description.slice(0, 52) + "…" : c.description}
                  </p>
                  <p className="cd-act__time">
                    {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className="cd-act__pill" style={{ "--pill": color }}>
                  <span className="cd-act__pill-dot" />{STATUS_ICON[c.status] || "📜"} {c.status?.replace(/_/g, " ")}
                </span>
                <span className="cd-act__arrow">›</span>
              </div>
            );
          })
        )}
      </div>
      <div className="cd-card__foot">
        <button className="cd-card-cta cd-card-cta--ghost"   onClick={() => onNavigate("/citizen/complaints")} type="button">📂 View All</button>
        <button className="cd-card-cta cd-card-cta--primary" onClick={() => onNavigate("/citizen/complaint/new")} type="button">📝 New Complaint</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════════════════════ */
function CitizenDashboard() {

  // Read canonical keys set by saveSession() in LoginPage
  const resolvedCitizenId = localStorage.getItem("accountId");
  const role              = localStorage.getItem("accountType");

  const navigate = useNavigate();

  const [dashboard,   setDashboard]   = useState(null);
  const [complaints,  setComplaints]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [visible,     setVisible]     = useState(false);
  const [houseInfo,   setHouseInfo]   = useState(null);
  const [motto,       setMotto]       = useState("");
  const [showProfile, setShowProfile] = useState(false);

  // Pre-render guard: return null immediately to prevent flash of dashboard content.
  // useNavigate requires all hooks to run first, so the redirect happens in useEffect,
  // but isAuthorized=false causes null return below before any JSX renders.
  const token = localStorage.getItem("accessToken")?.trim();
  const isAuthorized = !!(token && role === "CITIZEN");

  useEffect(() => {
    if (!isAuthorized) { navigate("/login", { replace: true }); }
  }, [isAuthorized, navigate]);

  useEffect(() => {
    if (!isAuthorized) return;

    (async () => {
      const dashRes = await apiFetch(`${API}/citizen/dashboard`, {}, navigate);
      if (!dashRes) return;

      let base;
      try {
        const text = await dashRes.text();
        base = text ? JSON.parse(text) : null;
      } catch {
        base = null;
      }

      if (!dashRes.ok) {
        setError(base?.message || `Dashboard load failed (${dashRes.status})`);
        setLoading(false);
        return;
      }

      base = base ?? {
        citizenId: resolvedCitizenId, citizenName: "Citizen", villageName: "Unknown",
        profileCompleted: false, profilePhoto: null,
        totalComplaints: 0, pendingComplaints: 0, resolvedComplaints: 0,
        activeSchemes: 0, latestNews: null, weatherSummary: null, dateOfBirth: null,
      };

      let pData = {};
      try {
        const pRes = await apiFetch(`${API}/citizen/profile`, {}, navigate);
        if (pRes && pRes.ok) {
          const pt = await pRes.text();
          pData = pt ? (JSON.parse(pt) || {}) : {};
        }
      } catch {}

      const citizenName = (() => {
        const f = (pData.firstName || "").trim();
        const l = (pData.lastName  || "").trim();
        if (f || l) return [f, l].filter(Boolean).join(" ");
        return pData.fullName || pData.citizenName || base.citizenName || "Citizen";
      })();

      const dateOfBirth  = pData.dateOfBirth    || pData.dob         || pData.birthDate   || base.dateOfBirth  || null;
      const profilePhoto = pData.profilePhotoUrl || pData.profilePhoto || base.profilePhoto || null;

      let complaintList      = [];
      let totalComplaints    = base.totalComplaints    || 0;
      let pendingComplaints  = base.pendingComplaints  || 0;
      let resolvedComplaints = base.resolvedComplaints || 0;

      try {
        const cRes = await apiFetch(`${API}/citizen/complaints/my`, {}, navigate);
        if (cRes && cRes.ok) {
          const list = await cRes.json();
          if (Array.isArray(list)) {
            const DONE = new Set(["RESOLVED", "VERIFIED", "CLOSED"]);
            const PEND = new Set(["SUBMITTED", "AWAITING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"]);
            complaintList      = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            totalComplaints    = list.length;
            resolvedComplaints = list.filter(c => DONE.has(c.status)).length;
            pendingComplaints  = list.filter(c => PEND.has(c.status)).length;
          }
        }
      } catch {}

      setComplaints(complaintList);
      setDashboard({ ...base, citizenName, dateOfBirth, profilePhoto, totalComplaints, pendingComplaints, resolvedComplaints });

      const det = detectHouse(citizenName);
      setHouseInfo(det);
      setMotto(getRandomMotto(det?.house || "default"));
      setLoading(false);
    })();
  }, [navigate]);

  useEffect(() => {
    if (!loading && !error) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading, error]);

  const today    = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Suppress all JSX until redirect fires — no flash of content for non-CITIZEN roles
  if (!isAuthorized) return null;

  if (loading) return (
    <>
      <Navbar />
      <div className="cd-page">
        <div className="cd-ambient" aria-hidden="true"><div className="cd-orb cd-orb--1"/><div className="cd-orb cd-orb--2"/></div>
        <div className="cd-wrap" style={{ opacity: 1, transform: "none" }}>
          <Sk w={300} h={38} r={8} mb={14}/><Sk w={190} h={16} r={4} mb={36}/>
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 22 }}>
            <div><Sk w="100%" h={230} r={14} mb={14}/><Sk w="100%" h={260} r={14}/></div>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
                {[0,1,2,3].map(i => <Sk key={i} w="100%" h={105} r={11}/>)}
              </div>
              <Sk w="100%" h={190} r={11} mb={14}/><Sk w="100%" h={150} r={11}/>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div className="cd-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚔</div>
          <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 22, color: "var(--cd-gold)", marginBottom: 10 }}>Connection Failed</h2>
          <p style={{ color: "var(--cd-txt-2)", marginBottom: 26, fontSize: 15 }}>{error}</p>
          <button className="cd-btn cd-btn--primary" onClick={() => navigate("/login")}>Return to Login</button>
        </div>
      </div>
      <Footer />
    </>
  );

  const {
    citizenName, villageName, profileCompleted, profilePhoto = null,
    totalComplaints = 0, pendingComplaints = 0, resolvedComplaints = 0,
    activeSchemes = 0, latestNews, weatherSummary,
  } = dashboard;

  const resolveRate = totalComplaints > 0
    ? Math.round((resolvedComplaints / totalComplaints) * 100)
    : 0;

  return (
    <>
      <Navbar />

      {showProfile && (
        <ProfileModal
          dashboard={dashboard}
          citizenId={resolvedCitizenId}
          onClose={() => setShowProfile(false)}
          onNavigate={navigate}
        />
      )}

      <div className="cd-page">
        <div className="cd-ambient" aria-hidden="true">
          <div className="cd-orb cd-orb--1"/><div className="cd-orb cd-orb--2"/><div className="cd-orb cd-orb--3"/>
          <div className="cd-dot-grid"/>
        </div>

        <div className={`cd-wrap${visible ? " cd-wrap--visible" : ""}`}>

          <HouseReveal citizenName={citizenName} houseInfo={houseInfo} motto={motto} />

          {!profileCompleted && <ProfileBanner onNavigate={navigate} />}

          {/* HEADER */}
          <header className="cd-header">
            <div className="cd-header__left">
              <p className="cd-header__eyebrow"><span className="cd-header__dot"/>{today}</p>
              <h1 className="cd-header__greeting">{greeting},<br/><span className="cd-header__name">{citizenName}</span></h1>
              <div className="cd-header__chips">
                <span className="cd-chip cd-chip--default">⚔ {villageName}</span>
                <span className={`cd-chip${profileCompleted ? " cd-chip--ok" : " cd-chip--warn"}`}>
                  {profileCompleted ? "✓ Verified Citizen" : "⏳ Verification Pending"}
                </span>
                <span className="cd-chip cd-chip--mono">ID: {resolvedCitizenId}</span>
              </div>
              <p className="cd-header__tagline">Manage your complaints, track government schemes, and access all civic services from one unified command centre.</p>

              <div className="cd-stat-strip">
                {[
                  { v: totalComplaints,    l: "Complaints",      c: "",        nav: true  },
                  { v: pendingComplaints,  l: "Pending",         c: "--amber", nav: true  },
                  { v: resolvedComplaints, l: "Resolved",        c: "--green", nav: true  },
                  { v: `${resolveRate}%`,  l: "Resolution Rate", c: "--blue",  nav: false, raw: true },
                  { v: activeSchemes,      l: "Active Schemes",  c: "--steel", nav: false },
                ].map(({ v, l, c, nav, raw }, i) => (
                  <div key={i} style={{ display: "contents" }}>
                    {i > 0 && <div className="cd-stat-sep"/>}
                    <div
                      className={`cd-stat${nav ? " cd-stat--link" : ""}`}
                      onClick={nav ? () => navigate("/citizen/complaints") : undefined}
                      role={nav ? "button" : undefined}
                      tabIndex={nav ? 0 : undefined}
                    >
                      <span className={`cd-stat__v${c}`}>{raw ? v : <Counter value={v}/>}</span>
                      <span className="cd-stat__l">{l}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cd-cta-row">
                <button className="cd-cta cd-cta--primary"   onClick={() => navigate("/citizen/complaint/new")}  type="button">📝 Lodge Complaint</button>
                <button className="cd-cta cd-cta--secondary" onClick={() => navigate("/citizen/complaints")} type="button">
                  📂 My Complaints {pendingComplaints > 0 && <span className="cd-cta__badge">{pendingComplaints}</span>}
                </button>
                <button className="cd-cta cd-cta--ghost" onClick={() => setShowProfile(true)} type="button">
                  👤 {profileCompleted ? "My Profile" : "Complete Profile"}
                </button>
              </div>
            </div>

            <div className="cd-header__right">
              <CitizenIDCard dashboard={dashboard} citizenId={resolvedCitizenId} />
            </div>
          </header>

          {/* BODY */}
          <div className="cd-body">
            {/* SIDEBAR */}
            <aside className="cd-sidebar">
              <div className="cd-profile-card">
                <div className="cd-profile-card__av-wrap">
                  <img
                    src={profilePhoto || "/default-avatar.png"} alt={citizenName} className="cd-profile-card__av"
                    onLoad={e => e.currentTarget.classList.add("loaded")}
                    onError={e => { e.currentTarget.src = "/default-avatar.png"; e.currentTarget.classList.add("loaded"); }}
                  />
                  {profileCompleted && <span className="cd-profile-card__verified"/>}
                </div>
                <h2 className="cd-profile-card__name">{citizenName}</h2>
                <p className="cd-profile-card__id">{resolvedCitizenId}</p>
                <p className="cd-profile-card__village">⚔ {villageName}</p>
                <div className="cd-profile-card__rule"/>
                <button className="cd-profile-card__btn" onClick={() => setShowProfile(true)} type="button">
                  👤 {profileCompleted ? "View Profile" : "Complete Profile"}
                </button>
              </div>

              {/* Analytics mini */}
              <div className="cd-mini-analytics">
                <p className="cd-mini-analytics__title">📊 Analytics</p>
                {[
                  { label: "Resolution Rate", pct: resolveRate, cls: "--green" },
                  { label: "Pending Rate",    pct: totalComplaints > 0 ? Math.round((pendingComplaints / totalComplaints) * 100) : 0, cls: "--amber" },
                ].map(({ label, pct, cls }) => (
                  <div className="cd-bar-item" key={label}>
                    <div className="cd-bar-item__head">
                      <span>{label}</span><span className="cd-bar-item__pct">{pct}%</span>
                    </div>
                    <div className="cd-bar-track">
                      <div className={`cd-bar-fill cd-bar-fill${cls}`} style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                ))}
                <div className="cd-mini-stats">
                  {[
                    { v: totalComplaints,    l: "Total", c: "--gold"  },
                    { v: resolvedComplaints, l: "Done",  c: "--green" },
                    { v: pendingComplaints,  l: "Open",  c: "--amber" },
                  ].map(({ v, l, c }) => (
                    <div className={`cd-mini-stat cd-mini-stat${c}`} key={l}>
                      <span className="cd-mini-stat__v">{v}</span>
                      <span className="cd-mini-stat__l">{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              <nav className="cd-quick">
                <p className="cd-quick__label">Quick Actions</p>
                {[
                  { icon: "📝", label: "Register Complaint", path: "/citizen/complaint/new",    v: "primary", b: 0 },
                  { icon: "📂", label: "My Complaints",       path: "/citizen/complaints",       v: "default", b: pendingComplaints },
                  { icon: "📋", label: "Submit Grievance",    path: "/citizen/grievance",        v: "default", b: 0 },
                  { icon: "🏛", label: "Welfare Schemes",     path: "/citizen/schemes",          v: "default", b: activeSchemes },
                  { icon: "📄", label: "My Documents",        path: "/citizen/documents",        v: "default", b: 0 },
                  { icon: "🔔", label: "Notifications",       path: "/citizen/notifications",    v: "default", b: 0 },
                ].map(({ icon, label, path, v, b }) => (
                  <button key={label} className={`cd-qbtn cd-qbtn--${v}`} onClick={() => navigate(path)} type="button">
                    <span className="cd-qbtn__icon">{icon}</span>
                    <span>{label}</span>
                    {b > 0 && <span className="cd-qbtn__badge">{b}</span>}
                    <span className="cd-qbtn__arrow">›</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* MAIN */}
            <main className="cd-main">

              <section className="cd-section">
                <div className="cd-section__head">
                  <h2 className="cd-section__title">Activity Overview</h2>
                  <p className="cd-section__sub">Real-time summary of your complaints and enrolled programmes.</p>
                </div>
                <div className="cd-metrics-grid">
                  <MetricCard icon="📊" label="Total Complaints" value={totalComplaints}    accent="gold"  sub="All time"            index={0} onClick={() => navigate("/citizen/complaints")}/>
                  <MetricCard icon="⏳" label="Pending Review"   value={pendingComplaints}  accent="amber" sub="Awaiting resolution" index={1} onClick={() => navigate("/citizen/complaints")}/>
                  <MetricCard icon="✅" label="Resolved"         value={resolvedComplaints} accent="green" sub="Successfully closed" index={2} onClick={() => navigate("/citizen/complaints")}/>
                  <MetricCard icon="🏛" label="Active Schemes"   value={activeSchemes}      accent="steel" sub="Currently enrolled"  index={3}/>
                </div>
              </section>

              <section className="cd-section">
                <div className="cd-section__head">
                  <h2 className="cd-section__title">Citizen Services</h2>
                  <p className="cd-section__sub">All civic services, welfare programmes and administrative tools at your command.</p>
                </div>
                <div className="cd-services-grid">
                  <ServiceCard icon="📝" title="Register Complaint"   desc="File a complaint with your local authority"        badge={pendingComplaints} accent="gold"    onClick={() => navigate("/citizen/complaint/new")}/>
                  <ServiceCard icon="📂" title="Track Complaints"     desc="Monitor the status of all submitted complaints"    badge={0}                 accent="violet"  onClick={() => navigate("/citizen/complaints")}/>
                  <ServiceCard icon="⚖️" title="Submit Grievance"     desc="Raise a formal grievance for priority handling"   badge={0}                 accent="rose"    onClick={() => navigate("/citizen/grievance")}/>
                  <ServiceCard icon="🏛" title="Welfare Schemes"      desc="Browse and enrol in government welfare programmes" badge={activeSchemes}     accent="emerald" onClick={() => navigate("/citizen/schemes")}/>
                  <ServiceCard icon="🎓" title="Education Benefits"   desc="Scholarships, training grants and learning aid"    badge={0}                 accent="amber"   onClick={() => navigate("/citizen/education")}/>
                  <ServiceCard icon="🌾" title="Agricultural Support" desc="Farmer subsidies, insurance and advisory services" badge={0}                 accent="steel"   onClick={() => navigate("/citizen/agriculture")}/>
                </div>
              </section>

              <section className="cd-section">
                <div className="cd-twin-grid">

                  <RecentComplaintsCard
                    complaints={complaints}
                    loading={loading}
                    onNavigate={navigate}
                  />

                  <div className="cd-stack">
                    <div className="cd-card">
                      <div className="cd-card__header"><h3 className="cd-card__title">📰 Local Announcements</h3></div>
                      <div className="cd-card__body">
                        {latestNews
                          ? <p className="cd-card__text">{latestNews}</p>
                          : <p className="cd-card__empty">No announcements have been issued for your area at this time.</p>
                        }
                      </div>
                    </div>

                    <div className="cd-card">
                      <div className="cd-card__header"><h3 className="cd-card__title">🌤 Weather Advisory</h3></div>
                      <div className="cd-card__body">
                        {weatherSummary
                          ? <p className="cd-card__text">{weatherSummary}</p>
                          : <p className="cd-card__empty">Weather data is not yet available for your registered village.</p>
                        }
                      </div>
                    </div>

                    <div className="cd-card cd-card--notice">
                      <div className="cd-card__header"><h3 className="cd-card__title">📢 Official Notice</h3></div>
                      <div className="cd-card__body">
                        <p className="cd-card__text">
                          The annual citizen enumeration commences next month. Ensure your registered details are current and accurate to maintain full eligibility for all active welfare schemes and civic benefits.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </main>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default CitizenDashboard;