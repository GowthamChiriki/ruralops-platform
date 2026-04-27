import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"  // ✅ removed useParams — worker identity from JWT
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import "../../styles/WorkerNotifications.css"

/* ─── API base — single source of truth ─── */
const API = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app"

const PAGE_SIZE = 5

/* ════════════════════════════════════════════
   AUTH HELPERS
   All read fresh on every call — never stale.
════════════════════════════════════════════ */
function getToken()      { return localStorage.getItem("accessToken") }
function getAccountType(){ return localStorage.getItem("accountType") }

/**
 * Central fetch wrapper for ALL protected requests.
 * - Attaches Authorization: Bearer <token> fresh on every call.
 * - Throws typed errors for 401 (expired) and 403 (forbidden).
 *
 * SecurityConfig: /workers/** → hasRole("WORKER") — stateless JWT.
 */
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

/* ── helpers ── */
function timeAgo(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr)
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/* ════════════════════════════════════════════════════════════
   NOTIFICATION FACTORY
   Derives notification objects from complaint data
════════════════════════════════════════════════════════════ */
function buildNotifications(complaints) {
  const notifs = []

  complaints.forEach(c => {
    /* 1 — NEW ASSIGNMENT */
    if (c.assignedAt) {
      notifs.push({
        id:          `assign-${c.complaintId}`,
        type:        "assigned",
        icon:        "⚔",
        color:       "#a78bfa",
        title:       "New Task Assigned",
        body:        `Complaint #${c.complaintId} has been assigned to you${c.areaName ? ` in ${c.areaName}` : ""}.`,
        category:    c.category,
        complaintId: c.complaintId,
        time:        c.assignedAt,
        urgent:      c.category === "PUBLIC_HEALTH",
        read:        !["ASSIGNED", "IN_PROGRESS"].includes(c.status),
      })
    }

    /* 2 — IN PROGRESS reminder (only if still active) */
    if (c.startedAt && c.status === "IN_PROGRESS") {
      notifs.push({
        id:          `progress-${c.complaintId}`,
        type:        "in_progress",
        icon:        "🔨",
        color:       "#fbbf24",
        title:       "Task In Progress",
        body:        `You started work on complaint #${c.complaintId}. Remember to mark it done when resolved.`,
        category:    c.category,
        complaintId: c.complaintId,
        time:        c.startedAt,
        urgent:      false,
        read:        false,
      })
    }

    /* 3 — AI VERIFIED */
    if (c.verifiedAt && c.aiVerified === true) {
      const score   = c.aiCleanScore
      const quality = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Average" : "Poor"
      notifs.push({
        id:          `verify-${c.complaintId}`,
        type:        "verified",
        icon:        "🔮",
        color:       "#52b874",
        title:       "AI Verification Complete",
        body:        `Task #${c.complaintId} passed AI verification with a ${quality} score of ${score}/100.`,
        category:    c.category,
        complaintId: c.complaintId,
        time:        c.verifiedAt,
        urgent:      false,
        read:        true,
        score,
      })
    }

    /* 4 — URGENT PUBLIC HEALTH */
    if (c.category === "PUBLIC_HEALTH" && c.status === "ASSIGNED") {
      notifs.push({
        id:          `urgent-${c.complaintId}`,
        type:        "urgent",
        icon:        "🚨",
        color:       "#f87171",
        title:       "⚠ Urgent: Public Health Alert",
        body:        `Complaint #${c.complaintId} is a public health emergency requiring immediate attention.`,
        category:    c.category,
        complaintId: c.complaintId,
        time:        c.assignedAt || c.createdAt,
        urgent:      true,
        read:        false,
      })
    }

    /* 5 — RESOLVED acknowledgement */
    if (c.resolvedAt) {
      notifs.push({
        id:          `resolved-${c.complaintId}`,
        type:        "resolved",
        icon:        "✅",
        color:       "#34d399",
        title:       "Task Marked Resolved",
        body:        `You successfully resolved complaint #${c.complaintId}. Awaiting VAO verification.`,
        category:    c.category,
        complaintId: c.complaintId,
        time:        c.resolvedAt,
        urgent:      false,
        read:        true,
      })
    }

    /* 6 — CLOSED */
    if (c.status === "CLOSED") {
      notifs.push({
        id:          `closed-${c.complaintId}`,
        type:        "closed",
        icon:        "🏁",
        color:       "#5d785d",
        title:       "Task Officially Closed",
        body:        `Complaint #${c.complaintId} has been reviewed, verified, and closed by administration.`,
        category:    c.category,
        complaintId: c.complaintId,
        time:        c.resolvedAt || c.verifiedAt,
        urgent:      false,
        read:        true,
      })
    }
  })

  /* sort: unread first, then urgent, then by time desc */
  return notifs.sort((a, b) => {
    if (a.read !== b.read)     return a.read   ? 1  : -1
    if (a.urgent !== b.urgent) return a.urgent ? -1 :  1
    return new Date(b.time) - new Date(a.time)
  })
}

