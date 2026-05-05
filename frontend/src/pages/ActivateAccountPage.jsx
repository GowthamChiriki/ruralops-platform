import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Wrench, Shield, Key, Eye, EyeOff, CheckCircle2, AlertCircle,
  Castle, Landmark, Lock, ArrowRight, ChevronRight, KeyRound, X,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import villageImg from "../assets/village.png";

/* ─────────────────────────────────────────
   Dark-mode observer  (watches .dark class on <html>)
───────────────────────────────────────── */
function useDark() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/* ─────────────────────────────────────────
   Account type config
───────────────────────────────────────── */
const ACCOUNT_TYPES = {
  RLOC: { label: "Citizen",               role: "citizen", variant: "tg", Icon: User },
  RLOW: { label: "Field Worker",          role: "worker",  variant: "tb", Icon: Wrench },
  RLOV: { label: "Village Admin Officer", role: "vao",     variant: "am", Icon: Castle },
  RLOM: { label: "Mandal Admin Officer",  role: "mao",     variant: "pu", Icon: Landmark },
};
const detectAccountType = (id) =>
  id.length >= 4 ? (ACCOUNT_TYPES[id.substring(0, 4).toUpperCase()] ?? null) : null;

const buildRoute = (role, id, ak, pw, cpw) => ({
  citizen: { endpoint: "/citizen/activate",              payload: { citizenId: id, activationKey: ak, password: pw, confirmPassword: cpw } },
  worker:  { endpoint: "/workers/activate",              payload: { workerId: id,  activationKey: ak, password: pw, confirmPassword: cpw } },
  vao:     { endpoint: "/administration/vao/activate",   payload: { vaoId: id,     activationKey: ak, password: pw, confirmPassword: cpw } },
  mao:     { endpoint: "/administration/mao/activate",   payload: { maoId: id,     activationKey: ak, password: pw, confirmPassword: cpw } },
}[role] ?? null);

/* ─────────────────────────────────────────
   Toast system  (v2 logic: rAF progress drain)
───────────────────────────────────────── */
let _tid = 0;

