import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import "../Styles/CitizenRegistration.css";

/* ─────────────────────────────────────────
   VILLAGES  (unchanged)
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
   VALIDATION  (unchanged)
───────────────────────────────────────── */
const validators = {
  fullName:        (v) => v.trim().length < 2      ? "Full name must be at least 2 characters."    : "",
  fatherName:      (v) => v.trim().length < 2      ? "Father name must be at least 2 characters."  : "",
  aadhaarNumber:   (v) => !/^\d{12}$/.test(v)      ? "Aadhaar must be exactly 12 digits."          : "",
  rationCardNumber:(v) => v.trim().length < 3      ? "Enter a valid ration card number."           : "",
  phoneNumber:     (v) => !/^[6-9]\d{9}$/.test(v) ? "Phone must be 10 digits starting with 6–9." : "",
  email:           (v) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email address." : "",
  villageId:       (v) => !v                       ? "Please select your village."                 : "",
};

const STEPS = [
  { id: 1, label: "Personal Info" },
  { id: 2, label: "Documents"    },
  { id: 3, label: "Village"      },
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
  { state: "GARISINGI",       dot: "red",   text: "2 document re-submissions needed" },
  { state: "DEVARAPALLE",     dot: "green", text: "Census sync: 99.2% complete" },
  { state: "NAGAYYAPETA",     dot: "gold",  text: "Scheme enrollment open till month-end" },
];

