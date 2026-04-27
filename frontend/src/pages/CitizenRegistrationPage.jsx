import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import "../Styles/CitizenRegistration.css";

/* ─────────────────────────────────────────
   VILLAGES
───────────────────────────────────────── */
const villages = [
  { id: "ALM-5889",  name: "Alamanda" },
  { id: "ALKP-9828", name: "Alamandakothapalle" },
  { id: "BTP-4500",  name: "Bethapudi" },
  { id: "BDP-6154",  name: "Boddapadu" },
  { id: "BKT-9041",  name: "Boilakintada" },
  { id: "CNP-4834",  name: "Chainulapalem" },
  { id: "CGV-9124",  name: "Chinagangavaram" },
  { id: "CNDP-8757", name: "Chinanandipalle" },
  { id: "CSP-9511",  name: "Chinasompuram" },
  { id: "CTP-1278",  name: "Chintalapudi" },
  { id: "DVP-1335",  name: "Devarapalle" },
  { id: "GRS-6975",  name: "Garisingi" },
  { id: "JDP-9896",  name: "Juttadapalem" },
  { id: "KGT-9618",  name: "Kaligotla" },
  { id: "KPR-4633",  name: "Kasipathirajupuram" },
  { id: "KSP-3037",  name: "Kasipuram" },
  { id: "KDB-6677",  name: "Kondakodabu" },
  { id: "KTP-6085",  name: "Kothapenta" },
  { id: "LMP-5650",  name: "Lovamukundapuram" },
  { id: "MDP-9975",  name: "Mamidipalle" },
  { id: "MRP-8869",  name: "Marepalle" },
  { id: "MKP-8644",  name: "Mulakalapalle" },
  { id: "MSP-9051",  name: "Mushidipalle" },
  { id: "NGP-8186",  name: "Nagayyapeta" },
  { id: "NGGN-4888", name: "Narasimha Gajapathinagaram" },
  { id: "PKD-4575",  name: "Pallapukodabu" },
  { id: "PNP-2254",  name: "Pedanandipalle Agraharam" },
  { id: "RWD-3591",  name: "Raiwada" },
  { id: "SBP-6101",  name: "Sambuvanipalem" },
  { id: "SMD-9892",  name: "Sammeda" },
  { id: "STP-6311",  name: "Seetampeta" },
  { id: "SRCP-8818", name: "Sivaramachainulapalem" },
  { id: "TMB-7921",  name: "Tamarabba" },
  { id: "TRV-4709",  name: "Taruva" },
  { id: "TNP-9280",  name: "Tenugupudi" },
  { id: "THM-6757",  name: "Thimiram" },
  { id: "VKP-4189",  name: "Vakapalle" },
  { id: "VLB-4973",  name: "Valabu" },
  { id: "VCL-9779",  name: "Vechalam" },
  { id: "VRP-8413",  name: "Venkatarajupuram" },
];

/* ─────────────────────────────────────────
   VALIDATION
───────────────────────────────────────── */
const validators = {
  fullName:        (v) => v.trim().length < 2      ? "Full name must be at least 2 characters."    : "",
  fatherName:      (v) => v.trim().length < 2      ? "Father's name must be at least 2 characters." : "",
  aadhaarNumber:   (v) => !/^\d{12}$/.test(v)      ? "Aadhaar must be exactly 12 digits."          : "",
  rationCardNumber:(v) => v.trim().length < 3      ? "Enter a valid ration card number."           : "",
  phoneNumber:     (v) => !/^[6-9]\d{9}$/.test(v) ? "Phone must be 10 digits starting with 6–9." : "",
  email:           (v) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email address." : "",
  villageId:       (v) => !v                       ? "Please select your village."                 : "",
};

const STEPS = [
  { id: 1, label: "Identity"  },
  { id: 2, label: "Documents" },
  { id: 3, label: "Confirm"   },
];
const STEP_FIELDS = {
  1: ["fullName","fatherName","phoneNumber","email"],
  2: ["aadhaarNumber","rationCardNumber"],
  3: ["villageId"],
};
const EMPTY_FORM = {
  fullName:"", fatherName:"", aadhaarNumber:"",
  rationCardNumber:"", phoneNumber:"", email:"", villageId:"",
};

