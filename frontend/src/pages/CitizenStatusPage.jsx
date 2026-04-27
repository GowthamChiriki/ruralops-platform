import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/StatusCheck.css";

const API =
  import.meta.env.VITE_API_BASE_URL ??
  "https://ruralops-platform-production.up.railway.app";

const ACCENTS = ["tg", "tb", "am", "cr", "sl"];

/* ─────────────────────────────────────────
   Status display config
───────────────────────────────────────── */
const STATUS_CONFIG = {
  APPROVED:            { label: "Approved",            pillCls: "pill--approved",   icon: "✦" },
  ACTIVE:              { label: "Active",              pillCls: "pill--approved",   icon: "✦" },
  PENDING:             { label: "Pending Review",      pillCls: "pill--pending",    icon: "◈" },
  PENDING_APPROVAL:    { label: "Pending Approval",    pillCls: "pill--pending",    icon: "◈" },
  PENDING_ACTIVATION:  { label: "Awaiting Activation", pillCls: "pill--activation", icon: "◉" },
  REJECTED:            { label: "Rejected",            pillCls: "pill--rejected",   icon: "✕" },
  SUSPENDED:           { label: "Suspended",           pillCls: "pill--suspended",  icon: "⊘" },
  INACTIVE:            { label: "Inactive",            pillCls: "pill--suspended",  icon: "⊘" },
};

const getStatus = (s) =>
  STATUS_CONFIG[s?.toUpperCase()] ?? {
    label: s ?? "Unknown",
    pillCls: "pill--unknown",
    icon: "?",
  };

/* ─────────────────────────────────────────
   Next action human-readable labels
───────────────────────────────────────── */
const NEXT_ACTION_LABELS = {
  REQUEST_ACTIVATION: "Request Activation",
  LOGIN:              "Proceed to Login",
  CONTACT_SUPPORT:    "Contact Support",
  WAIT_FOR_APPROVAL:  "Awaiting Council Review",
  REGISTER_TO_CREATE_ACCOUNT: "Register an Account",
};

const humanizeAction = (action) =>
  NEXT_ACTION_LABELS[action] ?? action?.replace(/_/g, " ") ?? "—";

