import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "../styles/Login.css";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const ROLE_CONFIG = {
  CITIZEN: { label: "Citizen",               sigil: "⚔️" },
  WORKER:  { label: "Field Worker",          sigil: "🛠️" },
  VAO:     { label: "Village Admin Officer", sigil: "📜" },
  MAO:     { label: "Mandal Admin Officer",  sigil: "⚜️" },
};

const PLATFORM_NEWS = [
  "⚔️ New welfare scheme registrations open for Kharif season 2026",
  "📜 VAO verification turnaround reduced to 48 hours across all mandals",
  "🏰 RuralOps now holding dominion over 40 villages — Chintalapudi region",
  "🔔 Field Workers: Updated route assignments await in your war room",
  "🏆 RuralOps recognised by the State Digital Governance Council — 2026",
  "📱 Mobile access granted — command your realm from any device",
];

const QUICK_LINKS = [
  { label: "Swear the Oath",    to: "/citizen/register",   icon: "📝", sub: "New Registration" },
  { label: "Track Your Scroll", to: "/citizen/status",     icon: "🔍", sub: "Check Status" },
  { label: "Claim Your Seal",   to: "/activate-account",   icon: "🔑", sub: "Activate Account" },
  { label: "Request a Raven",   to: "/activation/request", icon: "✉️", sub: "Request Key" },
];

const TICKER_ITEMS = [
  { state: "PEDANANDI PALLI", dot: "green", text: "12 new citizens entered the rolls today" },
  { state: "KALIGOTLA",       dot: "gold",  text: "VAO verification: 3 scrolls pending seal" },
  { state: "TARUVA",          dot: "green", text: "Welfare tribute: ₹48,000 disbursed" },
  { state: "MUSHIDIPALLE",    dot: "blue",  text: "Land records updated in the Grand Ledger" },
  { state: "SAMMEDA",         dot: "green", text: "8 oaths sworn and approved" },
  { state: "GARISINGI",       dot: "red",   text: "2 scrolls require re-submission" },
  { state: "DEVARAPALLE",     dot: "green", text: "Census sync: 99.2% complete" },
  { state: "NAGAYYAPETA",     dot: "gold",  text: "Scheme enrollment open till month-end" },
];

let refreshTimer = null;

const startTokenRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return;
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return;
      const data = await res.json();
      localStorage.setItem("accessToken",  data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
    } catch (err) {
      console.error("Refresh token failed", err);
    }
  }, 12 * 60 * 1000); // refresh at 12min — token expires at 15min
};

