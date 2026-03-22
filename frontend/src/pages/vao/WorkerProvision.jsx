import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/WorkerProvision.css";

/* ════════════════════════════════════════════
   BASE URL — single source of truth
════════════════════════════════════════════ */
const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/* ════════════════════════════════════════════
   AUTH HELPERS
════════════════════════════════════════════ */
function getToken()      { return localStorage.getItem("accessToken"); }
function getAccountId()  { return localStorage.getItem("accountId"); }
function getAccountType(){ return localStorage.getItem("accountType"); }

async function authFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401) {
    localStorage.clear();
    const err = new Error("Session expired. Please log in again.");
    err.code = 401;
    throw err;
  }
  if (res.status === 403) {
    const err = new Error("You do not have permission to perform this action.");
    err.code = 403;
    throw err;
  }
  return res;
}

/* ─────────────────────────────────────────────
   FIELD WRAPPER
───────────────────────────────────────────── */
function Field({ label, required, hint, error, children }) {
  return (
    <div className={`wp-field${error ? " wp-field--err" : ""}`}>
      <label className="wp-field__label">
        {label}
        {required && <span className="wp-field__req">*</span>}
        {hint && <span className="wp-field__hint">{hint}</span>}
      </label>
      {children}
      {error && <p className="wp-field__error"><span>⚔</span> {error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   AREA DROPDOWN
───────────────────────────────────────────── */
function AreaDropdown({ areas, loading, fetchError, value, onChange, onRetry, hasError }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  const selected = areas.find((a) => String(a.id) === String(value)) || null;
  const handleSelect = (area) => { onChange(String(area.id), area.name); setOpen(false); };
  const handleClear  = (e)    => { e.stopPropagation(); onChange("", ""); };

  if (loading)      return <div className="wp-area-flat wp-area-flat--loading"><span className="wp-area-spin" /><span className="wp-area-flat-txt">Summoning territories from the Citadel…</span></div>;
  if (fetchError)   return <div className="wp-area-flat wp-area-flat--error"><span className="wp-area-flat-ic">⚠</span><span className="wp-area-flat-txt">Failed to load territories</span><button className="wp-area-retry" type="button" onClick={onRetry}>↻ Retry</button></div>;
  if (!areas.length) return <div className="wp-area-flat wp-area-flat--empty"><span className="wp-area-flat-ic">🗺</span><span className="wp-area-flat-txt">No territories claimed yet — create areas in the Command Hall first</span></div>;

  return (
    <div ref={ref} className={["wp-area-dropdown", open?"wp-area-dropdown--open":"", hasError?"wp-area-dropdown--err":""].filter(Boolean).join(" ")}>
      <button type="button" className="wp-area-trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span className="wp-area-trigger__icon">🗺</span>
        {selected ? <span className="wp-area-trigger__val"><span className="wp-area-trigger__dot" />{selected.name}</span>
                  : <span className="wp-area-trigger__placeholder">Select a territory to assign…</span>}
        <span className="wp-area-trigger__right">
          {selected && <span className="wp-area-trigger__clear" role="button" tabIndex={0} title="Clear" onClick={handleClear} onKeyDown={(e) => e.key === "Enter" && handleClear(e)}>✕</span>}
          <span className={`wp-area-trigger__chevron${open ? " wp-area-trigger__chevron--up" : ""}`}>▾</span>
        </span>
      </button>
      {open && (
        <div className="wp-area-panel" role="listbox">
          <div className="wp-area-panel__header"><span className="wp-area-panel__title">⚔ Territories under your command</span><span className="wp-area-panel__count">{areas.length}</span></div>
          <div className="wp-area-panel__list">
            {areas.map((area, i) => (
              <button key={area.id} type="button" role="option" aria-selected={String(area.id) === String(value)}
                className={["wp-area-option", String(area.id) === String(value) ? "wp-area-option--selected" : ""].filter(Boolean).join(" ")}
                style={{ animationDelay: `${i * 0.04}s` }} onClick={() => handleSelect(area)}>
                <span className="wp-area-option__icon">🏘</span>
                <span className="wp-area-option__name">{area.name}</span>
                <span className="wp-area-option__id">#{area.id}</span>
                {String(area.id) === String(value) && <span className="wp-area-option__check">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
function Toast({ msg, type, onDismiss }) {
  return (
    <div className={`wp-toast wp-toast--${type}`} onClick={onDismiss}>
      <span className="wp-toast__icon">{type === "success" ? "⚔" : "🐉"}</span>
      <span>{msg}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUCCESS OVERLAY
───────────────────────────────────────────── */
function SuccessOverlay({ workerName, workerId, assignedArea, onAddAnother, onDashboard }) {
  return (
    <div className="wp-success">
      <div className="wp-success__watermark" aria-hidden="true">⚔</div>
      <div className="wp-success__ring"><div className="wp-success__ring-inner"><span className="wp-success__check">⚔</span></div></div>
      <div className="wp-success__confetti" aria-hidden="true">{[...Array(12)].map((_, i) => <div key={i} className={`wp-confetti-dot wp-confetti-dot--${i % 4}`} style={{ "--i": i }} />)}</div>
      <h2 className="wp-success__title">Sworn to the Realm!</h2>
      <p className="wp-success__sub"><strong>{workerName}</strong> hath been sworn into your village's service. A raven bearing their oath of activation shall be dispatched to their registered scroll &amp; crystal ere the next bell.</p>
      <div className="wp-success__id-badge"><span className="wp-success__id-label">Servant's Seal</span><span className="wp-success__id-val">{workerId || "Forged by the Citadel"}</span></div>
      {assignedArea && <div className="wp-success__area-badge"><span className="wp-success__area-ic">🗺</span><div><span className="wp-success__area-label">Territory Assigned</span><span className="wp-success__area-val">{assignedArea}</span></div></div>}
      <div className="wp-success__info">
        <div className="wp-success__info-row"><span className="wp-success__info-ic">🦅</span><span>Raven dispatched with the activation scroll</span></div>
        <div className="wp-success__info-row"><span className="wp-success__info-ic">🔮</span><span>Crystal messenger hath been notified</span></div>
        <div className="wp-success__info-row"><span className="wp-success__info-ic">⏳</span><span>Oath status: <em>Awaiting the Blood Pledge</em></span></div>
      </div>
      <div className="wp-success__actions">
        <button className="wp-btn wp-btn--ghost" onClick={onAddAnother}>⚔ Swear Another Servant</button>
        <button className="wp-btn wp-btn--primary" onClick={onDashboard}>Return to the Great Hall →</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AUTH ERROR SCREEN
───────────────────────────────────────────── */
function AuthErrorScreen({ message, isExpired, onGoLogin, onGoHome }) {
  return (
    <>
      <Navbar />
      <div style={{ minHeight: "calc(100vh - 68px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "DM Sans, system-ui, sans-serif", textAlign: "center", padding: 40 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(184,64,64,.09)", border: "2px solid rgba(184,64,64,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>🔒</div>
        <div style={{ fontSize: 72, fontWeight: 800, color: "#b84040", lineHeight: 1 }}>{isExpired ? "401" : "403"}</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{isExpired ? "Session Expired" : "Access Denied"}</div>
        <div style={{ fontSize: 14, color: "#6b7e6f", maxWidth: 400, lineHeight: 1.75, background: "rgba(184,64,64,.05)", border: "1px solid rgba(184,64,64,.14)", borderRadius: 12, padding: "16px 24px" }}>{message}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          {isExpired && <button onClick={onGoLogin} style={{ padding: "10px 28px", borderRadius: 8, background: "#25593f", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>→ Log In Again</button>}
          <button onClick={onGoHome} style={{ padding: "10px 28px", borderRadius: 8, background: "transparent", color: "#25593f", border: "1.5px solid #25593f", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Home</button>
        </div>
      </div>
      <Footer />
    </>
  );
}

/* ─────────────────────────────────────────────
   BACKEND ERROR PARSER
───────────────────────────────────────────── */
function parseBackendErrors(status, body) {
  const FIELD_MAP = {
    name:        "name",
    email:       "email",
    phoneNumber: "phoneNumber",
    areaId:      "areaId",
    area_id:     "areaId",
  };

  const MESSAGE_MAP = {
    "Worker name is required":                  "Every sworn servant must bear a name",
    "Worker name cannot exceed 150 characters": "The servant's name exceeds 150 runes — trim it",
    "Email is required":                        "A raven address is required to dispatch the oath",
    "Invalid email format":                     "That raven address is ill-formed — check the scroll",
    "Email cannot exceed 150 characters":       "The raven address exceeds 150 runes — trim it",
    "Phone number is required":                 "A crystal channel is required for the summons",
    "Invalid Indian phone number":              "A valid 10-digit crystal channel is required (starting 6–9)",
    "Area is required":                         "A territory must be assigned to this servant",
  };

  const rephrase = (msg) => (msg && MESSAGE_MAP[msg]) ? MESSAGE_MAP[msg] : msg;

  try {
    const json = JSON.parse(body);

    if (json.field && json.message) {
      const key = FIELD_MAP[json.field] || null;
      if (key) return { fieldErrors: { [key]: json.message }, toast: null };
      return { fieldErrors: {}, toast: json.message };
    }

    if (json.errors && Array.isArray(json.errors)) {
      const fieldErrors = {}, general = [];
      json.errors.forEach(({ field, message }) => {
        const key = field && FIELD_MAP[field];
        if (key) fieldErrors[key] = rephrase(message);
        else general.push(rephrase(message));
      });
      return { fieldErrors, toast: general.length ? general.join(" · ") : null };
    }

    if (json && typeof json === "object" && !json.message && !json.error && !json.status) {
      const fieldErrors = {}, general = [];
      Object.entries(json).forEach(([field, message]) => {
        const key = FIELD_MAP[field];
        if (key) fieldErrors[key] = rephrase(String(message));
        else general.push(rephrase(String(message)));
      });
      if (Object.keys(fieldErrors).length || general.length)
        return { fieldErrors, toast: general.length ? general.join(" · ") : null };
    }

    if (json.message) return { fieldErrors: {}, toast: rephrase(json.message) };
    if (json.error)   return { fieldErrors: {}, toast: rephrase(json.error) };

  } catch { /* not JSON */ }

  if (body && body.trim()) {
    const raw = body.toLowerCase();

    if ((raw.includes("area_id") || raw.includes("uk7fvbngrtfp9hg9j4ng4fqptea")) &&
        (raw.includes("duplicate") || raw.includes("unique"))) {
      return { fieldErrors: { areaId: "This territory already has a worker assigned. Each area can only have one worker." }, toast: null };
    }
    if (raw.includes("email") && (raw.includes("duplicate") || raw.includes("unique"))) {
      return { fieldErrors: { email: "A worker with this email address already exists in the realm." }, toast: null };
    }
    if ((raw.includes("phone") || raw.includes("phone_number")) &&
        (raw.includes("duplicate") || raw.includes("unique"))) {
      return { fieldErrors: { phoneNumber: "A worker with this phone number already exists in the realm." }, toast: null };
    }
    if (raw.includes("duplicate key") || raw.includes("unique constraint")) {
      return { fieldErrors: {}, toast: "A record with these details already exists. Please check for duplicates." };
    }
    if (raw.includes("foreign key") && raw.includes("area")) {
      return { fieldErrors: { areaId: "The selected area does not exist. Please refresh and try again." }, toast: null };
    }
    if (body.trim().length < 300 && !body.includes("at org.") && !body.includes("at com.")) {
      return { fieldErrors: {}, toast: body.trim() };
    }
    return { fieldErrors: {}, toast: "The Citadel encountered an error processing this request. Please try again." };
  }

  const STATUS_MESSAGES = {
    400: "The Citadel found fault with your scroll — check the fields above",
    404: "The village or territory could not be found in the realm",
    409: "A servant with these details already exists — check the raven address, crystal channel, or territory",
    422: "The Citadel could not process your request — verify all fields",
    500: "The Citadel's ravens have faltered — try again presently",
  };
  return {
    fieldErrors: {},
    toast: STATUS_MESSAGES[status] ?? `The Citadel refused the request (${status})`,
  };
}

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════ */
export default function WorkerProvision() {
  const navigate  = useNavigate();
  const { vaoId } = useParams();

  const storedId   = getAccountId();
  const storedType = getAccountType();

  const resolvedVaoId = (
    vaoId && getToken() && storedId === vaoId && storedType === "VAO"
  ) ? vaoId : (storedType === "VAO" ? storedId : null);

  const [form, setForm] = useState({ name: "", email: "", phoneNumber: "", areaId: "", areaName: "" });
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState(null);
  const [success,    setSuccess]    = useState(null);
  const [visible,    setVisible]    = useState(false);
  const [focused,    setFocused]    = useState(null);
  const [authError,  setAuthError]  = useState(null);
  const nameRef = useRef(null);

  const [areas,        setAreas]        = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError,   setAreasError]   = useState(null);

  const handleAuthError = useCallback((err) => {
    if (err.code === 401) {
      setAuthError({ message: err.message, isExpired: true });
      setTimeout(() => navigate("/vao/login", { replace: true }), 2000);
    } else {
      setAuthError({ message: err.message, isExpired: false });
    }
  }, [navigate]);

  /* ── FETCH AREAS ──
     Backend: GET /vao/areas
     VAO is resolved from JWT principal — no vaoId in URL.
  */
  const fetchAreas = useCallback(async () => {
    setAreasLoading(true);
    setAreasError(null);
    try {
      const res = await authFetch(`${BASE}/vao/areas`);
      if (!res.ok) throw new Error(`Failed to load areas (${res.status})`);
      const data = await res.json();
      setAreas(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.code === 401 || e.code === 403) handleAuthError(e);
      else setAreasError(e.message);
    } finally {
      setAreasLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    if (!getToken() || !resolvedVaoId) { navigate("/vao/login", { replace: true }); return; }
    fetchAreas();
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [resolvedVaoId, fetchAreas, navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phoneNumber") setForm((f) => ({ ...f, phoneNumber: value.replace(/\D/g, "").slice(0, 10) }));
    else if (name === "email")  setForm((f) => ({ ...f, email: value.trimStart() }));
    else                        setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleAreaChange = (id, name) => {
    setForm((f) => ({ ...f, areaId: id, areaName: name }));
    setErrors((er) => ({ ...er, areaId: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name = "Every sworn servant must bear a name";
    if (!form.email.trim())       e.email = "A raven address is required to dispatch the oath";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "That raven address is ill-formed — check the scroll";
    if (!form.phoneNumber.trim()) e.phoneNumber = "A crystal channel is required for the summons";
    else if (!/^[6-9]\d{9}$/.test(form.phoneNumber.trim())) e.phoneNumber = "A valid 10-digit crystal channel is required (starting 6–9)";
    if (!form.areaId)             e.areaId = "A territory must be assigned to this servant";
    return e;
  };

  /* ── PROVISION WORKER ──
     Backend: POST /workers/provision
     VAO is resolved from JWT principal — no vaoId in URL.
  */
  const handleSubmit = async () => {
    if (loading) return;
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const res = await authFetch(
        `${BASE}/workers/provision`,
        {
          method: "POST",
          body: JSON.stringify({
            name:        form.name.trim(),
            email:       form.email.trim().toLowerCase(),
            phoneNumber: form.phoneNumber.trim(),
            areaId:      Number(form.areaId),
          }),
        }
      );

      const text = await res.text();

      if (!res.ok) {
        const { fieldErrors, toast: toastMsg } = parseBackendErrors(res.status, text);
        if (Object.keys(fieldErrors).length) setErrors((prev) => ({ ...prev, ...fieldErrors }));
        if (toastMsg) setToast({ msg: toastMsg, type: "error" });
        else if (!Object.keys(fieldErrors).length) setToast({ msg: `The Citadel refused the request (${res.status})`, type: "error" });
        return;
      }

      let workerId = null;
      try { const parsed = JSON.parse(text); workerId = parsed.workerId ?? parsed.worker_id ?? parsed.id ?? null; }
      catch { /* plain-text 200 */ }

      setSuccess({ workerName: form.name.trim(), workerId, assignedArea: form.areaName });

    } catch (err) {
      if (err.code === 401 || err.code === 403) handleAuthError(err);
      else setToast({ msg: "The ravens could not reach the Citadel — check your connection", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnother = () => {
    setSuccess(null);
    setForm({ name: "", email: "", phoneNumber: "", areaId: "", areaName: "" });
    setErrors({});
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const handleBackToDashboard = () => navigate(`/vao/dashboard/${resolvedVaoId}`);

  const pct = Math.round([form.name.trim(), form.email.trim(), form.phoneNumber.trim(), form.areaId].filter(Boolean).length / 4 * 100);

  if (authError) return <AuthErrorScreen message={authError.message} isExpired={authError.isExpired} onGoLogin={() => navigate("/vao/login", { replace: true })} onGoHome={() => navigate("/")} />;

  return (
    <>
      <Navbar />
      <div className="wp-page">
        <div className="wp-ambient" aria-hidden="true">
          <div className="wp-orb wp-orb--1" /><div className="wp-orb wp-orb--2" />
          <div className="wp-orb wp-orb--3" /><div className="wp-orb wp-orb--4" />
          <div className="wp-grid" /><div className="wp-scanline" />
        </div>

        {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}

        <div className={`wp-wrap${visible ? " wp-wrap--visible" : ""}`}>
          <button className="wp-back" onClick={handleBackToDashboard} type="button">
            <span className="wp-back__arrow">←</span><span>Return to the Great Hall</span>
          </button>

          <header className="wp-header">
            <div className="wp-header__badge">
              <span className="wp-header__badge-dot" /><span className="wp-header__badge-pulse" />
              <span className="wp-header__badge-sword">⚔</span>Village Administrative Officer
            </div>
            <h1 className="wp-header__title">
              <span className="wp-title-line1">Swear a New</span>
              <span className="wp-title-line2">Sworn Servant</span>
            </h1>
            <p className="wp-header__sub">Bind a new servant to your village's service. They shall receive a raven bearing their oath of activation, that they may set their credentials and begin their duties forthwith.</p>
            <div className="wp-header__deco" aria-hidden="true">
              <div className="wp-header__deco-line" /><div className="wp-header__deco-dot" /><div className="wp-header__deco-line" />
            </div>
          </header>

          {success ? (
            <SuccessOverlay workerName={success.workerName} workerId={success.workerId} assignedArea={success.assignedArea} onAddAnother={handleAddAnother} onDashboard={handleBackToDashboard} />
          ) : (
            <div className="wp-card">
              <div className="wp-card__glow" aria-hidden="true" />
              <div className="wp-card__accent" />
              <div className="wp-card__head">
                <div className="wp-card__icon"><span className="wp-card__icon-ring" aria-hidden="true" /><span className="wp-card__icon-inner">⚔</span></div>
                <div className="wp-card__head-text"><h2 className="wp-card__title">Servant's Chronicle</h2><p className="wp-card__sub">Fields marked * are binding upon the realm.</p></div>
                <div className="wp-card__progress">
                  <div className="wp-card__progress-track"><div className="wp-card__progress-fill" style={{ width: `${pct}%` }}><div className="wp-card__progress-shimmer" /></div></div>
                  <span className="wp-card__progress-label">{pct}%</span>
                </div>
              </div>

              <div className="wp-body">
                <div className="wp-grid-2">
                  <Field label="Servant's Full Name" required error={errors.name}>
                    <div className={["wp-input-wrap", focused==="name"?"wp-input-wrap--focused":"", errors.name?"wp-input-wrap--err":""].filter(Boolean).join(" ")}>
                      <span className="wp-input-pre-icon">🛡</span>
                      <input ref={nameRef} className="wp-input" name="name" value={form.name} onChange={handleChange} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} placeholder="e.g. Suresh of House Kumar" maxLength={150} autoFocus autoComplete="off" />
                    </div>
                  </Field>
                  <Field label="Mobile — Crystal Channel" required error={errors.phoneNumber}>
                    <div className={["wp-phone", focused==="phoneNumber"?"wp-phone--focused":"", errors.phoneNumber?"wp-phone--err":""].filter(Boolean).join(" ")}>
                      <span className="wp-phone__pre">+91</span>
                      <input className="wp-phone__input" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} onFocus={() => setFocused("phoneNumber")} onBlur={() => setFocused(null)} placeholder="9876543210" maxLength={10} inputMode="numeric" autoComplete="off" />
                    </div>
                  </Field>
                </div>

                <Field label="Email — Raven Address" required error={errors.email}>
                  <div className={["wp-input-wrap", focused==="email"?"wp-input-wrap--focused":"", errors.email?"wp-input-wrap--err":""].filter(Boolean).join(" ")}>
                    <span className="wp-input-pre-icon">🦅</span>
                    <input className="wp-input" type="email" name="email" value={form.email} onChange={handleChange} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} placeholder="servant@therealm.com" autoComplete="off" />
                  </div>
                </Field>

                <Field label="Area — Realm of Jurisdiction" required error={errors.areaId} hint={!areasLoading && !areasError && areas.length ? `${areas.length} ${areas.length === 1 ? "territory" : "territories"} available` : undefined}>
                  <AreaDropdown areas={areas} loading={areasLoading} fetchError={areasError} value={form.areaId} onChange={handleAreaChange} onRetry={fetchAreas} hasError={!!errors.areaId} />
                </Field>

                <div className="wp-callout">
                  <span className="wp-callout__icon">📜</span>
                  <div>
                    <p className="wp-callout__title">The Rite of Activation</p>
                    <p className="wp-callout__text">Once sworn, the servant will receive an activation message (raven). They must verify their identity and set their oath-word to activate their account. Their Servant's Seal (Worker ID) will be forged automatically by the Citadel. The territory assigned defines the realm within which they shall serve.</p>
                  </div>
                </div>
              </div>

              <div className="wp-foot">
                <button className="wp-btn wp-btn--ghost" onClick={handleBackToDashboard} type="button" disabled={loading}>Withdraw</button>
                <button className={`wp-btn wp-btn--primary${loading ? " wp-btn--busy" : ""}`} onClick={handleSubmit} type="button" disabled={loading}>
                  {loading ? <><span className="wp-btn__spin" />Binding the Oath…</> : <><span className="wp-btn__icon">⚔</span>Provision Servant</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}