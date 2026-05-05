import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, FileText, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
  MapPin, ShieldCheck, Users, BarChart3, Lock, Phone, Mail,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import villageImg from "../assets/village.png";

const API = "https://ruralops-platform-production.up.railway.app";

/* ─── Villages ─── */
const villages = [
  { id: "ALM-5889", name: "Alamanda" },
  { id: "ALKP-9828", name: "Alamandakothapalle" },
  { id: "BTP-4500", name: "Bethapudi" },
  { id: "BDP-6154", name: "Boddapadu" },
  { id: "BKT-9041", name: "Boilakintada" },
  { id: "CNP-4834", name: "Chainulapalem" },
  { id: "CGV-9124", name: "Chinagangavaram" },
  { id: "CNDP-8757", name: "Chinanandipalle" },
  { id: "CSP-9511", name: "Chinasompuram" },
  { id: "CTP-1278", name: "Chintalapudi" },
  { id: "DVP-1335", name: "Devarapalle" },
  { id: "GRS-6975", name: "Garisingi" },
  { id: "JDP-9896", name: "Juttadapalem" },
  { id: "KGT-9618", name: "Kaligotla" },
  { id: "KPR-4633", name: "Kasipathirajupuram" },
  { id: "KSP-3037", name: "Kasipuram" },
  { id: "KDB-6677", name: "Kondakodabu" },
  { id: "KTP-6085", name: "Kothapenta" },
  { id: "LMP-5650", name: "Lovamukundapuram" },
  { id: "MDP-9975", name: "Mamidipalle" },
  { id: "MRP-8869", name: "Marepalle" },
  { id: "MKP-8644", name: "Mulakalapalle" },
  { id: "MSP-9051", name: "Mushidipalle" },
  { id: "NGP-8186", name: "Nagayyapeta" },
  { id: "NGGN-4888", name: "Narasimha Gajapathinagaram" },
  { id: "PKD-4575", name: "Pallapukodabu" },
  { id: "PNP-2254", name: "Pedanandipalle Agraharam" },
  { id: "RWD-3591", name: "Raiwada" },
  { id: "SBP-6101", name: "Sambuvanipalem" },
  { id: "SMD-9892", name: "Sammeda" },
  { id: "STP-6311", name: "Seetampeta" },
  { id: "SRCP-8818", name: "Sivaramachainulapalem" },
  { id: "TMB-7921", name: "Tamarabba" },
  { id: "TRV-4709", name: "Taruva" },
  { id: "TNP-9280", name: "Tenugupudi" },
  { id: "THM-6757", name: "Thimiram" },
  { id: "VKP-4189", name: "Vakapalle" },
  { id: "VLB-4973", name: "Valabu" },
  { id: "VCL-9779", name: "Vechalam" },
  { id: "VRP-8413", name: "Venkatarajupuram" },
];

/* ─── Validation ─── */
const validators = {
  fullName: v => v.trim().length < 2 ? "Full name must be at least 2 characters." : "",
  fatherName: v => v.trim().length < 2 ? "Father's name must be at least 2 characters." : "",
  aadhaarNumber: v => !/^\d{12}$/.test(v) ? "Aadhaar must be exactly 12 digits." : "",
  rationCardNumber: v => v.trim().length < 3 ? "Enter a valid ration card number." : "",
  phoneNumber: v => !/^[6-9]\d{9}$/.test(v) ? "Phone must be 10 digits starting with 6–9." : "",
  email: v => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email address." : "",
  villageId: v => !v ? "Please select your village." : "",
};

const STEPS = [{ id: 1, label: "Identity" }, { id: 2, label: "Documents" }, { id: 3, label: "Confirm" }];
const STEP_FIELDS = { 1: ["fullName", "fatherName", "phoneNumber", "email"], 2: ["aadhaarNumber", "rationCardNumber"], 3: ["villageId"] };
const EMPTY_FORM = { fullName: "", fatherName: "", aadhaarNumber: "", rationCardNumber: "", phoneNumber: "", email: "", villageId: "" };

const features = [
  { icon: ShieldCheck, title: "Identity Verified", text: "Securely verified by your Village Administrative Officer." },
  { icon: Users, title: "Inclusive Governance", text: "Access all government welfare schemes and programmes." },
  { icon: BarChart3, title: "Transparent Distribution", text: "Auditable welfare records with full accountability." },
];

