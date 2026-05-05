import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  Shield, BarChart2, Users, Info, ArrowRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import villageImg from "../assets/login-village.png";

const API = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

/* ─── Quick access links ─── */
const QUICK_LINKS = [
  { label: "New Registration", to: "/citizen/register", icon: "📝", sub: "Register as a citizen" },
  { label: "Check Status", to: "/citizen/status", icon: "🔍", sub: "Track your application" },
  { label: "Activate Account", to: "/activate-account", icon: "🔑", sub: "Enter your activation key" },
  { label: "Request Access Key", to: "/activation/request", icon: "✉️", sub: "Request a new key" },
];

const ROLE_CONFIG = {
  CITIZEN: { label: "Citizen", icon: "👤" },
  WORKER: { label: "Field Worker", icon: "🔧" },
  VAO: { label: "Village Admin Officer", icon: "📋" },
  MAO: { label: "Mandal Admin Officer", icon: "🏛️" },
};

const ROLE_PILLS = [
  { key: "VAO", label: "VAO", icon: User },
  { key: "OFFICER", label: "Officer", icon: Users },
  { key: "ADMIN", label: "Admin", icon: Shield },
];

const features = [
  { icon: Shield, title: "Secure Access", text: "Government-grade data protection at every layer." },
  { icon: BarChart2, title: "Efficient Workflows", text: "Digitized rural administration and governance." },
  { icon: Users, title: "Transparent System", text: "Full accountability and auditability at every step." },
];

/* ─── Session utilities (same as file 2, exported for backward compat) ─── */
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
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("accountType", data.activeRole);
  localStorage.setItem("accountId", data.accountId);
  localStorage.setItem("roles", JSON.stringify(data.roles ?? []));
  localStorage.setItem("villageId", data.villageId ?? "");
}

export function authFetch(url, options = {}) {
  const token = localStorage.getItem("accessToken");
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

/* ─── Validation ─── */
const vPhone = v =>
  !v ? "Phone number is required."
    : !/^[6-9]\d{9}$/.test(v) ? "Enter a valid 10-digit number starting with 6–9."
      : "";
const vPass = v =>
  !v ? "Password is required."
    : v.length < 6 ? "Minimum 6 characters required."
      : "";

/* ─── Read dark class from <html> ─── */
function useDark() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.getAttribute("data-theme") === "dark"));
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/* ══════════════════════════════════════════
   STYLES
══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:ital,wght@0,600;1,500&display=swap');

/* ══ LIGHT tokens ══ */
.lgp {
  --accent:       #1e5c22;
  --accent-hover: #174d1a;
  --accent-light: #2d7a31;
  --accent-sub:   rgba(30,92,34,0.10);
  --accent-ring:  rgba(30,92,34,0.20);
  --err:          #c0392b;
  --ok:           #1a7a3a;

  --card-bg:      rgba(255,255,255,0.93);
  --card-border:  rgba(255,255,255,0.7);
  --card-shadow:  0 32px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.10);

  --input-bg:     rgba(248,249,246,0.9);
  --input-border: #c8cfc2;
  --input-focus:  #1e5c22;
  --input-text:   #0f1410;
  --input-ph:     #9aa094;

  --card-text:    #0f1410;
  --card-text2:   #374033;
  --card-muted:   #7a8474;
  --card-line:    #dde0d8;

  --left-title:        #ffffff;
  --left-sub:          rgba(255,255,255,0.80);
  --left-feat-bg:      rgba(255,255,255,0.12);
  --left-feat-border:  rgba(255,255,255,0.18);
  --left-feat-text:    #ffffff;
  --left-feat-sub:     rgba(255,255,255,0.72);
  --left-ico-bg:       rgba(255,255,255,0.18);
  --left-ico-col:      #ffffff;

  --pill-vao-bg:      #f0fdf4; --pill-vao-border: #bbf7d0; --pill-vao-color: #16a34a;
  --pill-officer-bg:  #eef2ff; --pill-officer-border: #c7d2fe; --pill-officer-color: #4f46e5;
  --pill-admin-bg:    #faf5ff; --pill-admin-border: #e9d5ff; --pill-admin-color: #9333ea;

  --img-overlay: linear-gradient(105deg,
    rgba(10,30,12,0.82) 0%, rgba(10,30,12,0.65) 38%,
    rgba(10,30,12,0.30) 60%, rgba(10,30,12,0.08) 100%);
  --img-vignette: radial-gradient(ellipse at 70% 50%,
    transparent 30%, rgba(0,0,0,0.18) 100%);

  --toast-bg: rgba(255,255,255,0.96);
}

