import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../Styles/ActivateAccount.css";

/* ─────────────────────────────────────────
   ACCOUNT TYPE CONFIG  (unchanged)
───────────────────────────────────────── */
const ACCOUNT_TYPES = {
  RLOC: { label: "Citizen",               role: "citizen", colorClass: "badge-citizen", icon: "📜" },
  RLOW: { label: "Field Worker",          role: "worker",  colorClass: "badge-worker",  icon: "⚒️" },
  RLOV: { label: "Village Admin Officer", role: "vao",     colorClass: "badge-vao",     icon: "🏰" },
  RLOM: { label: "Mandal Admin Officer",  role: "mao",     colorClass: "badge-mao",     icon: "⚜️" },
};
const detectAccountType = (id) => ACCOUNT_TYPES[id.substring(0, 4).toUpperCase()] ?? null;

const buildRoute = (role, id, ak, pw, cpw) => ({
  citizen: {
    endpoint: "/citizen/activate",
    payload: { citizenId: id, activationKey: ak, password: pw, confirmPassword: cpw },
  },
  worker: {
    endpoint: "/workers/activate",
    payload: { workerId: id, activationKey: ak, password: pw, confirmPassword: cpw },
  },
  vao: {
    endpoint: "/administration/vao/activate",
    payload: { vaoId: id, activationKey: ak, password: pw, confirmPassword: cpw },
  },
  mao: {
    endpoint: "/administration/mao/activate",
    payload: { maoId: id, activationKey: ak, password: pw, confirmPassword: cpw },
  },
}[role] ?? null);

/* ─────────────────────────────────────────
   TOAST SYSTEM  — top-right, smooth
───────────────────────────────────────── */
let _tid = 0;

