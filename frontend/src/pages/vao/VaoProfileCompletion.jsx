import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../Styles/VaoProfile.css";

/* ─────────────────────────────────────────────
   STEPS
───────────────────────────────────────────── */
const STEPS = [
  { id: 1, icon: "👤", label: "Identity",  desc: "Personal details"  },
  { id: 2, icon: "📞", label: "Contact",   desc: "Office & phone"    },
  { id: 3, icon: "📸", label: "Documents", desc: "Photos & ID proof" },
  { id: 4, icon: "✅", label: "Review",    desc: "Confirm & submit"  },
];

/* ════════════════════════════════════════════
   BASE URL — single source of truth
════════════════════════════════════════════ */
const BASE = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

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

async function authUpload(url, formData) {
  const token = getToken();

  const res = await fetch(url, {
    method:  "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body:    formData,
  });

  if (res.status === 401) {
    localStorage.clear();
    const err = new Error("Session expired. Please log in again.");
    err.code = 401;
    throw err;
  }

  if (res.status === 403) {
    const err = new Error("You do not have permission to upload files.");
    err.code = 403;
    throw err;
  }

  return res;
}

/* ─────────────────────────────────────────────
   UPLOAD ENDPOINTS
───────────────────────────────────────────── */
const UPLOAD_ENDPOINTS = {
  profilePhotoUrl:   (vaoId) => `${BASE}/vao/${vaoId}/files/profile-photo`,
  signaturePhotoUrl: (vaoId) => `${BASE}/vao/${vaoId}/files/signature`,
  idProofUrl:        (vaoId) => `${BASE}/vao/${vaoId}/files/id-proof`,
};

function parseUploadUrl(data) {
  const raw =
    data?.url               ||
    data?.fileUrl           ||
    data?.photoUrl          ||
    data?.profilePhotoUrl   ||
    data?.signaturePhotoUrl ||
    data?.idProofUrl        ||
    data?.path              ||
    null;

  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (t.startsWith("blob:")) return null;
  return t;
}