function ToastItem({ t, onDone }) {
  const [phase, setPhase] = useState("entering");
  const rafRef   = useRef(null);
  const startRef = useRef(Date.now());
  const dur      = t.duration ?? 4500;
  const [progress, setProgress] = useState(100);

  const dismiss = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPhase("leaving");
    setTimeout(() => onDone(t.id), 220);
  }, [t.id, onDone]);

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

  return (
    <motion.div
      className={`aap-toast aap-toast--${t.type}`}
      initial={{ opacity: 0, x: 60, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.94 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="aap-toast-shell">
        <div className="aap-toast-ic">
          {t.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
        </div>
        <div className="aap-toast-body">
          <span className="aap-toast-ttl">{t.ttl}</span>
          <span className="aap-toast-msg">{t.sub}</span>
        </div>
        <button className="aap-toast-close" onClick={dismiss} aria-label="Dismiss">
          <X size={13} />
        </button>
      </div>
      <div
        className="aap-toast-bar"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </motion.div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push    = useCallback((type, ttl, sub, dur) =>
    setToasts(p => [...p, { id: ++_tid, type, ttl, sub, duration: dur }]), []);
  const remove  = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  const success = (ttl, sub) => push("success", ttl, sub);
  const error   = (ttl, sub) => push("error",   ttl, sub);
  return { toasts, remove, success, error };
}

/* ─────────────────────────────────────────
   Validation  (v2 pattern)
───────────────────────────────────────── */
const validate = {
  id:  (v) => !v.trim()           ? "Account ID is required."
             : !detectAccountType(v) ? "Prefix must be RLOC · RLOW · RLOV · RLOM."
             : null,
  ak:  (v) => !v.trim()           ? "Activation key is required."
             : v.trim().length < 6  ? "Key seems too short — check again."
             : null,
  pw:  (v) => !v                  ? "A password is required."
             : v.length < 8        ? "Minimum 8 characters required."
             : null,
  cpw: (v, pw) => !v              ? "Please confirm your password."
                : v !== pw         ? "Passwords do not match."
                : null,
};

/* field-class helper  (v2 pattern) */
const fc = (err, field, touched) =>
  !touched[field] ? "" : err ? "f-err" : "f-ok";

/* ─────────────────────────────────────────
   Static content
───────────────────────────────────────── */
const STEPS = [
  { num: "01", text: "Enter your Account ID and activation key" },
  { num: "02", text: "Set a strong, secure password" },
  { num: "03", text: "Your account activates upon completion" },
  { num: "04", text: "Access your governance dashboard immediately" },
];

const LIVE_FEED = [
  { Icon: User,    title: "Citizen Activated",     sub: "RLOC account successfully unsealed",   time: "2m ago",  variant: "tg" },
  { Icon: Castle,  title: "VAO Activated",          sub: "Village credentials confirmed",         time: "11m ago", variant: "am" },
  { Icon: Wrench,  title: "Worker Activated",       sub: "Field access privileges granted",       time: "18m ago", variant: "tb" },
];

const features = [
  { Icon: Shield,  title: "Council-Verified",   text: "Your account was approved and sealed by the district council." },
  { Icon: Key,     title: "One-Time Key",        text: "Your activation key is issued once and expires upon use." },
  { Icon: Lock,    title: "Sovereign Password",  text: "You retain full control of your credentials at all times." },
];

/* ─────────────────────────────────────────
   CSS  (v1 theme — complete, untouched)
   + additions for v2 toast structure & f-ok state
───────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:ital,wght@0,600;1,500&display=swap');

/* ══ LIGHT ══ */
.aap {
  --accent:        #1e5c22;
  --accent-hover:  #174d1a;
  --accent-light:  #2d7a31;
  --accent-sub:    rgba(30,92,34,0.10);
  --accent-ring:   rgba(30,92,34,0.20);
  --err:           #c0392b;
  --err-sub:       rgba(192,57,43,0.10);
  --err-ring:      rgba(192,57,43,0.20);
  --ok:            #1a7a3a;
  --ok-sub:        rgba(26,122,58,0.10);
  --ok-ring:       rgba(26,122,58,0.20);
  --amber:         #b45309;
  --amber-sub:     rgba(180,83,9,0.12);
  --amber-ring:    rgba(180,83,9,0.20);
  --blue:          #1d4ed8;
  --blue-sub:      rgba(29,78,216,0.10);
  --blue-ring:     rgba(29,78,216,0.20);
  --purple:        #7c3aed;
  --purple-sub:    rgba(124,58,237,0.10);
  --purple-ring:   rgba(124,58,237,0.22);

  --card-bg:       rgba(255,255,255,0.93);
  --card-border:   rgba(255,255,255,0.7);
  --card-shadow:   0 32px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.10);
  --inner-card-bg: rgba(248,249,246,0.7);
  --toast-bg:      rgba(255,255,255,0.96);

  --input-bg:      rgba(248,249,246,0.9);
  --input-border:  #c8cfc2;
  --input-focus:   #1e5c22;
  --input-text:    #0f1410;
  --input-ph:      #9aa094;

  --card-text:     #0f1410;
  --card-text2:    #374033;
  --card-muted:    #7a8474;
  --card-border-line: #dde0d8;

  --left-title:       #ffffff;
  --left-sub:         rgba(255,255,255,0.80);
  --left-feat-bg:     rgba(255,255,255,0.12);
  --left-feat-border: rgba(255,255,255,0.18);
  --left-feat-text:   #ffffff;
  --left-feat-sub:    rgba(255,255,255,0.72);
  --left-ico-bg:      rgba(255,255,255,0.18);
  --left-ico-col:     #ffffff;

  --img-overlay-left: linear-gradient(105deg,
    rgba(10,30,12,0.85) 0%, rgba(10,30,12,0.68) 38%,
    rgba(10,30,12,0.32) 60%, rgba(10,30,12,0.10) 100%);
  --img-overlay-vignette: radial-gradient(ellipse at 70% 50%,
    transparent 30%, rgba(0,0,0,0.18) 100%);

  --strength-weak:      #ef4444;
  --strength-fair:      #f59e0b;
  --strength-strong:    #22c55e;
  --strength-excellent: #16a34a;
}

/* ══ DARK ══ */
.aap.dark {
  --accent:        #2d8a31;
  --accent-hover:  #247026;
  --accent-light:  #3aaa3f;
  --accent-sub:    rgba(45,138,49,0.14);
  --accent-ring:   rgba(45,138,49,0.25);
  --err:           #e74c3c;
  --err-sub:       rgba(231,76,60,0.12);
  --err-ring:      rgba(231,76,60,0.22);
  --ok:            #27ae60;
  --ok-sub:        rgba(39,174,96,0.12);
  --ok-ring:       rgba(39,174,96,0.22);
  --amber:         #d97706;
  --amber-sub:     rgba(217,119,6,0.14);
  --amber-ring:    rgba(217,119,6,0.22);
  --blue:          #3b82f6;
  --blue-sub:      rgba(59,130,246,0.14);
  --blue-ring:     rgba(59,130,246,0.22);
  --purple:        #a78bfa;
  --purple-sub:    rgba(167,139,250,0.14);
  --purple-ring:   rgba(167,139,250,0.22);

  --card-bg:       rgba(14,18,15,0.88);
  --card-border:   rgba(255,255,255,0.08);
  --card-shadow:   0 32px 80px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.35);
  --inner-card-bg: rgba(255,255,255,0.04);
  --toast-bg:      rgba(14,18,15,0.96);

  --input-bg:      rgba(255,255,255,0.05);
  --input-border:  rgba(255,255,255,0.12);
  --input-focus:   #2d8a31;
  --input-text:    #e4e6e3;
  --input-ph:      #606860;

  --card-text:     #e4e6e3;
  --card-text2:    #a8b0a4;
  --card-muted:    #626862;
  --card-border-line: rgba(255,255,255,0.10);

  --left-title:       #ffffff;
  --left-sub:         rgba(255,255,255,0.72);
  --left-feat-bg:     rgba(255,255,255,0.07);
  --left-feat-border: rgba(255,255,255,0.12);
  --left-feat-text:   #ffffff;
  --left-feat-sub:    rgba(255,255,255,0.60);
  --left-ico-bg:      rgba(255,255,255,0.10);
  --left-ico-col:     #a8e6ac;

  --img-overlay-left: linear-gradient(105deg,
    rgba(5,12,6,0.92) 0%, rgba(5,12,6,0.78) 38%,
    rgba(5,12,6,0.42) 60%, rgba(5,12,6,0.16) 100%);
  --img-overlay-vignette: radial-gradient(ellipse at 70% 50%,
    transparent 20%, rgba(0,0,0,0.35) 100%);

  --strength-weak:      #f87171;
  --strength-fair:      #fbbf24;
  --strength-strong:    #4ade80;
  --strength-excellent: #22c55e;
}

/* ════ BASE ════ */
.aap *, .aap *::before, .aap *::after { box-sizing: border-box; margin: 0; padding: 0; }
.aap { font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; }

/* ════ HERO ════ */
.aap-hero {
  position: relative;
  min-height: calc(100vh - 64px);
  display: flex; align-items: stretch; overflow: hidden;
}
.aap-bg-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; object-position: center 35%; z-index: 0;
}
.aap-overlay-left    { position: absolute; inset: 0; background: var(--img-overlay-left);    z-index: 1; }
.aap-overlay-vignette{ position: absolute; inset: 0; background: var(--img-overlay-vignette); z-index: 2; }
.aap-inner {
  position: relative; z-index: 3; width: 100%;
  display: flex; align-items: center;
  padding: calc(var(--nav-h) + 20px) 5% 4rem; gap: 4rem;
  min-height: calc(100vh - var(--nav-h));
}