// ── Central session storage helper ──────────────────────────────────────────
// Keys must match exactly what App.jsx guards + all dashboards read.
export const saveSession = (data) => {
  localStorage.setItem("accessToken",  data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("accountType",  data.activeRole);          // canonical role key
  localStorage.setItem("accountId",    data.accountId);           // canonical id key
  localStorage.setItem("roles",        JSON.stringify(data.roles ?? []));
  localStorage.setItem("villageId",    data.villageId ?? "");
};

// ── Central authenticated fetch helper ──────────────────────────────────────
export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("accessToken");
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

function LoginPage() {
  const navigate = useNavigate();

  const [phoneNumber,  setPhoneNumber]  = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [toasts,       setToasts]       = useState([]);
  const [newsIndex,    setNewsIndex]    = useState(0);
  const [newsVisible,  setNewsVisible]  = useState(true);
  const [detectedRole, setDetectedRole] = useState(null);
  const [phoneError,   setPhoneError]   = useState("");
  const [passError,    setPassError]    = useState("");

  const newsTimer = useRef(null);

  useEffect(() => () => clearInterval(newsTimer.current), []);

  useEffect(() => {
    newsTimer.current = setInterval(() => {
      setNewsVisible(false);
      setTimeout(() => {
        setNewsIndex(i => (i + 1) % PLATFORM_NEWS.length);
        setNewsVisible(true);
      }, 340);
    }, 5000);
    return () => clearInterval(newsTimer.current);
  }, []);

  const addToast = (type, label, sub) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, label, sub, leaving: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 260);
    }, 5000);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 260);
  };

  const validatePhone = (v) => {
    if (!v) return "The raven bears no name — enter your phone number.";
    if (!/^[6-9]\d{9}$/.test(v)) return "This sigil is false — 10 digits, starting with 6–9.";
    return "";
  };
  const validatePass = (v) => {
    if (!v) return "No passphrase, no entry — the gates remain sealed.";
    if (v.length < 6) return "Your passphrase must be at least 6 characters.";
    return "";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const pErr = validatePhone(phoneNumber);
    const wErr = validatePass(password);
    setPhoneError(pErr);
    setPassError(wErr);
    if (pErr || wErr) { addToast("error", "The Gates Refuse You", "Correct the errors below before crossing."); return; }

    setLoading(true);
    addToast("info", "Dispatching the Raven…", "Your credentials fly to the citadel.");

    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("accountType");
      localStorage.removeItem("accountId");
      localStorage.removeItem("villageId");
      localStorage.removeItem("roles");
      localStorage.removeItem("role");
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      console.log("LOGIN RESPONSE:", data);
      if (!response.ok) throw new Error(data?.message || "Invalid credentials");

      // ── Store tokens + fields mapped to backend contract ──────────────────
      saveSession(data);

      startTokenRefresh();

      // ── Role detection uses data.activeRole ───────────────────────────────
      const role = ROLE_CONFIG[data.activeRole];           // was data.role
      setDetectedRole(role);
      addToast("success", "The Gates Open!", `Welcome, ${role?.label ?? ""}. Your war room awaits.`);

      // ── Navigation uses data.activeRole — backend reads userId from JWT ─────
      setTimeout(() => {
        switch (data.activeRole) {
          case "CITIZEN": navigate("/citizen/dashboard");                    break;
          case "MAO":     navigate("/mao/dashboard");                        break;
          case "VAO":     navigate(`/vao/dashboard/${data.accountId}`);      break; // :vaoId required by router + VaoDashboard
          case "WORKER":  navigate("/worker/dashboard");                    break; // no ID — JWT carries identity
          default:        navigate("/");
        }
      }, 1500);

    } catch (err) {
      const msg = err.message || "Login failed";
      addToast("error", "The Citadel Bars Your Entry",
        msg.toLowerCase().includes("credentials")
          ? "Your sigil or passphrase is unrecognised by the Maester."
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <section className="login-page">

        {/* ── LEFT PANEL ── */}
        <div className="login-left">

          <div className="login-eyebrow">
            <span className="login-eyebrow-icon">⚔</span>
            RuralOps Governance Network
          </div>

          <div className="login-hero-copy">
            <h1>
              Command Your<br />
              <span>Realm's Gateway</span>
            </h1>
            <p>
              Speak your sigil and passphrase. The Maesters of the citadel shall
              verify your identity — and the gates of rural governance shall open
              before you.
            </p>
          </div>

          {/* Depth stats */}
          <div className="login-depth-stats">
            <div className="login-depth-stat">
              <span className="login-depth-val">40K+</span>
              <span className="login-depth-lbl">Villages</span>
            </div>
            <div className="login-depth-stat">
              <span className="login-depth-val">9.2M</span>
              <span className="login-depth-lbl">Citizens</span>
            </div>
            <div className="login-depth-stat">
              <span className="login-depth-val">98.2%</span>
              <span className="login-depth-lbl">Approved</span>
            </div>
            <div className="login-depth-stat">
              <span className="login-depth-val">₹189Cr</span>
              <span className="login-depth-lbl">Disbursed</span>
            </div>
          </div>

          <div className="login-info-points">
            {[
              { icon: "⚔️", text: "Identity sealed by sworn VAO officers" },
              { icon: "🏰", text: "Transparent welfare — no ravens go astray" },
              { icon: "📜", text: "Village-level governance access granted" },
              { icon: "🛡️", text: "Sovereign protection of your scrolls" },
            ].map((pt, i) => (
              <div className="login-info-point" key={i}>
                <span className="login-info-point-icon">{pt.icon}</span>
                <span>{pt.text}</span>
              </div>
            ))}
          </div>

          {/* Live Ticker */}
          <div className="login-live-ticker">
            <div className="login-ticker-badge">
              <span className="login-ticker-live-dot" />
              LIVE
            </div>
            <div className="login-ticker-track">
              <div className="login-ticker-inner">
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <div className="login-ticker-item" key={i}>
                    <span className="login-ticker-state">{item.state}</span>
                    <span className={`login-ticker-dot login-ticker-dot--${item.dot}`} />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="login-quick-links">
            <p className="login-quick-label">Quick Access</p>
            <div className="login-quick-grid">
              {QUICK_LINKS.map(ql => (
                <Link key={ql.to} to={ql.to} className="login-quick-tile">
                  <span className="login-quick-icon">{ql.icon}</span>
                  <div className="login-quick-text">
                    <span className="login-quick-main">{ql.label}</span>
                    <span className="login-quick-sub">{ql.sub}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* ── LOGIN CARD ── */}
        <div className="login-card">

          <div className="login-news-ticker">
            <span className="login-news-label">LIVE</span>
            <p className={`login-news-text${newsVisible ? " visible" : ""}`}>
              {PLATFORM_NEWS[newsIndex]}
            </p>
          </div>

          <div className="login-card-header">
            <div className="login-card-sigil">🔐</div>
            <div>
              <h2>Enter the Realm</h2>
              <p className="login-card-desc">Speak your sigil — access your RuralOps command chamber</p>
            </div>
          </div>

          {detectedRole && (
            <div className="login-role-preview">
              <span className="login-role-icon">{detectedRole.sigil}</span>
              <div>
                <div className="login-role-main">Crossing the gates as</div>
                <div className="login-role-label">{detectedRole.label}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form" noValidate>

            <div className={`login-form-group${phoneError ? " field-error" : ""}`}>
              <label htmlFor="lp-phone">Phone Number — Your Sigil</label>
              <input
                id="lp-phone" type="tel" value={phoneNumber}
                onChange={e => { setPhoneNumber(e.target.value); if (phoneError) setPhoneError(validatePhone(e.target.value)); }}
                onBlur={e => setPhoneError(validatePhone(e.target.value))}
                placeholder="9876543210" maxLength="10" autoComplete="tel"
              />
              {phoneError && <span className="login-field-error" role="alert">{phoneError}</span>}
            </div>

            <div className={`login-form-group${passError ? " field-error" : ""}`}>
              <label htmlFor="lp-pwd">Passphrase — The Secret Word</label>
              <div className="login-password-wrap">
                <input
                  id="lp-pwd" type={showPassword ? "text" : "password"} value={password}
                  onChange={e => { setPassword(e.target.value); if (passError) setPassError(validatePass(e.target.value)); }}
                  onBlur={e => setPassError(validatePass(e.target.value))}
                  placeholder="Speak the secret word…" autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="login-toggle-btn"
                  aria-label={showPassword ? "Conceal passphrase" : "Reveal passphrase"}>
                  {showPassword ? "Conceal" : "Reveal"}
                </button>
              </div>
              {passError && <span className="login-field-error" role="alert">{passError}</span>}
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading
                ? <><span className="login-spinner" aria-hidden="true" />The Raven Flies…</>
                : <>⚜ Login — Cross the Gates</>}
            </button>

          </form>

          <div className="login-card-divider"><span>or seek passage via</span></div>

          <div className="login-card-footer-links">
            <Link to="/citizen/register"   className="login-footer-link">📝 Register — Swear an Oath</Link>
            <Link to="/activation/request" className="login-footer-link">✉️ Key — Request a Raven</Link>
          </div>

          <div className="login-realm-strip">
            <div className="login-realm-stat"><span className="login-realm-val">40K+</span><span className="login-realm-lbl">Villages</span></div>
            <div className="login-realm-divider" />
            <div className="login-realm-stat"><span className="login-realm-val">9.2M+</span><span className="login-realm-lbl">Citizens</span></div>
            <div className="login-realm-divider" />
            <div className="login-realm-stat"><span className="login-realm-val">98.2%</span><span className="login-realm-lbl">Approved</span></div>
            <div className="login-realm-divider" />
            <div className="login-realm-stat"><span className="login-realm-val">₹189Cr</span><span className="login-realm-lbl">Disbursed</span></div>
          </div>

        </div>

      </section>

      <footer className="login-footer">
        <div className="login-footer-left">
          <strong>RuralOps Platform</strong>
          <span>Digital Rural Governance Infrastructure</span>
        </div>
        <div className="login-footer-center">© 2026 RuralOps — GOWTHAM CHIRIKI</div>
        <div className="login-footer-links">
          <a href="#">Privacy</a>
          <a href="#">Security</a>
          <a href="#">Support</a>
        </div>
      </footer>

      {/* Toasts */}
      <div className="login-toast-container" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`login-toast-item login-toast-item--${toast.type}${toast.leaving ? " toast-leaving" : " toast-entering"}`}
            onClick={() => dismissToast(toast.id)}
          >
            <div className="login-toast-accent" />
            <div className="login-toast-icon">
              {toast.type === "success" ? "⚔️" : toast.type === "error" ? "🛡️" : "📜"}
            </div>
            <div className="login-toast-body">
              <div className="login-toast-label">{toast.label}</div>
              <div className="login-toast-sub">{toast.sub}</div>
            </div>
            <button
              className="login-toast-dismiss"
              onClick={e => { e.stopPropagation(); dismissToast(toast.id); }}
              aria-label="Dismiss"
            >×</button>
            {!toast.leaving && <div className="login-toast-progress" />}
          </div>
        ))}
      </div>

    </>
  );
}

export default LoginPage;