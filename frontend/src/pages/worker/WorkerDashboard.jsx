import { useEffect, useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import ruralopsLogo from "../../assets/ruralops-logo.png"
import "../../styles/WorkerDashboard.css"

const API = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app"

/* ════════════════════════════════════════════
   AUTH HELPERS — canonical keys from saveSession()
   Worker identity: JWT → userId → WorkerAccount
   No workerId in URLs — identity is server-side.
════════════════════════════════════════════ */
function getToken()      { return localStorage.getItem("accessToken") }
function getAccountType(){ return localStorage.getItem("accountType") }

async function authFetch(url, options = {}) {
  const token = getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  if (res.status === 401) {
    localStorage.clear()
    const err = new Error("Session expired. Please log in again.")
    err.code = 401
    throw err
  }
  if (res.status === 403) {
    const err = new Error("You do not have permission to perform this action.")
    err.code = 403
    throw err
  }
  return res
}

function normalizeUrl(url) {
  if (!url || typeof url !== "string") return null
  const t = url.trim()
  if (!t || t.startsWith("blob:")) return null
  if (t.startsWith("http://") || t.startsWith("https://")) return t
  if (t.startsWith("/")) return `${API}${t}`
  return `${API}/${t}`
}
function resolvePhotoUrl(obj) {
  return normalizeUrl(obj?.profilePhotoUrl || obj?.profilePhoto || obj?.photoUrl || obj?.photo || null)
}

/* ════════════ CONSTANTS ════════════ */
const DEPT_CONFIG = {
  SANITATION:    { icon: "🗑", color: "#4e9e6a", glow: "rgba(78,158,106,0.45)" },
  DRAINAGE:      { icon: "🌊", color: "#3f8fd4", glow: "rgba(63,143,212,0.45)" },
  ROAD:          { icon: "🛤",  color: "#c47818", glow: "rgba(196,120,24,0.45)" },
  STREET_LIGHT:  { icon: "💡", color: "#d4b020", glow: "rgba(212,176,32,0.45)" },
  WATER_SUPPLY:  { icon: "💧", color: "#3bbcd4", glow: "rgba(59,188,212,0.45)" },
  PUBLIC_HEALTH: { icon: "⚕",  color: "#c94444", glow: "rgba(201,68,68,0.45)" },
  DEFAULT:       { icon: "🛠",  color: "#b48c28", glow: "rgba(180,140,40,0.45)" },
}
const STATUS_COLOR = {
  SUBMITTED: "#60a5fa", AWAITING_ASSIGNMENT: "#f97316",
  ASSIGNED: "#a78bfa", IN_PROGRESS: "#fbbf24",
  RESOLVED: "#34d399", VERIFIED: "#52b874", CLOSED: "#5d785d",
}
const STATUS_ICON = {
  SUBMITTED: "📜", AWAITING_ASSIGNMENT: "⏳", ASSIGNED: "⚔",
  IN_PROGRESS: "🔨", RESOLVED: "✅", VERIFIED: "🔮", CLOSED: "🏁",
}
const CAT_ICON = {
  GARBAGE: "🗑", DRAINAGE: "🌊", ROAD_DAMAGE: "🛤", STREET_LIGHT: "💡",
  WATER_SUPPLY: "💧", PUBLIC_HEALTH: "⚕", OTHER: "📋",
}
function getDeptConfig(dept = "") {
  const key = (dept || "").toUpperCase().replace(/ /g, "_").split("_")[0]
  return DEPT_CONFIG[key] || DEPT_CONFIG.DEFAULT
}

/* ════════════ RATING ENGINE ════════════ */
function computeRatingData(complaints) {
  const verified = complaints.filter(c => c.aiVerified === true && c.aiCleanScore != null)
  if (verified.length === 0) return { rating: null, ratingStr: "N/A", ratingOf10: 0, sampleSize: 0, avgAiScore: 0, breakdown: [] }
  const avg = verified.reduce((s, c) => s + c.aiCleanScore, 0) / verified.length
  const ratingOf10 = parseFloat((avg / 10).toFixed(1))
  const buckets = [
    { label: "Excellent  81–100", min: 81, max: 100, color: "#34d399" },
    { label: "Good       61–80",  min: 61, max: 80,  color: "#52b874" },
    { label: "Average    41–60",  min: 41, max: 60,  color: "#fbbf24" },
    { label: "Poor       21–40",  min: 21, max: 40,  color: "#f97316" },
    { label: "Very Poor  0–20",   min: 0,  max: 20,  color: "#c94444" },
  ]
  const breakdown = buckets.map(b => ({
    ...b,
    count: verified.filter(c => c.aiCleanScore >= b.min && c.aiCleanScore <= b.max).length,
    pct: Math.round(verified.filter(c => c.aiCleanScore >= b.min && c.aiCleanScore <= b.max).length / verified.length * 100),
  }))
  return { rating: ratingOf10, ratingStr: `${ratingOf10}/10`, ratingOf10, avgAiScore: Math.round(avg), sampleSize: verified.length, breakdown }
}

/* ════════════ ANALYTICS ENGINE ════════════ */
function computeAnalytics(complaints) {
  const total      = complaints.length
  const assigned   = complaints.filter(c => c.status === "ASSIGNED").length
  const inProgress = complaints.filter(c => c.status === "IN_PROGRESS").length
  const resolved   = complaints.filter(c => c.status === "RESOLVED").length
  const verified   = complaints.filter(c => c.status === "VERIFIED").length
  const closed     = complaints.filter(c => c.status === "CLOSED").length
  const completed  = resolved + verified + closed
  const urgent     = complaints.filter(c => c.category === "PUBLIC_HEALTH").length
  const pending    = assigned + inProgress
  const withTime   = complaints.filter(c => c.resolvedAt && c.assignedAt)
  let avgResolutionStr = null
  if (withTime.length > 0) {
    const avg = withTime.reduce((s, c) => s + Math.max(0, (new Date(c.resolvedAt) - new Date(c.assignedAt)) / 60000), 0) / withTime.length
    avgResolutionStr = avg < 60 ? `${Math.round(avg)}m` : `${(avg / 60).toFixed(1)}h`
  }
  const completionRate   = total > 0 ? Math.round(completed / total * 100) : 0
  const verificationRate = completed > 0 ? Math.round((verified + closed) / completed * 100) : 0
  const urgencyRate      = total > 0 ? Math.round(urgent / total * 100) : 0
  const catCounts = {}
  complaints.forEach(c => { const cat = c.category || "OTHER"; catCounts[cat] = (catCounts[cat] || 0) + 1 })
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
  return { total, assigned, inProgress, resolved, verified, closed, completed, urgent, pending, completionRate, verificationRate, urgencyRate, avgResolutionStr, topCategory, catCounts }
}

/* ════════════ PRIMITIVES ════════════ */
function Sk({ w, h, r = 6, mb = 0 }) {
  return <div className="wd-sk" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
}
function Counter({ value }) {
  const [n, setN] = useState(0), raf = useRef(null)
  useEffect(() => {
    const target = Number(value) || 0
    if (target === 0) { setN(0); return }
    const start = performance.now()
    const tick = now => { const p = Math.min((now - start) / 850, 1); setN(Math.round((1 - Math.pow(1 - p, 3)) * target)); if (p < 1) raf.current = requestAnimationFrame(tick) }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value])
  return <>{n}</>
}
function FlipUnit({ value }) {
  const [display, setDisplay] = useState(value), [animate, setAnimate] = useState(false)
  useEffect(() => {
    if (value !== display) { setAnimate(true); const t = setTimeout(() => { setDisplay(value); setAnimate(false) }, 300); return () => clearTimeout(t) }
  }, [value])
  return (
    <span style={{ display: "inline-block", position: "relative", overflow: "hidden", minWidth: "0.6em", textAlign: "center" }}>
      <span style={{ display: "block", transform: animate ? "translateY(-100%)" : "translateY(0%)", opacity: animate ? 0 : 1, transition: animate ? "transform 0.30s cubic-bezier(0.4,0,0.2,1), opacity 0.30s ease" : "none" }}>{display}</span>
      {animate && <span style={{ display: "block", position: "absolute", top: "100%", left: 0, width: "100%", transform: "translateY(-100%)", transition: "transform 0.30s cubic-bezier(0.4,0,0.2,1)" }}>{value}</span>}
    </span>
  )
}

/* ════════════ WORKER PROFILE MODAL ════════════
   workerId = profile.workerId — display only, never a route param
════════════════════════════════════════════════ */
function WorkerProfileModal({ workerId, workerName, areaName, department, complaints, profile, onClose, onNavigate }) {
  const [phase, setPhase] = useState("view")
  const deptCfg = getDeptConfig(department), ratingData = computeRatingData(complaints), analytics = computeAnalytics(complaints)
  const photoUrl = resolvePhotoUrl(profile)
  const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") || workerName : workerName
  useEffect(() => { const fn = e => e.key === "Escape" && onClose(); document.addEventListener("keydown", fn); return () => document.removeEventListener("keydown", fn) }, [onClose])
  return (
    <div className="wdm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wdm-modal">
        <button className="wdm-close" onClick={onClose} aria-label="Close">✕</button>
        {phase === "view" ? (
          <>
            <div className="wdm-header">
              <div className="wdm-avatar-wrap" style={{ border: `2px solid ${deptCfg.color}45`, background: photoUrl ? "transparent" : `${deptCfg.color}18`, boxShadow: `0 0 18px ${deptCfg.glow}` }}>
                {photoUrl ? <img src={photoUrl} alt={fullName} onError={e => { e.currentTarget.style.display="none"; e.currentTarget.parentElement.style.background=`${deptCfg.color}18` }} /> : <span style={{ fontSize: 36 }}>{deptCfg.icon}</span>}
                <span className="wdm-avatar-dot" style={{ background: deptCfg.color, boxShadow: `0 0 8px ${deptCfg.glow}` }} />
              </div>
              <div className="wdm-header-info">
                <h2 className="wdm-name">{fullName}</h2>
                <p className="wdm-dept">{deptCfg.icon} {department} Department</p>
                <span className="wdm-badge wdm-badge--active">⚡ On Active Duty</span>
              </div>
            </div>
            <div className="wdm-divider" />
            <div className="wdm-fields">
              {[["Worker ID", workerId || "—", true], ["Full Name", fullName, false], ["Department", department, false], ["Assigned Area", areaName || "Zone", false], ["Phone", profile?.phoneNumber || "—", false], ["Village", profile?.villageName || "—", false], ["Status", "Active Field Worker", false]].map(([label, val, mono]) => (
                <div className="wdm-field" key={label}><span className="wdm-field__label">{label}</span><span className={`wdm-field__val${mono ? " wdm-field__val--mono" : ""}`}>{val || "—"}</span></div>
              ))}
            </div>
            <div className="wdm-divider" />
            <div className="wdm-perf-section">
              <p className="wdm-perf-title">📊 Performance Overview</p>
              <div className="wdm-stats-grid">
                <div className="wdm-stat-box"><span className="wdm-stat-box__val">{analytics.total}</span><span className="wdm-stat-box__lbl">Total Tasks</span></div>
                <div className="wdm-stat-box wdm-stat-box--green"><span className="wdm-stat-box__val">{analytics.completed}</span><span className="wdm-stat-box__lbl">Completed</span></div>
                <div className="wdm-stat-box wdm-stat-box--amber"><span className="wdm-stat-box__val">{analytics.pending}</span><span className="wdm-stat-box__lbl">Pending</span></div>
                <div className="wdm-stat-box wdm-stat-box--gold"><span className="wdm-stat-box__val">{ratingData.rating != null ? ratingData.ratingStr : "N/A"}</span><span className="wdm-stat-box__lbl">AI Rating /10</span></div>
              </div>
            </div>
            {ratingData.rating != null && (
              <div style={{ padding: "0 22px 14px" }}>
                <p className="wdm-perf-title">🤖 AI Score Breakdown</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
                  {ratingData.breakdown.map(b => (
                    <div key={b.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontFamily: "Cinzel, serif", fontSize: 9, color: b.color }}>{b.label}</span><span style={{ fontFamily: "Cinzel, serif", fontSize: 9, color: "var(--wd-t3)" }}>{b.count} ({b.pct}%)</span></div>
                      <div style={{ height: 4, borderRadius: 99, background: "var(--wd-raised)", overflow: "hidden" }}><div style={{ height: "100%", width: `${b.pct}%`, background: b.color, borderRadius: 99 }} /></div>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: "Cinzel, serif", fontSize: 9, color: "var(--wd-t3)" }}>Avg: {ratingData.avgAiScore}/100 · {ratingData.sampleSize} verified · Rating = Avg ÷ 10</p>
              </div>
            )}
            <div className="wdm-footer">
              <button className="wdm-btn wdm-btn--ghost" onClick={onClose} type="button">Close</button>
              <button className="wdm-btn wdm-btn--primary" onClick={() => setPhase("confirm")} type="button">✏ Update Profile</button>
            </div>
          </>
        ) : (
          <>
            <div className="wdm-confirm">
              <div className="wdm-confirm__icon">✏</div>
              <h3 className="wdm-confirm__title">Update Your Profile</h3>
              <p className="wdm-confirm__text">You will be redirected to the profile editor. Task history and AI data are unaffected.</p>
            </div>
            <div className="wdm-footer">
              <button className="wdm-btn wdm-btn--ghost" onClick={() => setPhase("view")} type="button">← Back</button>
              <button className="wdm-btn wdm-btn--primary" onClick={() => { onClose(); onNavigate("/worker/profile") }} type="button">Proceed →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ════════════ WORKER REVEAL ════════════ */
function WorkerReveal({ workerName, department, areaName }) {
  const firstName = (workerName || "").trim().split(/\s+/)[0] || "Worker"
  const deptCfg = getDeptConfig(department)
  const [time, setTime] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  const pad = n => String(n).padStart(2, "0")
  const HH = pad(time.getHours()), MM = pad(time.getMinutes()), SS = pad(time.getSeconds())
  const goldBright = "rgba(212,178,78,0.92)", goldMid = "rgba(158,125,41,0.65)", goldDim = "rgba(150,118,40,0.38)"
  const sub = { fontFamily: "Cinzel, serif", fontSize: 7, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: goldDim, marginTop: 2, textAlign: "center", display: "block" }
  const col = { fontFamily: "Cinzel, serif", fontSize: 20, fontWeight: 900, color: goldDim, lineHeight: 1, alignSelf: "flex-start", paddingTop: 2, userSelect: "none", margin: "0 2px" }
  return (
    <div className="wd-reveal">
      <div className="wd-reveal__bg" />
      <img src={ruralopsLogo} alt="" aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 170, height: 170, objectFit: "contain", opacity: 0.20, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "grid", gridTemplateColumns: "160px 1fr 160px", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "Cinzel, serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: goldDim }}>The Date</span>
          <p style={{ fontFamily: "Cinzel, serif", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.18em", color: goldMid, margin: 0 }}>{time.toLocaleDateString("en-IN", { weekday: "long" }).toUpperCase()}</p>
          <p style={{ fontFamily: "Cinzel, serif", fontSize: 21, fontWeight: 900, color: deptCfg.color, margin: 0, lineHeight: 1, textShadow: `0 0 14px ${deptCfg.glow}` }}>{time.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}</p>
          <p style={{ fontFamily: "Cinzel, serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: goldMid, margin: 0 }}>{time.getFullYear()}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <p className="wd-reveal__eyebrow">{deptCfg.icon}  {department} Department  ·  Field Operations</p>
          <h2 style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontWeight: 900, lineHeight: 1.15, marginBottom: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: `${deptCfg.color}cc`, textShadow: `0 0 18px ${deptCfg.glow}` }}>Welcome Back</span>
            <span style={{ fontSize: 40, fontWeight: 900, background: "linear-gradient(160deg,#e8c96a 0%,#c8982a 30%,#f0d878 52%,#b07818 72%,#d4a840 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{firstName}</span>
          </h2>
          <p className="wd-reveal__motto">"{areaName || "Assigned Zone"}  ·  On Active Duty"</p>
          <div className="wd-reveal__rule" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          <span style={{ fontFamily: "Cinzel, serif", fontSize: 7, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: `${deptCfg.color}ee` }}>Duty Time</span>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {[HH, MM].map((t, i) => (
              <span key={i} style={{ display: "flex", alignItems: "flex-start" }}>
                {i > 0 && <span style={col}>:</span>}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontFamily: "Cinzel, serif", fontSize: 28, fontWeight: 900, color: goldBright, lineHeight: 1 }}><FlipUnit value={t[0]} /><FlipUnit value={t[1]} /></span>
                  <span style={sub}></span>
                </div>
              </span>
            ))}
            <span style={col}>:</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 900, color: `${deptCfg.color}ee`, lineHeight: 1 }}><FlipUnit value={SS[0]} /><FlipUnit value={SS[1]} /></span>
              <span style={sub}></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════ WORKER ID CARD — display only ════════════ */
function WorkerIDCard({ workerId, workerName, department, areaName, ratingData, photoUrl }) {
  const [flipped, setFlipped] = useState(false), [tilt, setTilt] = useState({ x: 0, y: 0 }), [imgError, setImgError] = useState(false)
  const wrapRef = useRef(null), deptCfg = getDeptConfig(department)
  useEffect(() => { setImgError(false) }, [photoUrl])
  const onMove = useCallback(e => {
    if (!wrapRef.current || flipped) return
    const r = wrapRef.current.getBoundingClientRect()
    setTilt({ x: ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * -7, y: ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 7 })
  }, [flipped])
  const issueDate = new Date().toLocaleDateString("en-IN", { month: "2-digit", year: "numeric" })
  const expDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 2); return d.toLocaleDateString("en-IN", { month: "2-digit", year: "numeric" }) })()
  const idDisplay = (workerId || "").replace(/[^A-Z0-9]/gi, "").toUpperCase().match(/.{1,4}/g)?.join("  ") || "—"
  const showPhoto = photoUrl && !imgError
  return (
    <div className="wid-scene">
      <div ref={wrapRef} className={`wid-wrap${flipped ? " wid-wrap--flipped" : ""}`}
        style={{ transform: flipped ? "perspective(1100px) rotateY(-180deg)" : `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })} onClick={() => setFlipped(f => !f)}
        role="button" tabIndex={0} aria-label="Worker ID badge — click to flip" onKeyDown={e => e.key === "Enter" && setFlipped(f => !f)}>
        <div className="wid-face wid-face--front">
          <div className="wid-texture" /><div className="wid-watermark"><img src={ruralopsLogo} alt="" aria-hidden="true" /></div>
          <div className="wid-top-bar">
            <div className="wid-brand">
              <div className="wid-dept-icon" style={{ background: `${deptCfg.color}22`, border: `1.5px solid ${deptCfg.color}55`, boxShadow: `0 0 10px ${deptCfg.glow}` }}><span style={{ fontSize: 14 }}>{deptCfg.icon}</span></div>
              <div><p className="wid-brand__name">RURAL OPS</p><p className="wid-brand__sub">FIELD WORKER BADGE</p></div>
            </div>
            <div className="wid-chip"><div className="wid-chip__grid"><div/><div/><div/><div/><div/><div/><div/><div/><div/></div></div>
          </div>
          <div className="wid-mid">
            <div className="wid-avatar-frame" style={{ borderColor: `${deptCfg.color}55`, boxShadow: `0 0 14px ${deptCfg.glow}`, background: showPhoto ? "transparent" : "rgba(0,0,0,0.40)" }}>
              {showPhoto ? <img src={photoUrl} alt={workerName} onError={() => setImgError(true)} /> : <span style={{ fontSize: 28 }}>{deptCfg.icon}</span>}
            </div>
            <div className="wid-details">
              <p className="wid-details__name" style={{ color: `${deptCfg.color}dd`, textShadow: `0 0 12px ${deptCfg.glow}` }}>{(workerName || "").toUpperCase()}</p>
              {[["DEPT", department || "Operations"], ["AREA", areaName || "Assigned Zone"], ["RATING", ratingData.rating != null ? ratingData.ratingStr : "Unrated"]].map(([l, v]) => (
                <div className="wid-details__row" key={l}><span className="wid-details__lbl">{l}</span><span className="wid-details__val">{v}</span></div>
              ))}
            </div>
          </div>
          <div className="wid-bottom">
            <div><p className="wid-idnum__label">WORKER ID</p><p className="wid-idnum__val">{idDisplay}</p></div>
            <span className="wid-status wid-status--active"><span className="wid-status__dot" style={{ background: deptCfg.color, boxShadow: `0 0 6px ${deptCfg.glow}` }} />ON DUTY</span>
          </div>
        </div>
        <div className="wid-face wid-face--back">
          <div className="wid-back-wm"><img src={ruralopsLogo} alt="" aria-hidden="true" /></div>
          <div className="wid-mag-stripe" />
          <div className="wid-back__hd"><p className="wid-back__issuer">RURAL OPERATIONS PLATFORM</p><p className="wid-back__sub-lbl">GOVERNMENT OF INDIA · FIELD WORKER REGISTRY</p></div>
          <div className="wid-back__table">
            {[["WORKER ID", workerId || "—", true, null], ["FULL NAME", workerName, false, null], ["DEPARTMENT", department || "Operations", false, null], ["AREA", areaName || "Assigned Zone", false, null], ["AI RATING", ratingData.rating != null ? `${ratingData.ratingStr}  ·  Avg ${ratingData.avgAiScore}/100` : "No verified tasks yet", true, null], ["ISSUED", issueDate, true, null], ["EXPIRES", expDate, true, null], ["STATUS", "ACTIVE & ON DUTY", false, deptCfg.color]].map(([lbl, val, mono, color]) => (
              <div className="wid-back__row" key={lbl}><span className="wid-back__lbl">{lbl}</span><span className={`wid-back__val${mono ? " mono" : ""}`} style={color ? { color } : {}}>{val}</span></div>
            ))}
          </div>
          <div className="wid-back__ft"><p className="wid-back__legal">Issued under the Rural Ops Field Worker Act. Unauthorised use is a punishable offence.</p></div>
        </div>
      </div>
      <p className="wid-hint">Click to flip · Hover to tilt</p>
    </div>
  )
}

/* ════════════ METRIC CARD ════════════ */
function MetricCard({ icon, label, value, accent, sub, index, onClick, raw }) {
  return (
    <div className={`wd-metric wd-metric--${accent}${onClick ? " wd-metric--clickable" : ""}`} style={{ animationDelay: `${0.06 + index * 0.06}s` }} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={onClick ? e => e.key === "Enter" && onClick() : undefined}>
      <div className="wd-metric__top"><div className={`wd-metric__icon wd-metric__icon--${accent}`}>{icon}</div>{onClick && <span className="wd-metric__link">View →</span>}</div>
      <div className="wd-metric__val">{raw ? value : <Counter value={value} />}</div>
      <div className="wd-metric__label">{label}</div>
      {sub && <div className="wd-metric__sub">{sub}</div>}
    </div>
  )
}

/* ════════════ URGENT BANNER — identity-agnostic nav ════════════ */
function UrgentBanner({ urgentTask, navigate }) {
  const [dismissed, setDismissed] = useState(false), [hiding, setHiding] = useState(false)
  const dismiss = () => { setHiding(true); setTimeout(() => setDismissed(true), 280) }
  if (!urgentTask || dismissed) return null
  const age = urgentTask.assignedAt ? Math.round((Date.now() - new Date(urgentTask.assignedAt)) / 60000) : null
  return (
    <div className={`wd-banner${hiding ? " wd-banner--hiding" : ""}`} role="alert">
      <span className="wd-banner__icon">🚨</span>
      <div className="wd-banner__body">
        <p className="wd-banner__title">Urgent Task — Public Health · Immediate Action Required</p>
        <p className="wd-banner__sub">#{urgentTask.complaintId} · {urgentTask.description?.slice(0, 72) || "High priority complaint"}{age != null && <span style={{ marginLeft: 8, color: "#f87171" }}>· Assigned {age}m ago</span>}</p>
      </div>
      <button className="wd-banner__cta" onClick={() => navigate(`/worker/complaint/${urgentTask.complaintId}`)} type="button">Handle Now</button>
      <button className="wd-banner__close" onClick={dismiss} aria-label="Dismiss" type="button">✕</button>
    </div>
  )
}

/* ════════════ TASK PIPELINE — identity-agnostic nav ════════════ */
function TaskPipeline({ analytics, navigate }) {
  const stages = [
    { label: "Assigned",    icon: "⚔",  color: "#a78bfa", count: analytics.assigned   },
    { label: "In Progress", icon: "🔨", color: "#fbbf24", count: analytics.inProgress  },
    { label: "Resolved",    icon: "✅", color: "#34d399", count: analytics.resolved    },
    { label: "Verified",    icon: "🔮", color: "#52b874", count: analytics.verified    },
    { label: "Closed",      icon: "🏁", color: "#5d785d", count: analytics.closed      },
  ]
  const total = analytics.total || 1
  return (
    <div className="wd-card">
      <div className="wd-card__header">
        <div><h3 className="wd-card__title">📊 Task Pipeline</h3><p className="wd-card__sub">{analytics.total} total · {analytics.completionRate}% completion rate</p></div>
        <button className="wd-card-cta wd-card-cta--ghost" style={{ flex: "none", minWidth: "auto", padding: "5px 12px" }} onClick={() => navigate("/worker/tasks")} type="button">Full Board →</button>
      </div>
      <div style={{ padding: "14px 17px" }}>
        <div className="wd-pipeline">
          {stages.map((s, i) => (
            <div key={s.label} className="wd-pipeline__stage" onClick={() => navigate("/worker/tasks")} style={{ cursor: "pointer" }}>
              <div className="wd-pipeline__icon" style={{ background: `${s.color}18`, border: `1px solid ${s.color}35`, color: s.color }}>{s.icon}</div>
              <div className="wd-pipeline__count" style={{ color: s.color }}>{s.count}</div>
              <div className="wd-pipeline__label">{s.label}</div>
              {i < stages.length - 1 && <div className="wd-pipeline__arrow">→</div>}
            </div>
          ))}
        </div>
        <div className="wd-pipeline__bar-track" style={{ marginTop: 14 }}>
          {stages.map(s => <div key={s.label} className="wd-pipeline__bar-fill" style={{ width: `${(s.count / total) * 100}%`, background: s.color, minWidth: s.count > 0 ? 4 : 0 }} />)}
        </div>
      </div>
    </div>
  )
}

/* ════════════ FIELD ANALYTICS PANEL ════════════ */
function FieldAnalyticsPanel({ analytics, ratingData }) {
  return (
    <div className="wd-mini-analytics">
      <p className="wd-mini-analytics__title">⚙️ Field Analytics</p>
      {[
        { label: "Task Completion", pct: analytics.completionRate,   cls: "--green",  val: `${analytics.completed}/${analytics.total}` },
        { label: "AI Verification", pct: analytics.verificationRate, cls: "--violet", val: `${analytics.verified + analytics.closed}/${analytics.completed || 0}` },
        { label: "Urgency Rate",    pct: analytics.urgencyRate,      cls: "--red",    val: `${analytics.urgent} urgent` },
      ].map(({ label, pct, cls, val }) => (
        <div className="wd-bar-item" key={label}>
          <div className="wd-bar-item__head"><span>{label}</span><span className="wd-bar-item__pct">{pct}%<span style={{ color: "var(--wd-t3)", fontWeight: 400, fontSize: 9 }}> ({val})</span></span></div>
          <div className="wd-bar-track"><div className={`wd-bar-fill wd-bar-fill${cls}`} style={{ width: `${pct}%` }} /></div>
        </div>
      ))}
      <div className="wd-mini-stats">
        {[{ v: analytics.total, l: "Total", c: "--gold" }, { v: analytics.completed, l: "Done", c: "--green" }, { v: analytics.urgent, l: "Urgent", c: "--red" }].map(({ v, l, c }) => (
          <div className={`wd-mini-stat wd-mini-stat${c}`} key={l}><span className="wd-mini-stat__v">{v}</span><span className="wd-mini-stat__l">{l}</span></div>
        ))}
      </div>
      <div className="wd-rating-row">
        <div><span className="wd-rating__label">AI Clean Score Rating</span><span style={{ display: "block", fontFamily: "Cinzel, serif", fontSize: 8, color: "var(--wd-t3)", marginTop: 1 }}>{ratingData.sampleSize > 0 ? `${ratingData.sampleSize} verified · avg ${ratingData.avgAiScore}/100` : "No verified tasks yet"}</span></div>
        <span className="wd-rating__val">{ratingData.rating != null ? ratingData.ratingStr : "N/A"}</span>
      </div>
      {ratingData.rating != null && <div className="wd-bar-track" style={{ marginTop: 6 }}><div className="wd-bar-fill wd-bar-fill--green" style={{ width: `${(ratingData.rating / 10) * 100}%` }} /></div>}
      {analytics.avgResolutionStr && <div className="wd-rating-row" style={{ marginTop: 8 }}><span className="wd-rating__label">Avg Resolution Time</span><span className="wd-rating__val">{analytics.avgResolutionStr}</span></div>}
    </div>
  )
}

/* ════════════ AI RATING BREAKDOWN ════════════ */
function RatingBreakdownCard({ ratingData }) {
  if (ratingData.sampleSize === 0) return (
    <div className="wd-card"><div className="wd-card__header"><h3 className="wd-card__title">🤖 AI Rating Breakdown</h3></div><div className="wd-card__body"><p className="wd-card__empty">No AI-verified tasks yet.</p></div></div>
  )
  return (
    <div className="wd-card">
      <div className="wd-card__header"><div><h3 className="wd-card__title">🤖 AI Rating Breakdown</h3><p className="wd-card__sub">Avg: {ratingData.avgAiScore}/100 · {ratingData.sampleSize} verified tasks</p></div><div className="wd-rating-badge"><span className="wd-rating-badge__val">{ratingData.ratingStr}</span></div></div>
      <div className="wd-card__body">
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {ratingData.breakdown.map(b => (
            <div key={b.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontFamily: "Cinzel, serif", fontSize: 9.5, color: b.color }}>{b.label}</span><span style={{ fontFamily: "Cinzel, serif", fontSize: 9.5, color: "var(--wd-t2)" }}>{b.count} ({b.pct}%)</span></div>
              <div className="wd-bar-track"><div style={{ height: "100%", borderRadius: "99px", width: `${b.pct}%`, background: b.color, opacity: 0.80, transition: "width 0.7s ease" }} /></div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 12, fontFamily: "Cinzel, serif", fontSize: 9, color: "var(--wd-t3)", lineHeight: 1.6 }}>Rating = Avg AI Score ÷ 10.</p>
      </div>
    </div>
  )
}

/* ════════════ DAILY MISSION ════════════ */
function DailyMissionCard({ analytics, department }) {
  return (
    <div className="wd-card wd-card--mission">
      <div className="wd-card__header"><h3 className="wd-card__title">🎯 Today's Mission</h3></div>
      <div className="wd-card__body">
        <div className="wd-mission">
          {[
            { icon: "📋", label: "Active Tasks",       val: `${analytics.pending} complaint${analytics.pending !== 1 ? "s" : ""} pending`, urgent: false },
            ...(analytics.urgent > 0 ? [{ icon: "⚠️", label: "Priority Public Health", val: `${analytics.urgent} urgent issue${analytics.urgent !== 1 ? "s" : ""} — immediate action`, urgent: true }] : []),
            { icon: "🤖", label: "AI Queue",           val: `${analytics.resolved} task${analytics.resolved !== 1 ? "s" : ""} awaiting verification`, urgent: false },
            { icon: "🛠",  label: "Department",         val: department || "Rural Operations", urgent: false },
          ].map((m, i) => (
            <div key={i} className={`wd-mission__item${m.urgent ? " wd-mission__item--urgent" : ""}`}>
              <span className="wd-mission__icon">{m.icon}</span>
              <div><p className="wd-mission__label">{m.label}</p><p className="wd-mission__val">{m.val}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════════ ACTIVITY FEED ════════════ */
function ActivityFeed({ complaints }) {
  const events = []
  complaints.forEach(c => {
    if (c.verifiedAt) events.push({ time: new Date(c.verifiedAt), icon: "🔮", text: `Complaint #${c.complaintId} AI verified`, color: "#52b874", score: c.aiCleanScore })
    if (c.resolvedAt) events.push({ time: new Date(c.resolvedAt), icon: "✅", text: `Completed task #${c.complaintId}`, color: "#34d399" })
    if (c.startedAt)  events.push({ time: new Date(c.startedAt),  icon: "🔨", text: `Started work on #${c.complaintId}`, color: "#fbbf24" })
    if (c.assignedAt) events.push({ time: new Date(c.assignedAt), icon: "⚔",  text: `Task #${c.complaintId} assigned`, color: "#a78bfa" })
  })
  events.sort((a, b) => b.time - a.time)
  return (
    <div className="wd-card">
      <div className="wd-card__header"><h3 className="wd-card__title">⚡ Activity Timeline</h3></div>
      <div className="wd-act">
        {events.slice(0, 6).length === 0
          ? <p className="wd-card__empty" style={{ padding: "18px 20px" }}>No activity yet.</p>
          : events.slice(0, 6).map((ev, i) => (
            <div key={i} className="wd-act__row">
              <div className="wd-act__dot" style={{ background: `${ev.color}20`, border: `1px solid ${ev.color}40` }}>{ev.icon}</div>
              <div className="wd-act__body">
                <p className="wd-act__text">{ev.text}{ev.score != null && <span style={{ marginLeft: 6, color: ev.color, fontSize: 11, fontWeight: 700 }}> · AI: {ev.score}/100</span>}</p>
                <p className="wd-act__time">{ev.time.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {ev.time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

/* ════════════ TASK BOARD — identity-agnostic nav ════════════ */
function RecentTasksCard({ complaints, navigate, onActionDone, onAuthError }) {
  const [tab, setTab] = useState("active"), [actionLoading, setLoading] = useState({}), [actionError, setError] = useState(null)
  const sorted = [...complaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const tabDefs = [
    { id: "active", label: "Active",    icon: "⚔",  filter: c => ["ASSIGNED","IN_PROGRESS"].includes(c.status) },
    { id: "done",   label: "Completed", icon: "✅", filter: c => ["RESOLVED","VERIFIED","CLOSED"].includes(c.status) },
    { id: "all",    label: "All",       icon: "📋", filter: () => true },
  ]
  const tasks = sorted.filter(tabDefs.find(t => t.id === tab).filter)
  async function handleStart(complaintId) {
    setLoading(l => ({ ...l, [complaintId]: "starting" })); setError(null)
    try {
      const res = await authFetch(`${API}/workers/complaints/${complaintId}/start`, { method: "POST" })
      if (!res.ok) throw new Error(`Server responded ${res.status}`)
      await onActionDone()
    } catch (e) {
      if (e.code === 401)      onAuthError(e.message)
      else if (e.code === 403) setError("You do not have permission to start this task.")
      else                     setError(`Could not start: ${e.message}`)
    }
    setLoading(l => ({ ...l, [complaintId]: null }))
  }
  return (
    <div className="wd-taskboard">
      <div className="wd-taskboard__tabs">
        {tabDefs.map(t => { const count = sorted.filter(t.filter).length; return (
          <button key={t.id} className={`wd-taskboard__tab${tab === t.id ? " wd-taskboard__tab--active" : ""}`} onClick={() => setTab(t.id)} type="button">
            <span>{t.icon}</span><span>{t.label}</span><span className="wd-taskboard__tab-count">{count}</span>
          </button>
        ) })}
        <span className="wd-live-badge" style={{ marginLeft: "auto", flexShrink: 0 }}><span className="wd-live-badge__dot" />Live</span>
      </div>
      {actionError && <div className="wd-taskboard__error">⚠ {actionError}<button onClick={() => setError(null)} type="button">✕</button></div>}
      <div className="wd-taskboard__head-row">
        <span style={{ flex: "0 0 34px" }} /><span style={{ flex: 1 }}>Task</span>
        <span style={{ flex: "0 0 150px", textAlign: "center" }}>Status</span>
        <span style={{ flex: "0 0 74px", textAlign: "center" }}>Score</span>
        <span style={{ flex: "0 0 180px", textAlign: "right" }}>Actions</span>
      </div>
      <div className="wd-taskboard__list">
        {tasks.length === 0
          ? <div className="wd-taskboard__empty"><span style={{ fontSize: 30 }}>✅</span><p>No tasks in this view.</p></div>
          : tasks.map(t => {
            const color = STATUS_COLOR[t.status] || "#b48c28"
            const isStarting = actionLoading[t.complaintId] === "starting"
            const isActive = ["ASSIGNED","IN_PROGRESS"].includes(t.status)
            return (
              <div key={t.complaintId} className={`wd-taskboard__row${isActive ? " wd-taskboard__row--active" : ""}`}>
                <div className="wd-taskboard__cat" onClick={() => navigate(`/worker/complaint/${t.complaintId}`)}>{CAT_ICON[t.category] || "🔧"}</div>
                <div className="wd-taskboard__info" onClick={() => navigate(`/worker/complaint/${t.complaintId}`)}>
                  <p className="wd-taskboard__id">#{t.complaintId}</p>
                  <p className="wd-taskboard__desc">{t.description?.length > 62 ? t.description.slice(0, 62) + "…" : (t.description || "No description")}</p>
                  <p className="wd-taskboard__meta">
                    {t.areaName && <span>📍 {t.areaName}</span>}
                    <span>{new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    {t.category && <span>{t.category.replace(/_/g, " ")}</span>}
                  </p>
                </div>
                <div className="wd-taskboard__status-cell">
                  <span className="wd-act__pill" style={{ "--pill": color }}><span className="wd-act__pill-dot" />{STATUS_ICON[t.status]} {t.status?.replace(/_/g, " ")}</span>
                </div>
                <div className="wd-taskboard__score-cell">
                  {t.aiCleanScore != null
                    ? <span className={`wd-taskboard__score-val${t.aiCleanScore >= 70 ? " wd-taskboard__score-val--good" : t.aiCleanScore >= 40 ? " wd-taskboard__score-val--mid" : " wd-taskboard__score-val--low"}`}>{t.aiCleanScore}<span style={{ fontSize: 9, opacity: 0.6 }}>/100</span></span>
                    : <span className="wd-taskboard__score-na">—</span>}
                </div>
                <div className="wd-taskboard__actions">
                  {t.status === "ASSIGNED" && <button className="wd-tb-btn wd-tb-btn--start" onClick={() => handleStart(t.complaintId)} disabled={isStarting} type="button">{isStarting ? "…" : "▶ Start Work"}</button>}
                  {t.status === "IN_PROGRESS" && <button className="wd-tb-btn wd-tb-btn--complete" onClick={() => navigate(`/worker/complaint/${t.complaintId}?action=complete`)} type="button">✓ Mark Done</button>}
                  {["RESOLVED","VERIFIED","CLOSED"].includes(t.status) && <button className="wd-tb-btn wd-tb-btn--view" onClick={() => navigate(`/worker/complaint/${t.complaintId}`)} type="button">👁 View</button>}
                  <button className="wd-tb-btn wd-tb-btn--details" onClick={() => navigate(`/worker/complaint/${t.complaintId}`)} type="button">Details →</button>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}



/* ════════════════════════════════════════════════════════════
   MAIN WORKER DASHBOARD
   Architecture: JWT → userId → WorkerAccount → data
   workerId = profile.workerId — used for DISPLAY only.
   No useParams. No workerId in any route or URL.
════════════════════════════════════════════════════════════ */
export default function WorkerDashboard() {
  const navigate = useNavigate()

  // Guard: token + WORKER role only
  const isAuthorized = !!(getToken() && getAccountType() === "WORKER")

  const [complaints,     setComplaints]     = useState([])
  const [profile,        setProfile]        = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [authError,      setAuthError]      = useState(null)
  const [visible,        setVisible]        = useState(false)
  const [showProfile,    setShowProfile]    = useState(false)
  const [profileMissing, setProfileMissing] = useState(false)

  // GET /workers/complaints — worker from JWT, no ID in URL
  const fetchComplaints = useCallback(async () => {
    if (!isAuthorized) return
    setAuthError(null)
    try {
      const res = await authFetch(`${API}/workers/complaints`)
      // 404 = no complaints yet (fresh worker) — treat as empty, not error
      if (res.status === 404) { setComplaints([]); setError(null); return }
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setComplaints(Array.isArray(data) ? data : [])
      setError(null)
    } catch (e) {
      if (e.code === 401) { setAuthError(e.message); setTimeout(() => navigate("/login", { replace: true }), 2000) }
      else if (e.code === 403) setAuthError(e.message)
      else { setError(e.message); setComplaints([]) }
    }
  }, [isAuthorized, navigate])

  // GET /worker/profile — worker from JWT, no ID in URL
  // 404 = profile not yet created → redirect to setup form
  // profile.workerId is used for DISPLAY only (ID card, badge, profile modal)
  const fetchProfile = useCallback(async () => {
    if (!isAuthorized) return
    try {
      const res = await authFetch(`${API}/worker/profile`)
      if (res.status === 404) {
        setProfileMissing(true)
        return
      }
      if (!res.ok) return
      const data = await res.json()
      setProfile(data)
      setProfileMissing(false)
    } catch (_) { /* swallow — fetchComplaints handles 401 */ }
  }, [isAuthorized])

  useEffect(() => {
    async function init() { setLoading(true); await Promise.all([fetchComplaints(), fetchProfile()]); setLoading(false) }
    init()
  }, [fetchComplaints, fetchProfile])

  useEffect(() => {
    // Set visible as soon as loading is done — error/auth states have their
    // own early-return screens so we don't need to gate visibility on them.
    if (!loading) { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t) }
  }, [loading])

  /* ── derived display values ── */
  const workerName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") || complaints[0]?.workerName || "Field Worker" : complaints[0]?.workerName || "Field Worker"
  const areaName   = profile?.areaName   || complaints[0]?.areaName || "Assigned Zone"
  const department = profile?.workerType || profile?.skillCategory  || "Rural Operations"
  const photoUrl   = resolvePhotoUrl(profile)
  const workerId   = profile?.workerId ?? null  // DISPLAY ONLY — never used in routes

  const analytics  = computeAnalytics(complaints)
  const ratingData = computeRatingData(complaints)
  const deptCfg    = getDeptConfig(department)
  const urgentTask = complaints.find(c => c.category === "PUBLIC_HEALTH" && c.status === "ASSIGNED")
  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const today      = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  /* ── early returns ── */
  // 1. Unauthorized — check first before anything else renders
  if (!isAuthorized) return (
    <><Navbar />
      <div className="wd-page" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", padding:48 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>⚔</div>
          <div style={{ fontFamily:"Cinzel,serif", fontSize:48, fontWeight:900, color:"var(--wd-gold)", marginBottom:10 }}>401</div>
          <h2 style={{ fontFamily:"Cinzel,serif", fontSize:22, color:"var(--wd-green)", marginBottom:10 }}>Unauthorised Access</h2>
          <p style={{ color:"var(--wd-t2)", marginBottom:26, fontSize:15 }}>You do not have the authority to enter this command post.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            <a href="/login" className="wd-cta wd-cta--primary">→ Login</a>
            <a href="/" className="wd-cta wd-cta--ghost">← Home</a>
          </div>
        </div>
      </div>
    <Footer /></>
  )

  if (authError) return (
    <><Navbar />
      <div className="wd-page" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", padding:48 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
          <h2 style={{ fontFamily:"Cinzel,serif", fontSize:22, color:"var(--wd-green)", marginBottom:10 }}>Access Denied</h2>
          <p style={{ color:"var(--wd-t2)", marginBottom:26, fontSize:15 }}>{authError}</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            {authError.includes("expired") && <a href="/login" className="wd-cta wd-cta--primary">→ Log In Again</a>}
            <a href="/" className="wd-cta wd-cta--ghost">← Home</a>
          </div>
        </div>
      </div>
    <Footer /></>
  )

  // 2. Profile missing — show a full-screen prompt to complete the profile form
  if (profileMissing && !loading) {
    return (
      <><Navbar />
        <div className="wd-page" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
          <div className="wd-ambient" aria-hidden="true"><div className="wd-orb wd-orb--1"/><div className="wd-orb wd-orb--2"/></div>
          <div style={{ position:"relative", zIndex:1, maxWidth:480, width:"100%", margin:"0 auto", padding:"0 24px", textAlign:"center" }}>

            {/* Animated warning ring */}
            <div style={{ position:"relative", width:110, height:110, margin:"0 auto 28px" }}>
              <svg viewBox="0 0 110 110" style={{ position:"absolute", inset:0, width:"100%", height:"100%", animation:"wd-ringPulse 2.4s ease-in-out infinite" }}>
                <circle cx="55" cy="55" r="50" fill="none" stroke="rgba(200,152,42,0.18)" strokeWidth="2"/>
                <circle cx="55" cy="55" r="40" fill="none" stroke="rgba(200,152,42,0.30)" strokeWidth="1.5" strokeDasharray="6 4"/>
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
                width:110, height:110, borderRadius:"50%",
                background:"linear-gradient(145deg,rgba(200,152,42,0.12),rgba(100,70,10,0.08))",
                border:"2px solid rgba(200,152,42,0.35)",
                boxShadow:"0 0 32px rgba(200,152,42,0.18), inset 0 0 20px rgba(200,152,42,0.06)" }}>
                <span style={{ fontSize:42 }}>⚔</span>
              </div>
            </div>

            <p style={{ fontFamily:"Cinzel,serif", fontSize:9.5, fontWeight:700, letterSpacing:".22em", textTransform:"uppercase",
              color:"var(--wd-gold)", background:"rgba(201,162,39,.10)", border:"1px solid rgba(201,162,39,.28)",
              padding:"5px 14px", borderRadius:3, display:"inline-block", marginBottom:20 }}>
              Action Required
            </p>

            <h2 style={{ fontFamily:"Cinzel Decorative,serif", fontSize:"clamp(18px,2.2vw,24px)",
              color:"var(--wd-t1)", letterSpacing:".03em", lineHeight:1.2, marginBottom:14 }}>
              Profile Not Set Up
            </h2>

            <p style={{ fontFamily:"Crimson Pro,serif", fontSize:16, color:"var(--wd-t2)", lineHeight:1.75, marginBottom:8 }}>
              Your field worker profile has not been created yet.
              Complete it to activate your command post and begin receiving task assignments.
            </p>
            <p style={{ fontFamily:"Cinzel,serif", fontSize:10, color:"var(--wd-t3)", letterSpacing:".08em",
              marginBottom:32 }}>
              Takes less than 2 minutes.
            </p>

            <button
              className="wd-cta wd-cta--primary"
              onClick={() => navigate("/worker/profile")}
              type="button"
              style={{ fontSize:11, padding:"12px 32px", letterSpacing:".16em" }}
            >
              ⚔ Complete Your Profile →
            </button>

            <p style={{ marginTop:16, fontFamily:"Cinzel,serif", fontSize:9, color:"var(--wd-t4)",
              letterSpacing:".10em", textTransform:"uppercase" }}>
              You'll be redirected back here after completion
            </p>

          </div>
        </div>
      <Footer /></>
    )
  }

  if (loading) return (
    <><Navbar />
      <div className="wd-page">
        <div className="wd-ambient" aria-hidden="true"><div className="wd-orb wd-orb--1" /><div className="wd-orb wd-orb--2" /></div>
        <div className="wd-wrap" style={{ opacity:1, transform:"none" }}>
          <Sk w="100%" h={130} r={20} mb={20} />
          <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:22 }}>
            <div><Sk w="100%" h={190} r={14} mb={14} /><Sk w="100%" h={230} r={14} /></div>
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>{[0,1,2,3].map(i=><Sk key={i} w="100%" h={105} r={11}/>)}</div>
              <Sk w="100%" h={200} r={11} mb={14} /><Sk w="100%" h={150} r={11} />
            </div>
          </div>
        </div>
      </div>
    <Footer /></>
  )

  if (error) return (
    <><Navbar />
      <div className="wd-page" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", padding:48 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
          <h2 style={{ fontFamily:"Cinzel,serif", fontSize:22, color:"var(--wd-green)", marginBottom:10 }}>Failed to Load Dashboard</h2>
          <p style={{ color:"var(--wd-t2)", marginBottom:26, fontSize:15 }}>{error}</p>
          <button className="wd-cta wd-cta--primary" onClick={fetchComplaints} type="button">↺ Retry</button>
        </div>
      </div>
    <Footer /></>
  )

  return (
    <><Navbar />
      {showProfile && (
        <WorkerProfileModal
          workerId={workerId} workerName={workerName} areaName={areaName}
          department={department} complaints={complaints} profile={profile}
          onClose={() => setShowProfile(false)} onNavigate={navigate}
        />
      )}
      <div className="wd-page">
        <div className="wd-ambient" aria-hidden="true">
          <div className="wd-orb wd-orb--1" /><div className="wd-orb wd-orb--2" /><div className="wd-orb wd-orb--3" />
          <div className="wd-dot-grid" />
        </div>
        <div className={`wd-wrap${visible ? " wd-wrap--visible" : ""}`}>
          <WorkerReveal workerName={workerName} department={department} areaName={areaName} />
          <UrgentBanner urgentTask={urgentTask} navigate={navigate} />

          <header className="wd-header">
            <div className="wd-header__left">
              <p className="wd-header__eyebrow"><span className="wd-header__dot" />{today}</p>
              <h1 className="wd-header__greeting">{greeting},<br /><span className="wd-header__name">{workerName.trim().split(/\s+/)[0]}</span></h1>
              <div className="wd-header__chips">
                <span className="wd-chip wd-chip--default">🛠 {areaName}</span>
                <span className="wd-chip wd-chip--active">{deptCfg.icon} {department}</span>
                <span className="wd-chip wd-chip--duty">⚡ On Active Duty</span>
                {workerId && <span className="wd-chip wd-chip--mono">ID: {workerId}</span>}
                {ratingData.rating != null && <span className="wd-chip wd-chip--rating">🤖 {ratingData.ratingStr}</span>}
              </div>
              <p className="wd-header__tagline">Execute assigned tasks, log field progress, review AI verification scores, and manage operational performance from one unified mission console.</p>
              <div className="wd-stat-strip">
                {[
                  { v: analytics.total,               l: "Total",     c: "",         nav: true  },
                  { v: analytics.assigned,             l: "Assigned",  c: "--violet", nav: true  },
                  { v: analytics.inProgress,           l: "Active",    c: "--amber",  nav: true  },
                  { v: analytics.completed,            l: "Completed", c: "--green",  nav: true  },
                  { v: `${analytics.completionRate}%`, l: "Rate",      c: "--blue",   nav: false, raw: true },
                  { v: ratingData.rating != null ? ratingData.ratingStr : "N/A", l: "AI Rating", c: "--gold", nav: false, raw: true },
                ].map(({ v, l, c, nav, raw }, i) => (
                  <div key={i} style={{ display:"contents" }}>
                    {i > 0 && <div className="wd-stat-sep" />}
                    <div className={`wd-stat${nav ? " wd-stat--link" : ""}`} onClick={nav ? () => navigate("/worker/tasks") : undefined} role={nav ? "button" : undefined} tabIndex={nav ? 0 : undefined}>
                      <span className={`wd-stat__v${c}`}>{raw ? v : <Counter value={v} />}</span>
                      <span className="wd-stat__l">{l}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="wd-cta-row">
                <button className="wd-cta wd-cta--primary" onClick={() => navigate("/worker/tasks")} type="button">📋 My Tasks {analytics.assigned > 0 && <span className="wd-cta__badge">{analytics.assigned} new</span>}</button>
                <button className="wd-cta wd-cta--secondary" onClick={() => navigate("/worker/analytics")} type="button">📊 Analytics</button>
                <button className="wd-cta wd-cta--ghost" onClick={() => setShowProfile(true)} type="button">👤 Profile</button>
              </div>
            </div>
            <div className="wd-header__right">
              <WorkerIDCard workerId={workerId} workerName={workerName} department={department} areaName={areaName} ratingData={ratingData} photoUrl={photoUrl} />
            </div>
          </header>

          <div className="wd-body">
            <aside className="wd-sidebar">
              <div className="wd-profile-card">
                <div className="wd-profile-card__av-wrap">
                  <div className="wd-profile-card__av-icon" style={{ borderColor: `${deptCfg.color}45`, background: photoUrl ? "transparent" : `${deptCfg.color}18` }}>
                    {photoUrl ? <img src={photoUrl} alt={workerName} onError={e => { e.currentTarget.style.display="none"; e.currentTarget.parentElement.style.background=`${deptCfg.color}18` }} /> : <span style={{ fontSize: 30 }}>{deptCfg.icon}</span>}
                  </div>
                  <span className="wd-profile-card__verified" style={{ background: deptCfg.color }} />
                </div>
                <h2 className="wd-profile-card__name">{workerName}</h2>
                {workerId && <p className="wd-profile-card__id">{workerId}</p>}
                <p className="wd-profile-card__area">🛠 {areaName}</p>
                {profile?.villageName && <p style={{ fontFamily:"Cinzel, serif", fontSize:10, color:"var(--wd-t3)", margin:"2px 0" }}>🏘 {profile.villageName}</p>}
                {ratingData.rating != null && <p style={{ fontFamily:"Cinzel, serif", fontSize:11, color:"#ceaa48", margin:"4px 0" }}>🤖 {ratingData.ratingStr}  ·  avg {ratingData.avgAiScore}/100</p>}
                <div className="wd-profile-card__rule" />
                <button className="wd-profile-card__btn" onClick={() => setShowProfile(true)} type="button">👤 View Profile</button>
              </div>
              <FieldAnalyticsPanel analytics={analytics} ratingData={ratingData} />
              <nav className="wd-quick">
                <p className="wd-quick__label">Quick Actions</p>
                {[
                  { icon: "📋", label: "All Tasks",      path: "/worker/tasks",                    v: "primary", b: analytics.assigned  },
                  { icon: "⚔",  label: "Assigned",       path: "/worker/tasks?status=ASSIGNED",    v: "default", b: 0 },
                  { icon: "🔨", label: "In Progress",     path: "/worker/tasks?status=IN_PROGRESS", v: "default", b: analytics.inProgress },
                  { icon: "📊", label: "Analytics",       path: "/worker/analytics",                v: "default", b: 0 },
                  { icon: "⭐", label: "Citizen Ratings", path: "/worker/ratings",                  v: "default", b: 0 },
                  { icon: "🕒", label: "Activity Log",    path: "/worker/activity",                 v: "default", b: 0 },
                  { icon: "🔔", label: "Notifications",   path: "/worker/notifications",            v: "default", b: analytics.urgent },
                ].map(({ icon, label, path, v, b }) => (
                  <button key={label} className={`wd-qbtn wd-qbtn--${v}`} onClick={() => navigate(path)} type="button">
                    <span className="wd-qbtn__icon">{icon}</span><span>{label}</span>
                    {b > 0 && <span className="wd-qbtn__badge">{b}</span>}
                    <span className="wd-qbtn__arrow">›</span>
                  </button>
                ))}
              </nav>
            </aside>

            <main className="wd-main">
              <section className="wd-section">
                <div className="wd-section__head"><h2 className="wd-section__title">Work Overview</h2><p className="wd-section__sub">Live metrics — {analytics.total} total complaints assigned to you.</p></div>
                <div className="wd-metrics-grid">
                  <MetricCard icon="📋" label="Assigned"   value={analytics.assigned}   accent="violet" sub="Awaiting start"      index={0} onClick={() => navigate("/worker/tasks?status=ASSIGNED")} />
                  <MetricCard icon="⏳" label="In Progress" value={analytics.inProgress} accent="amber"  sub="Currently active"    index={1} onClick={() => navigate("/worker/tasks?status=IN_PROGRESS")} />
                  <MetricCard icon="✅" label="Completed"   value={analytics.completed}  accent="green"  sub="Done & verified"     index={2} onClick={() => navigate("/worker/tasks?status=RESOLVED")} />
                  <MetricCard icon="⚠" label="Urgent"      value={analytics.urgent}     accent="red"    sub="Public health"       index={3} onClick={() => navigate("/worker/tasks?category=PUBLIC_HEALTH")} />
                  <MetricCard icon="🔮" label="AI Verified" value={analytics.verified}   accent="steel"  sub="Passed verification" index={4} onClick={() => navigate("/worker/tasks?status=VERIFIED")} />
                  <MetricCard icon="🏁" label="Closed"      value={analytics.closed}     accent="gold"   sub="Archived & closed"   index={5} />
                  <MetricCard icon="🤖" label="AI Rating"   value={ratingData.rating != null ? ratingData.ratingStr : "N/A"} accent="gold" sub={ratingData.sampleSize > 0 ? `${ratingData.sampleSize} verified tasks` : "No data yet"} index={6} raw onClick={() => navigate("/worker/ratings")} />
                  {analytics.avgResolutionStr != null
                    ? <MetricCard icon="⏱" label="Avg Time" value={analytics.avgResolutionStr} accent="steel" sub="Per task · resolved" index={7} raw />
                    : <MetricCard icon="📈" label="Rate"     value={`${analytics.completionRate}%`} accent="steel" sub="Completion" index={7} raw />}
                </div>
              </section>

              <section className="wd-section">
                <div className="wd-twin-grid">
                  <div className="wd-stack"><TaskPipeline analytics={analytics} navigate={navigate} /><RatingBreakdownCard ratingData={ratingData} /></div>
                  <div className="wd-stack"><DailyMissionCard analytics={analytics} department={department} /><ActivityFeed complaints={complaints} /></div>
                </div>
              </section>

              <section className="wd-section wd-section--taskboard">
                <div className="wd-section__head"><h2 className="wd-section__title">🔧 Task Board</h2><p className="wd-section__sub">All complaints assigned to you — start work, complete tasks, track AI scores.</p></div>
                <RecentTasksCard
                  complaints={complaints} navigate={navigate}
                  onActionDone={fetchComplaints}
                  onAuthError={msg => { setAuthError(msg); setTimeout(() => navigate("/login", { replace: true }), 2000) }}
                />
              </section>
            </main>
          </div>
        </div>
      </div>
    <Footer /></>
  )
}