function ToastItem({ t, onDone }) {
  const [phase, setPhase] = useState("entering"); // entering | idle | leaving
  const rafRef   = useRef(null);
  const startRef = useRef(Date.now());
  const dur      = t.duration ?? 4500;
  const [progress, setProgress] = useState(100);

  const dismiss = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPhase("leaving");
    setTimeout(() => onDone(t.id), 220);
  }, [t.id, onDone]);

  /* progress drain — rAF for smoothness */
  useEffect(() => {
    setPhase("entering");
    const tick = () => {
      const pct = Math.max(0, 100 - ((Date.now() - startRef.current) / dur) * 100);
      setProgress(pct);
      if (pct <= 0) { dismiss(); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dismiss, dur]);

  const ICONS = { success: "⚔️", error: "🛡️" };

  return (
    <div
      className={`aa-toast aa-toast--${t.type} ${phase}`}
      style={{ "--toast-dur": `${dur}ms` }}
    >
      <div className="aa-toast-line" />
      <div className="aa-toast-icon">{t.icon ?? ICONS[t.type]}</div>
      <div className="aa-toast-body">
        <span className="aa-toast-title">{t.title}</span>
        <span className="aa-toast-msg">{t.msg}</span>
      </div>
      <button className="aa-toast-close" onClick={dismiss} tabIndex={-1}>✕</button>
      <div className="aa-toast-progress" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}

function ToastPortal({ toasts, remove }) {
  return (
    <div className="aa-toast-portal">
      {toasts.map(t => (
        <ToastItem key={t.id} t={t} onDone={remove} />
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push    = useCallback((type, title, msg, icon, dur) =>
    setToasts(p => [...p, { id: ++_tid, type, title, msg, icon, duration: dur }]), []);
  const remove  = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  const success = (title, msg, icon) => push("success", title, msg, icon);
  const error   = (title, msg, icon) => push("error",   title, msg, icon);
  return { toasts, remove, success, error };
}

/* ─────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────── */
const LIVE_FEED = [
  {
    icon: "📜", title: "Citizen Activated — Bethapudi",
    sub: "RLOC account unsealed by portal",
    time: "2m ago", pulse: "emerald",
    color: "#378a55",
  },
  {
    icon: "🏰", title: "VAO Activated — Nagayyapeta",
    sub: "Village officer credentials confirmed",
    time: "11m ago", pulse: "amber",
    color: "#c07818",
  },
  {
    icon: "⚒️", title: "Worker Unsealed — Kaligotla",
    sub: "Field worker access granted",
    time: "18m ago", pulse: "violet",
    color: "#7c5cfc",
  },
];

const STEPS = [
  { num: "1", text: "Enter your Account ID and activation key" },
  { num: "2", text: "Set a strong sovereign password" },
  { num: "3", text: "Your account unseals upon completion" },
  { num: "4", text: "Access your realm dashboard immediately" },
];

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function ActivateAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  /* form state */
  const [id,      setId]      = useState(searchParams.get("accountId") || "");
  const [ak,      setAk]      = useState("");
  const [pw,      setPw]      = useState("");
  const [cpw,     setCpw]     = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [touched, setTouched] = useState({});
  const touch = (f) => setTouched(p => ({ ...p, [f]: true }));

  const detectedType = id.length >= 4 ? detectAccountType(id) : null;

  /* validation */
  const validate = {
    id:  (v) => !v.trim()          ? "Account ID is required"
              : !detectAccountType(v) ? "Prefix must be RLOC · RLOW · RLOV · RLOM"
              : null,
    ak:  (v) => !v.trim()          ? "Activation key is required"
              : v.trim().length < 6  ? "Key seems too short — check again"
              : null,
    pw:  (v) => !v                 ? "Password is required"
              : v.length < 8        ? "Minimum 8 characters required"
              : null,
    cpw: (v, p) => !v              ? "Please confirm your password"
                 : v !== p         ? "Passwords do not match"
                 : null,
  };

  const idErr  = validate.id(id);
  const akErr  = validate.ak(ak);
  const pwErr  = validate.pw(pw);
  const cpwErr = validate.cpw(cpw, pw);

  const fc = (err, field) => !touched[field] ? "" : err ? "field-error" : "field-ok";

  /* ── SUBMIT — endpoints and auth untouched ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ id: true, ak: true, pw: true, cpw: true });

    if (idErr)  { toast.error("Invalid Account ID",     idErr,  "🔰"); return; }
    if (akErr)  { toast.error("Activation Key Missing", akErr,  "🔑"); return; }
    if (pwErr)  { toast.error("Password Issue",         pwErr,  "🛡️"); return; }
    if (cpwErr) { toast.error("Passwords Don't Match",  cpwErr, "⚠️"); return; }

    const type  = detectAccountType(id);
    const route = buildRoute(type.role, id, ak, pw, cpw);
    if (!route) {
      toast.error("Realm Gateway Error", "Could not determine activation endpoint.", "🗡️");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`https://ruralops-platform-production.up.railway.app${route.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(route.payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      setSuccess(true);
      toast.success("Realm Unsealed!", "Your account is now active. Welcome to the realm.", "⚔️");
    } catch (err) {
      let msg = "Activation failed. Please verify your credentials.";

if (err.message?.toLowerCase().includes("citizen")) {
  msg = "Citizen account not found.";
} 
else if (err.message?.toLowerCase().includes("worker")) {
  msg = "Worker account not found.";
}
else if (err.message?.toLowerCase().includes("vao")) {
  msg = "Village Admin account not found.";
}
else if (err.message?.toLowerCase().includes("activation")) {
  msg = "Invalid activation key.";
}

toast.error("Activation Failed", msg, "🛡️");
    }
    setLoading(false);
  };

  /* strength */
  const strengthScore = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Strong", "Sovereign"][strengthScore];
  const strengthClass = ["", "weak", "fair", "strong", "sovereign"][strengthScore];

  return (
    <>
      <ToastPortal toasts={toast.toasts} remove={toast.remove} />
      <Navbar />

      {/* ══ MAIN LAYOUT ══ */}
      <div className="aa-page">

        {/* ── LEFT — brand / info ── */}
        <div className="aa-left">

          <div className="aa-eyebrow">
            <span className="aa-eyebrow-dot" />
            RuralOps Activation Chamber
          </div>

          <h1 className="aa-hero-title">
            Unseal Your<br />
            <span>Account &amp; Enter</span>
          </h1>

          <p className="aa-hero-sub">
            Your account was forged by the council. Present your activation key
            to claim your seat in the realm and set your sovereign password.
          </p>

          <div className="aa-steps">
            {STEPS.map((s, i) => (
              <div className="aa-step" key={i}>
                <span className="aa-step-num">{s.num}</span>
                <span>{s.text}</span>
              </div>
            ))}
          </div>

          <div className="aa-feed-hdr">
            <span className="aa-live-dot" />
            Live Activations
          </div>
          <div className="aa-feed">
            {LIVE_FEED.map((item, i) => (
              <div
                className="aa-feed-item"
                key={i}
                style={{ "--feed-c": item.color }}
              >
                <div className="aa-feed-icon">{item.icon}</div>
                <div className="aa-feed-body">
                  <div className="aa-feed-title">{item.title}</div>
                  <div className="aa-feed-sub">{item.sub}</div>
                </div>
                <div className="aa-feed-time">{item.time}</div>
                <div className={`aa-feed-pulse aa-feed-pulse--${item.pulse}`} />
              </div>
            ))}
          </div>

        </div>

        {/* ── RIGHT — activation card ── */}
        <div className="aa-right">
          <div className="aa-card">

            {/* header */}
            <div className="aa-card-hdr">
              <div className="aa-card-title-row">
                <div className="aa-card-title">
                  <span className="aa-card-title-icon">⚜</span>
                  Activate Account
                </div>
                {detectedType
                  ? <span className={`aa-badge ${detectedType.colorClass}`}>{detectedType.icon} {detectedType.label}</span>
                  : <span className="aa-badge badge-unknown">? Unrecognised</span>}
              </div>
              <p className="aa-card-desc">
                Present your bonded credentials to unseal your account and claim your role in the realm.
              </p>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="aa-form" noValidate>

              <div className="aa-section-label">⚜ Identity</div>

              {/* account ID */}
              <div className="aa-field">
                <label htmlFor="accountId">Account ID</label>
                <div className="aa-input-wrap">
                  <input
                    id="accountId" type="text"
                    placeholder="e.g. RLOC-XXXX-XXXX"
                    value={id}
                    onChange={e => setId(e.target.value)}
                    onBlur={() => touch("id")}
                    className={[
                      detectedType ? "has-badge" : "",
                      fc(idErr, "id"),
                    ].filter(Boolean).join(" ")}
                  />
                  {detectedType && (
                    <span className="aa-input-badge">{detectedType.icon} {detectedType.label}</span>
                  )}
                </div>
                {touched.id && idErr && <span className="aa-field-err">⚠ {idErr}</span>}
              </div>

              {/* activation key */}
              <div className="aa-field">
                <label htmlFor="ak">Activation Key</label>
                <input
                  id="ak" type="text"
                  placeholder="Provided by your administrator"
                  value={ak}
                  onChange={e => setAk(e.target.value)}
                  onBlur={() => touch("ak")}
                  className={fc(akErr, "ak")}
                />
                {touched.ak && akErr
                  ? <span className="aa-field-err">⚠ {akErr}</span>
                  : <span className="aa-field-hint">Check your registered phone or email for the key</span>}
              </div>

              <div className="aa-divider"><span>Set Your Sovereign Password</span></div>

              {/* password row */}
              <div className="aa-field-row">
                <div className="aa-field">
                  <label htmlFor="pw">Password</label>
                  <div className="aa-input-wrap">
                    <input
                      id="pw" type={showPw ? "text" : "password"}
                      placeholder="Min 8 characters"
                      value={pw}
                      onChange={e => setPw(e.target.value)}
                      onBlur={() => touch("pw")}
                      className={fc(pwErr, "pw")}
                    />
                    <button type="button" className="aa-eye-btn" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                      {showPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {touched.pw && pwErr && <span className="aa-field-err">⚠ {pwErr}</span>}
                </div>

                <div className="aa-field">
                  <label htmlFor="cpw">Confirm Password</label>
                  <div className="aa-input-wrap">
                    <input
                      id="cpw" type={showCpw ? "text" : "password"}
                      placeholder="Repeat password"
                      value={cpw}
                      onChange={e => setCpw(e.target.value)}
                      onBlur={() => touch("cpw")}
                      className={fc(cpwErr, "cpw")}
                    />
                    <button type="button" className="aa-eye-btn" onClick={() => setShowCpw(p => !p)} tabIndex={-1}>
                      {showCpw ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {touched.cpw && cpwErr && <span className="aa-field-err">⚠ {cpwErr}</span>}
                </div>
              </div>

              {/* strength meter */}
              {pw.length > 0 && (
                <div className="aa-strength">
                  <div className="aa-strength-bars">
                    {[1, 2, 3, 4].map(n => (
                      <div
                        key={n}
                        className={`aa-strength-bar${n <= strengthScore ? ` aa-strength-bar--${strengthClass}` : ""}`}
                      />
                    ))}
                  </div>
                  <span className={`aa-strength-label aa-strength-label--${strengthClass}`}>{strengthLabel}</span>
                </div>
              )}

              {/* success confirmation */}
              {success && (
                <div className="aa-success-bar">
                  <span>⚔️</span>
                  <span>Account activated — you may now enter the realm.</span>
                </div>
              )}

              <button type="submit" className="aa-submit-btn" disabled={loading}>
                {loading
                  ? <><span className="aa-submit-spinner" /> Unsealing Account…</>
                  : <>⚜ Activate &amp; Enter the Realm</>}
              </button>

            </form>

            <div className="aa-alt">
              <span>No activation key?</span>
              <button
                className="aa-alt-link"
                onClick={() => navigate(`/activation/request?accountId=${id}`)}
              >
                Request Activation Key →
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* ══ FOOTER ══ */}
      <footer className="aa-footer">
        <div className="aa-footer-left">
          <strong>RuralOps Platform</strong>
          <span>Digital Infrastructure for Rural Governance</span>
        </div>
        <div className="aa-footer-center">© 2026 RuralOps — YOGANANDA REDDY</div>
        <div className="aa-footer-links">
          <a href="#">Privacy</a>
          <a href="#">Security</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </>
  );
}