/* ─── Theme — reads dark class from <html>, same pattern as rest of app ─── */
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

/* ─── Toast system (same logic as v1) ─── */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((type, ttl, sub) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, type, ttl, sub }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3800);
  }, []);
  const dismiss = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return {
    toasts, dismiss,
    success: (ttl, sub) => add("success", ttl, sub),
    error: (ttl, sub) => add("error", ttl, sub),
    info: (ttl, sub) => add("info", ttl, sub),
  };
}

/* ══════════════════════════════════════════
   VILLAGE CUSTOM SELECT
   Native <select> ignores CSS in dark mode
   (OS renders the option list). Custom dropdown
   solves this completely.
══════════════════════════════════════════ */
function VillageSelect({ value, onChange, onBlur, hasErr }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = React.useRef(null);
  const searchRef = React.useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { if (open && searchRef.current) searchRef.current.focus(); }, [open]);

  const filtered = villages.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
  const selected = villages.find(v => v.id === value);

  const handleSelect = v => {
    onChange({ target: { name: "villageId", value: v.id } });
    onBlur({ target: { name: "villageId", value: v.id } });
    setOpen(false); setSearch("");
  };

  return (
    <div className="vsel-wrap" ref={ref}>
      <button
        type="button"
        className={`vsel-trigger crp-input${hasErr ? " f-err" : value ? " f-ok" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox" aria-expanded={open}
      >
        <span className="crp-ico" style={{ pointerEvents: "none" }}><MapPin size={14} /></span>
        <span className={`vsel-val${!selected ? " vsel-ph" : ""}`}>
          {selected ? selected.name : "— Select your village —"}
        </span>
        <span className={`vsel-chevron${open ? " open" : ""}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="vsel-dropdown" role="listbox">
          <div className="vsel-search-wrap">
            <svg className="vsel-search-ico" width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8.5 8.5l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input ref={searchRef} className="vsel-search" placeholder="Search village…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="vsel-list">
            {filtered.length === 0
              ? <div className="vsel-empty">No villages found</div>
              : filtered.map(v => (
                <div key={v.id}
                  className={`vsel-option${v.id === value ? " selected" : ""}`}
                  role="option" aria-selected={v.id === value}
                  onMouseDown={() => handleSelect(v)}
                >
                  {v.id === value && <CheckCircle2 size={11} className="vsel-check" />}
                  {v.name}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   FIELD — MUST be top-level (outside page
   component) to prevent React unmounting
   inputs on every keystroke (focus loss bug).
══════════════════════════════════════════ */
function Field({ name, label, type = "text", placeholder, maxLength, inputMode, Icon, form, errors, touched, onChange, onBlur }) {
  const hasErr = errors[name] && touched[name];
  const isValid = touched[name] && !errors[name] && form[name];
  return (
    <div className="crp-field">
      <label className="crp-lbl">{label}</label>
      <div className="crp-iw">
        {Icon && <span className="crp-ico"><Icon size={14} /></span>}
        <input
          name={name} type={type} placeholder={placeholder}
          value={form[name]} onChange={onChange} onBlur={onBlur}
          maxLength={maxLength} inputMode={inputMode}
          className={`crp-input${!Icon ? " no-ico" : ""} ${hasErr ? "f-err" : isValid ? "f-ok" : ""}`}
        />
        {isValid && <span className="crp-ok-ico"><CheckCircle2 size={13} /></span>}
      </div>
      {hasErr && <span className="crp-err-msg"><AlertCircle size={11} />{errors[name]}</span>}
    </div>
  );
}

/* ══════════════════════════════════════════
   STYLES  (all inline — no external CSS file)
══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:ital,wght@0,600;1,500&display=swap');

/* ══ LIGHT tokens ══ */
.crp {
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

  --img-overlay-left: linear-gradient(105deg,
    rgba(10,30,12,0.82) 0%, rgba(10,30,12,0.65) 38%,
    rgba(10,30,12,0.30) 60%, rgba(10,30,12,0.08) 100%);
  --img-overlay-vignette: radial-gradient(ellipse at 70% 50%,
    transparent 30%, rgba(0,0,0,0.18) 100%);

  --toast-bg: rgba(255,255,255,0.96);
}

/* ══ DARK tokens ══ */
.crp.dark {
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

  --img-overlay-left: linear-gradient(105deg,
    rgba(5,12,6,0.92) 0%, rgba(5,12,6,0.78) 38%,
    rgba(5,12,6,0.40) 60%, rgba(5,12,6,0.15) 100%);
  --img-overlay-vignette: radial-gradient(ellipse at 70% 50%,
    transparent 20%, rgba(0,0,0,0.35) 100%);

  --toast-bg: rgba(14,18,15,0.96);
}

/* ════ RESET ════ */
.crp *, .crp *::before, .crp *::after { box-sizing: border-box; margin: 0; padding: 0; }
.crp { font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; }

/* ════ HERO ════ */
.crp-hero {
  position: relative;
  min-height: calc(100vh - 64px);
  display: flex; align-items: stretch; overflow: hidden;
}
.crp-bg-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; object-position: center 35%; z-index: 0;
}
.crp-overlay-left   { position: absolute; inset: 0; background: var(--img-overlay-left);    z-index: 1; }
.crp-overlay-vignette{ position: absolute; inset: 0; background: var(--img-overlay-vignette); z-index: 2; }

.crp-inner {
  position: relative; z-index: 3; width: 100%;
  display: flex; align-items: center;
  padding: 110px 5% 4rem; gap: 4rem;
  min-height: calc(100vh - 72px);
}

/* ════ LEFT ════ */
.crp-info { flex: 1; min-width: 0; display: flex; flex-direction: column; padding-right: 1rem; }

.crp-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.30);
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.92);
  font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  margin-bottom: 1.5rem; backdrop-filter: blur(8px); align-self: flex-start;
}
.crp-badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #7ddb82; box-shadow: 0 0 6px #7ddb82;
  animation: crp-pulse 2s infinite;
}
@keyframes crp-pulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:0.6; transform:scale(0.85); }
}