/* ─────────────────────────────────────────────
   FIELD WRAPPER
───────────────────────────────────────────── */
function Field({ label, required, error, hint, children }) {
  return (
    <div className={`vp-field${error ? " vp-field--error" : ""}`}>
      <label className="vp-field__label">
        {label}
        {required && <span className="vp-field__req" aria-label="required">*</span>}
        {hint && <span className="vp-field__hint">{hint}</span>}
      </label>
      {children}
      {error && (
        <p className="vp-field__err" role="alert">
          <span className="vp-field__err-icon" aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PHOTO UPLOADER
───────────────────────────────────────────── */
function PhotoUploader({
  label, fieldName, value, onChange, onClearError,
  required, icon, error, landscape, vaoId,
  onAuthError,
}) {
  const [previewSrc,   setPreviewSrc]   = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadErrMsg, setUploadErrMsg] = useState("");
  const inputRef = useRef(null);

  const displaySrc = previewSrc || (
    value && !value.startsWith("blob:") ? value : null
  );

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    setPreviewSrc(blobUrl);
    setUploadStatus("idle");
    setUploadErrMsg("");
    onClearError(fieldName);
    onChange(fieldName, "");
    setUploading(true);

    const endpoint = UPLOAD_ENDPOINTS[fieldName]?.(vaoId);

    if (!endpoint) {
      setUploadStatus("error");
      setUploadErrMsg("No upload endpoint configured for this field.");
      setUploading(false);
      setPreviewSrc(null);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await authUpload(endpoint, fd);

      if (!res.ok) {
        const errText = await res.text().catch(() => "Upload failed");
        throw new Error(errText || `Upload failed (${res.status})`);
      }

      const data = await res.json().catch(() => ({}));
      const serverUrl = parseUploadUrl(data);

      if (!serverUrl) throw new Error("Server did not return a valid file URL.");

      onChange(fieldName, serverUrl);
      setUploadStatus("done");
    } catch (err) {
      if (err.code === 401 || err.code === 403) {
        onAuthError?.(err);
        return;
      }
      onChange(fieldName, "");
      setPreviewSrc(null);
      setUploadStatus("error");
      setUploadErrMsg(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [fieldName, onChange, onClearError, vaoId, onAuthError]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  useEffect(() => {
    return () => { if (previewSrc) URL.revokeObjectURL(previewSrc); };
  }, [previewSrc]);

  return (
    <div
      className={[
        "vp-uploader",
        landscape                         ? "vp-uploader--landscape"  : "",
        displaySrc                        ? "vp-uploader--filled"     : "",
        error || uploadStatus === "error" ? "vp-uploader--err"        : "",
        uploading                         ? "vp-uploader--uploading"  : "",
      ].filter(Boolean).join(" ")}
      onClick={() => !uploading && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      aria-label={`Upload ${label}${required ? " (required)" : " (optional)"}`}
      aria-invalid={!!(error || uploadStatus === "error")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,application/pdf"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
        aria-hidden="true"
      />

      {displaySrc ? (
        <div className="vp-uploader__preview">
          <img
            src={displaySrc}
            alt={label}
            className="vp-uploader__img"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <div className="vp-uploader__overlay">
            {uploading ? (
              <>
                <div className="vp-uploader__spinner" aria-label="Uploading…" />
                <span className="vp-uploader__overlay-txt">Uploading…</span>
              </>
            ) : (
              <>
                <span className="vp-uploader__overlay-icon" aria-hidden="true">🔄</span>
                <span className="vp-uploader__overlay-txt">Change</span>
              </>
            )}
          </div>
          {uploadStatus === "done" && !uploading && (
            <div className="vp-uploader__done-badge" aria-label="Saved to server">✓</div>
          )}
          {uploadStatus === "idle" && !uploading && value && !value.startsWith("blob:") && (
            <div className="vp-uploader__done-badge vp-uploader__done-badge--existing" aria-label="Previously uploaded">↺</div>
          )}
        </div>
      ) : (
        <div className="vp-uploader__empty">
          {uploadStatus === "error" ? (
            <>
              <div className="vp-uploader__empty-icon" aria-hidden="true">⚠️</div>
              <p className="vp-uploader__empty-label">Upload Failed</p>
              <p className="vp-uploader__empty-hint vp-uploader__empty-hint--err">
                {uploadErrMsg}
              </p>
              <p className="vp-uploader__empty-hint">Click to retry</p>
            </>
          ) : (
            <>
              <div className="vp-uploader__empty-icon" aria-hidden="true">{icon}</div>
              <p className="vp-uploader__empty-label">{label}</p>
              <p className="vp-uploader__empty-hint">
                {uploading ? "Uploading to server…" : `Click or drop · ${required ? "Required" : "Optional"}`}
              </p>
              {uploading && (
                <div className="vp-uploader__spinner vp-uploader__spinner--center" aria-label="Uploading" />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   REVIEW ROW
───────────────────────────────────────────── */
function ReviewRow({ icon, label, value, onEdit, thumbSrc }) {
  return (
    <div className="vp-review-row">
      <span className="vp-review-row__icon" aria-hidden="true">{icon}</span>
      <div className="vp-review-row__body">
        <span className="vp-review-row__lbl">{label}</span>
        {thumbSrc ? (
          <img src={thumbSrc} alt={`${label} preview`} className="vp-review-row__thumb"
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <span className={`vp-review-row__val${!value ? " vp-review-row__val--empty" : ""}`}>
            {value || "Not provided"}
          </span>
        )}
      </div>
      <button className="vp-review-row__edit" onClick={onEdit} type="button" aria-label={`Edit ${label}`}>
        Edit
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
function Toast({ msg, type }) {
  return (
    <div className={`vp-toast vp-toast--${type}`} role="status" aria-live="polite">
      <span className="vp-toast__icon" aria-hidden="true">{type === "success" ? "✓" : "✕"}</span>
      <span>{msg}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP RAIL
───────────────────────────────────────────── */
function StepRail({ currentStep, onGoStep }) {
  return (
    <nav className="vp-rail" aria-label="Form steps">
      {STEPS.map((s, i) => {
        const done   = currentStep > s.id;
        const active = currentStep === s.id;
        return (
          <div key={s.id} className="vp-rail__item">
            <button
              className={["vp-rail__btn", active?"active":"", done?"done":"", !done&&!active?"locked":""].filter(Boolean).join(" ")}
              onClick={() => done && onGoStep(s.id)}
              type="button"
              disabled={!done && !active}
              aria-current={active ? "step" : undefined}
            >
              <div className="vp-rail__circle">
                {done
                  ? <span className="vp-rail__check" aria-hidden="true">✓</span>
                  : <span aria-hidden="true">{s.icon}</span>
                }
              </div>
              <div className="vp-rail__text">
                <span className="vp-rail__label">{s.label}</span>
                <span className="vp-rail__desc">{s.desc}</span>
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`vp-rail__line${done?" vp-rail__line--done":""}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ─────────────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <>
      <Navbar />
      <div className="vp-page">
        <div className="vp-ambient" aria-hidden="true">
          <div className="vp-orb vp-orb--1" /><div className="vp-orb vp-orb--2" /><div className="vp-dot-grid" />
        </div>
        <div className="vp-wrap">
          <div className="vp-skeleton-wrap" aria-label="Loading profile" role="status">
            <div className="vp-sk vp-sk--title" /><div className="vp-sk vp-sk--sub" />
            <div className="vp-sk vp-sk--rail" /><div className="vp-sk vp-sk--card" />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

/* ─────────────────────────────────────────────
   AUTH ERROR SCREEN
───────────────────────────────────────────── */
function AuthErrorScreen({ message, isExpired }) {
  return (
    <>
      <Navbar />
      <div style={{
        minHeight: "calc(100vh - 68px)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        fontFamily: "DM Sans, system-ui, sans-serif", textAlign: "center", padding: 40,
        background: "var(--bg-main, #f2f5f0)", color: "var(--text-main, #172117)",
      }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(184,64,64,.09)", border: "2px solid rgba(184,64,64,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>🔒</div>
        <div style={{ fontSize: 76, fontWeight: 800, color: "#b84040", lineHeight: 1 }}>
          {isExpired ? "401" : "403"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>
          {isExpired ? "Session Expired" : "Access Denied"}
        </div>
        <div style={{ fontSize: 14, color: "#6b7e6f", maxWidth: 400, lineHeight: 1.75, background: "rgba(184,64,64,.05)", border: "1px solid rgba(184,64,64,.14)", borderRadius: 12, padding: "16px 24px" }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          {isExpired && (
            <a href="/vao/login" style={{ padding: "10px 28px", borderRadius: 8, background: "#25593f", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>→ Log In Again</a>
          )}
          <a href="/" style={{ padding: "10px 28px", borderRadius: 8, background: "transparent", color: "#25593f", border: "1.5px solid #25593f", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>← Home</a>
        </div>
      </div>
      <Footer />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function VaoProfileCompletion() {
  const navigate = useNavigate();
  const { vaoId: paramVaoId } = useParams();

  const storedId   = getAccountId();
  const storedType = getAccountType();

  const vaoId = (
    paramVaoId &&
    getToken() &&
    storedId === paramVaoId &&
    storedType === "VAO"
  ) ? paramVaoId : null;

  const [step,        setStep]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [errors,      setErrors]      = useState({});
  const [toast,       setToast]       = useState(null);
  const [animState,   setAnimState]   = useState({ key: 0, dir: "fwd" });
  const [isUpdate,    setIsUpdate]    = useState(false);
  const [authError,   setAuthError]   = useState(null);
  const wrapRef = useRef(null);

  const [form, setForm] = useState({
    fullName:          "",
    dateOfBirth:       "",
    gender:            "",
    qualification:     "",
    alternatePhone:    "",
    officeAddress:     "",
    profilePhotoUrl:   "",
    signaturePhotoUrl: "",
    idProofUrl:        "",
  });

  const handleAuthError = useCallback((err) => {
    if (err.code === 401) {
      setAuthError({ message: err.message, isExpired: true });
      setTimeout(() => navigate("/vao/login", { replace: true }), 2000);
    } else {
      setAuthError({ message: err.message, isExpired: false });
    }
  }, [navigate]);

  /* ── Init: GET /vao/profile ── */
  useEffect(() => {
    if (!vaoId) { setInitLoading(false); return; }
    (async () => {
      try {
        const res = await authFetch(`${BASE}/vao/profile`);
        if (!res.ok) return;
        const pd = await res.json().catch(() => null);
        if (!pd) return;

        if (pd.profileCompleted === true) {
          setIsUpdate(true);
          setForm({
            fullName:          pd.fullName          ?? "",
            dateOfBirth:       pd.dateOfBirth       ?? "",
            gender:            pd.gender            ?? "",
            qualification:     pd.qualification     ?? "",
            alternatePhone:    pd.alternatePhone    ?? "",
            officeAddress:     pd.officeAddress     ?? "",
            profilePhotoUrl:   isRealUrl(pd.profilePhotoUrl)   ? pd.profilePhotoUrl   : "",
            signaturePhotoUrl: isRealUrl(pd.signaturePhotoUrl) ? pd.signaturePhotoUrl : "",
            idProofUrl:        isRealUrl(pd.idProofUrl)        ? pd.idProofUrl        : "",
          });
        }
      } catch (e) {
        if (e.code === 401) {
          setAuthError({ message: e.message, isExpired: true });
          setTimeout(() => navigate("/vao/login", { replace: true }), 2000);
        } else if (e.code === 403) {
          setAuthError({ message: e.message, isExpired: false });
        }
      } finally {
        setInitLoading(false);
      }
    })();
  }, [vaoId, navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: "" }));
  }, []);

  const handleUpload = useCallback((fieldName, url) => {
    setForm(f => ({ ...f, [fieldName]: url }));
    setErrors(er => ({ ...er, [fieldName]: "" }));
  }, []);

  const clearError = useCallback((fieldName) => {
    setErrors(er => ({ ...er, [fieldName]: "" }));
  }, []);

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.fullName.trim())  e.fullName    = "Full name is required";
      if (!form.dateOfBirth)      e.dateOfBirth = "Date of birth is required";
      if (!form.gender)           e.gender      = "Please select a gender";
    }
    if (s === 2) {
      if (!form.officeAddress.trim()) e.officeAddress = "Office address is required";
      if (form.alternatePhone && !/^\d{10}$/.test(form.alternatePhone))
        e.alternatePhone = "Enter a valid 10-digit phone number";
    }
    if (s === 3) {
      if (!form.profilePhotoUrl)   e.profilePhotoUrl   = "Please upload your profile photo";
      if (!form.signaturePhotoUrl) e.signaturePhotoUrl = "Please upload your signature";
      if (form.profilePhotoUrl?.startsWith("blob:"))
        e.profilePhotoUrl = "Photo upload incomplete — please wait or retry";
      if (form.signaturePhotoUrl?.startsWith("blob:"))
        e.signaturePhotoUrl = "Signature upload incomplete — please wait or retry";
    }
    return e;
  };

  const goNext = () => {
    const e = validate(step);
    if (Object.keys(e).length) {
      setErrors(e);
      const el = document.querySelector(".vp-field--error .vp-input, .vp-field--error .vp-uploader");
      el?.classList.add("vp-shake");
      setTimeout(() => el?.classList.remove("vp-shake"), 500);
      return;
    }
    setAnimState({ key: animState.key + 1, dir: "fwd" });
    setStep(s => Math.min(s + 1, 4));
    setErrors({});
  };

  const goPrev = () => {
    setAnimState({ key: animState.key + 1, dir: "bck" });
    setStep(s => Math.max(s - 1, 1));
    setErrors({});
  };

  const goStep = (n) => {
    if (n === step) return;
    setAnimState({ key: animState.key + 1, dir: n < step ? "bck" : "fwd" });
    setStep(n);
    setErrors({});
  };

  const handleBackToDashboard = () => {
    navigate(`/vao/dashboard/${vaoId}`);
  };

  /* ── Submit ──
     Complete: POST /vao/profile/complete  → @PostMapping("/complete")
     Update:   PUT  /vao/profile           → @PutMapping
  */
  const submitProfile = async () => {
    const blobFields = ["profilePhotoUrl", "signaturePhotoUrl", "idProofUrl"]
      .filter(f => form[f]?.startsWith("blob:"));
    if (blobFields.length) {
      setToast({ msg: "Please wait for all uploads to finish before submitting.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const method   = isUpdate ? "PUT"  : "POST";
      const endpoint = isUpdate
        ? `${BASE}/vao/profile`          // Fixed: was /vao/profile/update — no such mapping
        : `${BASE}/vao/profile/complete`;

      const res = await authFetch(endpoint, {
        method,
        body: JSON.stringify(form),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `Profile ${isUpdate ? "update" : "completion"} failed`);

      setToast({
        msg:  isUpdate ? "Profile updated successfully!" : "Profile completed successfully!",
        type: "success",
      });
      setTimeout(() => navigate(`/vao/dashboard/${vaoId}`), 1800);
    } catch (err) {
      if (err.code === 401) {
        setAuthError({ message: err.message, isExpired: true });
        setTimeout(() => navigate("/vao/login", { replace: true }), 2000);
      } else if (err.code === 403) {
        setAuthError({ message: err.message, isExpired: false });
      } else {
        setToast({ msg: err.message, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const filledFields = [
    form.fullName, form.dateOfBirth, form.gender,
    form.officeAddress, form.profilePhotoUrl, form.signaturePhotoUrl,
  ].filter(Boolean).length;
  const pct = Math.round((filledFields / 6) * 100);

  /* ── EARLY RETURNS ── */
  if (!vaoId) return (
    <>
      <Navbar />
      <div style={{
        minHeight: "calc(100vh - 68px)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        fontFamily: "DM Sans, system-ui, sans-serif", textAlign: "center", padding: 40,
        background: "var(--bg-main, #f2f5f0)", color: "var(--text-main, #172117)",
      }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(184,64,64,.09)", border: "2px solid rgba(184,64,64,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>🔒</div>
        <div style={{ fontSize: 76, fontWeight: 800, color: "#b84040", lineHeight: 1 }}>401</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>Unauthorised Access</div>
        <div style={{ fontSize: 14, color: "#6b7e6f", maxWidth: 400, lineHeight: 1.75, background: "rgba(184,64,64,.05)", border: "1px solid rgba(184,64,64,.14)", borderRadius: 12, padding: "16px 24px" }}>
          You don't have permission to access this profile page.<br />Please log in with a valid VAO account.
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <a href="/vao/login" style={{ padding: "10px 28px", borderRadius: 8, background: "#25593f", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>→ Go to Login</a>
          <a href="/" style={{ padding: "10px 28px", borderRadius: 8, background: "transparent", color: "#25593f", border: "1.5px solid #25593f", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>← Home</a>
        </div>
      </div>
      <Footer />
    </>
  );

  if (authError) return (
    <AuthErrorScreen message={authError.message} isExpired={authError.isExpired} />
  );

  if (initLoading) return <LoadingSkeleton />;

  return (
    <>
      <Navbar />
      <div className="vp-page">
        <div className="vp-ambient" aria-hidden="true">
          <div className="vp-orb vp-orb--1" /><div className="vp-orb vp-orb--2" />
          <div className="vp-orb vp-orb--3" /><div className="vp-orb vp-orb--4" />
          <div className="vp-dot-grid" />
          <div className="vp-noise" />
        </div>

        {toast && <Toast msg={toast.msg} type={toast.type} />}

        <div className="vp-wrap" ref={wrapRef}>

          <button className="vp-back-btn" onClick={handleBackToDashboard} type="button">
            <span>←</span> Back to Dashboard
          </button>

          <header className="vp-header">
            <p className="vp-header__eyebrow">
              <span className="vp-header__dot" aria-hidden="true" />
              <span className="vp-header__dot-pulse" aria-hidden="true" />
              Village Administrative Officer
            </p>
            <h1 className="vp-header__title">
              {isUpdate ? "Update Your Profile" : "Complete Your Profile"}
            </h1>
            <p className="vp-header__sub">
              {isUpdate
                ? "Update your VAO profile details. Changes will be reflected on your ID card and dashboard."
                : "Provide your operational details to activate your VAO account and unlock the dashboard."
              }
            </p>
            {isUpdate && (
              <div className="vp-update-badge" role="status">
                ✏️ Profile Update Mode — your existing data is pre-filled
              </div>
            )}
            <div className="vp-pbar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="vp-pbar__track">
                <div className="vp-pbar__fill" style={{ width: `${pct}%` }}>
                  <div className="vp-pbar__shimmer" />
                </div>
              </div>
              <span className="vp-pbar__label">{pct}%</span>
            </div>
          </header>

          <StepRail currentStep={step} onGoStep={goStep} />

          <div key={`step-${animState.key}`} className={`vp-card vp-card--${animState.dir}`}>

            {/* ════ STEP 1 — Identity ════ */}
            {step === 1 && (
              <div className="vp-body">
                <div className="vp-body__head">
                  <div className="vp-body__icon" aria-hidden="true">👤</div>
                  <div>
                    <h2 className="vp-body__title">Personal Identity</h2>
                    <p className="vp-body__sub">Your official name, date of birth, and gender as per government records.</p>
                  </div>
                </div>
                <div className="vp-grid vp-grid--2">
                  <Field label="Full Name" required error={errors.fullName}>
                    <input className={`vp-input${errors.fullName?" vp-input--err":""}`} name="fullName" value={form.fullName} onChange={handleChange} placeholder="e.g. Rajesh Kumar" autoFocus autoComplete="name" />
                  </Field>
                  <Field label="Date of Birth" required error={errors.dateOfBirth}>
                    <input className={`vp-input vp-input--date${errors.dateOfBirth?" vp-input--err":""}`} type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} max={new Date().toISOString().split("T")[0]} />
                  </Field>
                  <Field label="Gender" required error={errors.gender}>
                    <div className="vp-select-wrap">
                      <select className={`vp-input vp-select${errors.gender?" vp-input--err":""}`} name="gender" value={form.gender} onChange={handleChange}>
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other / Prefer not to say</option>
                      </select>
                    </div>
                  </Field>
                  <Field label="Qualification" hint="optional" error={errors.qualification}>
                    <input className="vp-input" name="qualification" value={form.qualification} onChange={handleChange} placeholder="e.g. B.A., M.A., B.Sc." autoComplete="off" />
                  </Field>
                </div>
              </div>
            )}

            {/* ════ STEP 2 — Contact ════ */}
            {step === 2 && (
              <div className="vp-body">
                <div className="vp-body__head">
                  <div className="vp-body__icon" aria-hidden="true">📞</div>
                  <div>
                    <h2 className="vp-body__title">Contact & Office</h2>
                    <p className="vp-body__sub">Your official contact number and registered office address.</p>
                  </div>
                </div>
                <div className="vp-grid vp-grid--1">
                  <Field label="Alternate Phone" hint="optional" error={errors.alternatePhone}>
                    <div className={`vp-phone${errors.alternatePhone?" vp-phone--err":""}`}>
                      <span className="vp-phone__pre" aria-hidden="true">+91</span>
                      <input className="vp-input vp-phone__input" name="alternatePhone" value={form.alternatePhone} onChange={handleChange} placeholder="9876543210" maxLength={10} inputMode="numeric" pattern="[0-9]*" autoComplete="tel-national" autoFocus />
                    </div>
                  </Field>
                  <Field label="Office Address" required error={errors.officeAddress}>
                    <textarea className={`vp-input vp-textarea${errors.officeAddress?" vp-input--err":""}`} name="officeAddress" value={form.officeAddress} onChange={handleChange} placeholder="e.g. VAO Office, Ward 4, Alamandakothapalle, Nellore District, AP – 524002" rows={4} autoComplete="street-address" />
                  </Field>
                </div>
              </div>
            )}

            {/* ════ STEP 3 — Documents ════ */}
            {step === 3 && (
              <div className="vp-body">
                <div className="vp-body__head">
                  <div className="vp-body__icon" aria-hidden="true">📸</div>
                  <div>
                    <h2 className="vp-body__title">Profile Documents</h2>
                    <p className="vp-body__sub">
                      Upload your official photo, signature, and ID proof.
                      {isUpdate ? " New uploads will replace existing ones." : " Files are stored securely on the server."}
                    </p>
                  </div>
                </div>
                <div className="vp-doc-row">
                  <div className="vp-doc-slot vp-doc-slot--portrait">
                    <Field label="Profile Photo" required error={errors.profilePhotoUrl}>
                      <PhotoUploader
                        label="Profile Photo" fieldName="profilePhotoUrl"
                        value={form.profilePhotoUrl} onChange={handleUpload}
                        onClearError={clearError} required icon="🖼"
                        error={errors.profilePhotoUrl} vaoId={vaoId}
                        onAuthError={handleAuthError}
                      />
                    </Field>
                  </div>
                  <div className="vp-doc-slot vp-doc-slot--stack">
                    <Field label="Signature" required error={errors.signaturePhotoUrl}>
                      <PhotoUploader
                        label="Signature" fieldName="signaturePhotoUrl"
                        value={form.signaturePhotoUrl} onChange={handleUpload}
                        onClearError={clearError} required icon="✍️"
                        error={errors.signaturePhotoUrl} landscape vaoId={vaoId}
                        onAuthError={handleAuthError}
                      />
                    </Field>
                    <Field label="ID Proof" hint="optional" error={errors.idProofUrl}>
                      <PhotoUploader
                        label="ID Proof" fieldName="idProofUrl"
                        value={form.idProofUrl} onChange={handleUpload}
                        onClearError={clearError} required={false} icon="🪪"
                        error={errors.idProofUrl} landscape vaoId={vaoId}
                        onAuthError={handleAuthError}
                      />
                    </Field>
                  </div>
                </div>
                <div className="vp-doc-info" role="note">
                  <span aria-hidden="true">ℹ️</span>
                  <span>Accepted: JPG, PNG, PDF · Max 5 MB per file · Saved to server immediately on upload</span>
                </div>
              </div>
            )}

            {/* ════ STEP 4 — Review ════ */}
            {step === 4 && (
              <div className="vp-body">
                <div className="vp-body__head">
                  <div className="vp-body__icon" aria-hidden="true">{isUpdate ? "✏️" : "✅"}</div>
                  <div>
                    <h2 className="vp-body__title">{isUpdate ? "Review & Update" : "Review & Submit"}</h2>
                    <p className="vp-body__sub">
                      {isUpdate ? "Review your changes before saving." : "Verify all information before completing your profile setup."}
                    </p>
                  </div>
                </div>

                <div className="vp-id-preview" role="region" aria-label="ID card preview">
                  <div className="vp-id-preview__photo-wrap">
                    {form.profilePhotoUrl && !form.profilePhotoUrl.startsWith("blob:") ? (
                      <img src={form.profilePhotoUrl} alt="Your profile photo" className="vp-id-preview__photo"
                        onError={e => { e.currentTarget.style.display="none"; }} />
                    ) : (
                      <div className="vp-id-preview__photo-placeholder" aria-label="No photo">👤</div>
                    )}
                  </div>
                  <div className="vp-id-preview__info">
                    <p className="vp-id-preview__name">{form.fullName || "—"}</p>
                    <p className="vp-id-preview__role">Village Administrative Officer</p>
                    <div className="vp-id-preview__chips">
                      {form.gender        && <span className="vp-id-chip">{form.gender}</span>}
                      {form.qualification && <span className="vp-id-chip">{form.qualification}</span>}
                      <span className={`vp-id-chip ${isUpdate?"vp-id-chip--ok":"vp-id-chip--pending"}`}>
                        {isUpdate ? "✓ Verified" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                  {form.signaturePhotoUrl && !form.signaturePhotoUrl.startsWith("blob:") && (
                    <div className="vp-id-preview__sig-wrap">
                      <p className="vp-id-preview__sig-lbl">Signature</p>
                      <img src={form.signaturePhotoUrl} alt="Your signature" className="vp-id-preview__sig"
                        onError={e => { e.currentTarget.style.display="none"; }} />
                    </div>
                  )}
                </div>

                <div className="vp-review" role="list">
                  <div className="vp-review__section" role="listitem">
                    <h3 className="vp-review__title">
                      <span aria-hidden="true">👤</span> Personal Identity
                      <button className="vp-review__section-edit" onClick={() => goStep(1)} type="button">Edit</button>
                    </h3>
                    <ReviewRow icon="📛" label="Full Name"     value={form.fullName}      onEdit={() => goStep(1)} />
                    <ReviewRow icon="🎂" label="Date of Birth" value={form.dateOfBirth}   onEdit={() => goStep(1)} />
                    <ReviewRow icon="⚥"  label="Gender"        value={form.gender}        onEdit={() => goStep(1)} />
                    <ReviewRow icon="🎓" label="Qualification" value={form.qualification} onEdit={() => goStep(1)} />
                  </div>
                  <div className="vp-review__section" role="listitem">
                    <h3 className="vp-review__title">
                      <span aria-hidden="true">📞</span> Contact & Office
                      <button className="vp-review__section-edit" onClick={() => goStep(2)} type="button">Edit</button>
                    </h3>
                    <ReviewRow icon="📱" label="Alternate Phone" value={form.alternatePhone ? `+91 ${form.alternatePhone}` : ""} onEdit={() => goStep(2)} />
                    <ReviewRow icon="🏢" label="Office Address"  value={form.officeAddress} onEdit={() => goStep(2)} />
                  </div>
                  <div className="vp-review__section" role="listitem">
                    <h3 className="vp-review__title">
                      <span aria-hidden="true">📸</span> Documents
                      <button className="vp-review__section-edit" onClick={() => goStep(3)} type="button">Edit</button>
                    </h3>
                    <ReviewRow icon="🖼"  label="Profile Photo" value={form.profilePhotoUrl ? "Uploaded ✓" : ""} thumbSrc={form.profilePhotoUrl && !form.profilePhotoUrl.startsWith("blob:") ? form.profilePhotoUrl : null} onEdit={() => goStep(3)} />
                    <ReviewRow icon="✍️" label="Signature"     value={form.signaturePhotoUrl ? "Uploaded ✓" : ""} thumbSrc={form.signaturePhotoUrl && !form.signaturePhotoUrl.startsWith("blob:") ? form.signaturePhotoUrl : null} onEdit={() => goStep(3)} />
                    <ReviewRow icon="🪪"  label="ID Proof"      value={form.idProofUrl ? "Uploaded ✓" : ""} thumbSrc={form.idProofUrl && !form.idProofUrl.startsWith("blob:") ? form.idProofUrl : null} onEdit={() => goStep(3)} />
                  </div>
                </div>

                <p className="vp-legal" role="note">
                  {isUpdate
                    ? "By saving, you confirm all updated information is accurate and authentic."
                    : "By submitting, you confirm all information is accurate and authentic. Providing false information is a punishable offence under applicable law."
                  }
                </p>
              </div>
            )}

            <div className="vp-foot">
              <button className="vp-btn vp-btn--ghost" onClick={goPrev} type="button" disabled={step === 1}>
                <span aria-hidden="true">←</span> Back
              </button>
              <div className="vp-foot__right">
                <span className="vp-foot__counter">{step} / {STEPS.length}</span>
                {step < 4 ? (
                  <button className="vp-btn vp-btn--primary" onClick={goNext} type="button">
                    Continue <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <button
                    className={`vp-btn vp-btn--submit${loading?" vp-btn--busy":""}`}
                    onClick={submitProfile} type="button" disabled={loading}
                  >
                    {loading ? (
                      <><span className="vp-btn__spin" aria-hidden="true" />{isUpdate ? "Saving…" : "Submitting…"}</>
                    ) : (
                      <><span aria-hidden="true">✓</span>{isUpdate ? "Save Changes" : "Complete Profile"}</>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function isRealUrl(url) {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith("blob:")) return false;
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}