/* ══ DARK tokens ══ */
.lgp.dark {
  --accent:       #2d8a31;
  --accent-hover: #247026;
  --accent-light: #3aaa3f;
  --accent-sub:   rgba(45,138,49,0.14);
  --accent-ring:  rgba(45,138,49,0.25);
  --err:          #e74c3c;
  --ok:           #27ae60;

  --card-bg:      rgba(14,18,15,0.88);
  --card-border:  rgba(255,255,255,0.08);
  --card-shadow:  0 32px 80px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.35);

  --input-bg:     rgba(255,255,255,0.05);
  --input-border: rgba(255,255,255,0.12);
  --input-focus:  #2d8a31;
  --input-text:   #e4e6e3;
  --input-ph:     #606860;

  --card-text:    #e4e6e3;
  --card-text2:   #a8b0a4;
  --card-muted:   #626862;
  --card-line:    rgba(255,255,255,0.10);

  --left-title:       #ffffff;
  --left-sub:         rgba(255,255,255,0.72);
  --left-feat-bg:     rgba(255,255,255,0.07);
  --left-feat-border: rgba(255,255,255,0.12);
  --left-feat-text:   #ffffff;
  --left-feat-sub:    rgba(255,255,255,0.60);
  --left-ico-bg:      rgba(255,255,255,0.10);
  --left-ico-col:     #a8e6ac;

  --pill-vao-bg:      #052e16; --pill-vao-border: #166534; --pill-vao-color: #4ade80;
  --pill-officer-bg:  #1e1b4b; --pill-officer-border: #3730a3; --pill-officer-color: #818cf8;
  --pill-admin-bg:    #3b0764; --pill-admin-border: #7e22ce; --pill-admin-color: #c084fc;

  --img-overlay: linear-gradient(105deg,
    rgba(5,12,6,0.92) 0%, rgba(5,12,6,0.78) 38%,
    rgba(5,12,6,0.40) 60%, rgba(5,12,6,0.15) 100%);
  --img-vignette: radial-gradient(ellipse at 70% 50%,
    transparent 20%, rgba(0,0,0,0.35) 100%);

  --toast-bg: rgba(14,18,15,0.96);
}

/* ════ RESET ════ */
.lgp *, .lgp *::before, .lgp *::after { box-sizing: border-box; margin: 0; padding: 0; }
.lgp { font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; }

/* ════ HERO ════ */
.lgp-hero {
  position: relative;
  min-height: 100vh;
  display: flex; align-items: stretch; overflow: hidden;
}
.lgp-bg-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; object-position: center 35%; z-index: 0;
}
.lgp-overlay  { position: absolute; inset: 0; background: var(--img-overlay);  z-index: 1; }
.lgp-vignette { position: absolute; inset: 0; background: var(--img-vignette); z-index: 2; }

.lgp-inner {
  position: relative; z-index: 3; width: 100%;
  display: flex; align-items: center;
  padding: 110px 5% 4rem; gap: 4rem;
  min-height: 100vh;
}

/* ════ LEFT ════ */
.lgp-info {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; padding-right: 1rem;
}

.lgp-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.30);
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.92);
  font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  margin-bottom: 1.5rem; backdrop-filter: blur(8px); align-self: flex-start;
}
.lgp-badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #7ddb82; box-shadow: 0 0 6px #7ddb82;
  animation: lgp-pulse 2s infinite;
}
@keyframes lgp-pulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:0.6; transform:scale(0.85); }
}