/* ════ LEFT PANEL ════ */
.aap-info {
  flex: 1; min-width: 0; display: flex; flex-direction: column;
  gap: 0; padding-right: 1rem;
}
.aap-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.30);
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.92);
  font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  margin-bottom: 1.5rem; backdrop-filter: blur(8px); align-self: flex-start;
}
.aap-headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.6rem, 4vw, 4rem); line-height: 1.05; font-weight: 600;
  color: var(--left-title); margin-bottom: 1.1rem;
  text-shadow: 0 2px 20px rgba(0,0,0,0.25);
}
.aap-headline em { font-style: italic; color: #7ddb82; display: block; }
.aap-subhead {
  font-size: 0.9rem; color: var(--left-sub); line-height: 1.8;
  margin-bottom: 2.4rem; max-width: 380px;
  text-shadow: 0 1px 8px rgba(0,0,0,0.30);
}

/* Feature cards */
.aap-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 2rem; }
.aap-feat {
  display: flex; align-items: center; gap: 13px;
  padding: 12px 14px; border-radius: 12px;
  border: 1px solid var(--left-feat-border);
  background: var(--left-feat-bg); backdrop-filter: blur(12px);
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
  cursor: default; max-width: 380px;
}
.aap-feat:hover { background: rgba(255,255,255,0.16); border-color: rgba(255,255,255,0.26); transform: translateX(4px); }
.aap-feat-icon {
  width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
  background: var(--left-ico-bg); color: var(--left-ico-col);
  display: flex; align-items: center; justify-content: center;
}
.aap-feat-body h4 { font-size: 0.82rem; font-weight: 600; color: var(--left-feat-text); margin-bottom: 2px; }
.aap-feat-body p  { font-size: 0.73rem; color: var(--left-feat-sub); line-height: 1.4; }

