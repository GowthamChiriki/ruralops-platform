import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";  // ✅ removed useParams — worker identity from JWT
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/WorkerProfile.css";

/* ─────────────────────────────────────────────
   API BASE — single source of truth
───────────────────────────────────────────── */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/* ════════════════════════════════════════════
   AUTH HELPERS
   All read fresh on every call — never stale.
════════════════════════════════════════════ */
function getToken()      { return localStorage.getItem("accessToken"); }
function getAccountType(){ return localStorage.getItem("accountType"); }
function getAccountId()  { return localStorage.getItem("accountId"); }

/**
 * Central fetch wrapper for ALL protected requests.
 * - Attaches Authorization: Bearer <token> fresh on every call.
 * - Throws typed errors for 401 (expired) and 403 (forbidden).
 * - Returns the raw Response so callers choose .json() / .text().
 */
async function authFetch(url, options = {}) {
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
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
   STEPS
───────────────────────────────────────────── */
const STEPS = [
  { id: 1, icon: "👤", label: "Identity", desc: "Personal details" },
  { id: 2, icon: "🏠", label: "Address",  desc: "House & location" },
  { id: 3, icon: "📸", label: "Photo",    desc: "Profile picture"  },
  { id: 4, icon: "✅", label: "Review",   desc: "Confirm & submit" },
];

/*
 * ✅ Updated endpoints — worker identity resolved from JWT, no workerId in URL.
 *
 * If your backend still requires workerId in the upload path
 * (POST /worker/files/{workerId}/profile-photo), switch to:
 *   const UPLOAD_FILE_ENDPOINT = (id) => `${BASE_URL}/worker/files/${id}/profile-photo`
 * and pass workerId when calling: authFetch(UPLOAD_FILE_ENDPOINT(workerId), ...)
 */
const PHOTO_PATCH_ENDPOINT = (photoUrl) =>
  `${BASE_URL}/worker/profile/photo?photoUrl=${encodeURIComponent(photoUrl)}`;

const UPLOAD_FILE_ENDPOINT = () =>
  `${BASE_URL}/worker/files/profile-photo`;

function parseUploadUrl(data) {
  const raw =
    data?.url             ||
    data?.fileUrl         ||
    data?.photoUrl        ||
    data?.profilePhotoUrl ||
    data?.path            ||
    null;
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (t.startsWith("blob:")) return null;
  return t;
}

function isRealUrl(url) {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (!t || t.startsWith("blob:")) return false;
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}

/* ─────────────────────────────────────────────
   STEP RAIL
───────────────────────────────────────────── */
function StepRail({ currentStep, onGoStep }) {
  return (
    <div className="wp-step-rail" role="navigation" aria-label="Form steps">
      {STEPS.map((s, i) => {
        const done   = currentStep > s.id;
        const active = currentStep === s.id;
        return (
          <div key={s.id} className="wp-step-rail__item">
            <button
              className={[
                "wp-step-rail__btn",
                active ? "wp-step-rail__btn--active" : "",
                done   ? "wp-step-rail__btn--done"   : "",
              ].filter(Boolean).join(" ")}
              onClick={() => done && onGoStep(s.id)}
              type="button"
              disabled={!done && !active}
              aria-current={active ? "step" : undefined}
            >
              <div className="wp-step-rail__circle">
                {done
                  ? <span aria-hidden="true">✓</span>
                  : <span aria-hidden="true">{s.icon}</span>}
              </div>
              <div className="wp-step-rail__text">
                <span className="wp-step-rail__label">{s.label}</span>
                <span className="wp-step-rail__desc">{s.desc}</span>
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`wp-step-rail__line${done ? " wp-step-rail__line--done" : ""}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PHOTO UPLOADER
   ✅ workerId prop removed — upload endpoint no longer requires it.
   Worker identity resolved from JWT server-side.
───────────────────────────────────────────── */
function PhotoUploader({ value, onChange, onClearError, error }) {
  const [previewSrc,   setPreviewSrc]   = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadErrMsg, setUploadErrMsg] = useState("");
  const inputRef = useRef(null);

  const displaySrc = previewSrc || (value && !value.startsWith("blob:") ? value : null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setPreviewSrc(blobUrl);
    setUploadStatus("idle");
    setUploadErrMsg("");
    onClearError("profilePhotoUrl");
    onChange("profilePhotoUrl", "");
    setUploading(true);

    try {
      /* ── Step 1: upload file, get back a URL ── */
      const fd = new FormData();
      fd.append("file", file);

      const uploadRes = await authFetch(UPLOAD_FILE_ENDPOINT(), {
        method: "POST",
        body:   fd,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => "Upload failed");
        throw new Error(errText || `Upload failed (${uploadRes.status})`);
      }

      const uploadData = await uploadRes.json().catch(() => ({}));
      const serverUrl  = parseUploadUrl(uploadData);
      if (!serverUrl) throw new Error("Server did not return a valid file URL.");

      /* ── Step 2: PATCH /worker/profile/photo?photoUrl=<url> ── */
      const patchRes = await authFetch(PHOTO_PATCH_ENDPOINT(serverUrl), {
        method: "PATCH",
      });

      if (!patchRes.ok) {
        const errText = await patchRes.text().catch(() => "Photo update failed");
        throw new Error(errText || `Photo update failed (${patchRes.status})`);
      }

      onChange("profilePhotoUrl", serverUrl);
      setUploadStatus("done");
    } catch (err) {
      onChange("profilePhotoUrl", "");
      setPreviewSrc(null);
      setUploadStatus("error");
      setUploadErrMsg(
        err.code === 401 ? "Session expired — please log in again." :
        err.code === 403 ? "You don't have permission to upload files." :
        err.message || "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }, [onChange, onClearError]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  useEffect(() => {
    return () => { if (previewSrc) URL.revokeObjectURL(previewSrc); };
  }, [previewSrc]);

  return (
    <div className="wp-section-body wp-section-body--photo">
      <div className="wp-current-photo">
        {displaySrc ? (
          <>
            <img
              src={displaySrc}
              alt="Profile photo preview"
              className="wp-current-photo__img"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <span className="wp-current-photo__label">
              {uploadStatus === "done"
                ? "✓ Saved to server"
                : uploading
                ? "Uploading…"
                : "Current photo"}
            </span>
          </>
        ) : (
          <div className="wp-current-photo__none" aria-label="No photo uploaded">👤</div>
        )}
      </div>

      <div
        className="wp-file-input-wrap"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <label className="wp-file-label" htmlFor="wp-photo-input">
          <span className="wp-file-label__icon" aria-hidden="true">
            {uploading ? "⏳" : uploadStatus === "error" ? "⚠️" : "📷"}
          </span>
          <span className="wp-file-label__title">
            {uploading
              ? "Uploading…"
              : uploadStatus === "error"
              ? "Upload Failed — Click to retry"
              : displaySrc
              ? "Change Photo"
              : "Upload Profile Photo"}
          </span>
          <span className="wp-file-label__sub">
            {uploadStatus === "error"
              ? uploadErrMsg
              : "JPG or PNG · Max 5 MB · Saved to server immediately"}
          </span>
        </label>
        <input
          ref={inputRef}
          id="wp-photo-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="wp-file-input"
          disabled={uploading}
          onChange={(e) => handleFile(e.target.files[0])}
          aria-label="Upload profile photo"
        />
      </div>

      {error && (
        <p className="wp-hint" style={{ color: "var(--rose)" }} role="alert">⚠ {error}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
function Toast({ msg, type }) {
  return (
    <div
      style={{
        position: "fixed", top: 24, right: 24, zIndex: 9999,
        display: "flex", alignItems: "center", gap: 10,
        padding: "13px 20px",
        background: type === "success"
          ? "linear-gradient(135deg,#0e2418,#152e20)"
          : "linear-gradient(135deg,#1e0c0c,#2a1010)",
        border: `1px solid ${type === "success" ? "rgba(55,138,85,.35)" : "rgba(158,51,40,.35)"}`,
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-lg)",
        fontFamily: "var(--fh)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".09em",
        textTransform: "uppercase",
        color: type === "success" ? "var(--emerald)" : "var(--rose)",
        animation: "fadeUp .3s var(--ease) both",
        maxWidth: 360,
      }}
      role="status"
      aria-live="polite"
    >
      <span aria-hidden="true">{type === "success" ? "✓" : "✕"}</span>
      <span>{msg}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REVIEW ROW
───────────────────────────────────────────── */
function ReviewRow({ icon, label, value, onEdit, masked, thumbSrc }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "9px 0",
      borderBottom: "1px solid var(--vd-border)",
    }}>
      <span style={{ fontSize: 14, width: 22, textAlign: "center", flexShrink: 0 }} aria-hidden="true">{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--fh)", fontSize: "8px", fontWeight: 700,
          letterSpacing: ".09em", textTransform: "uppercase",
          color: "var(--t3)", marginBottom: 2,
        }}>
          {label}
        </div>
        {thumbSrc ? (
          <img
            src={thumbSrc} alt={`${label} preview`}
            style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(184,146,46,.25)", marginTop: 4 }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div style={{
            fontFamily: masked ? "var(--fm)" : "var(--fb)",
            fontSize: 14,
            letterSpacing: masked ? ".1em" : "normal",
            color: value ? "var(--t1)" : "var(--t4)",
            fontStyle: value ? "normal" : "italic",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {value || "Not provided"}
          </div>
        )}
      </div>
      <button
        onClick={onEdit} type="button"
        style={{
          fontFamily: "var(--fh)", fontSize: "8px", fontWeight: 700,
          letterSpacing: ".08em", textTransform: "uppercase",
          color: "var(--gold)", background: "none", border: "none",
          cursor: "pointer", padding: "4px 8px",
          borderRadius: "var(--r-sm)", flexShrink: 0,
          transition: "background var(--t-fast)",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--gold-pale)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
        aria-label={`Edit ${label}`}
      >
        Edit
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROGRESS BAR
───────────────────────────────────────────── */
function ProgressBar({ pct }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
      <div style={{
        flex: 1, height: 4, borderRadius: 4,
        background: "rgba(184,146,46,.10)", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg, var(--gold-d), var(--gold-l))",
          borderRadius: 4,
          transition: "width .5s var(--ease)",
        }} />
      </div>
      <span style={{
        fontFamily: "var(--fm)", fontSize: 10,
        color: "var(--gold)", letterSpacing: ".06em", flexShrink: 0,
      }}>
        {pct}%
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT — WorkerProfileCompletion
═══════════════════════════════════════════════════════════ */
export default function WorkerProfileCompletion() {
  const navigate = useNavigate();

  /*
   * ✅ workerId derived from localStorage — no useParams needed.
   * Worker identity comes from the JWT stored at login via saveSession().
   * getAccountId() returns worker_accounts.id (not users.id).
   */
  const workerId =
    getToken() && getAccountType() === "WORKER"
      ? getAccountId()
      : null;

  const [step,        setStep]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [errors,      setErrors]      = useState({});
  const [toast,       setToast]       = useState(null);
  const [animKey,     setAnimKey]     = useState(0);
  const [isUpdate,    setIsUpdate]    = useState(false);
  const [authError,   setAuthError]   = useState(null);
  const wrapRef = useRef(null);

  const [form, setForm] = useState({
    firstName:       "",
    lastName:        "",
    gender:          "",
    dateOfBirth:     "",
    age:             "",
    fatherName:      "",
    motherName:      "",
    aadhaarNumber:   "",
    houseNumber:     "",
    street:          "",
    pincode:         "",
    profilePhotoUrl: "",
    workerType:      "Sanitation Worker",
    skillCategory:   "Sanitation",
    experience:      "2",
  });

  /* ─── INIT — load profile status + data ─── */
  useEffect(() => {
    if (!workerId) { setInitLoading(false); return; }

    (async () => {
      try {
        const statusRes = await authFetch(`${BASE_URL}/worker/profile/status`);

        if (statusRes.status === 404) {
          setIsUpdate(false);
          return;
        }

        if (!statusRes.ok) return;

        const isCompleted = await statusRes.json().catch(() => false);

        if (isCompleted === true) {
          const profileRes = await authFetch(`${BASE_URL}/worker/profile`);
          if (!profileRes.ok) return;

          const pd = await profileRes.json().catch(() => null);
          if (!pd) return;

          setIsUpdate(true);
          setForm({
            firstName:       pd.firstName       ?? "",
            lastName:        pd.lastName        ?? "",
            gender:          pd.gender          ?? "",
            dateOfBirth:     pd.dateOfBirth     ?? "",
            age:             pd.age != null     ? String(pd.age) : "",
            fatherName:      pd.fatherName      ?? "",
            motherName:      pd.motherName      ?? "",
            aadhaarNumber:   pd.aadhaarNumber   ?? "",
            houseNumber:     pd.houseNumber     ?? "",
            street:          pd.street          ?? "",
            pincode:         pd.pincode         ?? "",
            profilePhotoUrl: isRealUrl(pd.profilePhotoUrl) ? pd.profilePhotoUrl : "",
            workerType:      "Sanitation Worker",
            skillCategory:   "Sanitation",
            experience:      "2",
          });
        }
      } catch (e) {
        if (e.code === 401) {
          setAuthError(e.message);
          setTimeout(() => navigate("/login", { replace: true }), 2000);
        } else if (e.code === 403) {
          setAuthError(e.message);
        } else {
          console.warn("Worker profile load failed:", e);
        }
      } finally {
        setInitLoading(false);
      }
    })();
  }, [workerId, navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  /* ─── HANDLERS ─── */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (["workerType", "skillCategory", "experience"].includes(name)) return;
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

  /* ─── VALIDATION ─── */
  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.firstName.trim()) e.firstName   = "First name is required";
      if (!form.gender)           e.gender      = "Please select a gender";
      if (!form.dateOfBirth)      e.dateOfBirth = "Date of birth is required";
      if (form.aadhaarNumber && !/^\d{12}$/.test(form.aadhaarNumber))
        e.aadhaarNumber = "Aadhaar must be exactly 12 digits";
      if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 18 || Number(form.age) > 80))
        e.age = "Enter a valid age between 18 and 80";
    }
    if (s === 2) {
      if (!form.houseNumber.trim()) e.houseNumber = "House number is required";
      if (!form.street.trim())      e.street      = "Street / area is required";
      if (!form.pincode.trim())     e.pincode     = "Pincode is required";
      if (form.pincode && !/^\d{6}$/.test(form.pincode))
        e.pincode = "Enter a valid 6-digit pincode";
    }
    if (s === 3) {
      if (!form.profilePhotoUrl)
        e.profilePhotoUrl = "Please upload your profile photo";
      if (form.profilePhotoUrl?.startsWith("blob:"))
        e.profilePhotoUrl = "Photo upload incomplete — please wait or retry";
    }
    return e;
  };

  /* ─── NAVIGATION ─── */
  const goNext = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setAnimKey(k => k + 1);
    setStep(s => Math.min(s + 1, 4));
    setErrors({});
  };

  const goPrev = () => {
    setAnimKey(k => k + 1);
    setStep(s => Math.max(s - 1, 1));
    setErrors({});
  };

  const goStep = (n) => {
    if (n === step) return;
    setAnimKey(k => k + 1);
    setStep(n);
    setErrors({});
  };

  /* ─── SUBMIT ─── */
  const submitProfile = async () => {
    if (form.profilePhotoUrl?.startsWith("blob:")) {
      setToast({ msg: "Please wait for the photo upload to finish.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const method   = isUpdate ? "PUT" : "POST";
      const endpoint = `${BASE_URL}/worker/profile`;

      const payload = {
        firstName:       form.firstName.trim(),
        lastName:        form.lastName.trim()      || null,
        gender:          form.gender,
        dateOfBirth:     form.dateOfBirth          || null,
        age:             form.age ? Number(form.age) : null,
        fatherName:      form.fatherName.trim()    || null,
        motherName:      form.motherName.trim()    || null,
        aadhaarNumber:   form.aadhaarNumber.trim() || null,
        houseNumber:     form.houseNumber.trim(),
        street:          form.street.trim(),
        pincode:         form.pincode.trim(),
        profilePhotoUrl: form.profilePhotoUrl      || null,
        workerType:      "Sanitation Worker",
        skillCategory:   "Sanitation",
        experience:      "2",
      };

      const res = await authFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `Profile ${isUpdate ? "update" : "creation"} failed`);

      setToast({
        msg:  isUpdate ? "Profile updated successfully!" : "Profile completed successfully!",
        type: "success",
      });

      // ✅ fixed: removed /${workerId} from dashboard route
      if (workerId) {
        setTimeout(() => navigate(`/worker/dashboard`), 1800);
      }
    } catch (err) {
      if (err.code === 401) {
        setToast({ msg: "Session expired — please log in again.", type: "error" });
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } else if (err.code === 403) {
        setToast({ msg: "You don't have permission to update this profile.", type: "error" });
      } else {
        setToast({ msg: err.message, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  /* ─── PROGRESS ─── */
  const filledFields = [
    form.firstName, form.gender, form.dateOfBirth,
    form.houseNumber, form.street, form.profilePhotoUrl,
  ].filter(Boolean).length;
  const pct = Math.round((filledFields / 6) * 100);

  /* ════════════════════════════════════════════
     EARLY RETURNS
  ════════════════════════════════════════════ */

  if (!workerId) return (
    <>
      <Navbar />
      <div style={{
        minHeight: "calc(100vh - 68px)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: "var(--bg)", color: "var(--t1)",
        fontFamily: "var(--fh)", textAlign: "center", padding: 40,
      }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(158,51,40,.09)", border: "2px solid rgba(158,51,40,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>🔒</div>
        <div style={{ fontSize: 72, fontWeight: 900, color: "var(--rose)", lineHeight: 1 }}>401</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: ".04em" }}>Unauthorised Access</div>
        <div style={{ fontSize: 13, color: "var(--t3)", maxWidth: 400, lineHeight: 1.75, background: "rgba(158,51,40,.05)", border: "1px solid rgba(158,51,40,.14)", borderRadius: "var(--r-lg)", padding: "16px 24px", fontFamily: "var(--fb)" }}>
          You don't have permission to access this page.<br />Please log in with a valid Worker account.
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <a href="/login" style={{ padding: "10px 28px", borderRadius: "var(--r-md)", background: "linear-gradient(135deg,#c8a04e,#7a5a14)", color: "#040200", textDecoration: "none", fontSize: 11, fontWeight: 700, fontFamily: "var(--fh)", letterSpacing: ".08em", textTransform: "uppercase" }}>→ Login</a>
          <a href="/"      style={{ padding: "10px 28px", borderRadius: "var(--r-md)", background: "none", color: "var(--gold)", border: "1px solid rgba(184,146,46,.28)", textDecoration: "none", fontSize: 11, fontWeight: 700, fontFamily: "var(--fh)", letterSpacing: ".08em", textTransform: "uppercase" }}>← Home</a>
        </div>
      </div>
      <Footer />
    </>
  );

  if (authError) return (
    <>
      <Navbar />
      <div style={{
        minHeight: "calc(100vh - 68px)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: "var(--bg)", color: "var(--t1)",
        fontFamily: "var(--fh)", textAlign: "center", padding: 40,
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: ".04em" }}>Access Denied</div>
        <div style={{ fontSize: 13, color: "var(--t3)", maxWidth: 400, lineHeight: 1.75, background: "rgba(158,51,40,.05)", border: "1px solid rgba(158,51,40,.14)", borderRadius: "var(--r-lg)", padding: "16px 24px", fontFamily: "var(--fb)" }}>
          {authError}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          {authError.includes("expired") && (
            <a href="/login" style={{ padding: "10px 28px", borderRadius: "var(--r-md)", background: "linear-gradient(135deg,#c8a04e,#7a5a14)", color: "#040200", textDecoration: "none", fontSize: 11, fontWeight: 700, fontFamily: "var(--fh)", letterSpacing: ".08em", textTransform: "uppercase" }}>→ Log In Again</a>
          )}
          <a href="/" style={{ padding: "10px 28px", borderRadius: "var(--r-md)", background: "none", color: "var(--gold)", border: "1px solid rgba(184,146,46,.28)", textDecoration: "none", fontSize: 11, fontWeight: 700, fontFamily: "var(--fh)", letterSpacing: ".08em", textTransform: "uppercase" }}>← Home</a>
        </div>
      </div>
      <Footer />
    </>
  );

  if (initLoading) return (
    <>
      <Navbar />
      <div className="wp-page">
        <div className="wp-loading" role="status" aria-label="Loading profile">
          Loading Profile…
        </div>
      </div>
      <Footer />
    </>
  );

  /* ─────────────────────────────────────────────
     MAIN RENDER
  ───────────────────────────────────────────── */
  return (
    <>
      <Navbar />
      <div className="wp-page">

        {toast && <Toast msg={toast.msg} type={toast.type} />}

        <div className="wp-inner" ref={wrapRef}>

          {/* ✅ fixed: removed /${workerId} from back button nav */}
          <button
            className="wp-back"
            onClick={() => navigate(`/worker/dashboard`)}
            type="button"
          >
            <span className="wp-back__arrow">←</span> Back to Dashboard
          </button>

          {/* ── BANNER ── */}
          <div className="wp-banner">
            <p className="wp-eyebrow">
              <span className="wp-eyebrow__dot" aria-hidden="true" />
              Field Worker
            </p>
            <h1 className="wp-title">
              {isUpdate ? "Update Your Profile" : "Complete Your Profile"}
            </h1>
            <p className="wp-banner-sub">
              {isUpdate
                ? "Update your details — changes reflect on your ID card and dashboard."
                : "Provide your personal details to activate your account and access the dashboard."}
            </p>
            <div className="wp-banner-divider" aria-hidden="true" />
            {isUpdate && (
              <div style={{ marginTop: 12 }}>
                <span className="wp-pill wp-pill--teal">✏️ Update Mode — existing data pre-filled</span>
              </div>
            )}
            <ProgressBar pct={pct} />
          </div>

          {/* ── STEP RAIL ── */}
          <StepRail currentStep={step} onGoStep={goStep} />

          {/* ── FORM CARD ── */}
          <div
            key={`step-${animKey}`}
            className="wp-form-card"
            style={{ animation: "revealUp .4s var(--ease) both" }}
          >

            {/* ════ STEP 1 — Identity ════ */}
            {step === 1 && (
              <div className="wp-section">
                <div className="wp-section-header" style={{ "--accent": "var(--gold)" }}>
                  <div className="wp-section-icon" aria-hidden="true">👤</div>
                  <div>
                    <div className="wp-section-title">Personal Identity</div>
                    <div className="wp-section-sub">Name, gender, date of birth &amp; family details</div>
                  </div>
                </div>

                <div className="wp-section-body">
                  <div className="wp-field">
                    <label className="wp-label" htmlFor="wp-firstName">First Name <span className="req" aria-hidden="true">*</span></label>
                    <input id="wp-firstName" name="firstName" className="wp-input" value={form.firstName} onChange={handleChange} placeholder="e.g. Rajesh" autoFocus autoComplete="given-name" style={errors.firstName ? { borderColor: "rgba(158,51,40,.60)" } : {}} />
                    {errors.firstName && <p className="wp-hint" style={{ color: "var(--rose)" }} role="alert">⚠ {errors.firstName}</p>}
                  </div>

                  <div className="wp-field">
                    <label className="wp-label" htmlFor="wp-lastName">Last Name <span style={{ color: "var(--t4)", fontWeight: 400 }}>(optional)</span></label>
                    <input id="wp-lastName" name="lastName" className="wp-input" value={form.lastName} onChange={handleChange} placeholder="e.g. Kumar" autoComplete="family-name" />
                  </div>

                  <div className="wp-field">
                    <label className="wp-label" htmlFor="wp-gender">Gender <span className="req" aria-hidden="true">*</span></label>
                    <div className="wp-select-wrap">
                      <select id="wp-gender" name="gender" className="wp-select" value={form.gender} onChange={handleChange} style={errors.gender ? { borderColor: "rgba(158,51,40,.60)" } : {}}>
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other / Prefer not to say</option>
                      </select>
                    </div>
                    {errors.gender && <p className="wp-hint" style={{ color: "var(--rose)" }} role="alert">⚠ {errors.gender}</p>}
                  </div>

                  <div className="wp-field">
                    <label className="wp-label" htmlFor="wp-dob">Date of Birth <span className="req" aria-hidden="true">*</span></label>
                    <input id="wp-dob" name="dateOfBirth" type="date" className="wp-input" value={form.dateOfBirth} onChange={handleChange} max={new Date().toISOString().split("T")[0]} style={errors.dateOfBirth ? { borderColor: "rgba(158,51,40,.60)" } : {}} />
                    {errors.dateOfBirth && <p className="wp-hint" style={{ color: "var(--rose)" }} role="alert">⚠ {errors.dateOfBirth}</p>}
                  </div>

                  <div className="wp-field">
                    <label className="wp-label" htmlFor="wp-age">Age <span style={{ color: "var(--t4)", fontWeight: 400 }}>(optional)</span></label>
                    <input id="wp-age" name="age" className="wp-input" value={form.age} onChange={handleChange} placeholder="e.g. 28" inputMode="numeric" maxLength={3} style={errors.age ? { borderColor: "rgba(158,51,40,.60)" } : {}} />
                    {errors.age && <p className="wp-hint" style={{ color: "var(--rose)" }} role="alert">⚠ {errors.age}</p>}
                  </div>

                  <div className="wp-field">
                    <label className="wp-label" htmlFor="wp-aadhaar">Aadhaar Number <span style={{ color: "var(--t4)", fontWeight: 400 }}>(optional)</span></label>
                    <div className="wp-aadhaar-wrap">
                      <input id="wp-aadhaar" name="aadhaarNumber" className="wp-input" value={form.aadhaarNumber} onChange={handleChange} placeholder="12-digit Aadhaar" inputMode="numeric" maxLength={12} style={errors.aadhaarNumber ? { borderColor: "rgba(158,51,40,.60)" } : {}} />
                      <span className="wp-aadhaar-icon" aria-hidden="true">🪪</span>
                    </div>
                    {errors.aadhaarNumber && <p className="wp-hint" style={{ color: "var(--rose)" }} role="alert">⚠ {errors.aadhaarNumber}</p>}
                  </div>

                  <div className="wp-divider" aria-hidden="true" />

                  <div className="wp-field">
                    <label className="wp-label" htmlFor="wp-father">Father's Name <span style={{ color: "var(--t4)", fontWeight: 400 }}>(optional)</span></label>
                    <input id="wp-father" name="fatherName" className="wp-input" value={form.fatherName} onChange={handleChange} placeholder="e.g. Mahesh Kumar" />
                  </div>

                  <div className="wp-field">
                    <label className="wp-label" htmlFor="wp-mother">Mother's Name <span style={{ color: "var(--t4)", fontWeight: 400 }}>(optional)</span></label>
                    <input id="wp-mother" name="motherName" className="wp-input" value={form.motherName} onChange={handleChange} placeholder="e.g. Sita Devi" />
                  </div>
                </div>
              </div>
            )}

            {/* ════ STEP 2 — Address ════ */}
            {step === 2 && (
              <div className="wp-section">
                <div className="wp-section-header" style={{ "--accent": "var(--teal-l)" }}>
                  <div className="wp-section-icon" style={{ background: "rgba(35,110,128,.12)" }} aria-hidden="true">🏠</div>
                  <div>
                    <div className="wp-section-title" style={{ color: "var(--teal-l)" }}>Residential Address</div>
                    <div className="wp-section-sub">Your current house address for official records</div>
                  </div>
                </div>
                <div className="wp-section-body">
                  <div className="wp-field">
                    <label className="wp-label" htmlFor="wp-house">House Number <span className="req" aria-hidden="true">*</span></label>
                    <input id="wp-house" name="houseNumber" className="wp-input" value={form.houseNumber} onChange={handleChange} placeholder="e.g. 14B" autoFocus autoComplete="address-line1" style={errors.houseNumber ? { borderColor: "rgba(158,51,40,.60)" } : {}} />
                    {errors.houseNumber && <p className="wp-hint" style={{ color: "var(--rose)" }} role="alert">⚠ {errors.houseNumber}</p>}
                  </div>

                  <div className="wp-field">
                    <label className="wp-label" htmlFor="wp-pincode">Pincode <span className="req" aria-hidden="true">*</span></label>
                    <input id="wp-pincode" name="pincode" className="wp-input" value={form.pincode} onChange={handleChange} placeholder="e.g. 600032" inputMode="numeric" maxLength={6} autoComplete="postal-code" style={errors.pincode ? { borderColor: "rgba(158,51,40,.60)" } : {}} />
                    {errors.pincode && <p className="wp-hint" style={{ color: "var(--rose)" }} role="alert">⚠ {errors.pincode}</p>}
                  </div>

                  <div className="wp-field wp-field-full">
                    <label className="wp-label" htmlFor="wp-street">Street / Area <span className="req" aria-hidden="true">*</span></label>
                    <textarea id="wp-street" name="street" className="wp-input" value={form.street} onChange={handleChange} placeholder="e.g. Main Road, Kothapalle, Nellore District, AP" rows={3} autoComplete="street-address" style={{ resize: "vertical", ...(errors.street ? { borderColor: "rgba(158,51,40,.60)" } : {}) }} />
                    {errors.street && <p className="wp-hint" style={{ color: "var(--rose)" }} role="alert">⚠ {errors.street}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ════ STEP 3 — Photo ════ */}
            {step === 3 && (
              <div className="wp-section">
                <div className="wp-section-header" style={{ "--accent": "var(--silver-l)" }}>
                  <div className="wp-section-icon" style={{ background: "rgba(154,171,191,.10)" }} aria-hidden="true">📸</div>
                  <div>
                    <div className="wp-section-title" style={{ color: "var(--silver-l)" }}>Profile Photo</div>
                    <div className="wp-section-sub">
                      {isUpdate
                        ? "Upload a new photo to replace your existing one"
                        : "Upload a clear passport-style photo · saved to server immediately"}
                    </div>
                  </div>
                </div>
                {/* ✅ fixed: removed workerId={profile?.workerId} — profile was undefined;
                    PhotoUploader no longer needs workerId as upload endpoint is JWT-resolved */}
                <PhotoUploader
                  value={form.profilePhotoUrl}
                  onChange={(field, url) => handleUpload(field, url)}
                  onClearError={clearError}
                  error={errors.profilePhotoUrl}
                />
              </div>
            )}

            {/* ════ STEP 4 — Review ════ */}
            {step === 4 && (
              <div className="wp-section">
                <div className="wp-section-header" style={{ "--accent": isUpdate ? "var(--teal-l)" : "var(--emerald)" }}>
                  <div className="wp-section-icon" style={{ background: isUpdate ? "rgba(35,110,128,.12)" : "rgba(55,138,85,.12)" }} aria-hidden="true">
                    {isUpdate ? "✏️" : "✅"}
                  </div>
                  <div>
                    <div className="wp-section-title" style={{ color: isUpdate ? "var(--teal-l)" : "var(--emerald)" }}>
                      {isUpdate ? "Review & Update" : "Review & Submit"}
                    </div>
                    <div className="wp-section-sub">
                      {isUpdate
                        ? "Review your changes before saving."
                        : "Verify all information before completing your profile."}
                    </div>
                  </div>
                </div>

                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "linear-gradient(135deg, var(--surface2) 0%, #0c1824 100%)", border: "1px solid rgba(184,146,46,.18)", borderRadius: "var(--r-lg)", marginBottom: 22 }}>
                    {form.profilePhotoUrl && !form.profilePhotoUrl.startsWith("blob:") ? (
                      <img src={form.profilePhotoUrl} alt="Your profile" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(184,146,46,.28)", flexShrink: 0 }} onError={e => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: "50%", border: "2px dashed rgba(184,146,46,.22)", background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>👤</div>
                    )}
                    <div>
                      <div style={{ fontFamily: "var(--fh)", fontSize: 14, fontWeight: 700, color: "var(--t1)", letterSpacing: ".02em" }}>
                        {[form.firstName, form.lastName].filter(Boolean).join(" ") || "—"}
                      </div>
                      <div style={{ fontFamily: "var(--fb)", fontSize: 12, color: "var(--gold)", fontStyle: "italic", marginTop: 2 }}>Sanitation Worker</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        {form.gender && <span className="wp-pill wp-pill--gold">{form.gender}</span>}
                        <span className={`wp-pill ${isUpdate ? "wp-pill--green" : "wp-pill--teal"}`}>{isUpdate ? "✓ Verified" : "⏳ Pending"}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: "var(--fh)", fontSize: "8.5px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>👤 Personal Identity</span>
                      <button onClick={() => goStep(1)} type="button" style={{ fontFamily: "var(--fh)", fontSize: "8px", color: "var(--gold)", background: "none", border: "none", cursor: "pointer", letterSpacing: ".06em" }}>Edit</button>
                    </div>
                    <ReviewRow icon="📛" label="First Name"    value={form.firstName}   onEdit={() => goStep(1)} />
                    <ReviewRow icon="📛" label="Last Name"     value={form.lastName}    onEdit={() => goStep(1)} />
                    <ReviewRow icon="⚥"  label="Gender"        value={form.gender}      onEdit={() => goStep(1)} />
                    <ReviewRow icon="🎂" label="Date of Birth" value={form.dateOfBirth} onEdit={() => goStep(1)} />
                    <ReviewRow icon="🔢" label="Age"           value={form.age}         onEdit={() => goStep(1)} />
                    <ReviewRow icon="👨" label="Father's Name" value={form.fatherName}  onEdit={() => goStep(1)} />
                    <ReviewRow icon="👩" label="Mother's Name" value={form.motherName}  onEdit={() => goStep(1)} />
                    <ReviewRow icon="🪪" label="Aadhaar Number" value={form.aadhaarNumber ? `•••• •••• ${form.aadhaarNumber.slice(-4)}` : ""} onEdit={() => goStep(1)} masked />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: "var(--fh)", fontSize: "8.5px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--teal-l)", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>🏠 Residential Address</span>
                      <button onClick={() => goStep(2)} type="button" style={{ fontFamily: "var(--fh)", fontSize: "8px", color: "var(--gold)", background: "none", border: "none", cursor: "pointer", letterSpacing: ".06em" }}>Edit</button>
                    </div>
                    <ReviewRow icon="🏡" label="House Number" value={form.houseNumber} onEdit={() => goStep(2)} />
                    <ReviewRow icon="🛣" label="Street / Area" value={form.street}     onEdit={() => goStep(2)} />
                    <ReviewRow icon="📮" label="Pincode"       value={form.pincode}    onEdit={() => goStep(2)} />
                  </div>

                  <div>
                    <div style={{ fontFamily: "var(--fh)", fontSize: "8.5px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--silver-l)", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>📸 Photo</span>
                      <button onClick={() => goStep(3)} type="button" style={{ fontFamily: "var(--fh)", fontSize: "8px", color: "var(--gold)", background: "none", border: "none", cursor: "pointer", letterSpacing: ".06em" }}>Edit</button>
                    </div>
                    <ReviewRow icon="🖼" label="Profile Photo" value={form.profilePhotoUrl ? "Uploaded ✓" : ""} thumbSrc={form.profilePhotoUrl && !form.profilePhotoUrl.startsWith("blob:") ? form.profilePhotoUrl : null} onEdit={() => goStep(3)} />
                  </div>

                  <p style={{ fontFamily: "var(--fb)", fontSize: 11, color: "var(--t4)", fontStyle: "italic", marginTop: 18, lineHeight: 1.65, borderTop: "1px solid var(--vd-border)", paddingTop: 14 }}>
                    {isUpdate
                      ? "By saving, you confirm all updated information is accurate and authentic."
                      : "By submitting, you confirm all information is accurate and authentic. Providing false information is a punishable offence under applicable law."}
                  </p>
                </div>
              </div>
            )}

            {/* ── FORM FOOTER NAV ── */}
            <div className="wp-form-footer">
              <p className="wp-form-footer-text">
                Step <strong>{step}</strong> of <strong>{STEPS.length}</strong>{" "}
                — {STEPS[step - 1]?.label}
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {step > 1 && (
                  <button
                    type="button" onClick={goPrev}
                    style={{ fontFamily: "var(--fh)", fontSize: "10px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "10px 20px", borderRadius: "var(--r-md)", background: "none", border: "1px solid var(--vd-border)", color: "var(--t2)", cursor: "pointer", transition: "border-color var(--t-fast), color var(--t-fast)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(184,146,46,.30)"; e.currentTarget.style.color = "var(--t1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--vd-border)"; e.currentTarget.style.color = "var(--t2)"; }}
                  >
                    ← Back
                  </button>
                )}

                {step < 4 ? (
                  <button type="button" onClick={goNext} className="wp-submit">
                    <span className="wp-submit__text">Continue →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={!loading ? submitProfile : undefined}
                    disabled={loading}
                    className={`wp-submit${loading ? " wp-submit--loading" : ""}`}
                  >
                    <span className="wp-submit__spinner" aria-hidden="true" />
                    <span className="wp-submit__text">
                      {loading
                        ? (isUpdate ? "Saving…" : "Submitting…")
                        : (isUpdate ? "✓ Save Changes" : "✓ Complete Profile")}
                    </span>
                  </button>
                )}
              </div>
            </div>

          </div>{/* end wp-form-card */}
        </div>{/* end wp-inner */}
      </div>{/* end wp-page */}
      <Footer />
    </>
  );
}