.lgp-headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.4rem, 3.5vw, 3.6rem);
  line-height: 1.06; font-weight: 600;
  color: var(--left-title);
  margin-bottom: 0.6rem;
  text-shadow: 0 2px 20px rgba(0,0,0,0.25);
}
.lgp-headline em { font-style: italic; color: #7ddb82; display: block; }

.lgp-accent-bar {
  width: 56px; height: 3px;
  background: linear-gradient(90deg, #ca8a04, #facc15);
  border-radius: 2px; margin-bottom: 1.1rem;
}

.lgp-subhead {
  font-size: 0.9rem; color: var(--left-sub); line-height: 1.8;
  margin-bottom: 2rem; max-width: 360px;
  text-shadow: 0 1px 8px rgba(0,0,0,0.30);
}

/* ── Trust badge ── */
.lgp-trust {
  display: inline-flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.12); backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.20); border-radius: 14px;
  padding: 10px 18px; margin-bottom: 2rem; align-self: flex-start;
}
.lgp-trust-ico {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(134,239,172,0.20);
  display: flex; align-items: center; justify-content: center;
}
.lgp-trust h5 { color: #fff; font-size: 0.82rem; font-weight: 700; margin-bottom: 1px; }
.lgp-trust p  { color: #86efac; font-size: 0.69rem; }

/* ── Features ── */
.lgp-features { display: flex; flex-direction: column; gap: 10px; max-width: 380px; margin-bottom: 2rem; }
.lgp-feat {
  display: flex; align-items: center; gap: 13px;
  padding: 12px 14px; border-radius: 12px;
  border: 1px solid var(--left-feat-border);
  background: var(--left-feat-bg); backdrop-filter: blur(12px);
  transition: background 0.2s, transform 0.2s; cursor: default;
}
.lgp-feat:hover { background: rgba(255,255,255,0.16); transform: translateX(4px); }
.lgp-feat-icon {
  width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
  background: var(--left-ico-bg); color: var(--left-ico-col);
  display: flex; align-items: center; justify-content: center;
}
.lgp-feat-body h4 { font-size: 0.82rem; font-weight: 600; color: var(--left-feat-text); margin-bottom: 2px; }
.lgp-feat-body p  { font-size: 0.73rem; color: var(--left-feat-sub); line-height: 1.4; }

/* ── Quick links ── */
.lgp-quick-label {
  font-size: 0.65rem; font-weight: 700; letter-spacing: 0.10em;
  text-transform: uppercase; color: rgba(255,255,255,0.55);
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
.lgp-quick-label::after { content:''; flex:1; height:1px; background: rgba(255,255,255,0.18); }

.lgp-quick-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; max-width: 380px; }
.lgp-quick-tile {
  display: flex; flex-direction: column; align-items: flex-start;
  gap: 5px; padding: 12px 13px;
  background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.16);
  border-radius: 12px; text-decoration: none;
  backdrop-filter: blur(12px);
  transition: all 0.2s;
}
.lgp-quick-tile:hover {
  background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.28);
  transform: translateY(-2px);
}
.lgp-quick-ic {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.18);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.lgp-quick-title { font-size: 0.76rem; font-weight: 700; color: #fff; line-height: 1.2; }
.lgp-quick-sub   { font-size: 0.67rem; color: rgba(255,255,255,0.60); line-height: 1.3; }

/* ════ RIGHT — glass card column ════ */
.lgp-card-col {
  flex-shrink: 0; width: 100%; max-width: 440px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}

.lgp-card {
  width: 100%;
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 22px; box-shadow: var(--card-shadow);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  padding: 2.4rem 2.4rem 2rem;
  position: relative; overflow: hidden;
}
.lgp-card::before {
  content: ''; position: absolute; top: 0; left: 12%; right: 12%; height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent-light), transparent);
  border-radius: 0 0 3px 3px;
}

/* Logo */
.lgp-logo-wrap { display: flex; justify-content: center; margin-bottom: 1.3rem; }
.lgp-logo-circle {
  width: 62px; height: 62px; border-radius: 50%;
  background: var(--accent-sub); border: 2px solid var(--accent-ring);
  display: flex; align-items: center; justify-content: center;
}

.lgp-card-h1  { font-size: 1.45rem; font-weight: 700; color: var(--card-text); text-align: center; margin-bottom: 4px; }
.lgp-card-sub { font-size: 0.78rem; color: var(--card-muted); text-align: center; margin-bottom: 1.6rem; }

