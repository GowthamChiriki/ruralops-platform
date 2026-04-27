import { useState, useCallback, useEffect } from "react";
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
  fullName:         v => v.trim().length < 2      ? "Full name must be at least 2 characters."     : "",
  fatherName:       v => v.trim().length < 2      ? "Father's name must be at least 2 characters." : "",
  aadhaarNumber:    v => !/^\d{12}$/.test(v)      ? "Aadhaar must be exactly 12 digits."           : "",
  rationCardNumber: v => v.trim().length < 3      ? "Enter a valid ration card number."            : "",
  phoneNumber:      v => !/^[6-9]\d{9}$/.test(v) ? "Phone must be 10 digits starting with 6–9."  : "",
  email:            v => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email address."  : "",
  villageId:        v => !v                       ? "Please select your village."                  : "",
};

const STEPS = [
  { id: 1, label: "Identity"  },
  { id: 2, label: "Documents" },
  { id: 3, label: "Confirm"   },
];
const STEP_FIELDS = {
  1: ["fullName", "fatherName", "phoneNumber", "email"],
  2: ["aadhaarNumber", "rationCardNumber"],
  3: ["villageId"],
};
const EMPTY_FORM = {
  fullName: "", fatherName: "", aadhaarNumber: "",
  rationCardNumber: "", phoneNumber: "", email: "", villageId: "",
};

/* ─────────────────────────────────────────
   TOAST SYSTEM
───────────────────────────────────────── */
function useToasts() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, ttl, sub) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, type, ttl, sub, out: false }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 350);
    }, 3000);
  }, []);

  const dismiss = useCallback(id => {
    setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t));
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 350);
  }, []);

  return {
    toasts, dismiss,
    success: (ttl, sub) => add("success", ttl, sub),
    error:   (ttl, sub) => add("error",   ttl, sub),
    info:    (ttl, sub) => add("info",    ttl, sub),
  };
}