.crp-headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.6rem, 4vw, 4rem);
  line-height: 1.05; font-weight: 600;
  color: var(--left-title);
  margin-bottom: 1.1rem;
  text-shadow: 0 2px 20px rgba(0,0,0,0.25);
}
.crp-headline em { font-style: italic; color: #7ddb82; display: block; }

.crp-subhead {
  font-size: 0.9rem; color: var(--left-sub); line-height: 1.8;
  margin-bottom: 2.4rem; max-width: 380px;
  text-shadow: 0 1px 8px rgba(0,0,0,0.30);
}

.crp-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 2.2rem; }
.crp-feat {
  display: flex; align-items: center; gap: 13px;
  padding: 12px 14px; border-radius: 12px;
  border: 1px solid var(--left-feat-border);
  background: var(--left-feat-bg); backdrop-filter: blur(12px);
  transition: background 0.2s, transform 0.2s;
  cursor: default; max-width: 380px;
}
.crp-feat:hover { background: rgba(255,255,255,0.16); transform: translateX(4px); }
.crp-feat-icon {
  width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
  background: var(--left-ico-bg); color: var(--left-ico-col);
  display: flex; align-items: center; justify-content: center;
}
.crp-feat-body h4 { font-size: 0.82rem; font-weight: 600; color: var(--left-feat-text); margin-bottom: 2px; }
.crp-feat-body p  { font-size: 0.73rem; color: var(--left-feat-sub); line-height: 1.4; }

.crp-safety {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-radius: 10px;
  border: 1px solid var(--left-feat-border); background: var(--left-feat-bg);
  backdrop-filter: blur(12px); max-width: 380px;
}
.crp-safety-ico { color: #7ddb82; flex-shrink: 0; }
.crp-safety h5 { font-size: 0.78rem; font-weight: 600; color: var(--left-feat-text); margin-bottom: 1px; }
.crp-safety p  { font-size: 0.69rem; color: var(--left-feat-sub); }

/* ════ RIGHT — Glass card ════ */
.crp-card-wrap {
  flex-shrink: 0; width: 100%; max-width: 460px;
  display: flex; align-items: center; justify-content: center;
}
.crp-card {
  width: 100%;
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 22px; box-shadow: var(--card-shadow);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  padding: 2.4rem 2.4rem 2rem;
  position: relative; overflow: hidden;
}
.crp-card::before {
  content: ''; position: absolute; top: 0; left: 12%; right: 12%; height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent-light), transparent);
  border-radius: 0 0 3px 3px;
}