/* ── Role badge (shown after successful auth) ── */
.lgp-role-badge {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 13px; margin-bottom: 1rem;
  background: var(--accent-sub); border: 1px solid var(--accent-ring);
  border-radius: 10px;
}
.lgp-role-ic {
  width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
  background: rgba(30,92,34,0.12); border: 1px solid var(--accent-ring);
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.lgp-role-cap  { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--card-muted); }
.lgp-role-name { font-size: 0.84rem; font-weight: 700; color: var(--accent); margin-top: 2px; }

/* ── Fields ── */
.lgp-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 13px; }
.lgp-lbl   { font-size: 0.74rem; font-weight: 600; color: var(--card-text2); }
.lgp-iw    { position: relative; }
.lgp-ico {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: var(--card-muted); pointer-events: none; line-height: 0;
}
.lgp-input {
  width: 100%; height: 43px;
  border: 1.5px solid var(--input-border); border-radius: 10px;
  background: var(--input-bg); color: var(--input-text);
  font-family: 'DM Sans', sans-serif; font-size: 0.84rem;
  padding: 0 36px 0 36px; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.lgp-input::placeholder { color: var(--input-ph); }
.lgp-input.no-right { padding-right: 13px; }
.lgp-input:focus { border-color: var(--input-focus); box-shadow: 0 0 0 3px var(--accent-ring); }
.lgp-input.f-err  { border-color: var(--err); }

.lgp-eye {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: var(--card-muted); padding: 0; line-height: 0; transition: color 0.2s;
}
.lgp-eye:hover { color: var(--card-text); }

.lgp-err-msg {
  font-size: 0.69rem; color: var(--err);
  display: flex; align-items: center; gap: 4px; margin-top: 2px;
}

/* ── Remember + Forgot ── */
.lgp-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.2rem;
}
.lgp-remember {
  display: flex; align-items: center; gap: 6px;
  cursor: pointer; font-size: 0.80rem; color: var(--card-muted);
}
.lgp-remember input { accent-color: var(--accent); width: 14px; height: 14px; }
.lgp-forgot {
  font-size: 0.80rem; color: var(--accent); font-weight: 600;
  text-decoration: none; transition: color 0.2s;
}
.lgp-forgot:hover { color: var(--accent-hover); }

/* ── Submit ── */
.lgp-btn {
  width: 100%; padding: 12px;
  background: var(--accent); color: #fff; border: none;
  border-radius: 11px; font-size: 0.90rem; font-weight: 700;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 18px var(--accent-ring);
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
}
.lgp-btn:hover:not(:disabled) {
  background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 8px 24px var(--accent-ring);
}
.lgp-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

.lgp-spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2.5px solid rgba(255,255,255,0.35); border-top-color: #fff;
  animation: lgp-spin 0.75s linear infinite;
}
@keyframes lgp-spin { to { transform: rotate(360deg); } }

/* ── Divider ── */
.lgp-divider {
  display: flex; align-items: center; gap: 12px; margin: 1.3rem 0 0.9rem;
}
.lgp-div-line { flex: 1; height: 1px; background: var(--card-line); }
.lgp-div-txt  { font-size: 0.72rem; color: var(--card-muted); }

.lgp-role-label {
  text-align: center; font-size: 0.78rem; font-weight: 700;
  color: var(--card-text); margin-bottom: 0.75rem;
}

/* ── Role pills ── */
.lgp-pills { display: flex; gap: 10px; }
.lgp-pill {
  flex: 1; padding: 9px 4px; border-radius: 10px; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 0.80rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  border: 1.5px solid; transition: all 0.2s;
}
.lgp-pill:hover { opacity: 0.82; transform: translateY(-1px); }
.lgp-pill.vao     { background: var(--pill-vao-bg);     border-color: var(--pill-vao-border);     color: var(--pill-vao-color);     }
.lgp-pill.officer { background: var(--pill-officer-bg); border-color: var(--pill-officer-border); color: var(--pill-officer-color); }
.lgp-pill.admin   { background: var(--pill-admin-bg);   border-color: var(--pill-admin-border);   color: var(--pill-admin-color);   }

/* ── Security notice ── */
.lgp-security {
  width: 100%;
  background: var(--accent-sub); border: 1px solid var(--accent-ring);
  border-radius: 12px; padding: 12px 16px;
  display: flex; align-items: flex-start; gap: 10px;
  backdrop-filter: blur(12px);
}
.lgp-security-ico { color: var(--accent); flex-shrink: 0; margin-top: 1px; }
.lgp-security p { font-size: 0.72rem; color: var(--card-text2); line-height: 1.55; }