/* ─────────────────────────────────────────
   TOAST — rAF progress drain, 5 types
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

  /* type → CSS class: success=emerald, error=crimson, info=amber, worker=violet */
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
        aria-label="Dismiss"
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
    const ICONS = { success:"⚔️", error:"🛡️", info:"📜", worker:"⚒️" };
    setToasts(p => [...p, {
      id: ++_tid, type, label, sub,
      icon: icon ?? ICONS[type] ?? "📜",
      duration: dur ?? 5000,
    }]);
  }, []);
  const remove  = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  const success = (l,s,i)   => push("success",l,s,i);
  const error   = (l,s,i)   => push("error",l,s,i);
  const info    = (l,s,i)   => push("info",l,s,i);
  const worker  = (l,s,i)   => push("worker",l,s,i);
  return { toasts, remove, success, error, info, worker };
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
  const toast = useToast();

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
      toast.info(`Step ${step} Complete`, "Moving to the next section…");
    } else {
      toast.error("Validation Failed", "Please fix the highlighted fields.");
    }
  };
  const handleBack = () => setStep(s => s - 1);

  /* ── SUBMIT — endpoint unchanged ── */
  const handleSubmit = async e => {
    e.preventDefault();
    const allErrors = {};
    Object.keys(validators).forEach(f => { const err = validateField(f, form[f]); if (err) allErrors[f] = err; });
    setTouched(Object.fromEntries(Object.keys(validators).map(f => [f, true])));
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      toast.error("Submission Blocked", "Complete all required fields before submitting.");
      return;
    }
    setLoading(true);
    toast.info("Dispatching Scroll…", "Sending registration to the realm's records.");
    try {
      const response = await fetch("http://localhost:8080/citizen/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await response.text();
      if (response.ok) {
        toast.success("Oath Sworn — Registered!", text || "Your name has been entered into the rolls.");
        setForm(EMPTY_FORM); setErrors({}); setTouched({}); setStep(1);
      } else {
        toast.error("The Council Refuses", text || "Registration failed. Try again.");
      }
    } catch {
      toast.error("Raven Unreachable", "Cannot reach the castle.");
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

      {/* ── TOAST PORTAL — top-right ── */}
      <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
        {toast.toasts.map(t => <ToastItem key={t.id} t={t} onDone={toast.remove} />)}
      </div>

      {/* ══ MAIN PAGE ══ */}
      <section className="citizen-page">

        {/* ── LEFT ── */}
        <div className="citizen-info">
          <div className="citizen-info-header">

            {/* Eyebrow — AMBER */}
            <div className="citizen-eyebrow">
              <span className="citizen-eyebrow-sword">⚔</span>
              RuralOps Governance Network
            </div>

            <h1>
              Let Your Name Be<br />
              <span>Entered in the Village Ledger</span>
            </h1>

            <p>
              Swear your oath to the RuralOps Governance Network. Your Village
              Administrative Officer shall verify your identity — and upon approval,
              the gates to rural welfare programs and sovereign services shall open.
            </p>

            {/* Info points — TEAL icons */}
            <div className="info-points">
              {[
                { icon: "⚔️", text: "Identity verified by sworn VAO" },
                { icon: "🏰", text: "Transparent welfare distribution" },
                { icon: "📜", text: "Village-level governance access" },
                { icon: "🛡️", text: "Sovereign data protection" },
              ].map((pt, i) => (
                <div className="info-point" key={i}>
                  <span className="info-point-icon">{pt.icon}</span>
                  <span>{pt.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Ticker — CRIMSON badge */}
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

          <h2>Citizen Registration</h2>

          {/* Step progress — teal active, emerald done, violet connector */}
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

            {step === 1 && (
              <div className="form-step">
                <p className="step-description">
                  Declare your identity before the realm. Enter your personal and contact details with honesty.
                </p>
                <div className="registration-form-grid">
                  {field("fullName",    "Full Name",    { type:"text",  required:true })}
                  {field("fatherName",  "Father Name",  { type:"text",  required:true })}
                  {field("phoneNumber", "Phone Number", { type:"tel",   maxLength:"10", required:true })}
                  {field("email",       "Email Address",{ type:"email", required:true })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
                <p className="step-description">
                  Bring forth your identity scrolls. The Village Administrative Officer shall examine them
                  and bear witness to your claim before it is entered into the village record.
                </p>
                <div className="registration-form-grid">
                  {field("aadhaarNumber",    "Aadhaar Number",    { type:"text", maxLength:"12", inputMode:"numeric", required:true })}
                  {field("rationCardNumber", "Ration Card Number",{ type:"text", required:true })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-step">
                <p className="step-description">
                  Choose your village and review the sworn declaration before the final seal is placed.
                </p>
                <div className="registration-form-grid">
                  <div className={`form-group full-width${errors.villageId && touched.villageId ? " field-error" : ""}`}>
                    <label htmlFor="villageId">Select Your Village</label>
                    <select
                      id="villageId" name="villageId"
                      value={form.villageId}
                      onChange={handleChange} onBlur={handleBlur} required
                    >
                      <option value="">— Declare Your Village —</option>
                      {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    {touched.villageId && errors.villageId && (
                      <span className="field-error-msg" role="alert">{errors.villageId}</span>
                    )}
                  </div>
                </div>

                <div className="review-summary">
                  <h3>Review Your Declaration</h3>
                  <dl className="review-grid">
                    <div><dt>Full Name</dt>   <dd>{form.fullName        || "—"}</dd></div>
                    <div><dt>Father Name</dt> <dd>{form.fatherName      || "—"}</dd></div>
                    <div><dt>Phone</dt>       <dd>{form.phoneNumber     || "—"}</dd></div>
                    <div><dt>Email</dt>       <dd>{form.email           || "—"}</dd></div>
                    <div><dt>Aadhaar</dt>     <dd>{form.aadhaarNumber   ? `•••• •••• ${form.aadhaarNumber.slice(-4)}` : "—"}</dd></div>
                    <div><dt>Ration Card</dt> <dd>{form.rationCardNumber|| "—"}</dd></div>
                    <div><dt>Village</dt>     <dd>{villages.find(v => v.id === form.villageId)?.name || "—"}</dd></div>
                  </dl>
                </div>
              </div>
            )}

            <div className="step-nav">
              {step > 1 && (
                <button type="button" className="btn-back" onClick={handleBack}>← Retreat</button>
              )}
              {step < 3 && (
                <button type="button" className="btn-next" onClick={handleNext}>Advance →</button>
              )}
              {step === 3 && (
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "⚔ Dispatching…" : "⚜ Swear the Oath"}
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
          <span>Digital Rural Governance Infrastructure</span>
        </div>
        <div className="footer-center">© 2026 RuralOps — GOWTHAM CHIRIKI</div>
        <div className="footer-links">
          <a href="#">Privacy</a><a href="#">Security</a><a href="#">Support</a>
        </div>
      </footer>
    </>
  );
}