/* ── Progress bar ── */
.crp-progress-track {
  position: absolute; top: 3px; left: 0; right: 0; height: 3px;
  background: var(--card-line); overflow: hidden;
}
.crp-progress-fill {
  height: 100%; background: var(--accent-light);
  transition: width 0.5s cubic-bezier(0.16,1,0.3,1);
  border-radius: 0 2px 2px 0;
}

.crp-card-h1  { font-size: 1.5rem; font-weight: 700; color: var(--card-text); margin-bottom: 3px; }
.crp-card-sub { font-size: 0.78rem; color: var(--card-muted); margin-bottom: 1.8rem; }

/* ── Step indicator ── */
.crp-steps { display: flex; align-items: flex-start; margin-bottom: 1.8rem; }
.crp-step-item {
  display: flex; flex-direction: column; align-items: center;
  flex: 1; position: relative;
}
.crp-step-item:not(:last-child)::after {
  content: ''; position: absolute; top: 13px; left: 50%; right: -50%;
  height: 2px; background: var(--card-line); transition: background 0.35s; z-index: 0;
}
.crp-step-item.s-done:not(:last-child)::after { background: var(--accent); }

.crp-step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.76rem; font-weight: 700;
  border: 2px solid var(--card-line); background: transparent; color: var(--card-muted);
  position: relative; z-index: 1; transition: all 0.3s;
}
.crp-step-dot.s-active {
  border-color: var(--accent); color: var(--accent);
  background: var(--accent-sub); box-shadow: 0 0 0 4px var(--accent-ring);
}
.crp-step-dot.s-done { border-color: var(--accent); background: var(--accent); color: #fff; }

.crp-step-lbl {
  font-size: 0.63rem; font-weight: 500; color: var(--card-muted);
  margin-top: 6px; text-align: center; line-height: 1.3;
}
.crp-step-lbl.s-active { color: var(--accent); font-weight: 600; }

/* ── Section heading ── */
.crp-sec {
  font-size: 0.82rem; font-weight: 700; color: var(--card-text);
  padding-bottom: 10px; border-bottom: 1px solid var(--card-line); margin-bottom: 1.1rem;
}

/* ── Fields ── */
.crp-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.crp-field { display: flex; flex-direction: column; gap: 5px; }
.crp-lbl   { font-size: 0.74rem; font-weight: 600; color: var(--card-text2); }
.crp-iw    { position: relative; }
.crp-ico {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: var(--card-muted); pointer-events: none; line-height: 0;
}
.crp-input {
  width: 100%; height: 42px;
  border: 1.5px solid var(--input-border); border-radius: 9px;
  background: var(--input-bg); color: var(--input-text);
  font-family: 'DM Sans', sans-serif; font-size: 0.84rem;
  padding: 0 36px 0 35px; outline: none; appearance: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.crp-input::placeholder { color: var(--input-ph); }
.crp-input.no-ico { padding-left: 13px; }
.crp-input:focus  { border-color: var(--input-focus); box-shadow: 0 0 0 3px var(--accent-ring); }
.crp-input.f-err  { border-color: var(--err); }
.crp-input.f-ok   { border-color: var(--ok);  }

.crp-ok-ico {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  color: var(--ok); line-height: 0;
}
.crp-err-msg {
  font-size: 0.69rem; color: var(--err);
  display: flex; align-items: center; gap: 4px; margin-top: 2px;
}

/* ── Secure notice ── */
.crp-secure {
  display: flex; align-items: flex-start; gap: 11px;
  padding: 12px 14px; border-radius: 10px;
  border: 1px solid var(--accent); background: var(--accent-sub); margin-top: 0.3rem;
}
.crp-secure-ico { color: var(--accent); flex-shrink: 0; margin-top: 1px; }
.crp-secure h5 { font-size: 0.77rem; font-weight: 700; color: var(--accent); margin-bottom: 2px; }
.crp-secure p  { font-size: 0.70rem; color: var(--card-text2); line-height: 1.4; }

/* ── Summary box ── */
.crp-summary {
  border-radius: 11px; border: 1px solid var(--card-line);
  background: var(--accent-sub); padding: 14px; margin-top: 0.4rem;
}
.crp-sum-hd  { font-size: 0.78rem; font-weight: 700; color: var(--card-text); margin-bottom: 9px; display: flex; align-items: center; gap: 6px; }
.crp-sum-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.79rem; }
.crp-sum-k   { color: var(--card-muted); }
.crp-sum-v   { font-weight: 600; color: var(--card-text); }
.crp-sum-div { border: none; border-top: 1px solid var(--card-line); margin: 5px 0; }

/* ── Footer nav ── */
.crp-foot {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 1.5rem; padding-top: 1.2rem; border-top: 1px solid var(--card-line);
}
.crp-btn-back {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 18px; border-radius: 9px;
  font-size: 0.82rem; font-weight: 600;
  border: 1.5px solid var(--card-line); background: transparent; color: var(--card-text2);
  cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
}
.crp-btn-back:hover { border-color: var(--card-text2); color: var(--card-text); }

.crp-btn-next {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 26px; border-radius: 9px;
  font-size: 0.88rem; font-weight: 700; border: none;
  background: var(--accent); color: #fff;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 16px var(--accent-ring);
}
.crp-btn-next:hover:not(:disabled) {
  background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 8px 24px var(--accent-ring);
}
.crp-btn-next:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

.crp-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.30); border-top-color: #fff;
  animation: crp-spin 0.7s linear infinite;
}
@keyframes crp-spin { to { transform: rotate(360deg); } }