/* ── Mini footer ── */
.lgp-mini-footer { text-align: center; }
.lgp-mini-footer p { font-size: 0.78rem; color: var(--card-muted); }
.lgp-mini-footer a { color: var(--accent); font-weight: 600; text-decoration: none; }
.lgp-mini-footer a:hover { color: var(--accent-hover); }
.lgp-mini-footer .lgp-copy { font-size: 0.66rem; margin-top: 4px; }

/* ════ TOASTS ════ */
.lgp-toasts {
  position: fixed; top: 76px; right: 20px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 9999; pointer-events: none;
}
.lgp-toast {
  pointer-events: all; min-width: 270px; max-width: 330px;
  border-radius: 12px; overflow: hidden;
  background: var(--toast-bg); border: 1px solid var(--card-line);
  box-shadow: 0 12px 40px rgba(0,0,0,0.22);
  backdrop-filter: blur(16px);
}
.lgp-toast-shell { display: flex; align-items: center; gap: 10px; padding: 11px 13px; }
.lgp-toast-ic {
  width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.lgp-toast--success .lgp-toast-ic { background: rgba(26,122,58,0.15); color: var(--ok);   }
.lgp-toast--error   .lgp-toast-ic { background: rgba(192,57,43,0.15);  color: var(--err);  }
.lgp-toast--info    .lgp-toast-ic { background: rgba(59,130,246,0.15); color: #3b82f6;     }
.lgp-toast-body { flex: 1; }
.lgp-toast-ttl { display: block; font-size: 0.78rem; font-weight: 700; color: var(--card-text); }
.lgp-toast-msg { display: block; font-size: 0.68rem; color: var(--card-muted); }
.lgp-toast-close {
  background: none; border: none; color: var(--card-muted);
  cursor: pointer; font-size: 1rem; padding: 0; line-height: 1;
}
.lgp-toast-bar {
  height: 3px; animation: lgp-tbar 2.5s linear forwards;
}
.lgp-toast--success .lgp-toast-bar { background: var(--ok);  }
.lgp-toast--error   .lgp-toast-bar { background: var(--err); }
.lgp-toast--info    .lgp-toast-bar { background: #3b82f6;    }
@keyframes lgp-tbar { from { width: 100%; } to { width: 0; } }

/* ════ RESPONSIVE ════ */
@media (max-width: 900px) {
  .lgp-inner {
    flex-direction: column; align-items: flex-start;
    padding: 80px 5% 3rem; gap: 2.5rem; min-height: 100vh;
  }
  .lgp-info     { padding-right: 0; }
  .lgp-card-col { max-width: 100%; }
  .lgp-hero     { min-height: 100vh; }
  .lgp-quick-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 640px) {
  .lgp-card      { padding: 1.8rem 1.4rem 1.5rem; }
  .lgp-headline  { font-size: 2.2rem; }
  .lgp-inner     { padding: 74px 4% 2.5rem; gap: 2rem; }
  .lgp-pills     { flex-direction: column; }
  .lgp-pill      { padding: 10px 14px; }
  .lgp-quick-grid{ grid-template-columns: repeat(2, 1fr); }
}
`;

/* ══════════════════════════════════════════
   PAGE COMPONENT
══════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate();
  const dark = useDark();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [role, setRole] = useState(null);   // shown after successful login
  const [phoneErr, setPhoneErr] = useState("");
  const [passErr, setPassErr] = useState("");

  /* ── Toast system (multi-queue, same as file 2) ── */
  const addToast = useCallback((type, ttl, sub) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, type, ttl, sub }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2800);
  }, []);
  const dismissToast = id => setToasts(p => p.filter(t => t.id !== id));

  /* ── Login handler (file 2 logic exactly) ── */
  const handleLogin = async e => {
    e.preventDefault();
    const pe = vPhone(phone), we = vPass(password);
    setPhoneErr(pe); setPassErr(we);
    if (pe || we) { addToast("error", "Validation Failed", "Please correct the highlighted fields."); return; }

    setLoading(true);
    addToast("info", "Authenticating…", "Verifying your credentials with the server.");

    try {
      ["accessToken", "refreshToken", "accountType", "accountId", "villageId", "roles", "role"]
        .forEach(k => localStorage.removeItem(k));

      const res = await fetch(`${API}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, password }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.message || "Invalid credentials");

      saveSession(data);
      startTokenRefresh();
      setRole(ROLE_CONFIG[data.activeRole]);

      addToast("success", "Welcome back!", "Redirecting to your dashboard…");
      setTimeout(() => {
        switch (data.activeRole) {
          case "CITIZEN": navigate("/citizen/dashboard"); break;
          case "MAO": navigate("/mao/dashboard"); break;
          case "VAO": navigate(`/vao/dashboard/${data.accountId}`); break;
          case "WORKER": navigate("/worker/dashboard"); break;
          default: navigate("/");
        }
      }, 1500);
    } catch (err) {
      const msg = err.message || "Login failed";
      addToast("error", "Authentication Failed",
        msg.toLowerCase().includes("credentials")
          ? "The phone number or password is incorrect."
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <Navbar />

      <div className={`lgp${dark ? " dark" : ""}`}>
        <div className="lgp-hero">

          <img src={villageImg} alt="" aria-hidden="true" className="lgp-bg-img" />
          <div className="lgp-overlay" />
          <div className="lgp-vignette" />

          <div className="lgp-inner">

            {/* ══ LEFT ══ */}
            <motion.div className="lgp-info"
              initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="lgp-badge">
                <span className="lgp-badge-dot" />
                District Registry System
              </div>

              <h1 className="lgp-headline">
                Empowering Villages
                <em>Smart Governance.</em>
              </h1>

              <div className="lgp-accent-bar" />

              <p className="lgp-subhead">
                Digitizing rural administration with transparency and efficiency
                — one village at a time.
              </p>

              <div className="lgp-trust">
                <div className="lgp-trust-ico"><Users size={18} color="#86efac" /></div>
                <div>
                  <h5>Trusted by 1000+ Villages</h5>
                  <p>Across India 🇮🇳</p>
                </div>
              </div>

              <div className="lgp-features">
                {features.map((ft, i) => (
                  <motion.div key={i} className="lgp-feat"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  >
                    <div className="lgp-feat-icon"><ft.icon size={17} /></div>
                    <div className="lgp-feat-body"><h4>{ft.title}</h4><p>{ft.text}</p></div>
                  </motion.div>
                ))}
              </div>

              {/* Quick links */}
              <div>
                <div className="lgp-quick-label">Quick Access</div>
                <div className="lgp-quick-grid">
                  {QUICK_LINKS.map(ql => (
                    <Link key={ql.to} to={ql.to} className="lgp-quick-tile">
                      <span className="lgp-quick-ic">{ql.icon}</span>
                      <span className="lgp-quick-title">{ql.label}</span>
                      <span className="lgp-quick-sub">{ql.sub}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ══ RIGHT ══ */}
            <div className="lgp-card-col">

              <motion.div style={{ width: "100%" }}
                initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="lgp-card">

                  {/* Logo mark */}
                  <div className="lgp-logo-wrap">
                    <div className="lgp-logo-circle">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C9 2 7 5 7 8c0 4 5 10 5 10s5-6 5-10c0-3-2-6-5-6z" fill="#7ddb82" />
                        <circle cx="12" cy="8" r="2.5" fill={dark ? "#2d8a31" : "#1e5c22"} />
                      </svg>
                    </div>
                  </div>

                  <div className="lgp-card-h1">Welcome Back 👋</div>
                  <div className="lgp-card-sub">Sign in to manage your rural operations</div>

                  {/* Role badge — visible after successful auth */}
                  <AnimatePresence>
                    {role && (
                      <motion.div className="lgp-role-badge"
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      >
                        <span className="lgp-role-ic">{role.icon}</span>
                        <div>
                          <div className="lgp-role-cap">Authenticated as</div>
                          <div className="lgp-role-name">{role.label}</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form */}
                  <form onSubmit={handleLogin} noValidate>

                    {/* Phone */}
                    <div className="lgp-field">
                      <label className="lgp-lbl" htmlFor="lgp-phone">Phone Number</label>
                      <div className="lgp-iw">
                        <span className="lgp-ico"><User size={15} /></span>
                        <input
                          id="lgp-phone" type="tel" placeholder="9876543210"
                          value={phone} maxLength="10" autoComplete="tel"
                          onChange={e => { setPhone(e.target.value); if (phoneErr) setPhoneErr(vPhone(e.target.value)); }}
                          onBlur={e => setPhoneErr(vPhone(e.target.value))}
                          className={`lgp-input no-right${phoneErr ? " f-err" : ""}`}
                        />
                      </div>
                      <AnimatePresence>
                        {phoneErr && (
                          <motion.span className="lgp-err-msg"
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          >
                            <AlertCircle size={11} />{phoneErr}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Password */}
                    <div className="lgp-field">
                      <label className="lgp-lbl" htmlFor="lgp-pwd">Password</label>
                      <div className="lgp-iw">
                        <span className="lgp-ico"><Lock size={15} /></span>
                        <input
                          id="lgp-pwd" type={showPw ? "text" : "password"}
                          placeholder="Enter your password" autoComplete="current-password"
                          value={password}
                          onChange={e => { setPassword(e.target.value); if (passErr) setPassErr(vPass(e.target.value)); }}
                          onBlur={e => setPassErr(vPass(e.target.value))}
                          className={`lgp-input${passErr ? " f-err" : ""}`}
                        />
                        <button type="button" className="lgp-eye"
                          onClick={() => setShowPw(v => !v)}
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {passErr && (
                          <motion.span className="lgp-err-msg"
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          >
                            <AlertCircle size={11} />{passErr}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Remember + Forgot */}
                    <div className="lgp-row">
                      <label className="lgp-remember">
                        <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                        Remember Me
                      </label>
                      <Link to="/forgot-password" className="lgp-forgot">Forgot Password?</Link>
                    </div>

                    {/* Submit */}
                    <motion.button type="submit" className="lgp-btn" disabled={loading}
                      whileHover={loading ? {} : { scale: 1.02 }}
                      whileTap={loading ? {} : { scale: 0.98 }}
                    >
                      {loading
                        ? <><div className="lgp-spinner" /> Authenticating…</>
                        : <><Lock size={14} /> Sign In</>
                      }
                    </motion.button>
                  </form>

                  {/* Divider + Role pills */}
                  <div className="lgp-divider">
                    <div className="lgp-div-line" />
                    <span className="lgp-div-txt">OR</span>
                    <div className="lgp-div-line" />
                  </div>

                  <p className="lgp-role-label">Sign in as</p>

                  <div className="lgp-pills">
                    {ROLE_PILLS.map(({ key, label, icon: Icon }) => (
                      <motion.button key={key} type="button"
                        className={`lgp-pill ${key.toLowerCase()}`}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        onClick={() => addToast("info", `${label} Login`, `Enter your ${label} credentials above.`)}
                      >
                        <Icon size={13} />{label}
                      </motion.button>
                    ))}
                  </div>

                </div>{/* /lgp-card */}
              </motion.div>

              {/* Security notice */}
              <motion.div className="lgp-security"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              >
                <Shield size={16} className="lgp-security-ico" />
                <p>Your data is protected under government-grade encryption and district security protocols.</p>
              </motion.div>


            </div>{/* /lgp-card-col */}
          </div>{/* /lgp-inner */}
        </div>{/* /lgp-hero */}

        <Footer />
      </div>

      {/* ══ TOASTS ══ */}
      <div className="lgp-toasts" role="region" aria-label="Notifications" aria-live="polite">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              className={`lgp-toast lgp-toast--${t.type}`}
              initial={{ opacity: 0, x: 60, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.94 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => dismissToast(t.id)}
            >
              <div className="lgp-toast-shell">
                <div className="lgp-toast-ic">
                  {t.type === "success" ? <CheckCircle2 size={14} />
                    : t.type === "error" ? <AlertCircle size={14} />
                      : <Info size={14} />}
                </div>
                <div className="lgp-toast-body">
                  <span className="lgp-toast-ttl">{t.ttl}</span>
                  <span className="lgp-toast-msg">{t.sub}</span>
                </div>
                <button className="lgp-toast-close"
                  onClick={e => { e.stopPropagation(); dismissToast(t.id); }}
                  aria-label="Dismiss">×</button>
              </div>
              <div className="lgp-toast-bar" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}