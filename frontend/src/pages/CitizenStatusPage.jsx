import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/StatusCheck.css";

const API =
  import.meta.env.VITE_API_BASE_URL ??
  "https://ruralops-platform-production.up.railway.app";

const ACCENTS = ["tg", "tb", "am", "cr", "sl"];

/* ─────────────────────────────────────────
   Theme
───────────────────────────────────────── */
function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const s = localStorage.getItem("ruralops-theme");
    if (s) return s === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("ruralops-theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, setDark];
}

/* ─────────────────────────────────────────
   Status display config
───────────────────────────────────────── */
const STATUS_CONFIG = {
  APPROVED:           { label: "Approved",            pillCls: "pill--approved",   icon: "✦", color: "tg" },
  ACTIVE:             { label: "Active",              pillCls: "pill--approved",   icon: "✦", color: "tg" },
  PENDING:            { label: "Pending Review",      pillCls: "pill--pending",    icon: "◈", color: "am" },
  PENDING_APPROVAL:   { label: "Pending Approval",    pillCls: "pill--pending",    icon: "◈", color: "am" },
  PENDING_ACTIVATION: { label: "Awaiting Activation", pillCls: "pill--activation", icon: "◉", color: "ac" },
  REJECTED:           { label: "Rejected",            pillCls: "pill--rejected",   icon: "✕", color: "cr" },
  SUSPENDED:          { label: "Suspended",           pillCls: "pill--suspended",  icon: "⊘", color: "sl" },
  INACTIVE:           { label: "Inactive",            pillCls: "pill--suspended",  icon: "⊘", color: "sl" },
};

const getStatus = (s) =>
  STATUS_CONFIG[s?.toUpperCase()] ?? {
    label: s ?? "Unknown",
    pillCls: "pill--unknown",
    icon: "?",
    color: "sl",
  };

