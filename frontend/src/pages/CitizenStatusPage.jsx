import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles//StatusCheck.css";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const ACCENTS = ["tg", "tb", "am", "cr", "sl"];

const STATUS_CONFIG = {
  APPROVED:            { label: "Approved",            pillCls: "status-approved-pill",  icon: "⚔️" },
  ACTIVE:              { label: "Active",              pillCls: "status-approved-pill",  icon: "⚔️" },
  PENDING:             { label: "Pending Review",      pillCls: "status-pending-pill",   icon: "📜" },
  PENDING_APPROVAL:    { label: "Pending Approval",    pillCls: "status-pending-pill",   icon: "📜" },
  AWAITING_ACTIVATION: { label: "Awaiting Activation", pillCls: "status-pending-pill",   icon: "📜" },
  REJECTED:            { label: "Rejected",            pillCls: "status-rejected-pill",  icon: "🛡️" },
  SUSPENDED:           { label: "Suspended",           pillCls: "status-suspended-pill", icon: "⊘"  },
  INACTIVE:            { label: "Inactive",            pillCls: "status-suspended-pill", icon: "⊘"  },
};
const getStatus = (s) =>
  STATUS_CONFIG[s?.toUpperCase()] ?? { label: s ?? "Unknown", pillCls: "status-unknown-pill", icon: "?" };

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

function AccountResultCard({ account, onActivate, index }) {
  const cfg    = getStatus(account.status);
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <div className={`sc-acct-card sc-acct-card--${accent}`}>
      <div className="sc-acct-card__bar" />

      <div className="sc-acct-card__header">
        <span className={`sc-acct-card__type-badge sc-acct-card__type-badge--${accent}`}>
          {account.accountType}
        </span>
        <span className={`sc-acct-card__status-pill ${cfg.pillCls}`}>
          {cfg.icon}&nbsp;{cfg.label}
        </span>
      </div>

      <div className="sc-acct-card__body">
        <div className="sc-acct-card__row">
          <span className="sc-acct-card__lbl">Account ID</span>
          <span className="sc-acct-card__val sc-mono">{account.accountId}</span>
        </div>
        {account.nextAction && (
          <div className="sc-acct-card__row">
            <span className="sc-acct-card__lbl">Next Action</span>
            <span className="sc-acct-card__val">{account.nextAction.replace(/_/g, " ")}</span>
          </div>
        )}
      </div>

      {account.canActivate && (
        <button
          className={`sc-acct-card__cta sc-acct-card__cta--${accent}`}
          onClick={() => onActivate(account)}
        >
          ⚔ Activate Account →
        </button>
      )}
    </div>
  );
}

export default function CitizenStatusPage() {
  const navigate = useNavigate();
  const [phone,    setPhone]    = useState("");
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [toasts,   setToasts]   = useState([]);

  const addToast = useCallback((type, label, sub) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, label, sub, phase: "entering" }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, phase: "leaving" } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 360);
    }, 5000);
  }, []);

  const dismiss = (id) => {
    setToasts(p => p.map(t => t.id === id ? { ...t, phase: "leaving" } : t));
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 360);
  };

  const checkStatus = async (e) => {
    e.preventDefault();
    setLoading(true); setResults([]); setSearched(false);
    addToast("info", "Consulting the Rolls…", "Dispatching your query to the realm's records.");
    try {
      const res = await fetch(`${API}/status/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const accounts = Array.isArray(data) ? data : [data];
      setResults(accounts); setSearched(true);
      accounts.length === 0
        ? addToast("error", "No Record Found", "No account registered with this number.")
        : addToast(
            "success",
            accounts.length === 1 ? "Status Retrieved" : `${accounts.length} Accounts Found`,
            accounts.length === 1 ? "Account record located." : `${accounts.length} accounts linked to this number.`
          );
    } catch {
      addToast("error", "Raven Unreachable", "Unable to fetch status. Check your mobile number.");
    }
    setLoading(false);
  };

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
          <div>
            <h1 className="sc-title">
              Consult the
              <span className="sc-title__shimmer">Realm&apos;s Registry</span>
            </h1>
            <p className="sc-subtitle">
              After swearing your registration oath, the Village Administrative Officer reviews
              your claim. Enter your phone number on the right to see the verdict.
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
                <p className="sc-placeholder__title" style={{ margin: 0 }}>Consulting the rolls…</p>
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
                }}
                onActivate={() => {}}
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
                onActivate={(a) => navigate(`/activate-account?accountId=${a.accountId}`)}
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
                  onChange={e => setPhone(e.target.value)}
                  pattern="[6-9][0-9]{9}"
                  maxLength="10"
                  required
                />
              </div>

              <button
                type="submit"
                className="sc-submit-btn"
                disabled={loading}
              >
                {loading ? "⚔ Consulting Rolls…" : "⚜ Reveal Status"}
              </button>
            </form>

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
          {["Privacy", "Security", "Support"].map(l => (
            <a key={l} href="#">{l}</a>
          ))}
        </div>
      </footer>

      {/* Toast container */}
      <div className="sc-toast-container" role="region" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`sc-toast sc-toast--${t.type} sc-toast--${t.phase}`}
            onClick={() => dismiss(t.id)}
          >
            <div className="sc-toast-accent" />
            <div className="sc-toast-icon-wrap">
              <div className="sc-toast-icon">
                {t.type === "success" ? "⚔️" : t.type === "error" ? "🛡️" : "📜"}
              </div>
              <span className="sc-toast-pulse" />
            </div>
            <div className="sc-toast-body">
              <p className="sc-toast-label">{t.label}</p>
              <p className="sc-toast-sub">{t.sub}</p>
            </div>
            <button
              className="sc-toast-dismiss"
              onClick={e => { e.stopPropagation(); dismiss(t.id); }}
              aria-label="Dismiss"
            >×</button>
          </div>
        ))}
      </div>
    </>
  );
}