/* ─────────────────────────────────────────
   Ticker items
───────────────────────────────────────── */
const TICKER_ITEMS = [
  { state: "BETHAPUDI",    dotCls: "sc-dot--tg", text: "4 accounts approved today" },
  { state: "NAGAYYAPETA",  dotCls: "sc-dot--am", text: "VAO review: 7 pending cases" },
  { state: "SAMMEDA",      dotCls: "sc-dot--tg", text: "Status checks: 38 this hour" },
  { state: "TARUVA",       dotCls: "sc-dot--tb", text: "Portal uptime: 99.98%" },
  { state: "GARISINGI",    dotCls: "sc-dot--cr", text: "3 rejections under appeal" },
  { state: "DEVARAPALLE",  dotCls: "sc-dot--tg", text: "Activation rate: 91.4%" },
  { state: "MUSHIDIPALLE", dotCls: "sc-dot--am", text: "Verification queue: 12 citizens" },
  { state: "CHINTALAPUDI", dotCls: "sc-dot--tg", text: "6 accounts activated today" },
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
   ActivationKey row
───────────────────────────────────────── */
function ActivationKeyRow({ activationKey }) {
  const { copied, copy } = useCopyToClipboard();

  if (!activationKey) return null;

  return (
    <div className="sc-acct-card__activation-row">
      <div className="sc-acct-card__activation-header">
        <span className="sc-acct-card__lbl">Activation Key</span>
        <span className="sc-acct-card__activation-badge">Secure Token</span>
      </div>
      <div className="sc-acct-card__activation-key-wrap">
        <code className="sc-acct-card__activation-key">{activationKey}</code>
        <button
          className={`sc-acct-card__copy-btn ${copied ? "sc-acct-card__copy-btn--copied" : ""}`}
          onClick={() => copy(activationKey)}
          title="Copy activation key"
          aria-label="Copy activation key to clipboard"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <p className="sc-acct-card__activation-hint">
        Use this key to activate your account. Do not share it publicly.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Inline Key Request Panel
───────────────────────────────────────── */
function InlineKeyRequestPanel({ account, onKeyDispatched }) {
  const [loading,    setLoading]    = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [error,      setError]      = useState(null);

  // Derive account type for backend
  const toBackendType = (id) => {
    if (!id) return null;
    const prefix = id.substring(0, 4).toUpperCase();
    return { RLOC: "CITIZEN", RLOW: "WORKER", RLOV: "VAO", RLOM: "MAO" }[prefix] ?? null;
  };

  const backendType = toBackendType(account.accountId) ?? account.accountType;

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/activation/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: backendType,
          accountId: account.accountId,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Request failed");
      setDispatched(true);
      // Re-fetch updated key from status (parent will re-check status)
      onKeyDispatched();
    } catch (err) {
      setError(err.message || "Failed to dispatch key. Try again.");
    }
    setLoading(false);
  };

  if (dispatched) {
    return (
      <div className="sc-ikd-success">
        <p className="sc-ikd-success-title">✦ Key Dispatched</p>
        <p className="sc-ikd-success-sub">
          A fresh activation key has been issued. Refresh status to view it below.
        </p>
      </div>
    );
  }

  return (
    <div className="sc-inline-keydispatch">
      <div className="sc-ikd-header">
        <div className="sc-ikd-icon">◉</div>
        <div>
          <p className="sc-ikd-title">Request Activation Key</p>
          <p className="sc-ikd-sub">
            No key issued yet, or yours expired. Summon a fresh key now.
          </p>
        </div>
      </div>

      {error && (
        <div className="sc-ikd-exhausted">
          <span className="sc-ikd-exhausted-icon">✕</span>
          <span>{error}</span>
        </div>
      )}

      <button
        className="sc-ikd-btn sc-ikd-btn--dispatch"
        onClick={handleRequest}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="sc-ikd-spinner" />
            Dispatching…
          </>
        ) : (
          <>◉ Dispatch Activation Key</>
        )}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   AccountResultCard
───────────────────────────────────────── */
function AccountResultCard({ account, onActivate, onKeyDispatched, index }) {
  const cfg    = getStatus(account.status);
  const accent = ACCENTS[index % ACCENTS.length];
  const isPendingActivation = account.status === "PENDING_ACTIVATION";

  return (
    <div className={`sc-acct-card sc-acct-card--${accent}`}>
      <div className="sc-acct-card__bar" />

      {/* Header */}
      <div className="sc-acct-card__header">
        <span className={`sc-acct-card__type-badge sc-acct-card__type-badge--${accent}`}>
          {account.accountType}
        </span>
        <span className={`sc-acct-card__status-pill ${cfg.pillCls}`}>
          <span className="sc-pill-icon">{cfg.icon}</span>
          {cfg.label}
        </span>
      </div>

      {/* Body rows */}
      <div className="sc-acct-card__body">
        <div className="sc-acct-card__row">
          <span className="sc-acct-card__lbl">Account ID</span>
          <span className="sc-acct-card__val sc-mono">{account.accountId ?? "—"}</span>
        </div>

        {account.nextAction && (
          <div className="sc-acct-card__row">
            <span className="sc-acct-card__lbl">Next Step</span>
            <span className={`sc-acct-card__val sc-acct-card__next-action sc-next-action--${account.nextAction}`}>
              {humanizeAction(account.nextAction)}
            </span>
          </div>
        )}

        {/* Activation key — shown when status is PENDING_ACTIVATION and key exists */}
        {isPendingActivation && account.activationKey && (
          <ActivationKeyRow activationKey={account.activationKey} />
        )}

        {/* Inline key request — shown when pending activation but no key yet */}
        {isPendingActivation && !account.activationKey && (
          <InlineKeyRequestPanel
            account={account}
            onKeyDispatched={() => onKeyDispatched(account)}
          />
        )}
      </div>

      {/* CTA — activate button (only shown when key is present) */}
      {account.canActivate && account.activationKey && (
        <button
          className={`sc-acct-card__cta sc-acct-card__cta--${accent}`}
          onClick={() => onActivate(account)}
        >
          <span className="sc-cta-icon">◉</span>
          Activate Account
          <span className="sc-cta-arrow">→</span>
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main page component
───────────────────────────────────────── */
export default function CitizenStatusPage() {
  const navigate = useNavigate();
  const [phone,    setPhone]    = useState("");
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [toasts,   setToasts]   = useState([]);

  /* ── Toast helpers ── */
  const addToast = useCallback((type, label, sub) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, label, sub, phase: "entering" }]);
    setTimeout(() => {
      setToasts((p) =>
        p.map((t) => (t.id === id ? { ...t, phase: "leaving" } : t))
      );
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 360);
    }, 5000);
  }, []);

  const dismiss = (id) => {
    setToasts((p) =>
      p.map((t) => (t.id === id ? { ...t, phase: "leaving" } : t))
    );
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 360);
  };

  /* ── Status check ── */
  const checkStatus = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setResults([]);
    setSearched(false);
    addToast("info", "Consulting the Rolls…", "Dispatching your query to the realm's records.");

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
        const activationPending = accounts.filter(
          (a) => a.status === "PENDING_ACTIVATION"
        ).length;

        addToast(
          "success",
          accounts.length === 1
            ? "Status Retrieved"
            : `${accounts.length} Accounts Found`,
          activationPending > 0
            ? `${activationPending} account(s) ready for activation.`
            : accounts.length === 1
            ? "Account record located successfully."
            : `${accounts.length} accounts linked to this number.`
        );
      }
    } catch (err) {
      console.error("Status check failed:", err);
      addToast(
        "error",
        "Raven Unreachable",
        "Unable to fetch status. Verify your mobile number."
      );
    }

    setLoading(false);
  };

  /* ── Re-check status after key dispatch to pick up the newly issued key ── */
  const handleKeyDispatched = useCallback(async (account) => {
    // Small delay so the backend has time to persist the new token
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
        addToast("info", "Key Dispatched", "Key sent to your registered contact. Refresh to view it here.");
      }
    } catch {
      addToast("info", "Key Dispatched", "Your activation key was sent. Re-check status to see it.");
    }
  }, [phone, addToast]);

  /* ── Navigate to activate page, pre-filling accountId and key ── */
  const handleActivate = useCallback((account) => {
    const params = new URLSearchParams({ accountId: account.accountId });
    if (account.activationKey) params.set("key", account.activationKey);
    navigate(`/activate-account?${params.toString()}`);
  }, [navigate]);

  /* ── Render ── */
  return (
    <>
      <Navbar />

      <main className="status-page">

        {/* ══ LEFT ══ */}
        <div className="status-left">

          {/* Eyebrow */}
          <div className="sc-eyebrow">
            <span className="sc-eyebrow__dot" />
            RuralOps Verification Chamber
          </div>

          {/* Title */}
          <div className="sc-title-block">
            <h1 className="sc-title">
              Consult the
              <span className="sc-title__shimmer">Realm&apos;s Registry</span>
            </h1>
            <p className="sc-subtitle">
              After swearing your registration oath, the Village Administrative Officer
              reviews your claim. Enter your phone number to see the council&apos;s verdict.
            </p>

            <div className="sc-info-points">
              {[
                { cls: "sc-dot--tg", text: "Submit your registration scroll"   },
                { cls: "sc-dot--am", text: "VAO council reviews your claim"    },
                { cls: "sc-dot--tb", text: "Account approved and unsealed"     },
                { cls: "sc-dot--cr", text: "Sovereign protection of your data" },
              ].map((pt, i) => (
                <div key={i} className="sc-info-point">
                  <span className={`sc-dot ${pt.cls}`} />
                  {pt.text}
                </div>
              ))}
            </div>
          </div>

          {/* Live ticker */}
          <div className="sc-ticker">
            <div className="sc-ticker__badge">
              <span className="sc-ticker__live-dot" />
              LIVE
            </div>
            <div className="sc-ticker__track">
              <div className="sc-ticker__inner">
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <div key={i} className="sc-ticker__item">
                    <span className="sc-ticker__state">{item.state}</span>
                    <span className={`sc-dot ${item.dotCls}`} style={{ width: 5, height: 5 }} />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results area */}
          <div className="sc-results-area">

            {!searched && !loading && (
              <div className="sc-results-placeholder">
                <span className="sc-placeholder__icon">⚜</span>
                <div className="sc-placeholder__text">
                  <p className="sc-placeholder__title">Your verdict awaits</p>
                  <p className="sc-placeholder__sub">
                    Enter your registered phone number and submit to see account status here.
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="sc-loading-wrap">
                <div className="sc-loading-ring">
                  <div className="sc-loading-ring__outer" />
                  <div className="sc-loading-ring__inner" />
                </div>
                <p className="sc-placeholder__title" style={{ margin: 0 }}>
                  Consulting the rolls…
                </p>
              </div>
            )}

            {searched && results.length === 0 && (
              <AccountResultCard
                account={{
                  accountType: "NO RECORD",
                  accountId:   phone,
                  status:      "REJECTED",
                  nextAction:  "REGISTER_TO_CREATE_ACCOUNT",
                  canActivate: false,
                  activationKey: null,
                }}
                onActivate={() => {}}
                onKeyDispatched={() => {}}
                index={0}
              />
            )}

            {results.length > 1 && (
              <div className="sc-multi-label">
                <span className="sc-dot sc-dot--tg" />
                {results.length} accounts linked to this number
              </div>
            )}

            {results.map((account, i) => (
              <AccountResultCard
                key={account.accountId ?? i}
                account={account}
                onActivate={handleActivate}
                onKeyDispatched={handleKeyDispatched}
                index={i}
              />
            ))}

          </div>
        </div>

        {/* ══ RIGHT — sticky form ══ */}
        <div className="status-right">
          <div className="sc-form-card">
            <div className="sc-form-card__top-bar" />

            <h2 className="sc-form-card__title">Check Account Status</h2>

            <p className="sc-form-card__desc">
              Present your bonded phone number to retrieve the council&apos;s verdict.
            </p>

            <form className="sc-form" onSubmit={checkStatus} noValidate>
              <div className="sc-form-group">
                <label htmlFor="sc-phone">Registered Phone Number</label>
                <input
                  id="sc-phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  pattern="[6-9][0-9]{9}"
                  maxLength="10"
                  required
                  autoComplete="tel"
                />
              </div>

              <button type="submit" className="sc-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="sc-btn-spinner" />
                    Consulting Rolls…
                  </>
                ) : (
                  <>
                    <span>⚜</span>
                    Reveal Status
                  </>
                )}
              </button>
            </form>

            {/* Status legend */}
            <div className="sc-form-card__legend">
              <p className="sc-form-card__legend-title">Account States</p>
              <div className="sc-legend-grid">
                {[
                  { pill: "pill--approved",   icon: "✦", label: "Active"             },
                  { pill: "pill--pending",     icon: "◈", label: "Pending Approval"   },
                  { pill: "pill--activation",  icon: "◉", label: "Pending Activation" },
                  { pill: "pill--rejected",    icon: "✕", label: "Rejected"           },
                ].map((s, i) => (
                  <div key={i} className="sc-legend-item">
                    <span className={`sc-legend-pill ${s.pill}`}>
                      {s.icon}
                    </span>
                    <span className="sc-legend-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sc-form-card__info">
              {[
                { cls: "sc-dot--tg", text: "Submit scroll" },
                { cls: "sc-dot--am", text: "VAO reviews"   },
                { cls: "sc-dot--tb", text: "Approved"       },
                { cls: "sc-dot--cr", text: "Data secured"   },
              ].map((s, i) => (
                <div key={i} className="sc-form-card__step">
                  <span className={`sc-form-card__step-dot sc-dot ${s.cls}`} />
                  {s.text}
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="citizen-footer">
        <div className="footer-left">
          <strong>RuralOps Platform</strong>
          <span>Digital Infrastructure for Rural Governance</span>
        </div>
        <div className="footer-center">© 2026 RuralOps — AKSHAY PODENDLA</div>
        <div className="footer-links">
          {["Privacy", "Security", "Support"].map((l) => (
            <a key={l} href="#">{l}</a>
          ))}
        </div>
      </footer>

      {/* Toast container */}
      <div className="sc-toast-container" role="region" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`sc-toast sc-toast--${t.type} sc-toast--${t.phase}`}
            onClick={() => dismiss(t.id)}
          >
            <div className="sc-toast-accent" />
            <div className="sc-toast-icon-wrap">
              <div className="sc-toast-icon">
                {t.type === "success" ? "✦" : t.type === "error" ? "✕" : "◈"}
              </div>
              <span className="sc-toast-pulse" />
            </div>
            <div className="sc-toast-body">
              <p className="sc-toast-label">{t.label}</p>
              <p className="sc-toast-sub">{t.sub}</p>
            </div>
            <button
              className="sc-toast-dismiss"
              onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}