/* ─────────────────────────────────────────
   Next action labels
───────────────────────────────────────── */
const NEXT_ACTION_LABELS = {
  REQUEST_ACTIVATION:         "Request Activation",
  LOGIN:                      "Proceed to Login",
  CONTACT_SUPPORT:            "Contact Support",
  WAIT_FOR_APPROVAL:          "Awaiting Council Review",
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
    <div className="sc-activation-row">
      <div className="sc-activation-header">
        <span className="sc-field-label">Activation Key</span>
        <span className="sc-secure-badge">Secure Token</span>
      </div>
      <div className="sc-key-wrap">
        <code className="sc-key-code">{activationKey}</code>
        <button
          className={`sc-copy-btn ${copied ? "sc-copy-btn--copied" : ""}`}
          onClick={() => copy(activationKey)}
          aria-label="Copy activation key to clipboard"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <p className="sc-key-hint">
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
        body: JSON.stringify({ accountType: backendType, accountId: account.accountId }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Request failed");
      setDispatched(true);
      onKeyDispatched();
    } catch (err) {
      setError(err.message || "Failed to dispatch key. Try again.");
    }
    setLoading(false);
  };

  if (dispatched) {
    return (
      <div className="sc-dispatch-success">
        <div className="sc-dispatch-success-icon">✦</div>
        <div>
          <p className="sc-dispatch-success-title">Key Dispatched</p>
          <p className="sc-dispatch-success-sub">
            A fresh activation key has been issued. Refresh status to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-dispatch-panel">
      <div className="sc-dispatch-header">
        <div className="sc-dispatch-icon">◉</div>
        <div>
          <p className="sc-dispatch-title">Request Activation Key</p>
          <p className="sc-dispatch-sub">No key issued yet, or yours expired. Summon a fresh key now.</p>
        </div>
      </div>
      {error && (
        <div className="sc-dispatch-error">
          <span>✕</span>
          <span>{error}</span>
        </div>
      )}
      <button className="sc-dispatch-btn" onClick={handleRequest} disabled={loading}>
        {loading ? (
          <><span className="sc-spin" /> Dispatching…</>
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
    <div className={`sc-card sc-card--${accent}`}>
      <div className="sc-card-bar" />

      <div className="sc-card-header">
        <div className="sc-card-header-left">
          <span className={`sc-type-badge sc-type-badge--${accent}`}>
            {account.accountType}
          </span>
        </div>
        <span className={`sc-status-pill ${cfg.pillCls}`}>
          <span className="sc-pill-icon">{cfg.icon}</span>
          {cfg.label}
        </span>
      </div>

      <div className="sc-card-body">
        <div className="sc-card-row">
          <span className="sc-field-label">Account ID</span>
          <span className="sc-field-value sc-mono">{account.accountId ?? "—"}</span>
        </div>

        {account.nextAction && (
          <div className="sc-card-row">
            <span className="sc-field-label">Next Step</span>
            <span className={`sc-field-value sc-next-action sc-next-action--${account.nextAction}`}>
              {humanizeAction(account.nextAction)}
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

      {account.canActivate && account.activationKey && (
        <button className={`sc-card-cta sc-card-cta--${accent}`} onClick={() => onActivate(account)}>
          <span>◉</span>
          Activate Account
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:"auto"}}>
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
export default function CitizenStatusPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useTheme();

  const [phone,    setPhone]    = useState("");
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [toasts,   setToasts]   = useState([]);
  const [phoneErr, setPhoneErr] = useState("");

  /* Toasts */
  const addToast = useCallback((type, ttl, sub) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, ttl, sub, out: false }]);
    setTimeout(() => {
      setToasts((p) => p.map((t) => (t.id === id ? { ...t, out: true } : t)));
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 320);
    }, 4000);
  }, []);

  const dismissToast = (id) => {
    setToasts((p) => p.map((t) => (t.id === id ? { ...t, out: true } : t)));
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 320);
  };

  const vPhone = (v) => !v ? "Phone number is required." : !/^[6-9]\d{9}$/.test(v) ? "Enter a valid 10-digit number starting with 6–9." : "";

  /* Status check */
  const checkStatus = async (e) => {
    e?.preventDefault();
    const pe = vPhone(phone);
    setPhoneErr(pe);
    if (pe) { addToast("error", "Validation Error", pe); return; }
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
        const activationPending = accounts.filter((a) => a.status === "PENDING_ACTIVATION").length;
        addToast(
          "success",
          accounts.length === 1 ? "Status Retrieved" : `${accounts.length} Accounts Found`,
          activationPending > 0
            ? `${activationPending} account(s) ready for activation.`
            : accounts.length === 1
            ? "Account record located successfully."
            : `${accounts.length} accounts linked to this number.`
        );
      }
    } catch (err) {
      addToast("error", "Raven Unreachable", "Unable to fetch status. Verify your mobile number.");
    }
    setLoading(false);
  };

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
        addToast("info", "Key Dispatched", "Key sent to your registered contact.");
      }
    } catch {
      addToast("info", "Key Dispatched", "Your activation key was sent. Re-check status to see it.");
    }
  }, [phone, addToast]);

  const handleActivate = useCallback((account) => {
    const params = new URLSearchParams({ accountId: account.accountId });
    if (account.activationKey) params.set("key", account.activationKey);
    navigate(`/activate-account?${params.toString()}`);
  }, [navigate]);

  return (
    <>
      <div className="sc-page">
        {/* Ambient orbs */}
        <div className="sc-orb sc-orb-1" />
        <div className="sc-orb sc-orb-2" />

        <Navbar />

        {/* Theme toggle */}
        <button
          className="sc-theme-btn"
          onClick={() => setDark((d) => !d)}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              Light
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              Dark
            </>
          )}
        </button>

        <div className="sc-body">
          {/* ══ LEFT ══ */}
          <div className="sc-left">

            {/* Status pill */}
            <div className="sc-status-pill-wrap">
              <span className="sc-live-dot" />
              <span>Verification Chamber · RuralOps v2.4</span>
            </div>

            {/* Hero */}
            <div className="sc-hero">
              <h1 className="sc-hero-title">
                Consult the<br />
                <em>Realm's Registry</em>
              </h1>
              <p className="sc-hero-sub">
                After swearing your registration oath, the Village Administrative Officer
                reviews your claim. Enter your registered phone number to see the council's verdict on your account.
              </p>
            </div>

            {/* Info steps */}
            <div className="sc-steps">
              {[
                { cls: "tg", icon: "📝", label: "Submit your registration scroll"   },
                { cls: "am", icon: "📋", label: "VAO council reviews your claim"    },
                { cls: "tb", icon: "✦",  label: "Account approved & unsealed"       },
                { cls: "cr", icon: "🔒", label: "Sovereign protection of your data" },
              ].map((s, i) => (
                <div key={i} className="sc-step">
                  <div className={`sc-step-ic sc-step-ic--${s.cls}`}>{s.icon}</div>
                  <span className="sc-step-text">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Live ticker */}
            <div className="sc-ticker">
              <div className="sc-ticker-badge">
                <span className="sc-ticker-dot" />
                LIVE
              </div>
              <div className="sc-ticker-track">
                <div className="sc-ticker-inner">
                  {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                    <div key={i} className="sc-ticker-item">
                      <span className="sc-ticker-state">{item.state}</span>
                      <span className={`sc-dot ${item.dotCls}`} />
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="sc-results">
              {!searched && !loading && (
                <div className="sc-results-empty">
                  <span className="sc-results-empty-icon">⚜</span>
                  <div>
                    <p className="sc-results-empty-title">Your verdict awaits</p>
                    <p className="sc-results-empty-sub">Enter your registered phone number and submit to see account status here.</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="sc-results-loading">
                  <div className="sc-ring">
                    <div className="sc-ring-outer" />
                    <div className="sc-ring-inner" />
                  </div>
                  <p className="sc-results-empty-title" style={{margin:0}}>Consulting the rolls…</p>
                </div>
              )}

              {searched && results.length === 0 && (
                <AccountResultCard
                  account={{ accountType:"NO RECORD", accountId:phone, status:"REJECTED", nextAction:"REGISTER_TO_CREATE_ACCOUNT", canActivate:false, activationKey:null }}
                  onActivate={() => {}} onKeyDispatched={() => {}} index={0}
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
          <div className="sc-right">
            <div className="sc-form-card">
              <div className="sc-form-card-bar" />

              <div className="sc-form-card-head">
                <span className="sc-form-card-eyebrow">Account Lookup</span>
                <h2 className="sc-form-card-title">Check Account Status</h2>
                <p className="sc-form-card-desc">
                  Present your bonded phone number to retrieve the council's verdict on your registration.
                </p>
              </div>

              <form className="sc-form" onSubmit={checkStatus} noValidate>
                <div className={`sc-field ${phoneErr ? "sc-field--err" : ""}`}>
                  <label htmlFor="sc-phone">Registered Phone Number</label>
                  <input
                    id="sc-phone"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (phoneErr) setPhoneErr(vPhone(e.target.value)); }}
                    onBlur={(e) => setPhoneErr(vPhone(e.target.value))}
                    maxLength="10"
                    autoComplete="tel"
                  />
                  {phoneErr && <span className="sc-field-err-msg" role="alert">⚠ {phoneErr}</span>}
                </div>

                <button type="submit" className="sc-submit-btn" disabled={loading}>
                  {loading ? (
                    <><span className="sc-spin" aria-hidden="true" /> Consulting Rolls…</>
                  ) : (
                    <>
                      <span>⚜</span>
                      Reveal Status
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:"auto"}}>
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Legend */}
              <div className="sc-legend">
                <p className="sc-legend-title">Account States</p>
                <div className="sc-legend-grid">
                  {[
                    { pill: "pill--approved",   icon: "✦", label: "Active"             },
                    { pill: "pill--pending",     icon: "◈", label: "Pending Approval"   },
                    { pill: "pill--activation",  icon: "◉", label: "Pending Activation" },
                    { pill: "pill--rejected",    icon: "✕", label: "Rejected"           },
                  ].map((s, i) => (
                    <div key={i} className="sc-legend-item">
                      <span className={`sc-legend-pill ${s.pill}`}>{s.icon}</span>
                      <span className="sc-legend-label">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div className="sc-form-steps">
                {[
                  { cls: "tg", text: "Submit scroll" },
                  { cls: "am", text: "VAO reviews"   },
                  { cls: "tb", text: "Approved"      },
                  { cls: "cr", text: "Data secured"  },
                ].map((s, i) => (
                  <div key={i} className="sc-form-step">
                    <span className={`sc-dot sc-dot--${s.cls}`} />
                    {s.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="sc-footer">
          <div className="sc-footer-brand">
            <strong>RuralOps Platform</strong>
            <span>Digital Infrastructure for Rural Governance</span>
          </div>
          <div className="sc-footer-copy">© 2026 RuralOps — AKSHAY PODENDLA</div>
          <nav className="sc-footer-nav">
            {["Privacy", "Security", "Support"].map((l) => (
              <a key={l} href="#">{l}</a>
            ))}
          </nav>
        </footer>

      </div>

      {/* Toasts */}
      <div className="sc-toasts" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`sc-toast sc-toast--${t.type} ${t.out ? "tout" : "tin"}`}
            onClick={() => dismissToast(t.id)}
          >
            <div className="sc-toast-shell">
              <div className="sc-toast-ic">
                {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "i"}
              </div>
              <div className="sc-toast-body">
                <div className="sc-toast-ttl">{t.ttl}</div>
                <div className="sc-toast-msg">{t.sub}</div>
              </div>
              <button
                className="sc-toast-close"
                onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}
                aria-label="Dismiss"
              >×</button>
            </div>
            {!t.out && <div className="sc-toast-bar" />}
          </div>
        ))}
      </div>
    </>
  );
}