/* Process steps */
.aap-steps {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px; max-width: 380px; margin-bottom: 2rem;
}
.aap-step {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 11px 12px; border-radius: 10px;
  border: 1px solid var(--left-feat-border);
  background: var(--left-feat-bg); backdrop-filter: blur(10px);
}
.aap-step-num {
  font-family: 'DM Sans', sans-serif; font-size: 0.68rem; font-weight: 700;
  color: #7ddb82; flex-shrink: 0; font-variant-numeric: tabular-nums;
}
.aap-step-text { font-size: 0.71rem; color: var(--left-feat-sub); line-height: 1.4; }

/* Live feed */
.aap-live-wrap { max-width: 380px; }
.aap-live-label {
  display: flex; align-items: center; gap: 7px;
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase;
  color: rgba(255,255,255,0.60); margin-bottom: 10px;
}
.aap-live-dot {
  width: 5px; height: 5px; border-radius: 50%; background: #4ade80;
  animation: aap-pulse 1.6s infinite;
}
@keyframes aap-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
.aap-live-feed { display: flex; flex-direction: column; gap: 7px; }
.aap-live-item {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 12px; border-radius: 10px;
  border: 1px solid var(--left-feat-border); background: var(--left-feat-bg);
  backdrop-filter: blur(10px); transition: background 0.18s, transform 0.18s;
}
.aap-live-item:hover { background: rgba(255,255,255,0.14); transform: translateX(3px); }
.aap-live-ico {
  width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.aap-live-ico--tg { background: rgba(74,222,128,0.15);  color: #4ade80; }
.aap-live-ico--am { background: rgba(251,191,36,0.15);  color: #fbbf24; }
.aap-live-ico--tb { background: rgba(96,165,250,0.15);  color: #60a5fa; }
.aap-live-ico--pu { background: rgba(167,139,250,0.15); color: #a78bfa; }
.aap-live-title { font-size: 0.78rem; font-weight: 600; color: var(--left-feat-text); margin-bottom: 1px; }
.aap-live-sub   { font-size: 0.67rem; color: var(--left-feat-sub); }
.aap-live-time  { font-size: 0.65rem; color: rgba(255,255,255,0.45); white-space: nowrap; margin-left: auto; }

/* ════ RIGHT CARD ════ */
.aap-card-wrap {
  flex-shrink: 0; width: 100%; max-width: 480px;
  display: flex; align-items: center; justify-content: center;
}
.aap-card {
  width: 100%;
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 22px; box-shadow: var(--card-shadow);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  padding: 2.4rem 2.4rem 2rem;
  position: relative; overflow: hidden;
}
.aap-card::before {
  content: ''; position: absolute;
  top: 0; left: 12%; right: 12%; height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent-light), transparent);
  border-radius: 0 0 3px 3px;
}
.aap-card-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 3px;
}
.aap-card-eyebrow {
  font-size: 0.66rem; font-weight: 700; letter-spacing: 0.09em;
  text-transform: uppercase; color: var(--card-muted);
  display: flex; align-items: center; gap: 6px; margin-bottom: 3px;
}
.aap-card-h1  { font-size: 1.5rem; font-weight: 700; color: var(--card-text); margin-bottom: 3px; }
.aap-card-sub { font-size: 0.78rem; color: var(--card-muted); margin-bottom: 1.8rem; }

/* Account type badge */
.aap-type-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 999px;
  font-size: 0.68rem; font-weight: 700;
  border: 1px solid; white-space: nowrap; flex-shrink: 0;
}
.aap-type-badge--tg { color: var(--accent); background: var(--accent-sub); border-color: var(--accent-ring); }
.aap-type-badge--tb { color: var(--blue);   background: var(--blue-sub);   border-color: var(--blue-ring); }
.aap-type-badge--am { color: var(--amber);  background: var(--amber-sub);  border-color: var(--amber-ring); }
.aap-type-badge--pu { color: var(--purple); background: var(--purple-sub); border-color: var(--purple-ring); }

/* Section divider */
.aap-divider { display: flex; align-items: center; gap: 10px; margin: 1.2rem 0; }
.aap-divider-line { flex: 1; height: 1px; background: var(--card-border-line); }
.aap-divider-label {
  font-size: 0.65rem; font-weight: 700; letter-spacing: 0.09em;
  text-transform: uppercase; color: var(--card-muted); white-space: nowrap;
}

/* Fields */
.aap-form   { display: flex; flex-direction: column; gap: 0; }
.aap-field  { display: flex; flex-direction: column; gap: 5px; margin-bottom: 1rem; }
.aap-lbl    { font-size: 0.74rem; font-weight: 600; color: var(--card-text2); }
.aap-hint   { font-size: 0.68rem; color: var(--card-muted); }
.aap-iw     { position: relative; }
.aap-ico {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: var(--card-muted); pointer-events: none; line-height: 0;
}
.aap-ico-right {
  position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
  color: var(--card-muted); background: transparent; border: none;
  cursor: pointer; line-height: 0; padding: 2px; transition: color 0.15s;
}
.aap-ico-right:hover { color: var(--card-text); }
.aap-ok-ico {
  position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
  color: var(--ok); line-height: 0; pointer-events: none;
}

.aap-input {
  width: 100%; height: 44px;
  border: 1.5px solid var(--input-border); border-radius: 10px;
  background: var(--input-bg); color: var(--input-text);
  font-family: 'DM Sans', sans-serif; font-size: 0.84rem;
  padding: 0 38px 0 36px; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
}
.aap-input::placeholder { color: var(--input-ph); }
.aap-input:focus {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.aap-input.f-err { border-color: var(--err); box-shadow: 0 0 0 3px var(--err-ring); }
.aap-input.f-ok  { border-color: var(--ok); }
.aap-input.f-mono { font-family: 'Courier New', monospace; letter-spacing: 0.05em; }

.aap-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.aap-err-msg {
  font-size: 0.69rem; color: var(--err);
  display: flex; align-items: center; gap: 4px;
}

/* Strength meter */
.aap-strength { margin-top: -4px; margin-bottom: 1rem; }
.aap-strength-bars { display: flex; gap: 4px; margin-bottom: 5px; }
.aap-strength-bar {
  flex: 1; height: 4px; border-radius: 999px;
  background: var(--card-border-line); transition: background 0.3s;
}
.aap-strength-bar.w1 { background: var(--strength-weak); }
.aap-strength-bar.w2 { background: var(--strength-fair); }
.aap-strength-bar.w3 { background: var(--strength-strong); }
.aap-strength-bar.w4 { background: var(--strength-excellent); }
.aap-strength-label  {
  font-size: 0.68rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.aap-strength-label.w1 { color: var(--strength-weak); }
.aap-strength-label.w2 { color: var(--strength-fair); }
.aap-strength-label.w3 { color: var(--strength-strong); }
.aap-strength-label.w4 { color: var(--strength-excellent); }

/* Success banner */
.aap-success-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-radius: 10px;
  background: var(--ok-sub); border: 1px solid var(--ok-ring);
  color: var(--ok); font-size: 0.82rem; font-weight: 600;
  margin-bottom: 1rem;
}

/* Submit button */
.aap-submit-btn {
  width: 100%; height: 46px;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  background: var(--accent); color: #fff;
  border: none; border-radius: 10px;
  font-family: 'DM Sans', sans-serif; font-size: 0.92rem; font-weight: 700;
  cursor: pointer; margin-top: 0.3rem;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 16px var(--accent-ring);
}
.aap-submit-btn:hover:not(:disabled) {
  background: var(--accent-hover); transform: translateY(-1px);
  box-shadow: 0 8px 24px var(--accent-ring);
}
.aap-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Spinner */
.aap-spinner {
  display: inline-block; width: 15px; height: 15px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  animation: aap-spin 0.7s linear infinite;
}
@keyframes aap-spin { to { transform: rotate(360deg); } }

/* Card footer */
.aap-card-foot {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 1.5rem; padding-top: 1.2rem;
  border-top: 1px solid var(--card-border-line);
}
.aap-card-foot-info { font-size: 0.75rem; color: var(--card-muted); }
.aap-request-key-btn {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.78rem; font-weight: 600; color: var(--accent);
  background: transparent; border: 1px solid var(--accent-ring);
  border-radius: 8px; padding: 7px 13px;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: background 0.15s;
}
.aap-request-key-btn:hover { background: var(--accent-sub); }

/* ════ TOASTS — top-right, rAF progress bar (v2 logic + v1 theme) ════ */
.aap-toast-portal {
  position: fixed; top: 76px; right: 20px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 9999; pointer-events: none;
}
.aap-toast {
  pointer-events: all;
  min-width: 270px; max-width: 330px;
  border-radius: 12px; overflow: hidden;
  background: var(--toast-bg); border: 1px solid var(--card-border-line);
  box-shadow: 0 12px 40px rgba(0,0,0,0.22);
  backdrop-filter: blur(16px);
}
.aap-toast-shell {
  display: flex; align-items: center; gap: 10px; padding: 11px 13px;
}
.aap-toast-ic {
  width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.aap-toast--success .aap-toast-ic { background: var(--ok-sub);  color: var(--ok); }
.aap-toast--error   .aap-toast-ic { background: var(--err-sub); color: var(--err); }
.aap-toast-body { flex: 1; }
.aap-toast-ttl { display: block; font-size: 0.78rem; font-weight: 700; color: var(--card-text); }
.aap-toast-msg { display: block; font-size: 0.68rem; color: var(--card-muted); }
.aap-toast-close {
  background: none; border: none; color: var(--card-muted);
  cursor: pointer; line-height: 1; padding: 2px; display: flex; align-items: center;
  transition: color 0.15s;
}
.aap-toast-close:hover { color: var(--card-text); }
.aap-toast-bar {
  height: 3px; transform-origin: left;
  transition: transform 0.05s linear;
}
.aap-toast--success .aap-toast-bar { background: var(--ok); }
.aap-toast--error   .aap-toast-bar { background: var(--err); }

/* ════ RESPONSIVE ════ */
@media (max-width: 900px) {
  .aap-inner { flex-direction: column; align-items: flex-start; padding: 2.5rem 5% 3rem; gap: 2.5rem; }
  .aap-info  { padding-right: 0; }
  .aap-card-wrap { max-width: 100%; }
  .aap-bg-img    { object-position: center 20%; }
}
@media (max-width: 540px) {
  .aap-card   { padding: 1.8rem 1.4rem 1.5rem; }
  .aap-headline { font-size: 2.2rem; }
  .aap-inner  { padding: 2rem 4% 2.5rem; gap: 2rem; }
  .aap-g2     { grid-template-columns: 1fr; }
  .aap-steps  { grid-template-columns: 1fr; }
  .aap-toast-portal { right: 10px; left: 10px; }
  .aap-toast  { min-width: unset; max-width: 100%; }
}
`;

/* ─────────────────────────────────────────
   Field component  (v1 layout + v2 f-ok state)
───────────────────────────────────────── */
function Field({
  label, hint, Icon, type = "text", placeholder,
  value, onChange, onBlur, hasErr, isOk, errMsg,
  className = "", maxLength, inputMode, children,
}) {
  return (
    <div className="aap-field">
      <label className="aap-lbl">{label}</label>
      <div className="aap-iw">
        {Icon && <span className="aap-ico"><Icon size={14} /></span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={maxLength}
          inputMode={inputMode}
          className={`aap-input${!Icon ? " no-ico" : ""} ${hasErr ? "f-err" : isOk ? "f-ok" : ""} ${className}`}
        />
        {/* right-side slot: eye toggle OR ok icon */}
        {children}
        {!children && isOk && (
          <span className="aap-ok-ico"><CheckCircle2 size={13} /></span>
        )}
      </div>
      {hasErr && errMsg
        ? <span className="aap-err-msg"><AlertCircle size={11} /> {errMsg}</span>
        : hint
          ? <span className="aap-hint">{hint}</span>
          : null
      }
    </div>
  );
}

/* ─────────────────────────────────────────
   Password field  (eye toggle blocks ok icon)
───────────────────────────────────────── */
function PwField({ label, id: fieldId, value, onChange, onBlur, show, onToggle, hasErr, isOk, errMsg }) {
  return (
    <div className="aap-field">
      <label className="aap-lbl">{label}</label>
      <div className="aap-iw">
        <span className="aap-ico"><Shield size={14} /></span>
        <input
          id={fieldId}
          type={show ? "text" : "password"}
          placeholder="Minimum 8 characters"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`aap-input ${hasErr ? "f-err" : isOk ? "f-ok" : ""}`}
        />
        <button type="button" className="aap-ico-right" onClick={onToggle} aria-label="Toggle password visibility">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hasErr && errMsg && <span className="aap-err-msg"><AlertCircle size={11} /> {errMsg}</span>}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function ActivateAccountPage() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const dark          = useDark();
  const toast         = useToast();

  /* ── form state ── */
  const [id,      setId]      = useState(searchParams.get("accountId") || "");
  const [ak,      setAk]      = useState(searchParams.get("key") || "");
  const [pw,      setPw]      = useState("");
  const [cpw,     setCpw]     = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [touched, setTouched] = useState({});

  const touch = (f) => setTouched(p => ({ ...p, [f]: true }));

  const detectedType = detectAccountType(id);

  /* ── derived errors ── */
  const idErr  = validate.id(id);
  const akErr  = validate.ak(ak);
  const pwErr  = validate.pw(pw);
  const cpwErr = validate.cpw(cpw, pw);

  /* ── password strength ── */
  const strengthScore = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Strong", "Excellent"][strengthScore];
  const strengthCls   = ["", "w1",   "w2",   "w3",     "w4"][strengthScore];

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ id: true, ak: true, pw: true, cpw: true });

    if (idErr)  { toast.error("Invalid Account ID",      idErr);  return; }
    if (akErr)  { toast.error("Activation Key Missing",  akErr);  return; }
    if (pwErr)  { toast.error("Password Issue",          pwErr);  return; }
    if (cpwErr) { toast.error("Passwords Don't Match",   cpwErr); return; }

    const type  = detectAccountType(id);
    const route = buildRoute(type.role, id, ak, pw, cpw);
    if (!route) {
      toast.error("System Error", "Could not determine the activation endpoint.");
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
      toast.success("Account Activated", "Your account is now active. Redirecting to login…");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const e = err.message?.toLowerCase() ?? "";
      let msg = "Activation failed. Please verify your credentials.";
      if      (e.includes("activation")) msg = "Invalid or expired activation key.";
      else if (e.includes("citizen"))    msg = "Citizen account not found.";
      else if (e.includes("worker"))     msg = "Worker account not found.";
      else if (e.includes("vao"))        msg = "Village Admin account not found.";
      else if (e.includes("mao"))        msg = "Mandal Admin account not found.";
      toast.error("Activation Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <Navbar />

      <div className={`aap${dark ? " dark" : ""}`}>
        <div className="aap-hero">
          <img src={villageImg} alt="" aria-hidden="true" className="aap-bg-img" />
          <div className="aap-overlay-left" />
          <div className="aap-overlay-vignette" />

          <div className="aap-inner">

            {/* ══ LEFT PANEL ══ */}
            <motion.aside
              className="aap-info"
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="aap-badge">
                <KeyRound size={11} /> Account Activation Chamber
              </div>

              <h1 className="aap-headline">
                Activate Your<em>Account.</em>
              </h1>

              <p className="aap-subhead">
                Your account was approved and sealed by the district council.
                Present your activation key and set your sovereign password
                to claim full access to the governance platform.
              </p>

              {/* Feature cards */}
              <div className="aap-features">
                {features.map((ft, i) => (
                  <motion.div
                    key={i} className="aap-feat"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  >
                    <div className="aap-feat-icon"><ft.Icon size={17} /></div>
                    <div className="aap-feat-body"><h4>{ft.title}</h4><p>{ft.text}</p></div>
                  </motion.div>
                ))}
              </div>

              {/* Steps */}
              <div className="aap-steps">
                {STEPS.map((s, i) => (
                  <motion.div
                    key={i} className="aap-step"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.07 }}
                  >
                    <span className="aap-step-num">{s.num}</span>
                    <span className="aap-step-text">{s.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Live feed */}
              <motion.div
                className="aap-live-wrap"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              >
                <div className="aap-live-label">
                  <span className="aap-live-dot" /> Live Activations
                </div>
                <div className="aap-live-feed">
                  {LIVE_FEED.map((item, i) => (
                    <div key={i} className="aap-live-item">
                      <div className={`aap-live-ico aap-live-ico--${item.variant}`}>
                        <item.Icon size={17} />
                      </div>
                      <div>
                        <div className="aap-live-title">{item.title}</div>
                        <div className="aap-live-sub">{item.sub}</div>
                      </div>
                      <div className="aap-live-time">{item.time}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.aside>

            {/* ══ RIGHT CARD ══ */}
            <div className="aap-card-wrap">
              <motion.div
                className="aap-card"
                initial={{ opacity: 0, y: 32, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Card header */}
                <div className="aap-card-head">
                  <div>
                    <div className="aap-card-eyebrow">
                      <KeyRound size={12} /> Activation
                    </div>
                    <div className="aap-card-h1">Claim Your Identity</div>
                  </div>
                  <AnimatePresence>
                    {detectedType && (
                      <motion.span
                        className={`aap-type-badge aap-type-badge--${detectedType.variant}`}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                      >
                        <detectedType.Icon size={11} /> {detectedType.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="aap-card-sub">Complete all fields below to unseal your account.</div>

                <form className="aap-form" onSubmit={handleSubmit} noValidate>

                  {/* Account ID */}
                  <Field
                    label="Account ID"
                    Icon={User}
                    placeholder="e.g. RLOC-XXXX-XXXX"
                    value={id}
                    onChange={e => setId(e.target.value.toUpperCase())}
                    onBlur={() => touch("id")}
                    hasErr={!!(touched.id && idErr)}
                    isOk={!!(touched.id && !idErr && id)}
                    errMsg={idErr}
                  />

                  {/* Activation Key */}
                  <Field
                    label="Activation Key"
                    Icon={Key}
                    placeholder="Key provided by your administrator"
                    value={ak}
                    onChange={e => setAk(e.target.value)}
                    onBlur={() => touch("ak")}
                    hasErr={!!(touched.ak && akErr)}
                    isOk={!!(touched.ak && !akErr && ak)}
                    errMsg={akErr}
                    hint="Check your registered phone or email for this key."
                    className="f-mono"
                  />

                  <div className="aap-divider">
                    <div className="aap-divider-line" />
                    <span className="aap-divider-label">Set Password</span>
                    <div className="aap-divider-line" />
                  </div>

                  {/* Password row */}
                  <div className="aap-g2">
                    <PwField
                      label="Password"
                      fieldId="pw"
                      value={pw}
                      onChange={e => setPw(e.target.value)}
                      onBlur={() => touch("pw")}
                      show={showPw}
                      onToggle={() => setShowPw(p => !p)}
                      hasErr={!!(touched.pw && pwErr)}
                      isOk={!!(touched.pw && !pwErr && pw)}
                      errMsg={pwErr}
                    />
                    <PwField
                      label="Confirm Password"
                      fieldId="cpw"
                      value={cpw}
                      onChange={e => setCpw(e.target.value)}
                      onBlur={() => touch("cpw")}
                      show={showCpw}
                      onToggle={() => setShowCpw(p => !p)}
                      hasErr={!!(touched.cpw && cpwErr)}
                      isOk={!!(touched.cpw && !cpwErr && cpw)}
                      errMsg={cpwErr}
                    />
                  </div>

                  {/* Strength meter */}
                  <AnimatePresence>
                    {pw.length > 0 && (
                      <motion.div
                        className="aap-strength"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="aap-strength-bars">
                          {[1, 2, 3, 4].map(n => (
                            <div
                              key={n}
                              className={`aap-strength-bar${n <= strengthScore ? ` ${strengthCls}` : ""}`}
                            />
                          ))}
                        </div>
                        <div className={`aap-strength-label ${strengthCls}`}>{strengthLabel} Password</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Success banner */}
                  <AnimatePresence>
                    {success && (
                      <motion.div
                        className="aap-success-banner"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <CheckCircle2 size={18} />
                        Account activated — redirecting to login…
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    className="aap-submit-btn"
                    disabled={loading || success}
                  >
                    {loading
                      ? <><span className="aap-spinner" /> Activating Account…</>
                      : <><Shield size={16} /> Activate Account <ArrowRight size={15} /></>
                    }
                  </button>
                </form>

                <div className="aap-card-foot">
                  <span className="aap-card-foot-info">No activation key?</span>
                  <button
                    className="aap-request-key-btn"
                    onClick={() => navigate(`/activation/request?accountId=${id}`)}
                  >
                    Request Key <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        <Footer />
      </div>

      {/* ══ TOAST PORTAL — top-right, rAF drain (v2 logic) ══ */}
      <div className="aap-toast-portal" role="region" aria-label="Notifications" aria-live="polite">
        <AnimatePresence>
          {toast.toasts.map(t => (
            <ToastItem key={t.id} t={t} onDone={toast.remove} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}