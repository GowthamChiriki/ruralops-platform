import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import "../../Styles/WorkerComplaintDetail.css"

const API = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app"

/* ════════════════════════════════════════════
   AUTH HELPERS
════════════════════════════════════════════ */
function getToken() { return localStorage.getItem("accessToken") }
function getRole()  { return localStorage.getItem("accountType") }
function getAccountId() { return localStorage.getItem("accountId") }

async function authFetch(url, options = {}) {
  const token = getToken()

  const res = await fetch(url, {
    ...options,
    headers: {
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

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Server error: ${res.status}`)
  }

  return res
}

/* ════════════════════════════════════════════
   ROLE GUARD HOOK — only ROLE_WORKER may enter
════════════════════════════════════════════ */
function useRequireRole(requiredRole) {
  const nav = useNavigate()

  useEffect(() => {
    const token = getToken()
    const role  = getRole()

    if (!token) {
      nav("/login", { replace: true })
      return
    }
    if (role !== requiredRole) {
      nav("/unauthorized", { replace: true })
    }
  }, [nav, requiredRole])
}

/* ════════════════════════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════════════════════════ */
const STATUS_COLOR = {
  SUBMITTED:           "#a8bdd4",
  AWAITING_ASSIGNMENT: "#f97316",
  ASSIGNED:            "#a78bfa",
  IN_PROGRESS:         "#fbbf24",
  RESOLVED:            "#4aad7e",
  VERIFIED:            "#e8c96a",
  CLOSED:              "#7a8fa6",
}
const STATUS_ICON = {
  SUBMITTED: "📜", AWAITING_ASSIGNMENT: "⏳", ASSIGNED: "⚔",
  IN_PROGRESS: "🔨", RESOLVED: "✅", VERIFIED: "👑", CLOSED: "🏰",
}
const CAT_ICON = {
  GARBAGE: "🗑", DRAINAGE: "🌊", ROAD_DAMAGE: "🛤",
  STREET_LIGHT: "🕯", WATER_SUPPLY: "💧", PUBLIC_HEALTH: "⚕", OTHER: "📋",
}
const LIFECYCLE = [
  { key: "SUBMITTED",           label: "Submitted",           icon: "📜", field: "createdAt"  },
  { key: "AWAITING_ASSIGNMENT", label: "Awaiting Assignment", icon: "⏳", field: null         },
  { key: "ASSIGNED",            label: "Assigned",            icon: "⚔",  field: "assignedAt" },
  { key: "IN_PROGRESS",         label: "In Progress",         icon: "🔨", field: "startedAt"  },
  { key: "RESOLVED",            label: "Resolved",            icon: "✅", field: "resolvedAt" },
  { key: "VERIFIED",            label: "Verified",            icon: "👑", field: "verifiedAt" },
  { key: "CLOSED",              label: "Closed",              icon: "🏰", field: "closedAt"   },
]

function fmt(date) {
  if (!date) return null
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}
function dur(from, to) {
  if (!from || !to) return null
  const m = Math.round((new Date(to) - new Date(from)) / 60000)
  if (m < 1)  return "< 1m"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60), r = m % 60
  return r ? `${h}h ${r}m` : `${h}h`
}
function scoreCol(s) {
  if (s == null) return "#7a8fa6"
  if (s >= 70)   return "#4aad7e"
  if (s >= 40)   return "#fbbf24"
  return "#f87171"
}
function scoreTag(s) {
  if (s == null) return "Unscored"
  if (s >= 80)   return "Excellent"
  if (s >= 60)   return "Good"
  if (s >= 40)   return "Average"
  if (s >= 20)   return "Poor"
  return "Very Poor"
}
function chipVars(hex) {
  return { "--cc": hex, "--cc-border": hex + "60", "--cc-bg": hex + "1a" }
}

/* ── Skeleton ── */
function Sk({ w = "100%", h, r = 8, mb = 0 }) {
  return <div className="cdp-sk" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
}

/* ════════════════════════════════════════════════════════════════════
   COMPLETE WORK PANEL

   Photo upload flow (two steps):
     Step 1: POST /worker/files/{workerId}/attachment  (multipart, field="file")
             → WorkerFileUploadController.uploadAttachment()
             → validates jpeg/png/pdf, max 10 MB
             → returns { "message": "...", "url": "<public-url>" }

     Step 2: POST /workers/complaints/{complaintId}/complete  (JSON)
             → body: { complaintId, afterImageUrl, workerNotes }
             → worker identity resolved from JWT — workerId NOT in path
════════════════════════════════════════════════════════════════════ */
function CompletePanel({ workerId, complaintId, onSuccess, onCancel, onAuthError }) {
  const [file,       setFile]   = useState(null)
  const [preview,    setPreview] = useState(null)
  const [notes,      setNotes]   = useState("")
  const [uploading,  setUp]      = useState(false)
  const [uploaded,   setDone]    = useState(null)
  const [submitting, setSub]     = useState(false)
  const [err,        setErr]     = useState(null)
  const ref = useRef(null)

  function pick(e) {
    const f = e.target.files?.[0]; if (!f) return
    setFile(f); setDone(null); setErr(null)
    const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(f)
  }

  /*
   * Step 1 — upload the after-image file.
   * POST /worker/files/{workerId}/attachment
   *   → WorkerFileUploadController.uploadAttachment()
   *   → accepts jpeg/png/pdf up to 10 MB
   *   → returns { "message": "...", "url": "<public-url>" }
   */
  async function upload() {
    if (!file) return setErr("Select an after-image first.")
    setUp(true); setErr(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await authFetch(`${API}/worker/files/attachment`, {
        method: "POST",
        body:   fd,
      })
      const data = await res.json()
      setDone(data.url)
    } catch (e) {
      if (e.code === 401 || e.code === 403) { onAuthError(e.code); return }
      setErr(e.message)
    }
    setUp(false)
  }

  /*
   * Step 2 — mark complaint complete with the uploaded URL.
   * POST /workers/complaints/{complaintId}/complete
   * Worker identity resolved from JWT — workerId NOT in path.
   */
  async function submit() {
    if (!uploaded) return setErr("Upload the after-image first.")

    setSub(true)
    setErr(null)

    try {
      await authFetch(
        `${API}/workers/complaints/${complaintId}/complete`,
        {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            complaintId,
            afterImageUrl: uploaded,
            workerNotes:   notes,
          }),
        }
      )
      onSuccess()
    } catch (e) {
      if (e.code === 401 || e.code === 403) { onAuthError(e.code); return }
      setErr(e.message)
    }

    setSub(false)
  }

  return (
    <div className="cdp-cpanel">
      <div className="cdp-cpanel__hd">
        <span className="cdp-cpanel__icon">📸</span>
        <div>
          <p className="cdp-cpanel__title">Complete Task</p>
          <p className="cdp-cpanel__sub">Upload after-photo · add notes · submit for AI verification</p>
        </div>
      </div>

      <div className="cdp-dropzone" onClick={() => ref.current?.click()}>
        {preview
          ? <img src={preview} alt="preview" className="cdp-dropzone__img" />
          : <>
              <span style={{ fontSize: 36 }}>📷</span>
              <p className="cdp-dropzone__lbl">Click to select after-image</p>
              <p className="cdp-dropzone__hint">JPG · PNG · max 10 MB</p>
            </>
        }
        <input ref={ref} type="file" accept="image/jpeg,image/png" onChange={pick} style={{ display: "none" }} />
      </div>

      {file && !uploaded && (
        <div className="cdp-cpanel__upload-row">
          <span className="cdp-cpanel__fname">📎 {file.name}</span>
          <button className="cdp-tbtn cdp-tbtn--violet" onClick={upload} disabled={uploading} type="button">
            {uploading ? "Uploading…" : "⬆ Upload Image"}
          </button>
        </div>
      )}
      {uploaded && <p className="cdp-cpanel__uploaded">✓ Image uploaded — ready to submit</p>}

      <label className="cdp-flabel">Worker Notes <span>(optional)</span></label>
      <div className="cdp-ta-wrap">
        <textarea className="cdp-ta" rows={3}
          placeholder="Describe work done — e.g. 'Drain cleared, road cleaned and restored'"
          value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} />
        <span className="cdp-ta__ct">{notes.length}/1000</span>
      </div>

      {err && <p className="cdp-err">⚠ {err}</p>}

      <div className="cdp-cpanel__foot">
        <button className="cdp-tbtn cdp-tbtn--ghost" onClick={onCancel} type="button">✕ Cancel</button>
        <button className="cdp-tbtn cdp-tbtn--green"
          onClick={submit} disabled={!uploaded || submitting} type="button">
          {submitting ? "Submitting…" : "✓ Submit for AI Verification"}
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════ */
export default function ComplaintDetailPage() {
  // ✅ Fixed: removed workerId from useParams — worker identity comes from JWT/localStorage
  const { complaintId } = useParams()
  const navigate     = useNavigate()
  const [sp]         = useSearchParams()

  // workerId still needed for the file upload endpoint: POST /worker/files/{workerId}/attachment
  const workerId = getAccountId()

  // ── Role guard ──
  useRequireRole("WORKER")

  const [c,         setC]        = useState(null)
  const [loading,   setLoading]  = useState(true)
  const [err,       setErr]      = useState(null)
  const [authError, setAuthError] = useState(null)
  const [busy,      setBusy]     = useState(false)
  const [toast,     setToast]    = useState(null)
  const [showDone,  setShowDone] = useState(sp.get("action") === "complete")
  const [vis,       setVis]      = useState(false)

  // Centralised auth-error handler
  function handleAuthError(code) {
    localStorage.clear()
    const msg = code === 401
      ? "Session expired. Please log in again."
      : "You do not have permission to perform this action."
    setAuthError(msg)
    if (code === 401) setTimeout(() => navigate("/login", { replace: true }), 2000)
  }

  /*
   * GET /workers/complaints/{complaintId}
   * Worker identity resolved from JWT — workerId NOT in path.
   */
  async function load() {
    setLoading(true); setErr(null); setAuthError(null)
    try {
      const res = await authFetch(`${API}/workers/complaints/${complaintId}`)
      setC(await res.json())
    } catch (e) {
      if (e.code === 401 || e.code === 403) { handleAuthError(e.code) }
      else { setErr(e.message) }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [complaintId])                     // eslint-disable-line
  useEffect(() => {
    if (!loading && !err) { const t = setTimeout(() => setVis(true), 40); return () => clearTimeout(t) }
  }, [loading, err])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4200); return () => clearTimeout(t)
  }, [toast])

  /*
   * POST /workers/complaints/{complaintId}/start
   * Worker identity resolved from JWT — workerId NOT in path.
   */
  async function handleStart() {
    setBusy(true)
    try {
      await authFetch(
        `${API}/workers/complaints/${complaintId}/start`,
        { method: "PATCH" }
      )
      setToast({ ok: true, msg: "Task started — status is now In Progress." })
      await load()
    } catch (e) {
      if (e.code === 401 || e.code === 403) { handleAuthError(e.code) }
      else { setToast({ ok: false, msg: e.message }) }
    }
    setBusy(false)
  }

  function onCompleteOk() {
    setShowDone(false)
    setToast({ ok: true, msg: "Submitted for AI verification. Status → Resolved." })
    load()
  }

  /* ── Loading ── */
  if (loading) return (
    <>
      <Navbar />
      <div className="cdp-page">
        <div className="cdp-ambient">
          <div className="cdp-orb cdp-orb--1" /><div className="cdp-orb cdp-orb--2" />
        </div>
        <div className="cdp-wrap" style={{ opacity: 1, transform: "none" }}>
          <Sk h={34} w={260} mb={22} />
          <Sk h={156} r={18} mb={18} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
            <div><Sk h={280} r={14} mb={14} /><Sk h={190} r={14} /></div>
            <div><Sk h={170} r={14} mb={14} /><Sk h={150} r={14} mb={14} /><Sk h={110} r={14} /></div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )

  /* ── Auth error ── */
  if (authError) return (
    <>
      <Navbar />
      <div className="cdp-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 52 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 20, color: "#e8c96a", marginBottom: 10 }}>
            Access Denied
          </h2>
          <p style={{ color: "rgba(195,180,145,0.70)", marginBottom: 28 }}>{authError}</p>
          {authError.includes("expired") && (
            <button className="cdp-btn cdp-btn--primary"
              onClick={() => navigate("/login", { replace: true })} type="button">
              Go to Login
            </button>
          )}
        </div>
      </div>
      <Footer />
    </>
  )

  /* ── Error ── */
  if (err || !c) return (
    <>
      <Navbar />
      <div className="cdp-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 52 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 20, color: "#e8c96a", marginBottom: 10 }}>
            Could Not Load Task
          </h2>
          <p style={{ color: "rgba(195,180,145,0.70)", marginBottom: 28 }}>{err}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {/* ✅ Fixed: removed workerId from dashboard route */}
            <button className="cdp-btn cdp-btn--ghost"
              onClick={() => navigate(`/worker/dashboard/${workerId}`)} type="button">
              🏰 Dashboard
            </button>
            <button className="cdp-btn cdp-btn--primary" onClick={load} type="button">↺ Retry</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )

  /* ── Derived state ── */
  const sColor      = STATUS_COLOR[c.status] || "#c8982a"
  const sIcon       = STATUS_ICON[c.status]  || "⚔"
  const catIcon     = CAT_ICON[c.category]   || "📋"
  const stageIdx    = LIFECYCLE.findIndex(s => s.key === c.status)
  const canStart    = c.status === "ASSIGNED"
  const canComplete = c.status === "IN_PROGRESS"
  const isDone      = ["RESOLVED","VERIFIED","CLOSED"].includes(c.status)
  const resTme      = dur(c.startedAt || c.assignedAt || c.createdAt, c.resolvedAt)

  return (
    <>
      <Navbar />
      <div className="cdp-page">

        <div className="cdp-ambient" aria-hidden="true">
          <div className="cdp-orb cdp-orb--1" /><div className="cdp-orb cdp-orb--2" />
          <div className="cdp-orb cdp-orb--3" /><div className="cdp-dot-grid" />
        </div>

        <div className={`cdp-wrap${vis ? " cdp-wrap--vis" : ""}`}>

          {/* ── TOP NAV ── */}
          <nav className="cdp-topnav">
            <div className="cdp-topnav__l">
              <button className="cdp-nbtn" onClick={() => navigate(-1)} type="button">← Back</button>
              <button className="cdp-nbtn cdp-nbtn--ghost"
                onClick={() => navigate(`/worker/tasks`)} type="button">
                ⚔ Tasks
              </button>
              {/* ✅ Fixed: removed /${workerId} from dashboard nav */}
              <button className="cdp-nbtn cdp-nbtn--ghost"
                onClick={() => navigate(`/worker/dashboard/${workerId}`)} type="button">
                🏰 Dashboard
              </button>
            </div>
            <div className="cdp-topnav__r">
              <span className="cdp-crumb">
                {/* ✅ Fixed: removed /${workerId} from breadcrumb */}
                <span className="cdp-crumb__s" onClick={() => navigate(`/worker/dashboard/${workerId}`)}>Dashboard</span>
                <span className="cdp-crumb__sep">›</span>
                <span className="cdp-crumb__s" onClick={() => navigate(`/worker/tasks`)}>Tasks</span>
                <span className="cdp-crumb__sep">›</span>
                <span className="cdp-crumb__s cdp-crumb__s--act">#{c.complaintId}</span>
              </span>
              <button className="cdp-nbtn cdp-nbtn--ghost" onClick={load} title="Refresh" type="button">↺</button>
            </div>
          </nav>

          {/* ── TOAST ── */}
          {toast && (
            <div className={`cdp-toast${toast.ok ? " cdp-toast--ok" : " cdp-toast--err"}`}>
              <span>{toast.ok ? "✅" : "⚠"}</span>
              <span className="cdp-toast__msg">{toast.msg}</span>
              <button onClick={() => setToast(null)} type="button">✕</button>
            </div>
          )}

          {/* ══ HERO ══ */}
          <div className="cdp-hero">
            <div className="cdp-hero__scanline" />
            <div className="cdp-hero__glow"
              style={{ background: `radial-gradient(circle at 0% 50%, ${sColor}26 0%, transparent 60%)` }} />

            <div className="cdp-hero__left">
              <div className="cdp-hero__cat-icon"
                style={{ background: `${sColor}22`, borderColor: `${sColor}44` }}>
                <span style={{ fontSize: 30 }}>{catIcon}</span>
              </div>
              <div className="cdp-hero__meta">
                <p className="cdp-hero__eyebrow">
                  <span className="cdp-pdot" style={{ background: sColor, boxShadow: `0 0 8px ${sColor}` }} />
                  {[c.areaName, c.villageName, c.category?.replace(/_/g," ")].filter(Boolean).join("  ·  ")}
                </p>
                <h1 className="cdp-hero__id">#{c.complaintId}</h1>
                <p className="cdp-hero__desc">{c.description || "No description provided."}</p>
                <div className="cdp-chips">
                  <span className="cdp-chip" style={chipVars(sColor)}>
                    <span className="cdp-chip__dot" />{sIcon} {c.status?.replace(/_/g," ")}
                  </span>
                  {resTme && <span className="cdp-chip cdp-chip--dim">⏱ {resTme}</span>}
                  {c.category === "PUBLIC_HEALTH" && (
                    <span className="cdp-chip" style={chipVars("#f87171")}>
                      <span className="cdp-chip__dot" />⚕ URGENT
                    </span>
                  )}
                  {c.aiCleanScore != null && (
                    <span className="cdp-chip" style={chipVars(scoreCol(c.aiCleanScore))}>
                      <span className="cdp-chip__dot" />🤖 {c.aiCleanScore}/100 · {scoreTag(c.aiCleanScore)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="cdp-hero__actions">
              {canStart && (
                <button className="cdp-hbtn cdp-hbtn--start"
                  onClick={handleStart} disabled={busy} type="button">
                  {busy ? <><span className="cdp-spin">◌</span> Starting…</> : <>▶ Start Work</>}
                </button>
              )}
              {canComplete && !showDone && (
                <button className="cdp-hbtn cdp-hbtn--complete"
                  onClick={() => setShowDone(true)} type="button">
                  ✓ Mark as Done
                </button>
              )}
              {canComplete && showDone && (
                <button className="cdp-hbtn cdp-hbtn--cancel"
                  onClick={() => setShowDone(false)} type="button">
                  ✕ Cancel
                </button>
              )}
              {isDone && (
                <div className="cdp-hbtn cdp-hbtn--resolved">
                  {sIcon} {c.status === "CLOSED" ? "Closed" : c.status === "VERIFIED" ? "Verified" : "Resolved"}
                </div>
              )}
              {/* ✅ Fixed: removed /${workerId} from dashboard button */}
              <button className="cdp-hbtn cdp-hbtn--back"
                onClick={() => navigate(`/worker/dashboard/${workerId}`)} type="button">
                🏰 Back to Dashboard
              </button>
            </div>
          </div>

          {/* ══ COMPLETE PANEL ══ */}
          {showDone && canComplete && (
            // ✅ Fixed: was profile?.workerId (profile undefined) — now uses workerId from getAccountId()
            <CompletePanel
              workerId={workerId}
              complaintId={complaintId}
              onSuccess={onCompleteOk}
              onCancel={() => setShowDone(false)}
              onAuthError={handleAuthError}
            />
          )}

          {/* ══ BODY ══ */}
          <div className="cdp-body">

            <div className="cdp-left">

              {/* LIFECYCLE */}
              <div className="cdp-card">
                <div className="cdp-card__hd">
                  <h3 className="cdp-card__title">📅 Task Lifecycle</h3>
                  <span className="cdp-badge">Stage {stageIdx + 1} / {LIFECYCLE.length}</span>
                </div>
                <div className="cdp-tl">
                  {LIFECYCLE.map((step, i) => {
                    const done   = i < stageIdx
                    const active = i === stageIdx
                    const date   = step.field ? fmt(c[step.field]) : null
                    return (
                      <div key={step.key}
                        className={`cdp-tl__step${done ? " done" : ""}${active ? " active" : ""}`}>
                        {i < LIFECYCLE.length - 1 && <div className="cdp-tl__line" />}
                        <div className="cdp-tl__dot">
                          {active ? step.icon : done ? "✓" : "○"}
                        </div>
                        <div className="cdp-tl__info">
                          <p className="cdp-tl__label">{step.label}</p>
                          <p className="cdp-tl__when">{date || (active ? "In progress…" : "—")}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* EVIDENCE */}
              {(c.beforeImageUrl || c.afterImageUrl) && (
                <div className="cdp-card">
                  <div className="cdp-card__hd">
                    <h3 className="cdp-card__title">📷 Field Evidence</h3>
                    <span className="cdp-badge">{c.afterImageUrl ? "Before & After" : "Before only"}</span>
                  </div>
                  <div className="cdp-imgs">
                    {c.beforeImageUrl && (
                      <div className="cdp-imgs__slot">
                        <p className="cdp-imgs__lbl">Before</p>
                        <img src={c.beforeImageUrl} alt="Before" className="cdp-imgs__img" />
                      </div>
                    )}
                    {c.afterImageUrl && (
                      <div className="cdp-imgs__slot">
                        <p className="cdp-imgs__lbl" style={{ color: "#4aad7e" }}>After ✓</p>
                        <img src={c.afterImageUrl} alt="After" className="cdp-imgs__img" />
                      </div>
                    )}
                  </div>
                  {!c.afterImageUrl && canComplete && (
                    <div className="cdp-imgs__cta">
                      <p>No after-image uploaded yet.</p>
                      <button className="cdp-btn cdp-btn--primary"
                        onClick={() => setShowDone(true)} type="button">
                        📸 Upload &amp; Complete
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VAO NOTE */}
              {c.vaoReviewNote && (
                <div className="cdp-card">
                  <div className="cdp-card__hd">
                    <h3 className="cdp-card__title">🏛 VAO Review Note</h3>
                  </div>
                  <p className="cdp-vao">{c.vaoReviewNote}</p>
                </div>
              )}

            </div>

            <div className="cdp-right">

              {/* DETAILS */}
              <div className="cdp-card">
                <div className="cdp-card__hd">
                  <h3 className="cdp-card__title">📋 Details</h3>
                </div>
                <div className="cdp-dl">
                  {[
                    ["Complaint ID", c.complaintId,                              true ],
                    ["Category",     c.category?.replace(/_/g," "),              false],
                    ["Status",       `${sIcon} ${c.status?.replace(/_/g," ")}`,  false],
                    ["Area",         c.areaName,                                  false],
                    ["Village",      c.villageName,                               false],
                    ["Worker",       c.workerName,                                false],
                    ["Citizen ID",   c.citizenId,                                 true ],
                    ["Created",      fmt(c.createdAt),                            false],
                    ["Assigned",     fmt(c.assignedAt),                           false],
                    ["Started",      fmt(c.startedAt),                            false],
                    ["Resolved",     fmt(c.resolvedAt),                           false],
                    ["Verified",     fmt(c.verifiedAt),                           false],
                  ].filter(([, v]) => v).map(([lbl, val, mono]) => (
                    <div className="cdp-dl__row" key={lbl}>
                      <span className="cdp-dl__lbl">{lbl}</span>
                      <span className={`cdp-dl__val${mono ? " mono" : ""}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI SCORE */}
              <div className="cdp-card cdp-card--ai">
                <div className="cdp-card__hd">
                  <h3 className="cdp-card__title">🤖 AI Score</h3>
                  <span className="cdp-badge"
                    style={{ color: c.aiVerified ? "#4aad7e" : "#fbbf24" }}>
                    {c.aiVerified ? "✓ Verified" : "Pending"}
                  </span>
                </div>
                {c.aiCleanScore != null ? (
                  <div className="cdp-ai">
                    <div className="cdp-ai__num-row">
                      <span className="cdp-ai__big" style={{ color: scoreCol(c.aiCleanScore), textShadow: `0 0 30px ${scoreCol(c.aiCleanScore)}44` }}>
                        {c.aiCleanScore}
                      </span>
                      <span className="cdp-ai__denom">/100</span>
                      <span className="cdp-ai__tag" style={{ color: scoreCol(c.aiCleanScore) }}>
                        {scoreTag(c.aiCleanScore)}
                      </span>
                    </div>
                    <div className="cdp-ai__bar-row">
                      <div className="cdp-ai__track">
                        <div className="cdp-ai__fill"
                          style={{ width: `${c.aiCleanScore}%`, background: scoreCol(c.aiCleanScore) }} />
                      </div>
                    </div>
                    {c.verifiedAt && (
                      <div className="cdp-ai__meta">
                        <span>Verified</span><span>{fmt(c.verifiedAt)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="cdp-ai__empty">
                    <span style={{ fontSize: 28 }}>🤖</span>
                    <p>Score appears after task resolves and AI pipeline runs.</p>
                    {isDone && <p style={{ color: "#fbbf24", marginTop: 4 }}>Awaiting AI…</p>}
                  </div>
                )}
              </div>

              {/* TIMING */}
              {(c.assignedAt || c.startedAt || c.resolvedAt) && (
                <div className="cdp-card">
                  <div className="cdp-card__hd">
                    <h3 className="cdp-card__title">⏱ Timing</h3>
                  </div>
                  <div className="cdp-timing">
                    {c.assignedAt && c.startedAt && (
                      <div className="cdp-timing__row">
                        <span>Response time</span>
                        <strong>{dur(c.assignedAt, c.startedAt)}</strong>
                      </div>
                    )}
                    {c.startedAt && c.resolvedAt && (
                      <div className="cdp-timing__row">
                        <span>Work duration</span>
                        <strong>{dur(c.startedAt, c.resolvedAt)}</strong>
                      </div>
                    )}
                    {c.createdAt && c.resolvedAt && (
                      <div className="cdp-timing__row cdp-timing__row--hi">
                        <span>Total resolution</span>
                        <strong style={{ color: "#4aad7e" }}>{dur(c.createdAt, c.resolvedAt)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CITIZEN RATING */}
              {c.workerRating != null && (
                <div className="cdp-card">
                  <div className="cdp-card__hd">
                    <h3 className="cdp-card__title">⭐ Citizen Rating</h3>
                  </div>
                  <div className="cdp-rating">
                    <span className="cdp-rating__n">{c.workerRating}</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s}
                          style={{
                            color: s <= c.workerRating ? "#e8c96a" : "rgba(110,100,78,0.30)",
                            fontSize: 22,
                          }}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── BOTTOM BAR ── */}
          <div className="cdp-bar">
            <div className="cdp-bar__l">
              <button className="cdp-btn cdp-btn--ghost" onClick={() => navigate(-1)} type="button">← Back</button>
              <button className="cdp-btn cdp-btn--ghost"
                onClick={() => navigate(`/worker/tasks`)} type="button">
                ⚔ All Tasks
              </button>
              {/* ✅ Fixed: removed /${workerId} from bottom bar dashboard button */}
              <button className="cdp-btn cdp-btn--ghost"
                onClick={() => navigate(`/worker/dashboard/${workerId}`)} type="button">
                🏰 Dashboard
              </button>
            </div>
            <div className="cdp-bar__r">
              {canStart && (
                <button className="cdp-btn cdp-btn--start" onClick={handleStart} disabled={busy} type="button">
                  {busy ? "Starting…" : "▶ Start Work"}
                </button>
              )}
              {canComplete && (
                <button className="cdp-btn cdp-btn--complete"
                  onClick={() => setShowDone(s => !s)} type="button">
                  {showDone ? "✕ Cancel" : "✓ Mark as Done"}
                </button>
              )}
              {isDone && (
                <button className="cdp-btn cdp-btn--ghost"
                  onClick={() => navigate(`/worker/analytics`)} type="button">
                  📊 Analytics
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}