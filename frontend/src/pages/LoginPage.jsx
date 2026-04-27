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

const QUICK_LINKS = [
  { label: "New Registration",   to: "/citizen/register",   icon: "📝", sub: "Register as a citizen"    },
  { label: "Check Status",       to: "/citizen/status",     icon: "🔍", sub: "Track your application"   },
  { label: "Activate Account",   to: "/activate-account",   icon: "🔑", sub: "Enter your activation key" },
  { label: "Request Access Key", to: "/activation/request", icon: "✉️", sub: "Request a new key"         },
];

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
  const [role,       setRole]       = useState(null);
  const [phoneErr,   setPhoneErr]   = useState("");
  const [passErr,    setPassErr]    = useState("");

  const addToast = (type, ttl, sub) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, ttl, sub, out: false }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 320);
    }, 2500); // ← reduced from 5000ms to 2500ms
  };

  const dismissToast = id => {
    setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t));
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 320);
  };

  const vPhone = v => !v ? "Phone number is required." : !/^[6-9]\d{9}$/.test(v) ? "Enter a valid 10-digit number starting with 6–9." : "";
  const vPass  = v => !v ? "Password is required." : v.length < 6 ? "Minimum 6 characters required." : "";

  const handleLogin = async e => {
    e.preventDefault();
    const pe = vPhone(phone), we = vPass(password);
    setPhoneErr(pe); setPassErr(we);
    if (pe || we) { addToast("error", "Validation Failed", "Please correct the highlighted fields."); return; }
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
      addToast("success", "Welcome back!", "Redirecting to your dashboard…");
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
        msg.toLowerCase().includes("credentials") ? "The phone number or password is incorrect." : msg);
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        :root, [data-theme="light"] {
          --bg:           #f0ede8;
          --bg-card:      #faf9f7;
          --bg-glass:     rgba(255,255,255,0.72);
          --bg-glass2:    rgba(255,255,255,0.45);
          --bg-inset:     #ece9e3;
          --bg-hover:     rgba(0,0,0,0.025);
          --border:       rgba(0,0,0,0.08);
          --border-med:   rgba(0,0,0,0.13);
          --border-str:   rgba(0,0,0,0.22);
          --text-1:       #1a1714;
          --text-2:       #3d3830;
          --text-3:       #5a5349;
          --text-4:       #8a8278;
          --text-inv:     #faf9f7;
          --accent:       #1a1714;
          --accent-h:     #2e2924;
          --accent-sub:   rgba(26,23,20,0.06);
          --green:        #2d9e6b;
          --green-sub:    rgba(45,158,107,0.09);
          --green-brd:    rgba(45,158,107,0.22);
          --green-text:   #1e7a52;
          --amber:        #c97c1a;
          --amber-sub:    rgba(201,124,26,0.1);
          --red:          #c94040;
          --red-sub:      rgba(201,64,64,0.09);
          --red-brd:      rgba(201,64,64,0.22);
          --blue:         #3b7dd8;
          --blue-sub:     rgba(59,125,216,0.09);
          --blue-brd:     rgba(59,125,216,0.22);
          --sh-xs: 0 1px 2px rgba(0,0,0,0.04);
          --sh-sm: 0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --sh-md: 0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
          --sh-lg: 0 20px 48px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06);
          --sh-xl: 0 32px 64px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.07);
          --glow-green: 0 0 24px rgba(45,158,107,0.18);
          --r-xs:3px; --r-sm:6px; --r-md:10px; --r-lg:14px; --r-xl:20px; --r-pill:9999px;
          --font:      'Outfit', system-ui, sans-serif;
          --font-serif:'DM Serif Display', Georgia, serif;
          --font-mono: 'JetBrains Mono', monospace;
          --ease: cubic-bezier(0.22,1,0.36,1);
          --ease2: cubic-bezier(0.16,1,0.3,1);
        }

        [data-theme="dark"] {
          --bg:           #0d0c0b;
          --bg-card:      #141210;
          --bg-glass:     rgba(22,19,16,0.85);
          --bg-glass2:    rgba(30,26,22,0.6);
          --bg-inset:     #1a1714;
          --bg-hover:     rgba(255,255,255,0.035);
          --border:       rgba(255,255,255,0.07);
          --border-med:   rgba(255,255,255,0.12);
          --border-str:   rgba(255,255,255,0.2);
          --text-1:       #f0ede8;
          --text-2:       #d4cec8;
          --text-3:       #a89f96;
          --text-4:       #706860;
          --text-inv:     #0d0c0b;
          --accent:       #f0ede8;
          --accent-h:     #ffffff;
          --accent-sub:   rgba(240,237,232,0.06);
          --green:        #34c97c;
          --green-sub:    rgba(52,201,124,0.08);
          --green-brd:    rgba(52,201,124,0.18);
          --green-text:   #34c97c;
          --amber:        #e8942a;
          --amber-sub:    rgba(232,148,42,0.1);
          --red:          #e05555;
          --red-sub:      rgba(224,85,85,0.09);
          --red-brd:      rgba(224,85,85,0.22);
          --blue:         #5b9af0;
          --blue-sub:     rgba(91,154,240,0.09);
          --blue-brd:     rgba(91,154,240,0.22);
          --sh-xs: 0 1px 2px rgba(0,0,0,0.5);
          --sh-sm: 0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4);
          --sh-md: 0 8px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4);
          --sh-lg: 0 20px 48px rgba(0,0,0,0.65), 0 4px 12px rgba(0,0,0,0.45);
          --sh-xl: 0 32px 64px rgba(0,0,0,0.75), 0 8px 20px rgba(0,0,0,0.5);
          --glow-green: 0 0 32px rgba(52,201,124,0.2);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ro-page {
          font-family: var(--font);
          background: var(--bg);
          color: var(--text-1);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          transition: background 0.4s var(--ease), color 0.4s var(--ease);
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient orbs */
        .ro-orb {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 0;
          filter: blur(80px); opacity: 0.35;
          transition: opacity 0.5s ease;
        }
        .ro-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(45,158,107,0.35) 0%, transparent 70%);
          top: -100px; left: -100px;
        }
        .ro-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(59,125,216,0.2) 0%, transparent 70%);
          bottom: 0; right: 200px;
        }
        [data-theme="dark"] .ro-orb-1 { opacity: 0.5; }
        [data-theme="dark"] .ro-orb-2 { opacity: 0.4; }

        /* ── THEME TOGGLE ── */
        .ro-theme {
          position: fixed; bottom: 28px; right: 28px; z-index: 1000;
          height: 38px; padding: 0 16px; border-radius: var(--r-pill);
          background: var(--bg-glass); border: 1px solid var(--border-med);
          backdrop-filter: blur(20px) saturate(1.8);
          color: var(--text-2); cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          box-shadow: var(--sh-md); font-family: var(--font);
          font-size: 12.5px; font-weight: 500;
          transition: all 0.22s var(--ease);
        }
        .ro-theme:hover {
          color: var(--text-1); border-color: var(--border-str);
          box-shadow: var(--sh-lg); transform: translateY(-2px);
          background: var(--bg-card);
        }

        /* ── LAYOUT ── */
        .ro-body {
          display: grid;
          grid-template-columns: 1fr 400px;
          min-height: calc(100vh - 60px);
          position: relative; z-index: 1;
        }

        /* ══ LEFT PANEL ══ */
        .ro-left {
          padding: 52px 56px;
          display: flex; flex-direction: column; gap: 36px;
          overflow-y: auto;
          animation: fadeUp 0.7s var(--ease2) both;
        }

        /* Status pill */
        .ro-status {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 14px; border-radius: var(--r-pill);
          background: var(--green-sub); border: 1px solid var(--green-brd);
          width: fit-content;
          box-shadow: var(--glow-green);
        }
        .ro-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--green);
          animation: pulse 2.5s ease infinite;
          box-shadow: 0 0 8px var(--green);
        }
        .ro-status span {
          font-family: var(--font-mono); font-size: 11px; font-weight: 500;
          letter-spacing: 0.04em; color: var(--green-text);
        }

        /* Hero */
        .ro-hero { display: flex; flex-direction: column; gap: 16px; }
        .ro-hero h1 {
          font-family: var(--font-serif);
          font-size: clamp(44px, 4.5vw, 64px);
          line-height: 1.02; letter-spacing: -0.01em;
          color: var(--text-1); font-weight: 400;
        }
        .ro-hero h1 em {
          font-style: italic; color: var(--text-3);
        }
        .ro-hero p {
          font-size: 14.5px; color: var(--text-2);
          line-height: 1.72; max-width: 400px; font-weight: 400;
        }

        /* Quick access */
        .ro-quick-label {
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--text-3);
          display: flex; align-items: center; gap: 12px;
        }
        .ro-quick-label::after { content:''; flex:1; height:1px; background: var(--border-med); }
        .ro-quick-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-top: 10px; }
        .ro-quick-tile {
          display: flex; flex-direction: column; align-items: center;
          gap: 8px; padding: 14px 8px;
          background: var(--bg-glass); border: 1px solid var(--border-med);
          border-radius: var(--r-md); text-decoration: none;
          backdrop-filter: blur(12px);
          box-shadow: var(--sh-xs);
          transition: all 0.2s var(--ease);
          text-align: center;
        }
        .ro-quick-tile:hover {
          border-color: var(--border-str);
          transform: translateY(-3px);
          box-shadow: var(--sh-md);
          background: var(--bg-card);
        }
        .ro-quick-ic {
          width: 36px; height: 36px; border-radius: var(--r-md);
          background: var(--bg-inset); border: 1px solid var(--border-med);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .ro-quick-title {
          font-size: 11.5px; font-weight: 600;
          color: var(--text-1); letter-spacing: -0.01em; line-height: 1.2;
        }
        .ro-quick-sub { font-size: 10.5px; color: var(--text-3); margin-top: 1px; line-height: 1.3; }

        /* Stats strip */
        .ro-strip {
          display: grid; grid-template-columns: repeat(4,1fr);
          border: 1px solid var(--border-med); border-radius: var(--r-md);
          overflow: hidden; background: var(--border); gap: 1px;
          margin-top: auto;
        }
        .ro-strip-s {
          background: var(--bg-inset); padding: 12px 8px;
          display: flex; flex-direction: column; align-items: center; gap: 3px;
        }
        .ro-strip-v {
          font-size: 13px; font-weight: 700; letter-spacing: -0.03em;
          color: var(--text-1); font-family: var(--font-serif); font-style: italic;
        }
        .ro-strip-l { font-size: 9.5px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; }

        /* ══ RIGHT PANEL ══ */
        .ro-card-wrap {
          background: transparent;
          border-left: none;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 32px;
          overflow-y: auto;
          position: relative;
        }
        .ro-card-wrap::before {
          content: '';
          position: absolute; top: 0; left: 0; bottom: 0; width: 100px;
          background: linear-gradient(90deg, var(--bg) 0%, transparent 100%);
          pointer-events: none; z-index: 0;
        }

        /* The actual floating card */
        .ro-card {
          width: 100%; max-width: 380px;
          background: var(--bg-card);
          border: 1px solid var(--border-med);
          border-radius: var(--r-xl);
          box-shadow: var(--sh-xl), 0 0 0 1px var(--border);
          padding: 32px 28px 28px;
          display: flex; flex-direction: column; gap: 20px;
          position: relative; overflow: hidden;
          animation: cardReveal 0.65s 0.1s var(--ease2) both;
        }
        .ro-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%);
          pointer-events: none; border-radius: var(--r-xl) var(--r-xl) 0 0;
        }
        .ro-card::after {
          content: '';
          position: absolute; top: 0; left: 32px; right: 32px; height: 1.5px;
          background: linear-gradient(90deg, transparent, var(--green), transparent);
          border-radius: 0 0 var(--r-pill) var(--r-pill);
        }

        /* Card header */
        .ro-card-head {
          display: flex; flex-direction: column; gap: 5px;
          animation: stagger2 0.5s 0.22s var(--ease2) both;
        }
        .ro-card-eyebrow {
          font-family: var(--font-mono); font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3);
          display: flex; align-items: center; gap: 8px;
        }
        .ro-card-eyebrow::before {
          content: ''; display: inline-block;
          width: 16px; height: 1px; background: var(--border-str);
        }
        .ro-card-title {
          font-family: var(--font-serif);
          font-size: 28px; font-weight: 400;
          letter-spacing: -0.01em; color: var(--text-1); line-height: 1.1;
        }
        .ro-card-desc { font-size: 12.5px; color: var(--text-2); line-height: 1.65; font-weight: 400; }

        /* Role badge */
        .ro-role-badge {
          display: flex; align-items: center; gap: 11px; padding: 10px 13px;
          background: var(--green-sub); border: 1px solid var(--green-brd);
          border-radius: var(--r-md); box-shadow: var(--glow-green);
          animation: fadeIn 0.28s var(--ease) both;
        }
        .ro-role-ic {
          width: 32px; height: 32px; border-radius: var(--r-sm);
          background: rgba(52,201,124,0.12); border: 1px solid var(--green-brd);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }
        .ro-role-cap {
          font-size: 9.5px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-2);
        }
        .ro-role-name {
          font-size: 13.5px; font-weight: 600; color: var(--green-text);
          margin-top: 2px;
        }

        /* Form */
        .ro-form {
          display: flex; flex-direction: column; gap: 14px;
          animation: stagger3 0.5s 0.28s var(--ease2) both;
        }
        .ro-field { display: flex; flex-direction: column; gap: 6px; }
        .ro-field label {
          font-size: 12px; font-weight: 600; color: var(--text-1);
          letter-spacing: 0.03em;
        }
        .ro-input-wrap { position: relative; }
        .ro-field input {
          height: 44px; padding: 0 14px; border-radius: var(--r-md);
          border: 1.5px solid var(--border-med);
          background: var(--bg-inset);
          color: var(--text-1); font-family: var(--font); font-size: 14px;
          outline: none; width: 100%; -webkit-appearance: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          font-weight: 400;
        }
        .ro-field input::placeholder { color: var(--text-3); font-size: 13px; }
        .ro-field input:hover:not(:focus) { border-color: var(--border-str); }
        .ro-field input:focus {
          border-color: var(--accent); background: var(--bg-card);
          box-shadow: 0 0 0 3px var(--accent-sub);
        }
        .ro-field.has-err input {
          border-color: var(--red); box-shadow: 0 0 0 3px var(--red-sub);
        }
        .ro-field-err {
          font-size: 11.5px; color: var(--red);
          display: flex; align-items: center; gap: 5px;
          animation: fadeIn 0.2s ease both;
          font-weight: 500;
        }
        .ro-pw-btn {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          background: var(--bg-card); border: 1px solid var(--border-med);
          border-radius: var(--r-xs); cursor: pointer;
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          color: var(--text-2); padding: 4px 10px; letter-spacing: 0.06em;
          text-transform: uppercase;
          transition: all 0.15s; white-space: nowrap;
        }
        .ro-pw-btn:hover {
          color: var(--text-1); border-color: var(--border-str);
          background: var(--bg-inset);
        }

        /* Submit */
        .ro-submit {
          height: 46px; border-radius: var(--r-md);
          background: var(--accent); border: none;
          color: var(--text-inv); font-family: var(--font);
          font-size: 14px; font-weight: 600; letter-spacing: 0.01em;
          cursor: pointer; width: 100%; margin-top: 2px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: all 0.22s var(--ease);
          position: relative; overflow: hidden;
        }
        .ro-submit::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.09) 0%, transparent 55%);
          pointer-events: none;
        }
        .ro-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .ro-submit:active:not(:disabled) {
          transform: translateY(1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .ro-submit:disabled { opacity: 0.4; cursor: not-allowed; }
        .ro-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: rgba(255,255,255,0.95);
          border-radius: 50%; animation: spin 0.65s linear infinite;
        }
        [data-theme="dark"] .ro-spinner {
          border-color: rgba(0,0,0,0.25);
          border-top-color: rgba(0,0,0,0.9);
        }

        /* Footer */
        .ro-footer {
          border-top: 1px solid var(--border-med);
          background: var(--bg-card);
          padding: 18px 56px;
          display: flex; justify-content: space-between; align-items: center;
          position: relative; z-index: 1;
        }
        .ro-footer-brand strong { font-size: 13px; font-weight: 700; color: var(--text-1); letter-spacing: -0.02em; }
        .ro-footer-brand span { font-size: 11px; color: var(--text-3); display: block; margin-top: 1px; font-weight: 400; }
        .ro-footer-copy { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-3); letter-spacing: 0.02em; }
        .ro-footer-nav { display: flex; gap: 20px; }
        .ro-footer-nav a { font-size: 12px; color: var(--text-2); text-decoration: none; transition: color 0.15s; font-weight: 400; }
        .ro-footer-nav a:hover { color: var(--text-1); }

        /* ══ TOASTS ══ */
        .ro-toasts {
          position: fixed; top: 18px; left: 50%; transform: translateX(-50%);
          z-index: 9999;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          pointer-events: none;
        }
        .ro-toast {
          pointer-events: all; cursor: pointer;
          display: inline-flex; align-items: center;
          border-radius: 999px;
          overflow: hidden; position: relative;
          will-change: transform, opacity;
          white-space: nowrap;
        }
        .ro-toast:hover .ro-toast-shell { filter: brightness(1.08); transform: translateY(-1px); }
        .ro-toast:active .ro-toast-shell { transform: scale(0.96); }

        .ro-toast-shell {
          display: flex; align-items: center; gap: 9px;
          padding: 7px 14px 7px 8px;
          border-radius: 999px;
          position: relative;
          transition: filter 0.18s, transform 0.18s var(--ease);
        }

        /* Solid pill colors */
        .ro-toast--info    .ro-toast-shell {
          background: #2563eb;
          box-shadow: 0 4px 20px rgba(37,99,235,0.6), 0 1px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .ro-toast--success .ro-toast-shell {
          background: #16a34a;
          box-shadow: 0 4px 20px rgba(22,163,74,0.6), 0 1px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .ro-toast--error   .ro-toast-shell {
          background: #dc2626;
          box-shadow: 0 4px 20px rgba(220,38,38,0.6), 0 1px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
        }

        /* Top sheen */
        .ro-toast-shell::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%);
          border-radius: 999px 999px 0 0; pointer-events: none;
        }

        /* Icon bubble */
        .ro-toast-ic {
          width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
          background: rgba(255,255,255,0.25);
          border: 1.5px solid rgba(255,255,255,0.4);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 900; color: #fff;
          position: relative; z-index: 1;
          letter-spacing: 0;
        }

        /* Text — single line pill layout */
        .ro-toast-body { position: relative; z-index: 1; display: flex; align-items: baseline; gap: 6px; }
        .ro-toast-ttl {
          font-size: 13px; font-weight: 700; color: #fff;
          letter-spacing: -0.01em; line-height: 1;
        }
        .ro-toast-msg {
          font-size: 12px; font-weight: 400;
          color: rgba(255,255,255,0.85); line-height: 1;
        }

        /* Close */
        .ro-toast-close {
          flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%;
          background: rgba(0,0,0,0.18); border: 1px solid rgba(255,255,255,0.25);
          color: rgba(255,255,255,0.75); font-size: 12px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; z-index: 1;
          margin-left: 4px;
          transition: all 0.15s;
        }
        .ro-toast-close:hover { background: rgba(0,0,0,0.32); color: #fff; }

        /* Progress bar — thin line at bottom of pill */
        .ro-toast-bar {
          position: absolute; bottom: 0; left: 10%; right: 10%; height: 2px;
          transform-origin: left; animation: drain 2.5s linear forwards;
          background: rgba(255,255,255,0.4);
          border-radius: 999px;
        }

        /* Bounce in / shrink out */
        .ro-toast.tin  { animation: toastIn  0.45s var(--ease2) both; }
        .ro-toast.tout { animation: toastOut 0.25s var(--ease)  forwards; pointer-events: none; }

        /* ── Keyframes ── */
        @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cardReveal { from { opacity:0; transform:translateY(20px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes stagger2 { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes stagger3 { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse    { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(0.85);} }
        @keyframes spin     { to{transform:rotate(360deg);} }
        @keyframes drain    { from{transform:scaleX(1);} to{transform:scaleX(0);} }
        @keyframes toastIn {
          0%   { opacity:0; transform: scale(0.6)  translateY(-28px); }
          55%  { opacity:1; transform: scale(1.06) translateY(4px);  }
          75%  { transform: scale(0.97) translateY(-2px); }
          100% { opacity:1; transform: scale(1)    translateY(0);    }
        }
        @keyframes toastOut {
          0%   { opacity:1; transform: scale(1)    translateY(0);    }
          40%  { opacity:1; transform: scale(1.04) translateY(-4px); }
          100% { opacity:0; transform: scale(0.75) translateY(-22px);}
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .ro-body { grid-template-columns: 1fr; }
          .ro-left { border-right: none; border-bottom: 1px solid var(--border); padding: 40px 32px; }
          .ro-card-wrap { border-left: none; padding: 32px; }
          .ro-card-wrap::before { display: none; }
          .ro-card { max-width: 480px; }
          .ro-footer { padding: 18px 32px; }
          .ro-quick-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .ro-left { padding: 28px 18px; gap: 24px; }
          .ro-card-wrap { padding: 24px 18px; }
          .ro-quick-grid { grid-template-columns: repeat(2, 1fr); }
          .ro-footer { flex-direction: column; gap: 10px; text-align: center; padding: 16px 18px; }
          .ro-footer-nav { gap: 14px; }
          .ro-toasts { right: 12px; left: 12px; width: auto; }
        }
      `}</style>

      <div className="ro-page">
        {/* Ambient orbs */}
        <div className="ro-orb ro-orb-1" />
        <div className="ro-orb ro-orb-2" />

        <Navbar />

        <button
          className="ro-theme"
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

        <div className="ro-body">

          {/* ══ LEFT ══ */}
          <div className="ro-left">

            <div className="ro-status">
              <span className="ro-status-dot" />
              <span>Secure Government Portal · RuralOps v2.4</span>
            </div>

            <div className="ro-hero">
              <h1>Rural Governance,<br /><em>Unified.</em></h1>
              <p>
                Enter your registered phone number and password to access the
                RuralOps platform. Your session is secured and managed by the
                central authentication service.
              </p>
            </div>

            <div>
              <p className="ro-quick-label">Quick Access</p>
              <div className="ro-quick-grid">
                {QUICK_LINKS.map(ql => (
                  <Link key={ql.to} to={ql.to} className="ro-quick-tile">
                    <span className="ro-quick-ic">{ql.icon}</span>
                    <span className="ro-quick-title">{ql.label}</span>
                    <span className="ro-quick-sub">{ql.sub}</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* ══ RIGHT CARD ══ */}
          <div className="ro-card-wrap">
            <div className="ro-card">

              {/* Card header */}
              <div className="ro-card-head">
                <span className="ro-card-eyebrow">Secure Login</span>
                <h2 className="ro-card-title">Sign In to RuralOps</h2>
                <p className="ro-card-desc">Access your assigned dashboard by entering your credentials below.</p>
              </div>

              {/* Role badge — shown after successful auth */}
              {role && (
                <div className="ro-role-badge">
                  <span className="ro-role-ic">{role.icon}</span>
                  <div>
                    <span className="ro-role-cap">Authenticated as</span>
                    <div className="ro-role-name">{role.label}</div>
                  </div>
                </div>
              )}

              {/* Login form */}
              <form onSubmit={handleLogin} className="ro-form" noValidate>

                <div className={`ro-field${phoneErr ? " has-err" : ""}`}>
                  <label htmlFor="ro-phone">Phone Number</label>
                  <input
                    id="ro-phone" type="tel" value={phone}
                    onChange={e => { setPhone(e.target.value); if (phoneErr) setPhoneErr(vPhone(e.target.value)); }}
                    onBlur={e => setPhoneErr(vPhone(e.target.value))}
                    placeholder="9876543210" maxLength="10" autoComplete="tel"
                  />
                  {phoneErr && <span className="ro-field-err" role="alert">⚠ {phoneErr}</span>}
                </div>

                <div className={`ro-field${passErr ? " has-err" : ""}`}>
                  <label htmlFor="ro-pwd">Password</label>
                  <div className="ro-input-wrap">
                    <input
                      id="ro-pwd" type={showPw ? "text" : "password"} value={password}
                      onChange={e => { setPassword(e.target.value); if (passErr) setPassErr(vPass(e.target.value)); }}
                      onBlur={e => setPassErr(vPass(e.target.value))}
                      placeholder="Enter your password" autoComplete="current-password"
                      style={{ paddingRight: '72px' }}
                    />
                    <button type="button" className="ro-pw-btn"
                      onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}>
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  {passErr && <span className="ro-field-err" role="alert">⚠ {passErr}</span>}
                </div>

                <button type="submit" className="ro-submit" disabled={loading}>
                  {loading ? (
                    <><span className="ro-spinner" aria-hidden="true" /> Authenticating…</>
                  ) : (
                    <>Sign In <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                  )}
                </button>

              </form>

            </div>
          </div>

        </div>

        <footer className="ro-footer">
          <div className="ro-footer-brand">
            <strong>RuralOps Platform</strong>
            <span>Digital Rural Governance Infrastructure</span>
          </div>
          <div className="ro-footer-copy">© 2026 RuralOps — GOWTHAM CHIRIKI</div>
          <nav className="ro-footer-nav">
            <a href="#">Privacy</a>
            <a href="#">Security</a>
            <a href="#">Support</a>
          </nav>
        </footer>

      </div>

      {/* ══ TOASTS ══ */}
      <div className="ro-toasts" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`ro-toast ro-toast--${t.type} ${t.out ? "tout" : "tin"}`}
            onClick={() => dismissToast(t.id)}
          >
            <div className="ro-toast-shell">
              <div className="ro-toast-ic">
                {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "i"}
              </div>
              <div className="ro-toast-body">
                <div className="ro-toast-ttl">{t.ttl}</div>
                <div className="ro-toast-msg">{t.sub}</div>
              </div>
              <button
                className="ro-toast-close"
                onClick={e => { e.stopPropagation(); dismissToast(t.id); }}
                aria-label="Dismiss"
              >×</button>
            </div>
            {!t.out && <div className="ro-toast-bar" />}
          </div>
        ))}
      </div>
    </>
  );
}