/* ─────────────────────────────────────────
   TICKER DATA
───────────────────────────────────────── */
const TICKER_ITEMS = [
  { state: "PEDANANDI PALLI", dot: "green", text: "12 new citizens registered today" },
  { state: "KALIGOTLA",       dot: "blue",  text: "VAO verification pending: 3 cases" },
  { state: "TARUVA",          dot: "green", text: "Welfare disbursement: ₹48,000" },
  { state: "MUSHIDIPALLE",    dot: "blue",  text: "Land records updated" },
  { state: "SAMMEDA",         dot: "green", text: "8 approvals completed" },
  { state: "GARISINGI",       dot: "red",   text: "2 document re-submissions required" },
  { state: "DEVARAPALLE",     dot: "green", text: "Census sync: 99.2% complete" },
  { state: "NAGAYYAPETA",     dot: "gold",  text: "Scheme enrollment open till month-end" },
];

/* ─────────────────────────────────────────
   TOAST SYSTEM
───────────────────────────────────────── */
let _tid = 0;

function ToastItem({ t, onDone }) {
  const [phase,    setPhase]    = useState("toast-entering");
  const [progress, setProgress] = useState(100);
  const rafRef   = useRef(null);
  const startRef = useRef(Date.now());
  const dur      = t.duration ?? 5000;

  const dismiss = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPhase("toast-leaving");
    setTimeout(() => onDone(t.id), 200);
  }, [t.id, onDone]);

  useEffect(() => {
    const tick = () => {
      const pct = Math.max(0, 100 - ((Date.now() - startRef.current) / dur) * 100);
      setProgress(pct);
      if (pct <= 0) { dismiss(); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dismiss, dur]);

  const typeClass = `toast-${t.type}`;

  return (
    <div className={`toast-item ${typeClass} ${phase}`}>
      <div className="toast-top-line" />
      <div className="toast-icon-wrap">
        <div className="toast-icon">{t.icon}</div>
        <span className="toast-pulse" />
      </div>
      <div className="toast-body">
        <span className="toast-label">{t.label}</span>
        <span className="toast-sub">{t.sub}</span>
      </div>
      <button
        className="toast-dismiss"
        onClick={e => { e.stopPropagation(); dismiss(); }}
        aria-label="Dismiss notification"
      >✕</button>
      <div
        className="toast-progress"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((type, label, sub, icon, dur) => {
    const ICONS = { success: "✓", error: "✕", info: "→", worker: "◎" };
    setToasts(p => [...p, {
      id: ++_tid, type, label, sub,
      icon: icon ?? ICONS[type] ?? "→",
      duration: dur ?? 5000,
    }]);
  }, []);
  const remove  = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  const success = (l, s, i) => push("success", l, s, i);
  const error   = (l, s, i) => push("error",   l, s, i);
  const info    = (l, s, i) => push("info",    l, s, i);
  const worker  = (l, s, i) => push("worker",  l, s, i);
  return { toasts, remove, success, error, info, worker };
}

/* ─────────────────────────────────────────
   THEME TOGGLE
───────────────────────────────────────── */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("ruralops-theme") || "dark"; }
    catch { return "dark"; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("ruralops-theme", theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");
  return { theme, toggle };
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function CitizenRegistrationPage() {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [toggleKey, setToggleKey] = useState(0);
  const toast = useToast();
  const { theme, toggle } = useTheme();

  const handleThemeToggle = () => {
    toggle();
    setToggleKey(k => k + 1);
  };

  const validateField = (name, value) => validators[name]?.(value) ?? "";
  const validateStep  = stepNum => {
    const errs = {};
    STEP_FIELDS[stepNum].forEach(f => { const e = validateField(f, form[f]); if (e) errs[f] = e; });
    return errs;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (touched[name]) setErrors(p => ({ ...p, [name]: validateField(name, value) }));
  };
  const handleBlur = e => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    setErrors(p => ({ ...p, [name]: validateField(name, value) }));
  };

  const handleNext = () => {
    const stepErrors  = validateStep(step);
    const stepTouched = Object.fromEntries(STEP_FIELDS[step].map(f => [f, true]));
    setTouched(p => ({ ...p, ...stepTouched }));
    setErrors(p => ({ ...p, ...stepErrors }));
    if (Object.keys(stepErrors).length === 0) {
      setStep(s => s + 1);
      toast.info(`Step ${step} Complete`, "Proceeding to the next section.");
    } else {
      toast.error("Validation Required", "Please review the highlighted fields.");
    }
  };
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async e => {
    e.preventDefault();
    const allErrors = {};
    Object.keys(validators).forEach(f => { const err = validateField(f, form[f]); if (err) allErrors[f] = err; });
    setTouched(Object.fromEntries(Object.keys(validators).map(f => [f, true])));
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      toast.error("Submission Blocked", "Please complete all required fields before proceeding.");
      return;
    }
    setLoading(true);
    toast.info("Submitting Application…", "Transmitting your details to the district registry.");
    try {
      const response = await fetch("https://ruralops-platform-production.up.railway.app/citizen/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await response.text();
      if (response.ok) {
        toast.success("Registration Successful", text || "Your record has been entered into the district rolls.");
        setForm(EMPTY_FORM); setErrors({}); setTouched({}); setStep(1);
      } else {
        toast.error("Registration Failed", text || "An error occurred. Please try again.");
      }
    } catch {
      toast.error("Connection Error", "Unable to reach the registration server. Check your connection.");
    }
    setLoading(false);
  };

  const field = (name, label, inputProps = {}) => (
    <div className={`form-group${errors[name] && touched[name] ? " field-error" : ""}`}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name} name={name} value={form[name]}
        onChange={handleChange} onBlur={handleBlur}
        aria-describedby={`${name}-err`} {...inputProps}
      />
      {touched[name] && errors[name] && (
        <span className="field-error-msg" id={`${name}-err`} role="alert">{errors[name]}</span>
      )}
    </div>
  );

  return (
    <>
      <Navbar />

      {/* ── Theme Toggle ── */}
      <button
        className="theme-toggle"
        onClick={handleThemeToggle}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <span className="theme-toggle-inner" key={toggleKey}>
          {theme === "dark" ? "○" : "●"}
        </span>
      </button>

      {/* ── Toast Portal ── */}
      <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
        {toast.toasts.map(t => <ToastItem key={t.id} t={t} onDone={toast.remove} />)}
      </div>

      {/* ══ MAIN PAGE ══ */}
      <section className="citizen-page">

        {/* ── LEFT PANEL ── */}
        <div className="citizen-info">
          <div className="citizen-info-header">

            {/* Eyebrow */}
            <div className="citizen-eyebrow">
              <span className="eyebrow-dot" />
              RuralOps Governance Network
            </div>

            <h1>
              Register as an Official<br />
              <span className="h1-sub">Village Citizen</span>
            </h1>

            <p className="citizen-lead">
              Submit your identity details to the RuralOps district registry. Upon
              verification by your Village Administrative Officer, you will gain
              access to welfare programs, land record services, and all sovereign
              rural governance benefits.
            </p>

            {/* Info points */}
            <div className="info-points">
              {[
                { icon: "◎", text: "Identity verified by your Village Administrative Officer" },
                { icon: "⊞", text: "Transparent, auditable welfare distribution" },
                { icon: "≡", text: "Access to village-level governance services" },
                { icon: "◈", text: "End-to-end data privacy and sovereignty" },
              ].map((pt, i) => (
                <div className="info-point" key={i}>
                  <span className="info-point-icon">{pt.icon}</span>
                  <span>{pt.text}</span>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className="info-stats">
              {[
                { val: "40+",  lbl: "Villages" },
                { val: "99.2%", lbl: "Sync Rate" },
                { val: "3",    lbl: "Active Steps" },
                { val: "24h",  lbl: "Avg. Approval" },
              ].map((s, i) => (
                <div className="info-stat" key={i}>
                  <span className="info-stat-val">{s.val}</span>
                  <span className="info-stat-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Ticker */}
          <div className="lp-live-ticker">
            <div className="lp-ticker-badge">
              <span className="lp-ticker-live-dot" />LIVE
            </div>
            <div className="lp-ticker-track">
              <div className="lp-ticker-inner">
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <div className="lp-ticker-item" key={i}>
                    <span className="lp-ticker-state">{item.state}</span>
                    <span className={`lp-ticker-dot lp-ticker-dot--${item.dot}`} />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT: Registration Card ── */}
        <div className="registration-glass-card">

          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">⚜</span>
              Citizen Registration
            </h2>
            <div className="card-subtitle">
              DIST. REGISTRY<br />
              <span style={{ fontFamily: "var(--f-mono)", fontSize: "8px", letterSpacing: ".08em" }}>
                REG-2026
              </span>
            </div>
          </div>

          {/* Step Progress */}
          <div className="step-progress" aria-label="Registration steps">
            {STEPS.map((s, i) => (
              <div key={s.id} className="step-progress-item">
                <div className={`step-circle${step > s.id ? " done" : step === s.id ? " active" : ""}`}>
                  {step > s.id ? "✓" : s.id}
                </div>
                <span className={`step-label${step === s.id ? " active" : ""}`}>{s.label}</span>
                {i < STEPS.length - 1 && (
                  <div className={`step-connector${step > s.id ? " done" : ""}`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* ── Step 1: Identity ── */}
            {step === 1 && (
              <div className="form-step">
                <p className="step-description">
                  Provide your personal and contact information as it appears
                  on your official government-issued identification.
                </p>
                <div className="registration-form-grid">
                  {field("fullName",    "Full Name",     { type: "text",  required: true, placeholder: "As on Aadhaar card" })}
                  {field("fatherName",  "Father's Name", { type: "text",  required: true, placeholder: "As on Aadhaar card" })}
                  {field("phoneNumber", "Mobile Number", { type: "tel",   maxLength: "10", required: true, placeholder: "10-digit mobile number" })}
                  {field("email",       "Email Address", { type: "email", required: true, placeholder: "official@example.com" })}
                </div>
              </div>
            )}

            {/* ── Step 2: Documents ── */}
            {step === 2 && (
              <div className="form-step">
                <p className="step-description">
                  Enter your government-issued document numbers. These will be
                  verified by the Village Administrative Officer before approval.
                </p>
                <div className="registration-form-grid">
                  {field("aadhaarNumber",    "Aadhaar Number",    { type: "text", maxLength: "12", inputMode: "numeric", required: true, placeholder: "12-digit Aadhaar number" })}
                  {field("rationCardNumber", "Ration Card Number",{ type: "text", required: true, placeholder: "e.g. AP-XXXXX-XXXXX" })}
                </div>
              </div>
            )}

            {/* ── Step 3: Village + Confirm ── */}
            {step === 3 && (
              <div className="form-step">
                <p className="step-description">
                  Select your village and review your complete declaration before
                  final submission to the district registry.
                </p>
                <div className="registration-form-grid">
                  <div className={`form-group full-width${errors.villageId && touched.villageId ? " field-error" : ""}`}>
                    <label htmlFor="villageId">Village of Residence</label>
                    <select
                      id="villageId" name="villageId"
                      value={form.villageId}
                      onChange={handleChange} onBlur={handleBlur} required
                    >
                      <option value="">— Select Your Village —</option>
                      {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    {touched.villageId && errors.villageId && (
                      <span className="field-error-msg" role="alert">{errors.villageId}</span>
                    )}
                  </div>
                </div>

                <div className="review-summary">
                  <h3>Review Your Application</h3>
                  <dl className="review-grid">
                    <div><dt>Full Name</dt>   <dd>{form.fullName        || "—"}</dd></div>
                    <div><dt>Father's Name</dt><dd>{form.fatherName      || "—"}</dd></div>
                    <div><dt>Mobile</dt>       <dd>{form.phoneNumber     || "—"}</dd></div>
                    <div><dt>Email</dt>        <dd>{form.email           || "—"}</dd></div>
                    <div><dt>Aadhaar</dt>      <dd>{form.aadhaarNumber   ? `•••• •••• ${form.aadhaarNumber.slice(-4)}` : "—"}</dd></div>
                    <div><dt>Ration Card</dt>  <dd>{form.rationCardNumber|| "—"}</dd></div>
                    <div><dt>Village</dt>      <dd>{villages.find(v => v.id === form.villageId)?.name || "—"}</dd></div>
                  </dl>
                </div>
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="step-nav">
              {step > 1 && (
                <button type="button" className="btn-back" onClick={handleBack}>
                  ← Back
                </button>
              )}
              {step < 3 && (
                <button type="button" className="btn-next" onClick={handleNext}>
                  Continue →
                </button>
              )}
              {step === 3 && (
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Submitting…" : "⚜ Submit Application"}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="citizen-footer">
        <div className="footer-left">
          <strong>RuralOps Platform</strong>
          <span>District Rural Governance Infrastructure</span>
        </div>
        <div className="footer-center">© 2026 RuralOps — GOWTHAM CHIRIKI</div>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Security</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </>
  );
}