/* ════ VILLAGE CUSTOM SELECT ════ */
.vsel-wrap { position: relative; width: 100%; }
.vsel-trigger {
  width: 100%; height: 42px;
  display: flex; align-items: center;
  cursor: pointer; text-align: left;
}
.vsel-val { flex: 1; font-size: 0.84rem; color: var(--input-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vsel-ph  { color: var(--input-ph); }
.vsel-chevron {
  position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
  color: var(--card-muted); transition: transform 0.2s; line-height: 0;
}
.vsel-chevron.open { transform: translateY(-50%) rotate(180deg); }

.vsel-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 999;
  background: var(--card-bg); border: 1.5px solid var(--input-border); border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.14);
  backdrop-filter: blur(20px) saturate(1.4); overflow: hidden;
}
.vsel-search-wrap {
  display: flex; align-items: center; gap: 8px; padding: 9px 12px;
  border-bottom: 1px solid var(--card-line);
}
.vsel-search-ico { color: var(--card-muted); flex-shrink: 0; }
.vsel-search {
  flex: 1; background: transparent; border: none; outline: none;
  font-family: 'DM Sans', sans-serif; font-size: 0.80rem; color: var(--input-text);
}
.vsel-search::placeholder { color: var(--input-ph); }
.vsel-list {
  max-height: 200px; overflow-y: auto; padding: 5px;
  scrollbar-width: thin; scrollbar-color: var(--card-line) transparent;
}
.vsel-list::-webkit-scrollbar { width: 4px; }
.vsel-list::-webkit-scrollbar-thumb { background: var(--card-line); border-radius: 4px; }
.vsel-option {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 10px; border-radius: 7px;
  font-size: 0.81rem; color: var(--card-text);
  cursor: pointer; transition: background 0.12s, color 0.12s; user-select: none;
}
.vsel-option:hover   { background: var(--accent-sub); color: var(--accent); }
.vsel-option.selected{ background: var(--accent-sub); color: var(--accent); font-weight: 600; }
.vsel-check { color: var(--accent); flex-shrink: 0; }
.vsel-empty { padding: 12px 10px; font-size: 0.78rem; color: var(--card-muted); text-align: center; }

