import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const API = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

const ROLE_CONFIG = {
  CITIZEN: { label: "Citizen",               icon: "👤" },
  WORKER:  { label: "Field Worker",          icon: "🔧" },
  VAO:     { label: "Village Admin Officer", icon: "📋" },
  MAO:     { label: "Mandal Admin Officer",  icon: "🏛️" },
};

const ANNOUNCEMENTS = [
  "New welfare scheme registrations open for Kharif season 2026",
  "VAO verification turnaround reduced to 48 hours across all mandals",
  "RuralOps now serving 40,000+ villages nationwide",
  "Field Workers: Updated route assignments available in your dashboard",
  "RuralOps recognised by the State Digital Governance Council — 2026",
  "Mobile access enabled — manage your operations from any device",
];

const QUICK_LINKS = [
  { label: "New Registration",   to: "/citizen/register",   icon: "📝", sub: "Register as a citizen"     },
  { label: "Check Status",       to: "/citizen/status",     icon: "🔍", sub: "Track your application"    },
  { label: "Activate Account",   to: "/activate-account",   icon: "🔑", sub: "Enter your activation key"  },
  { label: "Request Access Key", to: "/activation/request", icon: "✉️", sub: "Request a new key"          },
];

const TICKER_ITEMS = [
  { region: "PEDANANDI PALLI", status: "ok",   text: "12 new citizen registrations today"       },
  { region: "KALIGOTLA",       status: "warn", text: "VAO verification: 3 applications pending" },
  { region: "TARUVA",          status: "ok",   text: "Welfare disbursement: ₹48,000 processed"  },
  { region: "MUSHIDIPALLE",    status: "info", text: "Land records updated in central registry" },
  { region: "SAMMEDA",         status: "ok",   text: "8 applications approved this morning"     },
  { region: "GARISINGI",       status: "warn", text: "2 applications require re-submission"     },
  { region: "DEVARAPALLE",     status: "ok",   text: "Census synchronisation: 99.2% complete"   },
  { region: "NAGAYYAPETA",     status: "info", text: "Scheme enrollment open until month-end"   },
];

/* ── Theme hook — shares key with LandingPage ── */
function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
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

let refreshTimer = null;
function startTokenRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(async () => {
    const rt = localStorage.getItem("refreshToken");
    if (!rt) return;
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return;
      const d = await res.json();
      localStorage.setItem("accessToken", d.accessToken);
      localStorage.setItem("refreshToken", d.refreshToken);
    } catch (e) { console.error(e); }
  }, 12 * 60 * 1000);
}