/* ─────────────────────────────────────────
   THEME HOOK
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
   SVG ICONS
───────────────────────────────────────── */
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const CheckIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ErrIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 4v2.5M6 8.5v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const SunIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const DocIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const ChevronDown = () => (
  <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
    <path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function CitizenRegistrationPage() {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [dark,    setDark]    = useTheme();
  const toast = useToasts();

  const validateField = (name, value) => validators[name]?.(value) ?? "";
  const validateStep  = stepNum => {
    const errs = {};
    STEP_FIELDS[stepNum].forEach(f => {
      const e = validateField(f, form[f]);
      if (e) errs[f] = e;
    });
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
      toast.info(`Step ${step} complete`, "Proceeding to the next section.");
    } else {
      toast.error("Validation required", "Please review the highlighted fields.");
    }
  };
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async e => {
    e.preventDefault();
    const allErrors = {};
    Object.keys(validators).forEach(f => {
      const err = validateField(f, form[f]);
      if (err) allErrors[f] = err;
    });
    setTouched(Object.fromEntries(Object.keys(validators).map(f => [f, true])));
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      toast.error("Submission blocked", "Please complete all required fields.");
      return;
    }
    setLoading(true);
    toast.info("Submitting…", "Transmitting your details to the registry.");
    try {
      const response = await fetch("https://ruralops-platform-production.up.railway.app/citizen/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await response.text();
      if (response.ok) {
        toast.success("Registration complete", text || "Your record has been entered into the district rolls.");
        setForm(EMPTY_FORM); setErrors({}); setTouched({}); setStep(1);
      } else {
        toast.error("Registration failed", text || "An error occurred. Please try again.");
      }
    } catch {
      toast.error("Connection error", "Unable to reach the registration server.");
    }
    setLoading(false);
  };

  /* Reusable field renderer */
  const field = (name, label, inputProps = {}) => {
    const hasErr  = errors[name] && touched[name];
    const isValid = touched[name] && !errors[name] && form[name];
    return (
      <div className={`cr-field${hasErr ? " has-err" : isValid ? " is-valid" : ""}`}>
        <label htmlFor={name}>{label}</label>
        <div className="cr-field-wrap">
          <input
            id={name} name={name} value={form[name]}
            onChange={handleChange} onBlur={handleBlur}
            aria-describedby={`${name}-err`}
            {...inputProps}
          />
          {isValid && (
            <span className="cr-field-check" aria-hidden="true">
              <CheckIcon size={12} />
            </span>
          )}
        </div>
        {hasErr && (
          <span className="cr-field-err" id={`${name}-err`} role="alert">
            <ErrIcon />
            {errors[name]}
          </span>
        )}
      </div>
    );
  };

  const progressPercent = ((step - 1) / (STEPS.length - 1)) * 100;

  const features = [
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: "Identity Verified",
      text: "Verified by your Village Administrative Officer"
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      ),
      title: "Transparent Distribution",
      text: "Auditable welfare distribution across all villages"
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
        </svg>
      ),
      title: "Instant Access",
      text: "All village-level governance services in one place"
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      title: "Data Sovereignty",
      text: "End-to-end privacy and data protection standards"
    },
  ];

  return (
    <>
      <div className="cr-page">
        {/* Background mesh */}
        <div className="cr-bg-mesh" aria-hidden="true">
          <div className="cr-mesh-orb cr-mesh-orb-1" />
          <div className="cr-mesh-orb cr-mesh-orb-2" />
          <div className="cr-mesh-orb cr-mesh-orb-3" />
          <div className="cr-grid-overlay" />
        </div>

        <Navbar />

        {/* Theme toggle */}
        <button
          className="cr-theme"
          onClick={() => setDark(d => !d)}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="cr-theme-track">
            <span className="cr-theme-thumb">
              {dark ? <SunIcon /> : <MoonIcon />}
            </span>
          </span>
          <span className="cr-theme-label">{dark ? "Light" : "Dark"}</span>
        </button>

        {/* ── BODY ── */}
        <div className="cr-body">

          {/* ══ LEFT ══ */}
          <div className="cr-left">
            <div className="cr-left-inner">

              {/* Status */}
              <div className="cr-status">
                <span className="cr-status-pulse">
                  <span className="cr-status-dot" />
                </span>
                <span className="cr-status-text">Secure Registration Portal · RuralOps v2.4</span>
              </div>

              {/* Hero */}
              <div className="cr-hero">
                <div className="cr-hero-badge">District Registry System</div>
                <h1>Citizen<br /><em>Registration.</em></h1>
                <p>
                  Submit your identity details to the RuralOps district registry.
                  Upon verification by your Village Administrative Officer, you
                  will gain access to all rural governance services and welfare programmes.
                </p>
              </div>

              <div className="cr-divider" />

              {/* Feature points */}
              <div className="cr-points">
                {features.map((pt, i) => (
                  <div
                    className="cr-point"
                    key={i}
                    style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                  >
                    <div className="cr-point-ic">{pt.icon}</div>
                    <div className="cr-point-text">
                      <span className="cr-point-title">{pt.title}</span>
                      <span className="cr-point-desc">{pt.text}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* ══ RIGHT CARD ══ */}
          <div className="cr-card-wrap">
            <div className="cr-card">

              {/* Accent line at very top */}
              <div className="cr-card-accent-line" />

              {/* Progress bar */}
              <div className="cr-progress-bar">
                <div className="cr-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>

              {/* Card header */}
              <div className="cr-card-head">
                <span className="cr-card-eyebrow">
                  <span className="cr-eyebrow-line" />
                  District Registry
                </span>
                <h2 className="cr-card-title">Register as Citizen</h2>
                <p className="cr-card-desc">
                  Complete all three steps to submit your application to the district registry.
                </p>
              </div>

              {/* Step progress */}
              <div className="cr-steps" aria-label="Registration progress">
                {STEPS.map((s, i) => (
                  <div className="cr-step" key={s.id}>
                    <div className={`cr-step-circle${step > s.id ? " done" : step === s.id ? " active" : ""}`}>
                      {step > s.id ? <CheckIcon size={11} /> : s.id}
                    </div>
                    <span className={`cr-step-label${step === s.id ? " active" : step > s.id ? " done" : ""}`}>
                      {s.label}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div className="cr-step-line">
                        <div className="cr-step-line-fill" style={{ width: step > s.id ? "100%" : "0%" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} noValidate>

                {/* ── Step 1: Identity ── */}
                {step === 1 && (
                  <div className="cr-step-body" key="step1">
                    <div className="cr-step-header">
                      <div className="cr-step-num">01</div>
                      <div>
                        <div className="cr-step-name">Personal Identity</div>
                        <p className="cr-step-desc">
                          Provide your personal and contact information as it appears on your government-issued identification.
                        </p>
                      </div>
                    </div>
                    <div className="cr-form-grid">
                      {field("fullName",    "Full Name",     { type: "text",  required: true, placeholder: "As on Aadhaar card" })}
                      {field("fatherName",  "Father's Name", { type: "text",  required: true, placeholder: "As on Aadhaar card" })}
                      {field("phoneNumber", "Mobile Number", { type: "tel",   maxLength: "10", required: true, placeholder: "10-digit number" })}
                      {field("email",       "Email Address", { type: "email", required: true, placeholder: "you@example.com" })}
                    </div>
                  </div>
                )}

                {/* ── Step 2: Documents ── */}
                {step === 2 && (
                  <div className="cr-step-body" key="step2">
                    <div className="cr-step-header">
                      <div className="cr-step-num">02</div>
                      <div>
                        <div className="cr-step-name">Document Numbers</div>
                        <p className="cr-step-desc">
                          Enter your government-issued document numbers. These will be verified by your Village Administrative Officer.
                        </p>
                      </div>
                    </div>
                    <div className="cr-form-grid cr-form-grid--single">
                      {field("aadhaarNumber",    "Aadhaar Number",     { type: "text", maxLength: "12", inputMode: "numeric", required: true, placeholder: "12-digit number" })}
                      {field("rationCardNumber", "Ration Card Number", { type: "text", required: true, placeholder: "e.g. AP-XXXXX-XXXXX" })}
                    </div>
                  </div>
                )}

                {/* ── Step 3: Village + Review ── */}
                {step === 3 && (() => {
                  const vcErr  = errors.villageId && touched.villageId;
                  const vcOk   = touched.villageId && !errors.villageId;
                  return (
                    <div className="cr-step-body" key="step3">
                      <div className="cr-step-header">
                        <div className="cr-step-num">03</div>
                        <div>
                          <div className="cr-step-name">Review & Submit</div>
                          <p className="cr-step-desc">
                            Select your village and review your complete declaration before final submission.
                          </p>
                        </div>
                      </div>

                      <div className={`cr-field full${vcErr ? " has-err" : vcOk ? " is-valid" : ""}`}>
                        <label htmlFor="villageId">Village of Residence</label>
                        <div className="cr-field-wrap cr-select-wrap">
                          <select
                            id="villageId" name="villageId"
                            value={form.villageId}
                            onChange={handleChange} onBlur={handleBlur} required
                          >
                            <option value="">— Select your village —</option>
                            {villages.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                          <span className="cr-select-arrow" aria-hidden="true">
                            <ChevronDown />
                          </span>
                        </div>
                        {vcErr && (
                          <span className="cr-field-err" role="alert">
                            <ErrIcon />
                            {errors.villageId}
                          </span>
                        )}
                      </div>

                      <div className="cr-review">
                        <div className="cr-review-head">
                          <DocIcon />
                          Application Summary
                        </div>
                        <div className="cr-review-grid">
                          {[
                            { dt: "Full Name",    dd: form.fullName },
                            { dt: "Father's Name", dd: form.fatherName },
                            { dt: "Mobile",       dd: form.phoneNumber },
                            { dt: "Email",        dd: form.email },
                            { dt: "Aadhaar",      dd: form.aadhaarNumber ? `•••• •••• ${form.aadhaarNumber.slice(-4)}` : "" },
                            { dt: "Ration Card",  dd: form.rationCardNumber },
                            { dt: "Village",      dd: villages.find(v => v.id === form.villageId)?.name, full: true },
                          ].map((row, i) => (
                            <div className={`cr-review-row${row.full ? " full" : ""}`} key={i}>
                              <span className="cr-review-dt">{row.dt}</span>
                              <span className="cr-review-dd">{row.dd || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Navigation ── */}
                <div className="cr-nav">
                  {step > 1 && (
                    <button type="button" className="cr-btn-back" onClick={handleBack}>
                      <ArrowLeft />
                      Back
                    </button>
                  )}
                  <div className="cr-nav-right">
                    <span className="cr-step-counter">{step} of {STEPS.length}</span>
                    {step < 3 && (
                      <button type="button" className="cr-btn-next" onClick={handleNext}>
                        Continue
                        <ArrowRight />
                      </button>
                    )}
                    {step === 3 && (
                      <button type="submit" className="cr-btn-submit" disabled={loading}>
                        {loading ? (
                          <><span className="cr-spinner" aria-hidden="true" /> Submitting…</>
                        ) : (
                          <>Submit Application <ArrowRight /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </form>

            </div>
          </div>

        </div>

        {/* ── FOOTER ── */}
        <footer className="cr-footer">
          <div className="cr-footer-brand">
            <strong>RuralOps Platform</strong>
            <span>Digital Rural Governance Infrastructure</span>
          </div>
          <div className="cr-footer-copy">© 2026 RuralOps — GOWTHAM CHIRIKI</div>
          <nav className="cr-footer-nav">
            <a href="#">Privacy</a>
            <a href="#">Security</a>
            <a href="#">Support</a>
          </nav>
        </footer>

      </div>

      {/* ══ TOASTS ══ */}
      <div className="cr-toasts" role="region" aria-label="Notifications" aria-live="polite">
        {toast.toasts.map(t => (
          <div
            key={t.id}
            className={`cr-toast cr-toast--${t.type} ${t.out ? "tout" : "tin"}`}
            onClick={() => toast.dismiss(t.id)}
          >
            <div className="cr-toast-shell">
              <div className="cr-toast-ic">
                {t.type === "success" ? (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : t.type === "error" ? (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M6 5.5v3M6 3.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <div className="cr-toast-body">
                <span className="cr-toast-ttl">{t.ttl}</span>
                <span className="cr-toast-msg">{t.sub}</span>
              </div>
              <button
                className="cr-toast-close"
                onClick={e => { e.stopPropagation(); toast.dismiss(t.id); }}
                aria-label="Dismiss"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M7 1L1 7M1 1l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {!t.out && <div className="cr-toast-bar" />}
          </div>
        ))}
      </div>
    </>
  );
}