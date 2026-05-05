import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, ShieldCheck, FileSearch, CheckCircle2, AlertCircle,
  Clock, XCircle, Lock, ArrowRight, BarChart3, RefreshCw,
  Copy, Check, X, KeyRound, LogIn, UserPlus, Mail,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import villageImg from "../assets/village.png";

const API =
  import.meta.env.VITE_API_BASE_URL ??
  "https://ruralops-platform-production.up.railway.app";

/* ─────────────────────────────────────────
   Status display config
───────────────────────────────────────── */
const STATUS_CONFIG = {
  APPROVED: { label: "Approved", pillVar: "tg", Icon: CheckCircle2 },
  ACTIVE: { label: "Active", pillVar: "tg", Icon: CheckCircle2 },
  PENDING: { label: "Pending Review", pillVar: "am", Icon: Clock },
  PENDING_APPROVAL: { label: "Pending Approval", pillVar: "am", Icon: Clock },
  PENDING_ACTIVATION: { label: "Awaiting Activation", pillVar: "ac", Icon: KeyRound },
  REJECTED: { label: "Rejected", pillVar: "cr", Icon: XCircle },
  SUSPENDED: { label: "Suspended", pillVar: "sl", Icon: XCircle },
  INACTIVE: { label: "Inactive", pillVar: "sl", Icon: XCircle },
};

const getStatus = (s) =>
  STATUS_CONFIG[s?.toUpperCase()] ?? { label: s ?? "Unknown", pillVar: "sl", Icon: AlertCircle };

/* ─────────────────────────────────────────
   Next-action config
───────────────────────────────────────── */
const NEXT_ACTION_CONFIG = {
  REQUEST_ACTIVATION: {
    label: "Request Activation Key",
    sub: "Dispatch a key to your registered contact",
    to: "/activation/request",
    Icon: KeyRound,
    variant: "ac",
  },
  LOGIN: {
    label: "Proceed to Login",
    sub: "Your account is active and ready",
    to: "/login",
    Icon: LogIn,
    variant: "tg",
  },
  CONTACT_SUPPORT: {
    label: "Contact Support",
    sub: "Reach out to our governance team",
    to: null,
    href: "mailto:support@ruralops.gov.in",
    Icon: Mail,
    variant: "cr",
  },
  WAIT_FOR_APPROVAL: {
    label: "Awaiting Council Review",
    sub: "No action required at this time",
    to: null,
    Icon: Clock,
    variant: "am",
    disabled: true,
  },
  REGISTER_TO_CREATE_ACCOUNT: {
    label: "Register an Account",
    sub: "Begin your application with the district registry",
    to: "/citizen/register",
    Icon: UserPlus,
    variant: "tb",
  },
};

/* ─────────────────────────────────────────
   Ticker items
───────────────────────────────────────── */
const TICKER_ITEMS = [
  { state: "BETHAPUDI", dotVar: "tg", text: "4 accounts approved today" },
  { state: "NAGAYYAPETA", dotVar: "am", text: "VAO review: 7 pending cases" },
  { state: "SAMMEDA", dotVar: "tg", text: "Status inquiries: 38 this hour" },
  { state: "TARUVA", dotVar: "tb", text: "Portal uptime: 99.98%" },
  { state: "GARISINGI", dotVar: "cr", text: "3 rejections under appeal" },
  { state: "DEVARAPALLE", dotVar: "tg", text: "Activation rate: 91.4%" },
  { state: "MUSHIDIPALLE", dotVar: "am", text: "Verification queue: 12 citizens" },
  { state: "CHINTALAPUDI", dotVar: "tg", text: "6 accounts activated today" },
];

/* ─────────────────────────────────────────
   Copy-to-clipboard hook
───────────────────────────────────────── */
function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const copy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), timeout);
    });
  }, [timeout]);
  return { copied, copy };
}

/* ─────────────────────────────────────────
   ActivationKeyRow
───────────────────────────────────────── */
function ActivationKeyRow({ activationKey }) {
  const { copied, copy } = useCopyToClipboard();
  if (!activationKey) return null;
  return (
    <div className="cs-key-wrap">
      <div className="cs-key-header">
        <span className="cs-key-label">
          <KeyRound size={12} /> Activation Key
        </span>
        <span className="cs-secure-badge">Secure Token</span>
      </div>
      <div className="cs-key-row">
        <code className="cs-key-code">{activationKey}</code>
        <button
          className={`cs-copy-btn${copied ? " copied" : ""}`}
          onClick={() => copy(activationKey)}
          aria-label="Copy activation key"
        >
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <p className="cs-key-hint">Keep this key confidential. Do not share it with unauthorised parties.</p>
    </div>
  );
}