/* ════════════════════════════════════════════════════════════
   STATIC SYSTEM NOTIFICATIONS
   Defined outside component — stable reference, no flicker.
════════════════════════════════════════════════════════════ */
const SYSTEM_NOTIFS = [
  {
    id:          "sys-1",
    type:        "system",
    icon:        "📡",
    color:       "#3bbcd4",
    title:       "Notification Service Active",
    body:        "You are now connected to the Rural Ops live notification pipeline.",
    time:        new Date().toISOString(),
    urgent:      false,
    read:        true,
    complaintId: null,
  },
  {
    id:          "sys-2",
    type:        "system",
    icon:        "🤖",
    color:       "#a78bfa",
    title:       "AI Verification Pipeline Online",
    body:        "The AI clean-score verification system is operational. Completed tasks will be scored automatically.",
    time:        new Date(Date.now() - 3600000).toISOString(),
    urgent:      false,
    read:        true,
    complaintId: null,
  },
]

/* ════════════════════════════════════════════════════════════
   SKELETON
════════════════════════════════════════════════════════════ */
function NotifSkeleton() {
  return (
    <div className="wn-skeleton-list">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="wn-sk-row" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="wn-sk wn-sk-icon" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="wn-sk wn-sk-title" style={{ width: `${50 + i * 8}%` }} />
            <div className="wn-sk wn-sk-body"  style={{ width: `${70 + i * 4}%` }} />
          </div>
          <div className="wn-sk wn-sk-time" />
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   NOTIFICATION ROW
   ✅ removed workerId prop — nav uses /worker/complaint/:id directly
════════════════════════════════════════════════════════════ */
const CAT_COLORS = {
  PUBLIC_HEALTH: "#f87171",
  SANITATION:    "#4e9e6a",
  DRAINAGE:      "#3f8fd4",
  ROAD_DAMAGE:   "#c47818",
  STREET_LIGHT:  "#d4b020",
  WATER_SUPPLY:  "#3bbcd4",
  OTHER:         "#b48c28",
}

function NotifRow({ notif, onNavigate, onDismiss, idx }) {
  const [dismissing, setDismissing] = useState(false)
  const catColor = CAT_COLORS[notif.category] || "#b48c28"

  function handleDismiss(e) {
    e.stopPropagation()
    setDismissing(true)
    setTimeout(() => onDismiss(notif.id), 300)
  }

  // ✅ fixed: removed workerId — route is /worker/complaint/:id (no workerId in path)
  // System notifs have no complaintId — guard against navigating to /undefined
  function handleClick() {
    if (notif.complaintId) {
      onNavigate(`/worker/complaint/${notif.complaintId}`)
    }
  }

  return (
    <div
      className={`wn-row${notif.read ? " wn-row--read" : ""}${notif.urgent ? " wn-row--urgent" : ""}${dismissing ? " wn-row--dismissing" : ""}${!notif.complaintId ? " wn-row--no-link" : ""}`}
      style={{ animationDelay: `${0.05 + idx * 0.04}s`, "--notif-color": notif.color }}
      onClick={handleClick}
      role={notif.complaintId ? "button" : undefined}
      tabIndex={notif.complaintId ? 0 : undefined}
      onKeyDown={notif.complaintId ? e => e.key === "Enter" && handleClick() : undefined}
    >
      {/* unread dot */}
      {!notif.read && <span className="wn-unread-dot" />}

      {/* left accent */}
      <div className="wn-accent-bar" style={{ background: notif.color }} />

      {/* icon */}
      <div className="wn-icon-wrap" style={{
        background:  `${notif.color}14`,
        border:      `1px solid ${notif.color}38`,
        boxShadow:   notif.urgent ? `0 0 14px ${notif.color}30` : "none",
      }}>
        <span className="wn-icon-emoji">{notif.icon}</span>
        {notif.urgent && <span className="wn-icon-pulse" style={{ borderColor: notif.color }} />}
      </div>

      {/* body */}
      <div className="wn-body">
        <div className="wn-title-row">
          <p className="wn-title" style={{ color: notif.urgent ? notif.color : undefined }}>
            {notif.title}
          </p>
          {notif.score != null && (
            <span className="wn-score-badge" style={{
              color:       notif.score >= 70 ? "#34d399" : notif.score >= 40 ? "#fbbf24" : "#f87171",
              borderColor: notif.score >= 70 ? "rgba(52,211,153,0.30)" : notif.score >= 40 ? "rgba(251,191,36,0.30)" : "rgba(248,113,113,0.30)",
            }}>
              {notif.score}/100
            </span>
          )}
        </div>
        <p className="wn-body-text">{notif.body}</p>
        <div className="wn-meta">
          {notif.category && (
            <span className="wn-cat-chip" style={{ color: catColor, borderColor: `${catColor}35`, background: `${catColor}10` }}>
              {notif.category.replace(/_/g, " ")}
            </span>
          )}
          <span className="wn-time">{timeAgo(notif.time)}</span>
          {notif.complaintId && (
            <span className="wn-time" style={{ opacity: 0.55 }}>#{notif.complaintId}</span>
          )}
        </div>
      </div>

      {/* dismiss */}
      <button className="wn-dismiss" onClick={handleDismiss} aria-label="Dismiss" type="button">✕</button>

      {/* arrow — only if navigable */}
      {notif.complaintId && <span className="wn-arrow">›</span>}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   PAGINATION CONTROLS
════════════════════════════════════════════════════════════ */
function Pagination({ page, totalPages, onPrev, onNext, total, pageSize }) {
  if (totalPages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)
  return (
    <div className="wn-pagination">
      <button
        className="wn-page-btn"
        onClick={onPrev}
        disabled={page === 1}
        type="button"
      >
        ← Prev
      </button>
      <div className="wn-page-info">
        <span className="wn-page-info__range">{from}–{to}</span>
        <span className="wn-page-info__sep">of</span>
        <span className="wn-page-info__total">{total}</span>
        <span className="wn-page-info__sep">·</span>
        <span className="wn-page-info__pages">Page {page} / {totalPages}</span>
      </div>
      <button
        className="wn-page-btn"
        onClick={onNext}
        disabled={page === totalPages}
        type="button"
      >
        Next →
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   EMPTY STATE
════════════════════════════════════════════════════════════ */
function EmptyState({ filter }) {
  return (
    <div className="wn-empty">
      <div className="wn-empty__sigil">⚔</div>
      <h3 className="wn-empty__title">The ravens are silent</h3>
      <p className="wn-empty__sub">
        {filter === "unread"
          ? "All notifications have been read. Your duty is noted."
          : filter === "urgent"
          ? "No urgent matters at this time. Stand easy."
          : "No notifications yet. Activity will appear here as tasks are assigned and completed."}
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   SUMMARY BAR
════════════════════════════════════════════════════════════ */
function SummaryBar({ notifs }) {
  const unread   = notifs.filter(n => !n.read).length
  const urgent   = notifs.filter(n => n.urgent).length
  const verified = notifs.filter(n => n.type === "verified").length
  const total    = notifs.length
  return (
    <div className="wn-summary">
      {[
        { v: total,    l: "Total",    c: ""        },
        { v: unread,   l: "Unread",   c: "--amber" },
        { v: urgent,   l: "Urgent",   c: "--red"   },
        { v: verified, l: "Verified", c: "--green" },
      ].map(({ v, l, c }) => (
        <div key={l} className={`wn-summary__stat${c}`}>
          <span className="wn-summary__val">{v}</span>
          <span className="wn-summary__lbl">{l}</span>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function WorkerNotifications() {
  // worker identity comes from JWT — no useParams needed
  const navigate = useNavigate()

  /* ── Auth guard ── */
  const isAuthorized = !!(
    getToken() &&
    getAccountType() === "WORKER"
  )

  const [complaints, setComplaints] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [authError,  setAuthError]  = useState(null)
  const [filter,     setFilter]     = useState("all")
  const [dismissed,  setDismissed]  = useState(new Set())
  const [visible,    setVisible]    = useState(false)
  const [page,       setPage]       = useState(1)
  const intervalRef  = useRef(null)

  /*
   * GET /workers/complaints
   * Worker identity resolved from JWT — workerId NOT in path.
   */
  const fetchComplaints = useCallback(async () => {
    if (!isAuthorized) return
    setAuthError(null)
    try {
      const res  = await authFetch(`${API}/workers/complaints`)
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setComplaints(Array.isArray(data) ? data : [])
      setError(null)
    } catch (e) {
      if (e.code === 401) {
        clearInterval(intervalRef.current)
        setAuthError(e.message)
        // ✅ fixed: was "/workers/login"
        setTimeout(() => navigate("/login", { replace: true }), 2000)
      } else if (e.code === 403) {
        clearInterval(intervalRef.current)
        setAuthError(e.message)
      } else {
        setError(e.message)
      }
    }
  }, [isAuthorized, navigate])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await fetchComplaints()
      setLoading(false)
    }
    init()
    if (isAuthorized) {
      intervalRef.current = setInterval(fetchComplaints, 30000)
    }
    return () => clearInterval(intervalRef.current)
  }, [fetchComplaints, isAuthorized])

  useEffect(() => {
    if (!loading && !authError) {
      const t = setTimeout(() => setVisible(true), 50)
      return () => clearTimeout(t)
    }
  }, [loading, authError])

  /* ── reset to page 1 whenever filter or dismissed changes ── */
  useEffect(() => { setPage(1) }, [filter, dismissed])

  /* ── derive notifications — memoised to avoid flicker ── */
  const allNotifs = useMemo(
    () => buildNotifications(complaints).filter(n => !dismissed.has(n.id)),
    [complaints, dismissed]
  )

  const systemNotifs = useMemo(
    () => SYSTEM_NOTIFS.filter(n => !dismissed.has(n.id)),
    [dismissed]
  )

  const combined = useMemo(() => {
    return [...allNotifs, ...systemNotifs].sort((a, b) => {
      if (a.read !== b.read)     return a.read   ? 1  : -1
      if (a.urgent !== b.urgent) return a.urgent ? -1 :  1
      return new Date(b.time) - new Date(a.time)
    })
  }, [allNotifs, systemNotifs])

  const filtered = useMemo(() => {
    return combined.filter(n => {
      if (filter === "unread") return !n.read
      if (filter === "urgent") return n.urgent
      if (filter === "system") return n.type === "system"
      return true
    })
  }, [combined, filter])

  const unreadCount = useMemo(() => combined.filter(n => !n.read).length,  [combined])
  const urgentCount = useMemo(() => combined.filter(n => n.urgent).length, [combined])

  /* ── pagination ── */
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const tabs = [
    { id: "all",    label: "All Ravens", icon: "📜", count: combined.length     },
    { id: "unread", label: "Unread",     icon: "🔔", count: unreadCount         },
    { id: "urgent", label: "Urgent",     icon: "🚨", count: urgentCount         },
    { id: "system", label: "System",     icon: "📡", count: systemNotifs.length },
  ]

  function dismissAll() {
    setDismissed(prev => new Set([...prev, ...filtered.map(n => n.id)]))
  }

  /* ════════════════════════════════════════════
     EARLY RETURNS
  ════════════════════════════════════════════ */

  if (!isAuthorized) return (
    <>
      <Navbar />
      <div className="wn-page wn-page--center">
        <div className="wn-error">
          <div style={{ fontSize: 42, marginBottom: 8 }}>⚔</div>
          <div style={{ fontFamily: "Cinzel,serif", fontSize: 42, fontWeight: 900, color: "var(--wn-gold, #c9a227)", marginBottom: 10 }}>401</div>
          <h2 className="wn-error__title">Unauthorised Access</h2>
          <p className="wn-error__sub">You do not have the authority to view these dispatches.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 18 }}>
            {/* ✅ fixed: was "/workers/login" */}
            <a href="/login" className="wn-retry-btn">→ Login</a>
            <a href="/" style={{ opacity: 0.7 }} className="wn-retry-btn">← Home</a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )

  if (authError) return (
    <>
      <Navbar />
      <div className="wn-page wn-page--center">
        <div className="wn-error">
          <div style={{ fontSize: 42, marginBottom: 16 }}>🔒</div>
          <h2 className="wn-error__title">Access Denied</h2>
          <p className="wn-error__sub">{authError}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 18 }}>
            {authError.includes("expired") && (
              // ✅ fixed: was "/workers/login"
              <a href="/login" className="wn-retry-btn">→ Log In Again</a>
            )}
            <a href="/" style={{ opacity: 0.7 }} className="wn-retry-btn">← Home</a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )

  if (loading) return (
    <>
      <Navbar />
      <div className="wn-page">
        <div className="wn-ambient" aria-hidden="true">
          <div className="wn-orb wn-orb--1" /><div className="wn-orb wn-orb--2" />
          <div className="wn-dot-grid" />
        </div>
        <div className="wn-wrap">
          <div className="wn-sk wn-sk-head" style={{ marginBottom: 28 }} />
          <NotifSkeleton />
        </div>
      </div>
      <Footer />
    </>
  )

  if (error) return (
    <>
      <Navbar />
      <div className="wn-page wn-page--center">
        <div className="wn-error">
          <div style={{ fontSize: 42, marginBottom: 16 }}>⚠️</div>
          <h2 className="wn-error__title">Raven Lost in Transit</h2>
          <p className="wn-error__sub">{error}</p>
          <button className="wn-retry-btn" onClick={fetchComplaints} type="button">↺ Retry</button>
        </div>
      </div>
      <Footer />
    </>
  )

  /* ════════════════════════════════════════════
     MAIN RENDER
  ════════════════════════════════════════════ */
  return (
    <>
      <Navbar />
      <div className="wn-page">
        <div className="wn-ambient" aria-hidden="true">
          <div className="wn-orb wn-orb--1" /><div className="wn-orb wn-orb--2" /><div className="wn-orb wn-orb--3" />
          <div className="wn-dot-grid" />
        </div>

        <div className={`wn-wrap${visible ? " wn-wrap--visible" : ""}`}>

          {/* ── PAGE HEADER ── */}
          <header className="wn-header">
            <div className="wn-header__left">
              <div className="wn-breadcrumb">
                {/* ✅ fixed: removed /${workerId} from dashboard nav */}
                <button className="wn-back-btn" onClick={() => navigate(`/worker/dashboard`)} type="button">
                  ← Dashboard
                </button>
                <span className="wn-breadcrumb__sep">›</span>
                <span className="wn-breadcrumb__cur">Notifications</span>
              </div>
              <h1 className="wn-title-main">
                <span className="wn-title-icon">🔔</span>
                Raven Dispatches
              </h1>
              <p className="wn-subtitle">
                Field alerts, task assignments, AI verification results and system updates — all in one war council feed.
              </p>
            </div>

            <div className="wn-header__right">
              <SummaryBar notifs={combined} />
              <div className="wn-header__actions">
                <button className="wn-action-btn wn-action-btn--ghost" onClick={fetchComplaints} type="button">
                  ↺ Refresh
                </button>
                {filtered.length > 0 && (
                  <button className="wn-action-btn wn-action-btn--dismiss" onClick={dismissAll} type="button">
                    ✕ Clear {filter === "all" ? "All" : "Filtered"}
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* ── TABS ── */}
          <div className="wn-tabs">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`wn-tab${filter === t.id ? " wn-tab--active" : ""}`}
                onClick={() => setFilter(t.id)}
                type="button"
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span className={`wn-tab__badge${t.id === "urgent" && t.count > 0 ? " wn-tab__badge--urgent" : ""}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
            <div className="wn-live-badge" style={{ marginLeft: "auto" }}>
              <span className="wn-live-dot" />
              Live
            </div>
          </div>

          {/* ── NOTIFICATIONS LIST ── */}
          <div className="wn-list">
            {filtered.length === 0
              ? <EmptyState filter={filter} />
              : paginated.map((n, i) => (
                // ✅ fixed: removed workerId={profile?.workerId} — prop no longer exists
                <NotifRow
                  key={n.id}
                  notif={n}
                  idx={i}
                  onNavigate={navigate}
                  onDismiss={id => setDismissed(prev => new Set([...prev, id]))}
                />
              ))
            }
          </div>

          {/* ── PAGINATION ── */}
          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
          />

          {/* ── FOOTER NOTE ── */}
          {/* ✅ fixed: removed · Worker ID: {workerId} */}
          <p className="wn-foot-note">
            Notifications are derived live from your complaint assignments · Auto-refreshes every 30 seconds
            {filtered.length > 0 && ` · Showing ${paginated.length} of ${filtered.length}`}
          </p>

        </div>
      </div>
      <Footer />
    </>
  )
}