/* ════ TOASTS ════ */
.crp-toasts {
  position: fixed; top: 76px; right: 20px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 9999; pointer-events: none;
}
.crp-toast {
  pointer-events: all;
  min-width: 270px; max-width: 330px;
  border-radius: 12px; overflow: hidden;
  background: var(--toast-bg); border: 1px solid var(--card-line);
  box-shadow: 0 12px 40px rgba(0,0,0,0.22);
  backdrop-filter: blur(16px);
}
.crp-toast-shell { display: flex; align-items: center; gap: 10px; padding: 11px 13px; }
.crp-toast-ic {
  width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.crp-toast--success .crp-toast-ic { background: rgba(26,122,58,0.15); color: var(--ok);    }
.crp-toast--error   .crp-toast-ic { background: rgba(192,57,43,0.15);  color: var(--err);   }
.crp-toast--info    .crp-toast-ic { background: rgba(59,130,246,0.15); color: #3b82f6;      }
.crp-toast-body { flex: 1; }
.crp-toast-ttl { display: block; font-size: 0.78rem; font-weight: 700; color: var(--card-text); }
.crp-toast-msg { display: block; font-size: 0.68rem; color: var(--card-muted); }
.crp-toast-close {
  background: none; border: none; color: var(--card-muted);
  cursor: pointer; font-size: 1rem; padding: 0; line-height: 1;
}
.crp-toast-bar {
  height: 3px; animation: crp-tbar 3.8s linear forwards;
}
.crp-toast--success .crp-toast-bar { background: var(--ok);    }
.crp-toast--error   .crp-toast-bar { background: var(--err);   }
.crp-toast--info    .crp-toast-bar { background: #3b82f6;      }
@keyframes crp-tbar { from { width: 100%; } to { width: 0; } }

/* ════ PAGE FOOTER ════ */
.crp-page-footer {
  background: var(--card-bg); border-top: 1px solid var(--card-line);
  padding: 1.4rem 5%;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
.crp-footer-brand { display: flex; flex-direction: column; }
.crp-footer-brand strong { font-size: 0.82rem; color: var(--card-text); }
.crp-footer-brand span   { font-size: 0.70rem; color: var(--card-muted); }
.crp-footer-copy { font-size: 0.70rem; color: var(--card-muted); }
.crp-footer-nav  { display: flex; gap: 16px; }
.crp-footer-nav a {
  font-size: 0.72rem; color: var(--card-muted); text-decoration: none;
  transition: color 0.15s;
}
.crp-footer-nav a:hover { color: var(--accent); }

/* ════ RESPONSIVE ════ */
@media (max-width: 900px) {
  .crp-inner {
    flex-direction: column; align-items: flex-start;
    padding: 2.5rem 5% 3rem; gap: 2.5rem;
    min-height: calc(100vh - 64px);
  }
  .crp-info      { padding-right: 0; }
  .crp-card-wrap { max-width: 100%; }
  .crp-hero      { min-height: auto; }
  .crp-bg-img    { object-position: center 20%; }
}
@media (max-width: 540px) {
  .crp-g2       { grid-template-columns: 1fr; }
  .crp-card     { padding: 1.8rem 1.4rem 1.5rem; }
  .crp-headline { font-size: 2.2rem; }
  .crp-inner    { padding: 2rem 4% 2.5rem; gap: 2rem; }
}
`;

/* ══════════════════════════════════════════
   PAGE COMPONENT
══════════════════════════════════════════ */
export default function CitizenRegistrationPage() {
  const dark = useDark();
  const toast = useToasts();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const validate = (name, value) => validators[name]?.(value) ?? "";
  const validateStep = s => {
    const errs = {};
    STEP_FIELDS[s].forEach(f => { const e = validate(f, form[f]); if (e) errs[f] = e; });
    return errs;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (touched[name]) setErrors(p => ({ ...p, [name]: validate(name, value) }));
  };
  const handleBlur = e => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    setErrors(p => ({ ...p, [name]: validate(name, value) }));
  };
  const handleNext = () => {
    const errs = validateStep(step);
    setTouched(p => ({ ...p, ...Object.fromEntries(STEP_FIELDS[step].map(f => [f, true])) }));
    setErrors(p => ({ ...p, ...errs }));
    if (!Object.keys(errs).length) {
      setStep(s => s + 1);
      toast.info(`Step ${step} complete`, "Proceeding to the next section.");
    } else {
      toast.error("Validation required", "Please review the highlighted fields.");
    }
  };
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async e => {
    e.preventDefault();
    const allErrors = {};
    Object.keys(validators).forEach(f => { const err = validate(f, form[f]); if (err) allErrors[f] = err; });
    setTouched(Object.fromEntries(Object.keys(validators).map(f => [f, true])));
    setErrors(allErrors);
    if (Object.keys(allErrors).length) { toast.error("Submission blocked", "Please complete all required fields."); return; }

    setLoading(true);
    toast.info("Submitting…", "Transmitting your details to the district registry.");
    try {
      const res = await fetch(`${API}/citizen/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      if (res.ok) {
        toast.success("Registration complete", text || "Your record has been entered into the district rolls.");
        setForm(EMPTY_FORM); setErrors({}); setTouched({}); setStep(1);
      } else {
        toast.error("Registration failed", text || "An error occurred. Please try again.");
      }
    } catch {
      toast.error("Connection error", "Unable to reach the registration server. Please try again later.");
    }
    setLoading(false);
  };

  const selectedVillage = villages.find(v => v.id === form.villageId);
  const progressPercent = ((step - 1) / (STEPS.length - 1)) * 100;
  const fieldProps = { form, errors, touched, onChange: handleChange, onBlur: handleBlur };

  return (
    <>
      <style>{CSS}</style>
      <Navbar />

      <div className={`crp${dark ? " dark" : ""}`}>

        {/* ══ HERO ══ */}
        <div className="crp-hero">
          <img src={villageImg} alt="" aria-hidden="true" className="crp-bg-img" />
          <div className="crp-overlay-left" />
          <div className="crp-overlay-vignette" />

          <div className="crp-inner">

            {/* ── LEFT ── */}
            <motion.aside className="crp-info"
              initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="crp-badge">
                <span className="crp-badge-dot" />
                District Registry System
              </div>

              <h1 className="crp-headline">Citizen<em>Registration.</em></h1>

              <p className="crp-subhead">
                Submit your identity details to the RuralOps district registry.
                Upon verification by your Village Administrative Officer, you will
                gain access to all rural governance services and welfare programmes.
              </p>

              <div className="crp-features">
                {features.map((ft, i) => (
                  <motion.div key={i} className="crp-feat"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  >
                    <div className="crp-feat-icon"><ft.icon size={17} /></div>
                    <div className="crp-feat-body"><h4>{ft.title}</h4><p>{ft.text}</p></div>
                  </motion.div>
                ))}
              </div>

              <motion.div className="crp-safety"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              >
                <Lock size={15} className="crp-safety-ico" />
                <div>
                  <h5>Government-Grade Data Protection</h5>
                  <p>All records are encrypted and protected under district security protocols.</p>
                </div>
              </motion.div>
            </motion.aside>

            {/* ── RIGHT card ── */}
            <div className="crp-card-wrap">
              <motion.div className="crp-card"
                initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Animated progress bar */}
                <div className="crp-progress-track">
                  <div className="crp-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>

                <div className="crp-card-h1">Register as Citizen</div>
                <div className="crp-card-sub">Step {step} of 3 — complete all fields to register</div>

                {/* Step dots */}
                <div className="crp-steps">
                  {STEPS.map(s => {
                    const done = step > s.id;
                    const active = step === s.id;
                    return (
                      <div key={s.id} className={`crp-step-item${done ? " s-done" : ""}`}>
                        <div className={`crp-step-dot${done ? " s-done" : active ? " s-active" : ""}`}>
                          {done ? <CheckCircle2 size={13} /> : s.id}
                        </div>
                        <div className={`crp-step-lbl${active ? " s-active" : ""}`}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Steps ── */}
                <form onSubmit={handleSubmit} noValidate>
                  <AnimatePresence mode="wait">

                    {step === 1 && (
                      <motion.div key="s1"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        style={{ display: "flex", flexDirection: "column", gap: "13px" }}
                      >
                        <div className="crp-sec">Personal Identity</div>
                        <div className="crp-g2">
                          <Field name="fullName" label="Full Name" Icon={User} placeholder="As on Aadhaar card"  {...fieldProps} />
                          <Field name="fatherName" label="Father's / Husband's Name" Icon={User} placeholder="As on Aadhaar card"  {...fieldProps} />
                        </div>
                        <Field name="phoneNumber" label="Mobile Number" Icon={Phone} type="tel" maxLength="10" placeholder="10-digit mobile number" {...fieldProps} />
                        <Field name="email" label="Email Address" Icon={Mail} type="email" placeholder="you@example.com" {...fieldProps} />
                        <div className="crp-secure">
                          <ShieldCheck size={15} className="crp-secure-ico" />
                          <div>
                            <h5>Secure &amp; Confidential</h5>
                            <p>Your information is encrypted and used exclusively for official government purposes.</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="s2"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        style={{ display: "flex", flexDirection: "column", gap: "13px" }}
                      >
                        <div className="crp-sec">Document Numbers</div>
                        <Field name="aadhaarNumber" label="Aadhaar Number" Icon={FileText} maxLength="12" inputMode="numeric" placeholder="12-digit number"      {...fieldProps} />
                        <Field name="rationCardNumber" label="Ration Card Number" Icon={FileText} placeholder="e.g. AP-XXXXX-XXXXX" {...fieldProps} />
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="s3"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        style={{ display: "flex", flexDirection: "column", gap: "13px" }}
                      >
                        <div className="crp-sec">Location &amp; Review</div>

                        <div className="crp-field">
                          <label className="crp-lbl">Village of Residence</label>
                          <VillageSelect
                            value={form.villageId}
                            onChange={handleChange} onBlur={handleBlur}
                            hasErr={!!(errors.villageId && touched.villageId)}
                          />
                          {errors.villageId && touched.villageId && (
                            <span className="crp-err-msg"><AlertCircle size={11} />{errors.villageId}</span>
                          )}
                        </div>

                        <div className="crp-summary">
                          <div className="crp-sum-hd"><FileText size={13} /> Application Summary</div>
                          {[
                            ["Full Name", form.fullName || "—"],
                            ["Father's Name", form.fatherName || "—"],
                            ["Mobile", form.phoneNumber || "—"],
                            ["Email", form.email || "—"],
                            ["Aadhaar", form.aadhaarNumber ? `•••• •••• ${form.aadhaarNumber.slice(-4)}` : "—"],
                            ["Ration Card", form.rationCardNumber || "—"],
                          ].map(([k, v]) => (
                            <div className="crp-sum-row" key={k}>
                              <span className="crp-sum-k">{k}</span>
                              <span className="crp-sum-v">{v}</span>
                            </div>
                          ))}
                          <hr className="crp-sum-div" />
                          <div className="crp-sum-row">
                            <span className="crp-sum-k">Village</span>
                            <span className="crp-sum-v">{selectedVillage?.name || "—"}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="crp-foot">
                    {step > 1
                      ? <button type="button" className="crp-btn-back" onClick={handleBack}><ArrowLeft size={14} /> Back</button>
                      : <span />
                    }
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--card-muted)" }}>{step} of {STEPS.length}</span>
                      {step < 3
                        ? <button type="button" className="crp-btn-next" onClick={handleNext}>
                          Continue <ArrowRight size={14} />
                        </button>
                        : <button type="submit" className="crp-btn-next" disabled={loading}>
                          {loading
                            ? <><div className="crp-spinner" /> Submitting…</>
                            : <>Submit Application <CheckCircle2 size={14} /></>
                          }
                        </button>
                      }
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>

          </div>
        </div>

        <Footer />

      </div>

      {/* ══ TOASTS ══ */}
      <div className="crp-toasts" role="region" aria-label="Notifications" aria-live="polite">
        <AnimatePresence>
          {toast.toasts.map(t => (
            <motion.div key={t.id}
              className={`crp-toast crp-toast--${t.type}`}
              initial={{ opacity: 0, x: 60, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.94 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => toast.dismiss(t.id)}
            >
              <div className="crp-toast-shell">
                <div className="crp-toast-ic">
                  {t.type === "success" ? <CheckCircle2 size={14} />
                    : t.type === "error" ? <AlertCircle size={14} />
                      : <ShieldCheck size={14} />}
                </div>
                <div className="crp-toast-body">
                  <span className="crp-toast-ttl">{t.ttl}</span>
                  <span className="crp-toast-msg">{t.sub}</span>
                </div>
                <button className="crp-toast-close"
                  onClick={e => { e.stopPropagation(); toast.dismiss(t.id); }}
                  aria-label="Dismiss">×</button>
              </div>
              <div className="crp-toast-bar" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}