/* ─────────────────────────────────────────
   InlineKeyRequestPanel
───────────────────────────────────────── */
function InlineKeyRequestPanel({ account, onKeyDispatched }) {
  const [loading, setLoading] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [error, setError] = useState(null);

  const toBackendType = (id) => {
    if (!id) return null;
    const prefix = id.substring(0, 4).toUpperCase();
    return { RLOC: "CITIZEN", RLOW: "WORKER", RLOV: "VAO", RLOM: "MAO" }[prefix] ?? null;
  };

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/activation/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: toBackendType(account.accountId) ?? account.accountType,
          accountId: account.accountId,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Request failed");
      setDispatched(true);
      onKeyDispatched();
    } catch (err) {
      setError(err.message || "Unable to dispatch key. Please try again.");
    }
    setLoading(false);
  };

  if (dispatched) {
    return (
      <motion.div
        className="cs-dispatch-success"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CheckCircle2 size={18} className="cs-dispatch-success-icon" />
        <div>
          <p className="cs-dispatch-success-title">Key Dispatched Successfully</p>
          <p className="cs-dispatch-success-sub">
            A new activation key has been issued. Refresh your status to retrieve it.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="cs-dispatch-panel">
      <div className="cs-dispatch-header">
        <KeyRound size={16} className="cs-dispatch-icon" />
        <div>
          <p className="cs-dispatch-title">Request an Activation Key</p>
          <p className="cs-dispatch-sub">No key is currently on file, or your previous key has expired.</p>
        </div>
      </div>
      {error && (
        <div className="cs-dispatch-error">
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}
      <button className="cs-dispatch-btn" onClick={handleRequest} disabled={loading}>
        {loading
          ? <><span className="cs-spinner" /> Dispatching…</>
          : <><KeyRound size={13} /> Dispatch Activation Key</>
        }
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   NextActionButton
───────────────────────────────────────── */
function NextActionButton({ action, account, onActivate }) {
  if (!action) return null;
  const cfg = NEXT_ACTION_CONFIG[action];
  if (!cfg) return null;

  if (action === "REQUEST_ACTIVATION" && account?.canActivate && account?.activationKey) {
    return (
      <button className="cs-cta-btn cs-cta-btn--ac" onClick={() => onActivate(account)}>
        <KeyRound size={15} className="cs-cta-icon" />
        <span className="cs-cta-text">
          <span className="cs-cta-label">Activate Account</span>
          <span className="cs-cta-sub">Use your activation key</span>
        </span>
        <ArrowRight size={14} className="cs-cta-arrow" />
      </button>
    );
  }

  if (cfg.disabled) {
    return (
      <div className={`cs-cta-btn cs-cta-btn--${cfg.variant} cs-cta-btn--disabled`}>
        <cfg.Icon size={15} className="cs-cta-icon" />
        <span className="cs-cta-text">
          <span className="cs-cta-label">{cfg.label}</span>
          <span className="cs-cta-sub">{cfg.sub}</span>
        </span>
      </div>
    );
  }

  if (cfg.href) {
    return (
      <a className={`cs-cta-btn cs-cta-btn--${cfg.variant}`} href={cfg.href} target="_blank" rel="noopener noreferrer">
        <cfg.Icon size={15} className="cs-cta-icon" />
        <span className="cs-cta-text">
          <span className="cs-cta-label">{cfg.label}</span>
          <span className="cs-cta-sub">{cfg.sub}</span>
        </span>
        <ArrowRight size={14} className="cs-cta-arrow" />
      </a>
    );
  }

  return (
    <Link className={`cs-cta-btn cs-cta-btn--${cfg.variant}`} to={cfg.to}>
      <cfg.Icon size={15} className="cs-cta-icon" />
      <span className="cs-cta-text">
        <span className="cs-cta-label">{cfg.label}</span>
        <span className="cs-cta-sub">{cfg.sub}</span>
      </span>
      <ArrowRight size={14} className="cs-cta-arrow" />
    </Link>
  );
}

/* ─────────────────────────────────────────
   AccountResultCard
───────────────────────────────────────── */
function AccountResultCard({ account, onActivate, onKeyDispatched, index }) {
  const cfg = getStatus(account.status);
  const isPendingActivation = account.status === "PENDING_ACTIVATION";

  return (
    <motion.div
      className={`cs-card cs-card--${cfg.pillVar}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="cs-card-top-bar" />

      <div className="cs-card-header">
        <span className="cs-type-badge">{account.accountType}</span>
        <span className={`cs-status-pill cs-status-pill--${cfg.pillVar}`}>
          <cfg.Icon size={11} />
          {cfg.label}
        </span>
      </div>

      <div className="cs-card-body">
        <div className="cs-card-row">
          <span className="cs-field-label">Account ID</span>
          <span className="cs-field-value cs-mono">{account.accountId ?? "—"}</span>
        </div>

        {account.nextAction && (
          <div className="cs-card-row">
            <span className="cs-field-label">Required Action</span>
            <span className="cs-field-value cs-field-action">
              {NEXT_ACTION_CONFIG[account.nextAction]?.label ?? account.nextAction?.replace(/_/g, " ")}
            </span>
          </div>
        )}

        {isPendingActivation && account.activationKey && (
          <ActivationKeyRow activationKey={account.activationKey} />
        )}

        {isPendingActivation && !account.activationKey && (
          <InlineKeyRequestPanel account={account} onKeyDispatched={() => onKeyDispatched(account)} />
        )}
      </div>

      {account.nextAction && (
        <div className="cs-card-cta-wrap">
          <NextActionButton action={account.nextAction} account={account} onActivate={onActivate} />
        </div>
      )}

      {!account.nextAction && account.canActivate && account.activationKey && (
        <div className="cs-card-cta-wrap">
          <button className="cs-cta-btn cs-cta-btn--ac" onClick={() => onActivate(account)}>
            <KeyRound size={15} className="cs-cta-icon" />
            <span className="cs-cta-text">
              <span className="cs-cta-label">Activate Account</span>
              <span className="cs-cta-sub">Use your activation key</span>
            </span>
            <ArrowRight size={14} className="cs-cta-arrow" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Results Modal
───────────────────────────────────────── */
function ResultsModal({ open, loading, searched, results, phone, onClose, onActivate, onKeyDispatched }) {
  useEffect(() => {
    if (!open && !loading) return;
    const h = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, loading, onClose]);

  useEffect(() => {
    document.body.style.overflow = (open || loading) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open, loading]);

  if (!open && !loading) return null;

  const modal = (
    <AnimatePresence>
      {(open || loading) && (
        <motion.div
          className="cs-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="cs-modal"
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cs-modal-bar" />

            <div className="cs-modal-head">
              <div>
                <span className="cs-modal-eyebrow">Registry Response</span>
                <h3 className="cs-modal-title">Account Status</h3>
              </div>
              {!loading && (
                <button className="cs-modal-close" onClick={onClose} aria-label="Close results">
                  <X size={15} />
                </button>
              )}
            </div>

            {loading && (
              <div className="cs-modal-loading">
                <div className="cs-modal-spinner">
                  <div className="cs-ring-outer" />
                  <div className="cs-ring-inner" />
                </div>
                <div>
                  <p className="cs-modal-loading-title">Consulting the Registry…</p>
                  <p className="cs-modal-loading-sub">Retrieving records associated with {phone}</p>
                </div>
              </div>
            )}

            {!loading && searched && (
              <div className="cs-modal-body">
                {results.length === 0 && (
                  <AccountResultCard
                    account={{
                      accountType: "NO RECORD",
                      accountId: phone,
                      status: "REJECTED",
                      nextAction: "REGISTER_TO_CREATE_ACCOUNT",
                      canActivate: false,
                      activationKey: null,
                    }}
                    onActivate={() => { }}
                    onKeyDispatched={() => { }}
                    index={0}
                  />
                )}
                {results.length > 1 && (
                  <div className="cs-multi-label">
                    <span className="cs-multi-dot" />
                    {results.length} accounts are linked to this number
                  </div>
                )}
                {results.map((account, i) => (
                  <AccountResultCard
                    key={account.accountId ?? i}
                    account={account}
                    onActivate={onActivate}
                    onKeyDispatched={onKeyDispatched}
                    index={i}
                  />
                ))}
              </div>
            )}

            {!loading && searched && (
              <div className="cs-modal-footer">
                <span className="cs-modal-footer-info">
                  Results for <strong>{phone}</strong>
                </span>
                <button className="cs-modal-recheck" onClick={onClose}>
                  <RefreshCw size={12} /> Check another number
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

/* ─────────────────────────────────────────
   Left-panel feature items
───────────────────────────────────────── */
const features = [
  { icon: FileSearch, title: "Instant Registry Lookup", text: "Real-time access to your council's decision." },
  { icon: ShieldCheck, title: "Verified & Secure", text: "Your enquiry is encrypted end-to-end." },
  { icon: BarChart3, title: "Transparent Process", text: "Full visibility across every stage of review." },
];

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:ital,wght@0,600;1,500&display=swap');

/* ══════════════════════════════════════════
   LIGHT TOKENS  (default)
══════════════════════════════════════════ */
:root,
[data-theme="light"] {
  --accent:        #1e5c22;
  --accent-hover:  #174d1a;
  --accent-light:  #2d7a31;
  --accent-sub:    rgba(30,92,34,0.10);
  --accent-ring:   rgba(30,92,34,0.22);
  --err:           #c0392b;
  --ok:            #1a7a3a;
  --amber:         #b45309;
  --amber-sub:     rgba(180,83,9,0.12);
  --blue:          #1d4ed8;
  --blue-sub:      rgba(29,78,216,0.10);
  --slate:         #64748b;
  --slate-sub:     rgba(100,116,139,0.10);

  --card-bg:       rgba(255,255,255,0.94);
  --card-border:   rgba(255,255,255,0.72);
  --card-shadow:   0 32px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.10);

  --input-bg:      rgba(248,249,246,0.92);
  --input-border:  #c8cfc2;
  --input-focus:   #1e5c22;
  --input-text:    #0f1410;
  --input-ph:      #9aa094;

  --card-text:     #0f1410;
  --card-text2:    #374033;
  --card-muted:    #7a8474;
  --card-border-line: #dde0d8;

  --inner-card-bg: rgba(248,249,246,0.72);

  /* img overlays */
  --img-overlay-left: linear-gradient(105deg,
    rgba(10,30,12,0.82) 0%,
    rgba(10,30,12,0.65) 38%,
    rgba(10,30,12,0.30) 60%,
    rgba(10,30,12,0.08) 100%
  );
  --img-overlay-vignette: radial-gradient(ellipse at 70% 50%,
    transparent 30%, rgba(0,0,0,0.18) 100%
  );
}

/* ══════════════════════════════════════════
   DARK TOKENS
══════════════════════════════════════════ */
[data-theme="dark"] {
  --accent:        #2d8a31;
  --accent-hover:  #247026;
  --accent-light:  #3aaa3f;
  --accent-sub:    rgba(45,138,49,0.14);
  --accent-ring:   rgba(45,138,49,0.26);
  --err:           #e74c3c;
  --ok:            #27ae60;
  --amber:         #d97706;
  --amber-sub:     rgba(217,119,6,0.14);
  --blue:          #3b82f6;
  --blue-sub:      rgba(59,130,246,0.14);
  --slate:         #94a3b8;
  --slate-sub:     rgba(148,163,184,0.12);

  --card-bg:       rgba(14,18,15,0.90);
  --card-border:   rgba(255,255,255,0.08);
  --card-shadow:   0 32px 80px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.35);

  --input-bg:      rgba(255,255,255,0.06);
  --input-border:  rgba(255,255,255,0.13);
  --input-focus:   #2d8a31;
  --input-text:    #e4e6e3;
  --input-ph:      #606860;

  --card-text:     #e4e6e3;
  --card-text2:    #a8b0a4;
  --card-muted:    #626862;
  --card-border-line: rgba(255,255,255,0.10);

  --inner-card-bg: rgba(255,255,255,0.04);

  --img-overlay-left: linear-gradient(105deg,
    rgba(5,12,6,0.93) 0%,
    rgba(5,12,6,0.78) 38%,
    rgba(5,12,6,0.42) 60%,
    rgba(5,12,6,0.15) 100%
  );
  --img-overlay-vignette: radial-gradient(ellipse at 70% 50%,
    transparent 20%, rgba(0,0,0,0.38) 100%
  );
}

/* ════ BASE ════ */
.csp *, .csp *::before, .csp *::after { box-sizing: border-box; margin: 0; padding: 0; }
.csp {
  font-family: 'DM Sans', sans-serif;
  display: flex; flex-direction: column;
}

/* ════ HERO ════ */
.csp-hero {
  position: relative;
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: stretch;
  overflow: hidden;
}
.csp-bg-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; object-position: center 35%;
  z-index: 0;
}
.csp-overlay-left {
  position: absolute; inset: 0;
  background: var(--img-overlay-left);
  z-index: 1;
}
.csp-overlay-vignette {
  position: absolute; inset: 0;
  background: var(--img-overlay-vignette);
  z-index: 2;
}
.csp-inner {
  position: relative; z-index: 3; width: 100%;
  display: flex; align-items: center;
  padding: 110px 5% 4rem; gap: 4rem;
  min-height: calc(100vh - 72px);
}

/* ════ LEFT PANEL ════ */
.csp-info {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
  gap: 0; padding-right: 1rem;
}
.csp-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.30);
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.92);
  font-size: 0.68rem; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(8px);
  align-self: flex-start;
}
.csp-headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.6rem, 4vw, 4rem);
  line-height: 1.05; font-weight: 600;
  color: #ffffff; margin-bottom: 1.1rem;
  text-shadow: 0 2px 20px rgba(0,0,0,0.28);
}
.csp-headline em {
  font-style: italic; color: #7ddb82; display: block;
}
.csp-subhead {
  font-size: 0.9rem; color: rgba(255,255,255,0.80);
  line-height: 1.8; margin-bottom: 2.4rem;
  max-width: 380px;
  text-shadow: 0 1px 8px rgba(0,0,0,0.30);
}

/* Features */
.csp-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 2.2rem; }
.csp-feat {
  display: flex; align-items: center; gap: 13px;
  padding: 12px 14px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(12px);
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
  cursor: default; max-width: 380px;
}
.csp-feat:hover {
  background: rgba(255,255,255,0.17);
  border-color: rgba(255,255,255,0.26);
  transform: translateX(4px);
}
.csp-feat-icon {
  width: 38px; height: 38px; border-radius: 9px;
  flex-shrink: 0; background: rgba(255,255,255,0.18);
  color: #ffffff;
  display: flex; align-items: center; justify-content: center;
}
[data-theme="dark"] .csp-feat-icon { color: #a8e6ac; }
.csp-feat-body h4 { font-size: 0.82rem; font-weight: 600; color: #ffffff; margin-bottom: 2px; }
.csp-feat-body p  { font-size: 0.73rem; color: rgba(255,255,255,0.72); line-height: 1.4; }

/* Safety note */
.csp-safety {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(12px);
  max-width: 380px;
}
.csp-safety-ico { color: #7ddb82; flex-shrink: 0; }
.csp-safety h5 { font-size: 0.78rem; font-weight: 600; color: #ffffff; margin-bottom: 1px; }
.csp-safety p  { font-size: 0.69rem; color: rgba(255,255,255,0.72); }

/* ══ LIVE TICKER ══ */
.csp-ticker {
  margin-top: 1.6rem;
  display: flex; align-items: center; gap: 10px;
  max-width: 380px; overflow: hidden;
}
.csp-ticker-badge {
  flex-shrink: 0; display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 999px;
  border: 1px solid rgba(125,219,130,0.35);
  background: rgba(125,219,130,0.12);
  font-size: 0.62rem; font-weight: 700;
  letter-spacing: 0.10em; color: #7ddb82;
}
.csp-ticker-live-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #7ddb82;
  animation: csp-pulse 1.6s infinite;
}
@keyframes csp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

.csp-ticker-track { flex: 1; overflow: hidden; position: relative; }
.csp-ticker-inner {
  display: flex; gap: 0;
  animation: csp-ticker 32s linear infinite;
  white-space: nowrap;
}
@keyframes csp-ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.csp-ticker-item {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 0.70rem; color: rgba(255,255,255,0.72);
  padding: 0 18px;
}
.csp-ticker-state { font-weight: 600; color: rgba(255,255,255,0.90); }
.csp-tdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.csp-tdot--tg { background: #4ade80; }
.csp-tdot--am { background: #fbbf24; }
.csp-tdot--tb { background: #60a5fa; }
.csp-tdot--cr { background: #f87171; }

/* ════ RIGHT CARD ════ */
.csp-card-wrap {
  flex-shrink: 0; width: 100%; max-width: 460px;
  display: flex; align-items: center; justify-content: center;
}
.csp-card {
  width: 100%;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 22px;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  padding: 2.4rem 2.4rem 2rem;
  position: relative; overflow: hidden;
}
.csp-card::before {
  content: ''; position: absolute;
  top: 0; left: 12%; right: 12%; height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent-light), transparent);
  border-radius: 0 0 3px 3px;
}
.csp-card-h1 { font-size: 1.5rem; font-weight: 700; color: var(--card-text); margin-bottom: 3px; }
.csp-card-sub { font-size: 0.78rem; color: var(--card-muted); margin-bottom: 1.8rem; }

/* ── Legend ── */
.csp-legend { margin-bottom: 1.5rem; }
.csp-legend-title { font-size: 0.72rem; font-weight: 700; color: var(--card-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
.csp-legend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.csp-legend-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: 8px;
  border: 1px solid var(--card-border-line);
  background: var(--inner-card-bg);
}
.csp-legend-pill {
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0;
}
.csp-legend-pill--tg { background: rgba(30,92,34,0.15); color: var(--accent); }
.csp-legend-pill--am { background: var(--amber-sub); color: var(--amber); }
.csp-legend-pill--ac { background: var(--blue-sub); color: var(--blue); }
.csp-legend-pill--cr { background: rgba(192,57,43,0.12); color: var(--err); }
.csp-legend-label { font-size: 0.71rem; font-weight: 500; color: var(--card-text2); }

/* ── Input field ── */
.csp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem; }
.csp-lbl { font-size: 0.74rem; font-weight: 600; color: var(--card-text2); }
.csp-iw { position: relative; }
.csp-ico {
  position: absolute; left: 11px; top: 50%;
  transform: translateY(-50%); color: var(--card-muted);
  pointer-events: none; line-height: 0;
}
.csp-input {
  width: 100%; height: 44px;
  border: 1.5px solid var(--input-border);
  border-radius: 10px;
  background: var(--input-bg);
  color: var(--input-text);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  padding: 0 14px 0 36px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
}
.csp-input::placeholder { color: var(--input-ph); }
.csp-input:focus {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.csp-input.f-err { border-color: var(--err); }
.csp-err-msg { font-size: 0.69rem; color: var(--err); display: flex; align-items: center; gap: 4px; }

/* ── Submit button ── */
.csp-submit-btn {
  width: 100%; height: 46px;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  background: var(--accent); color: #fff;
  border: none; border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.92rem; font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 16px var(--accent-ring);
}
.csp-submit-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px var(--accent-ring);
}
.csp-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Security note ── */
.csp-secure {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 11px 13px; border-radius: 10px;
  border: 1px solid var(--accent-ring);
  background: var(--accent-sub);
  margin-top: 1rem;
}
.csp-secure-ico { color: var(--accent); flex-shrink: 0; margin-top: 1px; }
.csp-secure h5 { font-size: 0.76rem; font-weight: 700; color: var(--accent); margin-bottom: 1px; }
.csp-secure p  { font-size: 0.69rem; color: var(--card-text2); line-height: 1.4; }

/* ── Spinner ── */
.cs-spinner {
  display: inline-block;
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.30);
  border-top-color: #fff;
  animation: csp-spin 0.7s linear infinite;
}
@keyframes csp-spin { to{transform:rotate(360deg)} }

/* ════════════════════════════════════════
   MODAL
════════════════════════════════════════ */
.cs-modal-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.cs-modal {
  width: 100%; max-width: 520px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 22px;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  overflow: hidden;
  max-height: 88vh; display: flex; flex-direction: column;
}
.cs-modal-bar {
  height: 3px; flex-shrink: 0;
  background: linear-gradient(90deg, transparent, var(--accent-light), transparent);
}
.cs-modal-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 1.4rem 1.6rem 1rem; flex-shrink: 0;
}
.cs-modal-eyebrow {
  font-size: 0.66rem; font-weight: 700; letter-spacing: 0.09em;
  text-transform: uppercase; color: var(--card-muted);
  display: block; margin-bottom: 3px;
}
.cs-modal-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.4rem; font-weight: 600; color: var(--card-text);
}
.cs-modal-close {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--card-border-line);
  background: var(--inner-card-bg); color: var(--card-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.cs-modal-close:hover { color: var(--card-text); border-color: var(--card-text2); }

/* loading */
.cs-modal-loading {
  display: flex; align-items: center; gap: 1rem;
  padding: 2rem 1.6rem;
}
.cs-modal-spinner { position: relative; width: 44px; height: 44px; flex-shrink: 0; }
.cs-ring-outer {
  position: absolute; inset: 0; border-radius: 50%;
  border: 3px solid var(--accent-sub);
  border-top-color: var(--accent);
  animation: csp-spin 0.9s linear infinite;
}
.cs-ring-inner {
  position: absolute; inset: 8px; border-radius: 50%;
  border: 2px solid var(--card-border-line);
  border-bottom-color: var(--accent-light);
  animation: csp-spin 1.4s linear infinite reverse;
}
.cs-modal-loading-title { font-size: 0.9rem; font-weight: 700; color: var(--card-text); margin-bottom: 3px; }
.cs-modal-loading-sub { font-size: 0.76rem; color: var(--card-muted); }

/* body / footer */
.cs-modal-body {
  flex: 1; overflow-y: auto;
  padding: 0 1.6rem 1rem;
  display: flex; flex-direction: column; gap: 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--card-border-line) transparent;
}
.cs-modal-body::-webkit-scrollbar { width: 4px; }
.cs-modal-body::-webkit-scrollbar-thumb { background: var(--card-border-line); border-radius: 4px; }

.cs-multi-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.74rem; font-weight: 600; color: var(--card-muted);
}
.cs-multi-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }

.cs-modal-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.6rem 1.4rem;
  border-top: 1px solid var(--card-border-line);
  flex-shrink: 0;
}
.cs-modal-footer-info { font-size: 0.75rem; color: var(--card-muted); }
.cs-modal-footer-info strong { color: var(--card-text); }
.cs-modal-recheck {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.78rem; font-weight: 600;
  color: var(--accent); background: transparent;
  border: 1px solid var(--accent-ring); border-radius: 8px;
  padding: 7px 14px; cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: background 0.15s, border-color 0.15s;
}
.cs-modal-recheck:hover { background: var(--accent-sub); }

/* ════ RESULT CARDS ════ */
.cs-card {
  background: var(--inner-card-bg);
  border: 1px solid var(--card-border-line);
  border-radius: 14px; overflow: hidden; position: relative;
}
.cs-card-top-bar { height: 3px; }
.cs-card--tg .cs-card-top-bar { background: linear-gradient(90deg, var(--accent), var(--accent-light)); }
.cs-card--am .cs-card-top-bar { background: linear-gradient(90deg, var(--amber), #f59e0b); }
.cs-card--ac .cs-card-top-bar { background: linear-gradient(90deg, var(--blue), #60a5fa); }
.cs-card--cr .cs-card-top-bar { background: linear-gradient(90deg, var(--err), #ef4444); }
.cs-card--sl .cs-card-top-bar { background: linear-gradient(90deg, var(--slate), #94a3b8); }
.cs-card--tb .cs-card-top-bar { background: linear-gradient(90deg, #1d4ed8, #3b82f6); }

.cs-card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 8px;
}
.cs-type-badge {
  font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--card-muted);
  padding: 3px 8px; border-radius: 5px;
  border: 1px solid var(--card-border-line);
  background: var(--card-bg);
}
.cs-status-pill {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.71rem; font-weight: 700;
  padding: 4px 10px; border-radius: 999px;
}
.cs-status-pill--tg { color: var(--accent); background: var(--accent-sub); border: 1px solid var(--accent-ring); }
.cs-status-pill--am { color: var(--amber); background: var(--amber-sub); border: 1px solid rgba(180,83,9,0.20); }
.cs-status-pill--ac { color: var(--blue); background: var(--blue-sub); border: 1px solid rgba(29,78,216,0.20); }
.cs-status-pill--cr { color: var(--err); background: rgba(192,57,43,0.10); border: 1px solid rgba(192,57,43,0.20); }
.cs-status-pill--sl { color: var(--slate); background: var(--slate-sub); border: 1px solid rgba(100,116,139,0.20); }
.cs-status-pill--tb { color: var(--blue); background: var(--blue-sub); border: 1px solid rgba(29,78,216,0.20); }

.cs-card-body { padding: 0 14px 14px; display: flex; flex-direction: column; gap: 8px; }
.cs-card-row { display: flex; justify-content: space-between; align-items: center; }
.cs-field-label { font-size: 0.71rem; color: var(--card-muted); }
.cs-field-value { font-size: 0.78rem; font-weight: 600; color: var(--card-text); }
.cs-mono { font-family: 'Courier New', monospace; font-size: 0.73rem; }
.cs-field-action { font-size: 0.73rem; color: var(--accent); }

/* Activation key */
.cs-key-wrap {
  background: var(--card-bg);
  border: 1px solid var(--card-border-line);
  border-radius: 10px; padding: 11px 12px; margin-top: 4px;
}
.cs-key-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
.cs-key-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.69rem; font-weight: 700; color: var(--card-muted);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.cs-secure-badge {
  font-size: 0.60rem; font-weight: 700; letter-spacing: 0.07em;
  padding: 2px 7px; border-radius: 4px;
  background: var(--accent-sub); color: var(--accent);
  text-transform: uppercase;
}
.cs-key-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.cs-key-code {
  flex: 1; font-family: 'Courier New', monospace;
  font-size: 0.72rem; color: var(--card-text);
  word-break: break-all; background: transparent;
}
.cs-copy-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 10px; border-radius: 7px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.70rem; font-weight: 600;
  border: 1px solid var(--card-border-line);
  background: var(--inner-card-bg); color: var(--card-muted);
  cursor: pointer; white-space: nowrap; transition: all 0.15s;
}
.cs-copy-btn:hover { border-color: var(--accent); color: var(--accent); }
.cs-copy-btn.copied { border-color: var(--ok); color: var(--ok); background: rgba(26,122,58,0.10); }
.cs-key-hint { font-size: 0.65rem; color: var(--card-muted); line-height: 1.4; }

/* Dispatch panel */
.cs-dispatch-panel {
  background: var(--card-bg);
  border: 1px dashed var(--card-border-line);
  border-radius: 10px; padding: 12px; margin-top: 4px;
}
.cs-dispatch-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
.cs-dispatch-icon { color: var(--blue); flex-shrink: 0; margin-top: 1px; }
.cs-dispatch-title { font-size: 0.78rem; font-weight: 700; color: var(--card-text); margin-bottom: 2px; }
.cs-dispatch-sub { font-size: 0.70rem; color: var(--card-muted); }
.cs-dispatch-error {
  display: flex; align-items: center; gap: 7px;
  font-size: 0.72rem; color: var(--err);
  padding: 7px 10px; border-radius: 7px;
  background: rgba(192,57,43,0.08); margin-bottom: 8px;
}
.cs-dispatch-btn {
  width: 100%; height: 36px;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  border: none; border-radius: 8px;
  background: var(--blue); color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem; font-weight: 700; cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
}
.cs-dispatch-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.cs-dispatch-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.cs-dispatch-success {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 11px 12px; border-radius: 10px;
  background: var(--accent-sub); border: 1px solid var(--accent-ring); margin-top: 4px;
}
.cs-dispatch-success-icon { color: var(--ok); flex-shrink: 0; margin-top: 1px; }
.cs-dispatch-success-title { font-size: 0.78rem; font-weight: 700; color: var(--accent); margin-bottom: 2px; }
.cs-dispatch-success-sub { font-size: 0.70rem; color: var(--card-text2); }

/* CTA button */
.cs-card-cta-wrap { padding: 0 14px 14px; }
.cs-cta-btn {
  width: 100%; display: flex; align-items: center;
  gap: 10px; padding: 10px 14px; border-radius: 10px;
  border: 1.5px solid transparent; cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  font-family: 'DM Sans', sans-serif;
}
.cs-cta-btn:hover:not(.cs-cta-btn--disabled) { transform: translateY(-1px); opacity: 0.90; }
.cs-cta-btn--disabled { cursor: default; opacity: 0.6; }

.cs-cta-btn--tg { background: var(--accent-sub); border-color: var(--accent-ring); color: var(--accent); }
.cs-cta-btn--am { background: var(--amber-sub); border-color: rgba(180,83,9,0.20); color: var(--amber); }
.cs-cta-btn--ac { background: var(--blue-sub); border-color: rgba(29,78,216,0.20); color: var(--blue); }
.cs-cta-btn--cr { background: rgba(192,57,43,0.10); border-color: rgba(192,57,43,0.20); color: var(--err); }
.cs-cta-btn--tb { background: var(--blue-sub); border-color: rgba(29,78,216,0.20); color: var(--blue); }

.cs-cta-icon { flex-shrink: 0; }
.cs-cta-text { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.cs-cta-label { font-size: 0.81rem; font-weight: 700; }
.cs-cta-sub { font-size: 0.68rem; opacity: 0.75; }
.cs-cta-arrow { flex-shrink: 0; }

/* ════ TOASTS ════ */
.csp-toasts {
  position: fixed; top: 74px; left: 50%;
  transform: translateX(-50%);
  z-index: 9999; pointer-events: none;
  display: flex; flex-direction: column; gap: 8px;
  align-items: center;
}
.csp-toast {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 16px 11px 12px; border-radius: 999px;
  background: var(--card-bg);
  border: 1.5px solid var(--card-border-line);
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
  backdrop-filter: blur(16px);
  min-width: 260px; pointer-events: all;
  cursor: pointer;
}
.csp-toast.t-err  { border-top: 3px solid var(--err);  }
.csp-toast.t-ok   { border-top: 3px solid var(--ok);   }
.csp-toast.t-info { border-top: 3px solid var(--blue); }

.csp-toast-ico        { line-height: 0; flex-shrink: 0; }
.csp-toast-ico.t-err  { color: var(--err); }
.csp-toast-ico.t-ok   { color: var(--ok); }
.csp-toast-ico.t-info { color: var(--blue); }

.csp-toast-body { flex: 1; }
.csp-toast h5 { font-size: 0.80rem; font-weight: 700; color: var(--card-text); }
.csp-toast p  { font-size: 0.69rem; color: var(--card-muted); }

.csp-toast-close {
  background: transparent; border: none; cursor: pointer;
  color: var(--card-muted); line-height: 0; padding: 2px;
  flex-shrink: 0;
  transition: color 0.15s;
}
.csp-toast-close:hover { color: var(--card-text); }

/* ════ RESPONSIVE ════ */
@media (max-width: 900px) {
  .csp-inner { flex-direction: column; align-items: flex-start; padding: 2.5rem 5% 3rem; gap: 2.5rem; }
  .csp-info { padding-right: 0; }
  .csp-card-wrap { max-width: 100%; }
  .csp-bg-img { object-position: center 20%; }
}
@media (max-width: 540px) {
  .csp-card { padding: 1.8rem 1.4rem 1.5rem; }
  .csp-headline { font-size: 2.2rem; }
  .csp-inner { padding: 2rem 4% 2.5rem; gap: 2rem; }
  .cs-modal { border-radius: 16px; }

}
`;

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
export default function CitizenStatusPage() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [phoneErr, setPhoneErr] = useState("");

  /* ── Toasts with dismiss ── */
  const addToast = useCallback((type, ttl, sub) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, ttl, sub }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  /* ── Validation ── */
  const vPhone = (v) =>
    !v ? "A mobile number is required."
      : !/^[6-9]\d{9}$/.test(v) ? "Please enter a valid 10-digit number beginning with 6–9."
        : "";

  /* ── Status check ── */
  const checkStatus = async (e) => {
    e?.preventDefault();
    const pe = vPhone(phone);
    setPhoneErr(pe);
    if (pe) { addToast("error", "Validation Required", pe); return; }

    setLoading(true);
    setResults([]);
    setSearched(false);
    setModalOpen(true);
    addToast("info", "Consulting the Registry…", "Dispatching your query to the realm's records.");

    try {
      const res = await fetch(`${API}/status/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.message ?? res.status);
      }
      const data = await res.json();
      const accounts = Array.isArray(data) ? data : [data];
      setResults(accounts);
      setSearched(true);

      if (accounts.length === 0) {
        addToast("error", "No Record Found", "No account registered with this number.");
      } else {
        const ap = accounts.filter((a) => a.status === "PENDING_ACTIVATION").length;
        addToast(
          "success",
          accounts.length === 1 ? "Record Retrieved" : `${accounts.length} Accounts Located`,
          ap > 0
            ? `${ap} account(s) are ready for activation.`
            : accounts.length === 1
              ? "Your account record has been located."
              : `${accounts.length} accounts are linked to this number.`
        );
      }
    } catch {
      addToast("error", "Service Unavailable", "Unable to retrieve your status. Please verify your mobile number.");
      setModalOpen(false);
    }
    setLoading(false);
  };

  /* ── Key dispatched → re-fetch ── */
  const handleKeyDispatched = useCallback(async (account) => {
    await new Promise((r) => setTimeout(r, 800));
    try {
      const res = await fetch(`${API}/status/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const accounts = Array.isArray(data) ? data : [data];
      setResults(accounts);
      const updated = accounts.find((a) => a.accountId === account.accountId);
      if (updated?.activationKey) {
        addToast("success", "Key Received", "Your activation key is now displayed below.");
      } else {
        addToast("info", "Key Dispatched", "Key dispatched to your registered contact.");
      }
    } catch {
      addToast("info", "Key Dispatched", "Your activation key has been sent. Re-check status to view it.");
    }
  }, [phone, addToast]);

  /* ── Navigate to activation ── */
  const handleActivate = useCallback((account) => {
    const params = new URLSearchParams({ accountId: account.accountId });
    if (account.activationKey) params.set("key", account.activationKey);
    navigate(`/activate-account?${params.toString()}`);
  }, [navigate]);

  return (
    <>
      <style>{CSS}</style>

      {/* ══ NAVBAR ══ */}
      <Navbar />

      {/* ══ PAGE ══ */}
      <div className="csp">
        <div className="csp-hero">
          <img src={villageImg} alt="" aria-hidden="true" className="csp-bg-img" />
          <div className="csp-overlay-left" />
          <div className="csp-overlay-vignette" />

          <div className="csp-inner">

            {/* ══ LEFT PANEL ══ */}
            <motion.aside
              className="csp-info"
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="csp-badge">
                <FileSearch size={11} /> Verification Portal · RuralOps v2.4
              </div>

              <h1 className="csp-headline">
                Account Status,<em>Verified.</em>
              </h1>

              <p className="csp-subhead">
                After submitting your registration, the Village Administrative Officer
                reviews your application. Enter your registered mobile number to retrieve
                the council's official decision on your account.
              </p>

              <div className="csp-features">
                {features.map((ft, i) => (
                  <motion.div
                    key={i}
                    className="csp-feat"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  >
                    <div className="csp-feat-icon"><ft.icon size={17} /></div>
                    <div className="csp-feat-body">
                      <h4>{ft.title}</h4>
                      <p>{ft.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="csp-safety"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
              >
                <Lock size={15} className="csp-safety-ico" />
                <div>
                  <h5>Your enquiry is protected</h5>
                  <p>End-to-end encryption &amp; government-grade data security</p>
                </div>
              </motion.div>

              {/* Live ticker */}
              <div className="csp-ticker">
                <div className="csp-ticker-badge">
                  <span className="csp-ticker-live-dot" /> LIVE
                </div>
                <div className="csp-ticker-track">
                  <div className="csp-ticker-inner">
                    {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                      <div key={i} className="csp-ticker-item">
                        <span className="csp-ticker-state">{item.state}</span>
                        <span className={`csp-tdot csp-tdot--${item.dotVar}`} />
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* ══ RIGHT CARD ══ */}
            <div className="csp-card-wrap">
              <motion.div
                className="csp-card"
                initial={{ opacity: 0, y: 32, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="csp-card-h1">Check Account Status</div>
                <div className="csp-card-sub">
                  Enter your registered mobile number to retrieve your council's decision.
                </div>

                {/* Legend */}
                <div className="csp-legend">
                  <div className="csp-legend-title">Account States</div>
                  <div className="csp-legend-grid">
                    {[
                      { var: "tg", icon: <CheckCircle2 size={11} />, label: "Active" },
                      { var: "am", icon: <Clock size={11} />, label: "Pending Approval" },
                      { var: "ac", icon: <KeyRound size={11} />, label: "Pending Activation" },
                      { var: "cr", icon: <XCircle size={11} />, label: "Rejected" },
                    ].map((s) => (
                      <div key={s.var} className="csp-legend-item">
                        <span className={`csp-legend-pill csp-legend-pill--${s.var}`}>{s.icon}</span>
                        <span className="csp-legend-label">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={checkStatus} noValidate>
                  <div className="csp-field">
                    <label className="csp-lbl" htmlFor="csp-phone">Registered Mobile Number</label>
                    <div className="csp-iw">
                      <span className="csp-ico"><Phone size={14} /></span>
                      <input
                        id="csp-phone"
                        type="tel"
                        className={`csp-input${phoneErr ? " f-err" : ""}`}
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneErr) setPhoneErr(vPhone(e.target.value));
                        }}
                        onBlur={(e) => setPhoneErr(vPhone(e.target.value))}
                        maxLength="10"
                        autoComplete="tel"
                      />
                    </div>
                    {phoneErr && (
                      <span className="csp-err-msg">
                        <AlertCircle size={11} /> {phoneErr}
                      </span>
                    )}
                  </div>

                  <button type="submit" className="csp-submit-btn" disabled={loading}>
                    {loading
                      ? <><span className="cs-spinner" /> Consulting Registry…</>
                      : <>Reveal Status <ArrowRight size={15} /></>
                    }
                  </button>
                </form>

                <div className="csp-secure">
                  <ShieldCheck size={15} className="csp-secure-ico" />
                  <div>
                    <h5>Confidential Enquiry</h5>
                    <p>
                      Your search is encrypted and processed exclusively for official
                      district registry verification purposes.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        <Footer />
      </div>

      {/* ══ RESULTS MODAL ══ */}
      <ResultsModal
        open={modalOpen}
        loading={loading}
        searched={searched}
        results={results}
        phone={phone}
        onClose={() => setModalOpen(false)}
        onActivate={handleActivate}
        onKeyDispatched={handleKeyDispatched}
      />

      {/* ══ TOASTS ══ */}
      <div className="csp-toasts" role="region" aria-label="Notifications" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => {
            const cls = t.type === "success" ? "t-ok" : t.type === "error" ? "t-err" : "t-info";
            return (
              <motion.div
                key={t.id}
                className={`csp-toast ${cls}`}
                initial={{ opacity: 0, y: -14, scale: 0.93 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.94 }}
                onClick={() => dismissToast(t.id)}
              >
                <span className={`csp-toast-ico ${cls}`}>
                  {t.type === "error" ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
                </span>
                <div className="csp-toast-body">
                  <h5>{t.ttl}</h5>
                  <p>{t.sub}</p>
                </div>
                <button
                  className="csp-toast-close"
                  onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}
                  aria-label="Dismiss"
                >
                  <X size={13} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}