export function saveSession(data) {
  localStorage.setItem("accessToken",  data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("accountType",  data.activeRole);
  localStorage.setItem("accountId",    data.accountId);
  localStorage.setItem("roles",        JSON.stringify(data.roles ?? []));
  localStorage.setItem("villageId",    data.villageId ?? "");
}

export function authFetch(url, options = {}) {
  const token = localStorage.getItem("accessToken");
  return fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useTheme();

  const [phone,      setPhone]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [toasts,     setToasts]     = useState([]);
  const [noticeIdx,  setNoticeIdx]  = useState(0);
  const [noticeVis,  setNoticeVis]  = useState(true);
  const [role,       setRole]       = useState(null);
  const [phoneErr,   setPhoneErr]   = useState("");
  const [passErr,    setPassErr]    = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      setNoticeVis(false);
      setTimeout(() => { setNoticeIdx(i => (i + 1) % ANNOUNCEMENTS.length); setNoticeVis(true); }, 300);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const addToast = (type, ttl, sub) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, ttl, sub, out: false }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 260);
    }, 5000);
  };
  const dismissToast = id => {
    setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t));
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 260);
  };

  const vPhone = v => !v ? "Phone number is required." : !/^[6-9]\d{9}$/.test(v) ? "Enter a valid 10-digit number starting with 6–9." : "";
  const vPass  = v => !v ? "Password is required." : v.length < 6 ? "Minimum 6 characters required." : "";

  const handleLogin = async e => {
    e.preventDefault();
    const pe = vPhone(phone), we = vPass(password);
    setPhoneErr(pe); setPassErr(we);
    if (pe || we) { addToast("error", "Validation Failed", "Please correct the errors below."); return; }
    setLoading(true);
    addToast("info", "Authenticating…", "Verifying your credentials with the server.");
    try {
      ["accessToken","refreshToken","accountType","accountId","villageId","roles","role"].forEach(k => localStorage.removeItem(k));
      const res  = await fetch(`${API}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, password }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.message || "Invalid credentials");
      saveSession(data); startTokenRefresh();
      setRole(ROLE_CONFIG[data.activeRole]);
      addToast("success", "Authentication Successful", "Redirecting to your dashboard…");
      setTimeout(() => {
        switch (data.activeRole) {
          case "CITIZEN": navigate("/citizen/dashboard"); break;
          case "MAO":     navigate("/mao/dashboard");     break;
          case "VAO":     navigate(`/vao/dashboard/${data.accountId}`); break;
          case "WORKER":  navigate("/worker/dashboard");  break;
          default:        navigate("/");
        }
      }, 1500);
    } catch (err) {
      const msg = err.message || "Login failed";
      addToast("error", "Authentication Failed",
        msg.toLowerCase().includes("credentials") ? "The phone number or password you entered is incorrect." : msg);
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap');

        /* ── LIGHT TOKENS — identical to LandingPage ── */
        :root, [data-theme="light"] {
          --bg:          #f4f5f7;
          --bg-card:     #ffffff;
          --bg-1:        #f9fafb;
          --bg-elevated: #f0f2f5;
          --border:      #e5e7eb;
          --border-med:  #d1d5db;
          --border-str:  #9ca3af;
          --text-1:      #111827;
          --text-2:      #374151;
          --text-3:      #6b7280;
          --text-4:      #9ca3af;
          --text-inv:    #ffffff;
          --accent:      #1a1d23;
          --accent-mid:  #252830;
          --accent-sub:  rgba(26,29,35,0.06);
          --green:       #10b981;
          --green-sub:   rgba(16,185,129,0.08);
          --green-brd:   rgba(16,185,129,0.2);
          --green-text:  #059669;
          --warn:        #f59e0b;
          --danger:      #ef4444;
          --danger-sub:  rgba(239,68,68,0.08);
          --info:        #3b82f6;
          --info-sub:    rgba(59,130,246,0.08);
          --sh-sm:  0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
          --sh-md:  0 4px 6px rgba(0,0,0,0.05),0 2px 4px rgba(0,0,0,0.04);
          --sh-lg:  0 10px 15px rgba(0,0,0,0.07),0 4px 6px rgba(0,0,0,0.05);
          --sh-xl:  0 20px 25px rgba(0,0,0,0.08);
          --r-xs:3px; --r-sm:6px; --r-md:8px; --r-lg:12px; --r-xl:16px; --r-pill:9999px;
          --font:      'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
          --font-mono: 'Geist Mono', 'SF Mono', monospace;
          --ease:      cubic-bezier(0.16,1,0.3,1);
        }

        /* ── DARK TOKENS — identical to LandingPage ── */
        [data-theme="dark"] {
          --bg:          #0a0a0a;
          --bg-card:     #161616;
          --bg-1:        #141414;
          --bg-elevated: #1e1e1e;
          --border:      rgba(255,255,255,0.08);
          --border-med:  rgba(255,255,255,0.13);
          --border-str:  rgba(255,255,255,0.22);
          --text-1:      #f5f5f5;
          --text-2:      #a3a3a3;
          --text-3:      #525252;
          --text-4:      #303030;
          --text-inv:    #0a0a0a;
          --accent:      #f5f5f5;
          --accent-mid:  #e5e5e5;
          --accent-sub:  rgba(245,245,245,0.06);
          --green:       #22c55e;
          --green-sub:   rgba(34,197,94,0.08);
          --green-brd:   rgba(34,197,94,0.18);
          --green-text:  #22c55e;
          --warn:        #eab308;
          --danger:      #ef4444;
          --danger-sub:  rgba(239,68,68,0.08);
          --info:        #a3a3a3;
          --info-sub:    rgba(163,163,163,0.08);
          --sh-sm:  0 1px 3px rgba(0,0,0,0.7),0 1px 2px rgba(0,0,0,0.6);
          --sh-md:  0 4px 6px rgba(0,0,0,0.7),0 2px 4px rgba(0,0,0,0.6);
          --sh-lg:  0 10px 15px rgba(0,0,0,0.8),0 4px 6px rgba(0,0,0,0.6);
          --sh-xl:  0 20px 25px rgba(0,0,0,0.85);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── PAGE ── */
        .lp-page {
          font-family: var(--font);
          background: var(--bg);
          color: var(--text-1);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          transition: background 0.3s var(--ease), color 0.3s var(--ease);
        }

        /* ── THEME TOGGLE — same pill as LandingPage ── */
        .lp-theme-btn {
          position: fixed; bottom: 24px; right: 24px; z-index: 1000;
          height: 36px; padding: 0 14px; border-radius: var(--r-pill);
          background: var(--bg-card); border: 1px solid var(--border-med);
          color: var(--text-3); cursor: pointer;
          display: flex; align-items: center; gap: 7px;
          box-shadow: var(--sh-lg); font-family: var(--font);
          font-size: 12px; font-weight: 500; white-space: nowrap;
          transition: all 0.2s var(--ease);
        }
        .lp-theme-btn:hover {
          color: var(--text-1); border-color: var(--border-str);
          box-shadow: var(--sh-xl); transform: translateY(-1px);
        }

        /* ── LAYOUT — two col below navbar ── */
        .lp-wrap {
          display: grid;
          grid-template-columns: 1fr 440px;
          min-height: calc(100vh - 56px);
        }

        /* ── LEFT ── */
        .lp-left {
          padding: 60px 56px;
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 40px;
          overflow-y: auto;
          animation: lpHeroUp 0.7s var(--ease) both;
        }

        /* eyebrow */
        .lp-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 11px;
          color: var(--green-text); background: var(--green-sub);
          border: 1px solid var(--green-brd);
          padding: 4px 12px; border-radius: var(--r-pill);
          letter-spacing: 0.02em; width: fit-content;
        }
        .lp-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--green); flex-shrink: 0;
          animation: lpPulse 2.5s ease infinite;
        }

        /* hero */
        .lp-hero { display: flex; flex-direction: column; gap: 14px; }
        .lp-hero h1 {
          font-size: clamp(36px, 4vw, 56px); font-weight: 700;
          line-height: 1.06; letter-spacing: -0.04em; color: var(--text-1);
        }
        .lp-hero-dim { color: var(--text-3); font-weight: 400; }
        .lp-hero p {
          font-size: 15px; color: var(--text-3);
          line-height: 1.65; max-width: 420px;
        }

        /* stats row */
        .lp-stats {
          display: grid; grid-template-columns: repeat(4,1fr);
          border: 1px solid var(--border); border-radius: var(--r-lg);
          overflow: hidden; background: var(--border); gap: 1px;
          box-shadow: var(--sh-sm);
        }
        .lp-stat {
          background: var(--bg-card); padding: 18px 12px;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          transition: background 0.15s;
        }
        .lp-stat:hover { background: var(--bg-1); }
        .lp-stat-v {
          font-size: 20px; font-weight: 700;
          letter-spacing: -0.04em; color: var(--text-1); line-height: 1;
        }
        .lp-stat-l { font-size: 11px; color: var(--text-4); font-weight: 500; }

        /* trust grid */
        .lp-trust { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .lp-trust-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; background: var(--bg-card);
          border: 1px solid var(--border); border-radius: var(--r-md);
          font-size: 12px; color: var(--text-2);
          box-shadow: var(--sh-sm); transition: all 0.15s var(--ease);
        }
        .lp-trust-item:hover { border-color: var(--border-med); transform: translateX(2px); }
        .lp-trust-icon {
          width: 28px; height: 28px; border-radius: var(--r-sm);
          background: var(--bg-elevated); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; flex-shrink: 0;
        }

        /* ticker */
        .lp-ticker {
          display: flex; align-items: stretch;
          border: 1px solid var(--border); border-radius: var(--r-md);
          overflow: hidden; background: var(--bg-card); box-shadow: var(--sh-sm);
        }
        .lp-ticker-badge {
          display: flex; align-items: center; gap: 6px; padding: 8px 14px;
          background: var(--bg-1); border-right: 1px solid var(--border);
          font-family: var(--font-mono); font-size: 10px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--green-text); white-space: nowrap; flex-shrink: 0;
        }
        .lp-ticker-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--green); animation: lpBlink 2s ease infinite;
        }
        .lp-ticker-track { flex: 1; overflow: hidden; display: flex; align-items: center; }
        .lp-ticker-inner {
          display: flex; white-space: nowrap;
          animation: lpTicker 50s linear infinite;
        }
        .lp-ticker-inner:hover { animation-play-state: paused; }
        .lp-ticker-item {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 20px; border-right: 1px solid var(--border);
          font-family: var(--font-mono); font-size: 11px;
          color: var(--text-4); white-space: nowrap;
        }
        .lp-ticker-region {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3);
        }
        .lp-sdot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }
        .lp-sdot--ok   { background: var(--green); }
        .lp-sdot--warn { background: var(--warn);  }
        .lp-sdot--info { background: var(--info);  }

        /* quick access */
        .lp-quick { display: flex; flex-direction: column; gap: 10px; }
        .lp-quick-lbl {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-4);
          display: flex; align-items: center; gap: 10px;
        }
        .lp-quick-lbl::after { content:''; flex:1; height:1px; background: var(--border); }
        .lp-quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .lp-quick-tile {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--r-md); text-decoration: none;
          box-shadow: var(--sh-sm); transition: all 0.18s var(--ease);
        }
        .lp-quick-tile:hover {
          border-color: var(--border-med); background: var(--bg-1);
          transform: translateY(-2px); box-shadow: var(--sh-md);
        }
        .lp-quick-ic {
          width: 30px; height: 30px; border-radius: var(--r-sm);
          background: var(--bg-elevated); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; flex-shrink: 0;
        }
        .lp-quick-title {
          display: block; font-size: 12.5px; font-weight: 600;
          color: var(--text-1); letter-spacing: -0.01em; line-height: 1.2;
        }
        .lp-quick-sub { display: block; font-size: 11px; color: var(--text-4); margin-top: 1px; }

        /* ── RIGHT CARD ── */
        .lp-card {
          background: var(--bg-card);
          display: flex; flex-direction: column;
          padding: 36px 32px; gap: 22px;
          overflow-y: auto;
          animation: lpSlideIn 0.7s 0.1s var(--ease) both;
        }

        /* notice */
        .lp-notice {
          display: flex; align-items: center; gap: 10px; padding: 8px 11px;
          background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--r-md);
        }
        .lp-notice-tag {
          font-family: var(--font-mono); font-size: 10px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-3);
          background: var(--bg-elevated); border: 1px solid var(--border-med);
          padding: 2px 7px; border-radius: var(--r-xs);
          white-space: nowrap; flex-shrink: 0;
        }
        .lp-notice-txt {
          font-size: 11.5px; color: var(--text-3);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          opacity: 0; transform: translateY(3px);
          transition: opacity 0.26s ease, transform 0.26s var(--ease);
        }
        .lp-notice-txt.vis { opacity: 1; transform: translateY(0); }

        /* card header */
        .lp-card-hd { display: flex; flex-direction: column; gap: 5px; }
        .lp-card-sup {
          font-family: var(--font-mono); font-size: 11px;
          letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-4);
        }
        .lp-card-title {
          font-size: 26px; font-weight: 700;
          letter-spacing: -0.03em; color: var(--text-1); line-height: 1.1;
        }
        .lp-card-desc { font-size: 13px; color: var(--text-3); line-height: 1.6; }

        /* role badge */
        .lp-role {
          display: flex; align-items: center; gap: 10px; padding: 10px 13px;
          background: var(--green-sub); border: 1px solid var(--green-brd);
          border-radius: var(--r-md);
          animation: lpFadeIn 0.24s ease both;
        }
        .lp-role-icon {
          width: 32px; height: 32px; border-radius: var(--r-sm);
          background: rgba(16,185,129,0.12); border: 1px solid var(--green-brd);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }
        .lp-role-cap {
          display: block; font-size: 10.5px; font-weight: 500;
          letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3);
        }
        .lp-role-name {
          display: block; font-size: 13.5px; font-weight: 700;
          color: var(--green-text); margin-top: 1px;
        }

        /* form */
        .lp-form { display: flex; flex-direction: column; gap: 16px; }
        .lp-field { display: flex; flex-direction: column; gap: 6px; }
        .lp-field label {
          font-size: 12px; font-weight: 500; color: var(--text-2); letter-spacing: 0.01em;
        }
        .lp-field input {
          height: 40px; padding: 0 12px; border-radius: var(--r-md);
          border: 1px solid var(--border); background: var(--bg-1);
          color: var(--text-1); font-family: var(--font); font-size: 13.5px;
          outline: none; width: 100%; -webkit-appearance: none;
          transition: border-color 0.12s, box-shadow 0.12s, background 0.12s;
        }
        .lp-field input::placeholder { color: var(--text-4); }
        .lp-field input:hover { border-color: var(--border-med); }
        .lp-field input:focus {
          border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-sub);
          background: var(--bg-card);
        }
        .lp-field.err input { border-color: var(--danger); box-shadow: none; }
        .lp-field-err {
          font-size: 11.5px; color: var(--danger); display: flex; align-items: center; gap: 5px;
        }
        .lp-pw { position: relative; }
        .lp-pw input { padding-right: 72px; }
        .lp-pw-btn {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          font-family: var(--font); font-size: 11.5px; font-weight: 500;
          color: var(--text-3); padding: 3px 6px; border-radius: var(--r-xs);
          letter-spacing: 0.04em; transition: color 0.12s, background 0.12s;
        }
        .lp-pw-btn:hover { color: var(--text-1); background: var(--bg-elevated); }

        /* submit */
        .lp-submit {
          height: 40px; border-radius: var(--r-md);
          background: var(--accent); border: 1px solid var(--accent);
          color: var(--text-inv); font-family: var(--font);
          font-size: 13.5px; font-weight: 600; letter-spacing: -0.01em; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 4px; box-shadow: var(--sh-sm);
          transition: background 0.18s var(--ease), transform 0.18s var(--ease), box-shadow 0.18s var(--ease);
        }
        .lp-submit:hover:not(:disabled) {
          background: var(--accent-mid); transform: translateY(-1px); box-shadow: var(--sh-md);
        }
        .lp-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        .lp-spinner {
          width: 14px; height: 14px;
          border: 1.5px solid rgba(255,255,255,0.25);
          border-top-color: rgba(255,255,255,0.9);
          border-radius: 50%; animation: lpSpin 0.65s linear infinite;
        }
        [data-theme="dark"] .lp-spinner {
          border-color: rgba(0,0,0,0.2); border-top-color: rgba(0,0,0,0.85);
        }

        /* divider */
        .lp-div {
          display: flex; align-items: center; gap: 12px;
          font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-4);
        }
        .lp-div::before, .lp-div::after { content:''; flex:1; height:1px; background: var(--border); }

        /* aux links */
        .lp-links { display: flex; gap: 8px; }
        .lp-link {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          height: 38px; border-radius: var(--r-md);
          border: 1px solid var(--border); background: transparent;
          font-family: var(--font); font-size: 12px; font-weight: 500;
          color: var(--text-2); text-decoration: none; box-shadow: var(--sh-sm);
          transition: all 0.18s var(--ease);
        }
        .lp-link:hover {
          border-color: var(--border-med); background: var(--bg-1);
          color: var(--text-1); transform: translateY(-1px); box-shadow: var(--sh-md);
        }

        /* bottom stats strip */
        .lp-strip {
          display: grid; grid-template-columns: repeat(4,1fr);
          padding: 12px 14px; border-radius: var(--r-md);
          background: var(--bg-1); border: 1px solid var(--border);
          margin-top: auto;
        }
        .lp-strip-s { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .lp-strip-v { font-size: 13.5px; font-weight: 700; letter-spacing: -0.02em; color: var(--text-1); }
        .lp-strip-l { font-size: 10px; color: var(--text-4); }

        /* footer */
        .lp-footer {
          border-top: 1px solid var(--border); background: var(--bg-card);
          padding: 18px 56px; display: flex; justify-content: space-between; align-items: center;
        }
        .lp-footer-brand { display: flex; flex-direction: column; gap: 2px; }
        .lp-footer-brand strong { font-size: 12.5px; font-weight: 700; color: var(--text-1); letter-spacing: -0.01em; }
        .lp-footer-brand span  { font-size: 11px; color: var(--text-4); }
        .lp-footer-copy { font-family: var(--font-mono); font-size: 11px; color: var(--text-4); }
        .lp-footer-nav  { display: flex; gap: 18px; }
        .lp-footer-nav a { font-size: 11px; color: var(--text-3); text-decoration: none; transition: color 0.12s; }
        .lp-footer-nav a:hover { color: var(--text-1); }

        /* toasts */
        .lp-toasts {
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          display: flex; flex-direction: column; gap: 8px;
          pointer-events: none; width: 320px; max-width: calc(100vw - 32px);
        }
        .lp-toast {
          display: flex; align-items: flex-start; gap: 11px;
          padding: 12px 14px 16px; border-radius: var(--r-lg);
          background: var(--bg-card); border: 1px solid var(--border);
          box-shadow: var(--sh-xl); pointer-events: all; cursor: pointer;
          position: relative; overflow: hidden; transition: transform 0.12s;
        }
        .lp-toast:hover { transform: translateX(-2px); }
        .lp-toast--info    { border-top: 2px solid var(--info); }
        .lp-toast--success { border-top: 2px solid var(--green); }
        .lp-toast--error   { border-top: 2px solid var(--danger); }
        .lp-toast.tin  { animation: lpToastIn  0.28s var(--ease) both; }
        .lp-toast.tout { animation: lpToastOut 0.18s ease forwards; pointer-events: none; }
        .lp-toast-ic {
          width: 30px; height: 30px; border-radius: var(--r-sm);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 1px;
        }
        .lp-toast--info    .lp-toast-ic { background: var(--info-sub);   color: var(--info);       border: 1px solid rgba(59,130,246,0.2); }
        .lp-toast--success .lp-toast-ic { background: var(--green-sub);  color: var(--green-text); border: 1px solid var(--green-brd); }
        .lp-toast--error   .lp-toast-ic { background: var(--danger-sub); color: var(--danger);     border: 1px solid rgba(239,68,68,0.2); }
        .lp-toast-bd { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
        .lp-toast-ttl { font-size: 13px; font-weight: 700; color: var(--text-1); letter-spacing: -0.01em; }
        .lp-toast-sub { font-size: 12px; color: var(--text-3); line-height: 1.5; }
        .lp-toast-x {
          flex-shrink: 0; width: 20px; height: 20px; border-radius: var(--r-xs);
          background: none; border: none; color: var(--text-4); font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.12s, color 0.12s;
        }
        .lp-toast-x:hover { background: var(--bg-elevated); color: var(--text-1); }
        .lp-toast-bar {
          position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
          transform-origin: left; animation: lpDrain 5s linear forwards;
        }
        .lp-toast--info    .lp-toast-bar { background: var(--info); }
        .lp-toast--success .lp-toast-bar { background: var(--green); }
        .lp-toast--error   .lp-toast-bar { background: var(--danger); }

        /* ── KEYFRAMES ── */
        @keyframes lpHeroUp  { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lpSlideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes lpFadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes lpPulse   { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes lpBlink   { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        @keyframes lpTicker  { from{transform:translateX(0);} to{transform:translateX(-50%);} }
        @keyframes lpSpin    { to{transform:rotate(360deg);} }
        @keyframes lpToastIn  { from{opacity:0;transform:translateY(-10px) scale(0.97);} to{opacity:1;transform:translateY(0) scale(1);} }
        @keyframes lpToastOut { to{opacity:0;transform:translateY(-8px) scale(0.97);} }
        @keyframes lpDrain    { from{transform:scaleX(1);} to{transform:scaleX(0);} }

        /* ── RESPONSIVE ── */
        @media (max-width: 1000px) {
          .lp-wrap { grid-template-columns: 1fr; }
          .lp-left { border-right: none; border-bottom: 1px solid var(--border); padding: 40px 28px; }
          .lp-card { max-width: 480px; width: 100%; margin: 0 auto; }
          .lp-footer { padding: 18px 28px; }
        }
        @media (max-width: 600px) {
          .lp-left { padding: 32px 16px; gap: 28px; }
          .lp-card { padding: 28px 16px; }
          .lp-stats { grid-template-columns: repeat(2,1fr); }
          .lp-trust { grid-template-columns: 1fr; }
          .lp-quick-grid { grid-template-columns: 1fr; }
          .lp-links { flex-direction: column; }
          .lp-footer { flex-direction: column; gap: 10px; text-align: center; padding: 16px; }
          .lp-toasts { right: 10px; left: 10px; width: auto; }
        }
      `}</style>

      <div className="lp-page">

        {/* ── Your existing Navbar ── */}
        <Navbar />

        {/* ── Theme toggle — same as LandingPage ── */}
        <button
          className="lp-theme-btn"
          onClick={() => setDark(d => !d)}
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

        {/* ── MAIN TWO-COLUMN GRID ── */}
        <div className="lp-wrap">

          {/* ══ LEFT PANEL ══ */}
          <div className="lp-left">

            <div className="lp-eyebrow">
              <span className="lp-eyebrow-dot" />
              Secure Government Portal · RuralOps v2.4
            </div>

            <div className="lp-hero">
              <h1>Rural Governance,<br /><span className="lp-hero-dim">Unified.</span></h1>
              <p>
                Enter your registered phone number and password to access the RuralOps
                platform. Your session is secured and managed by the central authentication service.
              </p>
            </div>

            <div className="lp-stats">
              {[
                { v:"40K+", l:"Villages" }, { v:"9.2M", l:"Citizens" },
                { v:"98.2%",l:"Approved" }, { v:"₹189Cr",l:"Disbursed" },
              ].map((s,i) => (
                <div className="lp-stat" key={i}>
                  <span className="lp-stat-v">{s.v}</span>
                  <span className="lp-stat-l">{s.l}</span>
                </div>
              ))}
            </div>

            <div className="lp-trust">
              {[
                { icon:"✓",  text:"Identity verified by authorised VAO officers" },
                { icon:"🔒", text:"Secure, encrypted data transmission" },
                { icon:"📂", text:"Village-level governance access" },
                { icon:"🛡️", text:"Compliant with state data protection norms" },
              ].map((pt,i) => (
                <div className="lp-trust-item" key={i}>
                  <span className="lp-trust-icon">{pt.icon}</span>
                  <span>{pt.text}</span>
                </div>
              ))}
            </div>

            <div className="lp-ticker" aria-hidden="true">
              <div className="lp-ticker-badge">
                <span className="lp-ticker-dot" />
                Live
              </div>
              <div className="lp-ticker-track">
                <div className="lp-ticker-inner">
                  {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i) => (
                    <div className="lp-ticker-item" key={i}>
                      <span className="lp-ticker-region">{item.region}</span>
                      <span className={`lp-sdot lp-sdot--${item.status}`} />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lp-quick">
              <p className="lp-quick-lbl">Quick Access</p>
              <div className="lp-quick-grid">
                {QUICK_LINKS.map(ql => (
                  <Link key={ql.to} to={ql.to} className="lp-quick-tile">
                    <span className="lp-quick-ic">{ql.icon}</span>
                    <div>
                      <span className="lp-quick-title">{ql.label}</span>
                      <span className="lp-quick-sub">{ql.sub}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* ══ RIGHT CARD ══ */}
          <div className="lp-card">

            <div className="lp-notice">
              <span className="lp-notice-tag">Notice</span>
              <p className={`lp-notice-txt${noticeVis ? " vis" : ""}`}>
                {ANNOUNCEMENTS[noticeIdx]}
              </p>
            </div>

            <div className="lp-card-hd">
              <span className="lp-card-sup">Secure Login</span>
              <h2 className="lp-card-title">Sign In to RuralOps</h2>
              <p className="lp-card-desc">Access your assigned dashboard by entering your credentials below.</p>
            </div>

            {role && (
              <div className="lp-role">
                <span className="lp-role-icon">{role.icon}</span>
                <div>
                  <span className="lp-role-cap">Authenticated as</span>
                  <span className="lp-role-name">{role.label}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="lp-form" noValidate>

              <div className={`lp-field${phoneErr ? " err" : ""}`}>
                <label htmlFor="lp-phone">Phone Number</label>
                <input
                  id="lp-phone" type="tel" value={phone}
                  onChange={e => { setPhone(e.target.value); if (phoneErr) setPhoneErr(vPhone(e.target.value)); }}
                  onBlur={e => setPhoneErr(vPhone(e.target.value))}
                  placeholder="9876543210" maxLength="10" autoComplete="tel"
                />
                {phoneErr && <span className="lp-field-err" role="alert">⚠ {phoneErr}</span>}
              </div>

              <div className={`lp-field${passErr ? " err" : ""}`}>
                <label htmlFor="lp-pwd">Password</label>
                <div className="lp-pw">
                  <input
                    id="lp-pwd" type={showPw ? "text" : "password"} value={password}
                    onChange={e => { setPassword(e.target.value); if (passErr) setPassErr(vPass(e.target.value)); }}
                    onBlur={e => setPassErr(vPass(e.target.value))}
                    placeholder="Enter your password" autoComplete="current-password"
                  />
                  <button type="button" className="lp-pw-btn"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                {passErr && <span className="lp-field-err" role="alert">⚠ {passErr}</span>}
              </div>

              <button type="submit" className="lp-submit" disabled={loading}>
                {loading
                  ? <><span className="lp-spinner" aria-hidden="true" /> Authenticating…</>
                  : <>Sign In <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                }
              </button>

            </form>

            <div className="lp-div"><span>or</span></div>

            <div className="lp-links">
              <Link to="/citizen/register"   className="lp-link">📝 Register</Link>
              <Link to="/activation/request" className="lp-link">✉️ Request Key</Link>
            </div>

            <div className="lp-strip">
              {[
                {v:"40K+",l:"Villages"},{v:"9.2M+",l:"Citizens"},
                {v:"98.2%",l:"Approved"},{v:"₹189Cr",l:"Disbursed"},
              ].map((s,i) => (
                <div className="lp-strip-s" key={i}>
                  <span className="lp-strip-v">{s.v}</span>
                  <span className="lp-strip-l">{s.l}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-brand">
            <strong>RuralOps Platform</strong>
            <span>Digital Rural Governance Infrastructure</span>
          </div>
          <div className="lp-footer-copy">© 2026 RuralOps — GOWTHAM CHIRIKI</div>
          <nav className="lp-footer-nav">
            <a href="#">Privacy</a>
            <a href="#">Security</a>
            <a href="#">Support</a>
          </nav>
        </footer>

      </div>

      {/* ── TOASTS ── */}
      <div className="lp-toasts" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id}
            className={`lp-toast lp-toast--${t.type} ${t.out ? "tout" : "tin"}`}
            onClick={() => dismissToast(t.id)}
          >
            <div className="lp-toast-ic">
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
            </div>
            <div className="lp-toast-bd">
              <div className="lp-toast-ttl">{t.ttl}</div>
              <div className="lp-toast-sub">{t.sub}</div>
            </div>
            <button className="lp-toast-x"
              onClick={e => { e.stopPropagation(); dismissToast(t.id); }}
              aria-label="Dismiss">×</button>
            {!t.out && <div className="lp-toast-bar" />}
          </div>
        ))}
      </div>
    </>
  );
}