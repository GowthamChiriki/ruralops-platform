import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/ComplaintSubmission.css";

// Fix 1: consistent env var across all modules
const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const CATEGORIES = [
  { value: "GARBAGE",       label: "🗑 Garbage & Sanitation",    group: "Sanitation",      priority: 3 },
  { value: "DRAINAGE",      label: "🌊 Drainage Blockage",       group: "Infrastructure",  priority: 4 },
  { value: "ROAD_DAMAGE",   label: "🛤 Road Damage / Potholes",  group: "Infrastructure",  priority: 2 },
  { value: "STREET_LIGHT",  label: "💡 Street Light Failure",    group: "Utilities",       priority: 2 },
  { value: "WATER_SUPPLY",  label: "💧 Water Supply Issue",      group: "Utilities",       priority: 4 },
  { value: "PUBLIC_HEALTH", label: "⚕ Public Health Hazard",    group: "Health",          priority: 5 },
  { value: "OTHER",         label: "📋 Other Issue",              group: "General",         priority: 1 },
];

/* ════════════════════════════════════════════
   AUTH HELPERS
   Keys match saveSession() in LoginPage.jsx:
     accessToken | accountType | accountId
   TODO: extract to src/lib/apiClient.js
════════════════════════════════════════════ */
async function tryRefresh() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem("accessToken",  data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function apiFetch(url, options = {}, navigateFn) {
  const doRequest = (token) =>
    fetch(url, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

  // Fix 4: replace:true prevents back-button returning to broken page
  const clearAuth = () => {
    ["accessToken", "refreshToken", "accountId", "accountType", "villageId", "roles"]
      .forEach((k) => localStorage.removeItem(k));
    navigateFn("/login", { replace: true });
  };

  // Fix 3: trim() prevents "Bearer  null" malformed headers
  let token = localStorage.getItem("accessToken")?.trim();
  if (!token) { clearAuth(); return null; }

  let res = await doRequest(token);

  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (!newToken) { clearAuth(); return null; }
    res = await doRequest(newToken);
    if (res.status === 401) { clearAuth(); return null; }
  }

  return res;
}

/* ─── Field Wrapper ─── */
function Field({ label, required, hint, error, children }) {
  return (
    <div className={`cs-field${error ? " cs-field--err" : ""}`}>
      <label className="cs-field__label">
        {label}
        {required && <span className="cs-field__req">*</span>}
        {hint && <span className="cs-field__hint">{hint}</span>}
      </label>
      {children}
      {error && (
        <p className="cs-field__error">
          <span>⚔</span> {error}
        </p>
      )}
    </div>
  );
}

/* ─── Area Dropdown ─── */
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

  const selected     = areas.find((a) => String(a.id) === String(value)) || null;
  const handleSelect = (area) => { onChange(String(area.id), area.name); setOpen(false); };
  const handleClear  = (e)    => { e.stopPropagation(); onChange("", ""); };

  if (loading) return (
    <div className="cs-area-flat cs-area-flat--loading">
      <span className="cs-area-spin" />
      <span>Summoning territories from the Citadel…</span>
    </div>
  );

  if (fetchError) return (
    <div className="cs-area-flat cs-area-flat--error">
      <span>⚠</span>
      <span>Failed to load territories</span>
      <button className="cs-area-retry" type="button" onClick={onRetry}>↻ Retry</button>
    </div>
  );

  if (!areas.length) return (
    <div className="cs-area-flat cs-area-flat--empty">
      <span>🗺</span>
      <span>No territories found for your village</span>
    </div>
  );

  return (
    <div
      ref={ref}
      className={["cs-area-dropdown", open ? "cs-area-dropdown--open" : "", hasError ? "cs-area-dropdown--err" : ""].filter(Boolean).join(" ")}
    >
      <button
        type="button"
        className="cs-area-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cs-area-trigger__icon">🗺</span>
        {selected ? (
          <span className="cs-area-trigger__val">
            <span className="cs-area-trigger__dot" />
            {selected.name}
          </span>
        ) : (
          <span className="cs-area-trigger__placeholder">Select the area where the issue occurred…</span>
        )}
        <span className="cs-area-trigger__right">
          {selected && (
            <span
              className="cs-area-trigger__clear"
              role="button" tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e)}
            >✕</span>
          )}
          <span className={`cs-area-trigger__chevron${open ? " cs-area-trigger__chevron--up" : ""}`}>▾</span>
        </span>
      </button>

      {open && (
        <div className="cs-area-panel" role="listbox">
          <div className="cs-area-panel__header">
            <span className="cs-area-panel__title">⚔ Areas within your village</span>
            <span className="cs-area-panel__count">{areas.length}</span>
          </div>
          <div className="cs-area-panel__list">
            {areas.map((area, i) => (
              <button
                key={area.id}
                type="button"
                role="option"
                aria-selected={String(area.id) === String(value)}
                className={["cs-area-option", String(area.id) === String(value) ? "cs-area-option--selected" : ""].filter(Boolean).join(" ")}
                style={{ animationDelay: `${i * 0.04}s` }}
                onClick={() => handleSelect(area)}
              >
                <span className="cs-area-option__icon">🏘</span>
                <span className="cs-area-option__name">{area.name}</span>
                <span className="cs-area-option__id">#{area.id}</span>
                {String(area.id) === String(value) && <span className="cs-area-option__check">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Category Selector ─── */
function CategorySelector({ value, onChange, error }) {
  return (
    <div className={`cs-cat-grid${error ? " cs-cat-grid--err" : ""}`}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          type="button"
          className={`cs-cat-tile${value === cat.value ? " cs-cat-tile--selected" : ""}`}
          onClick={() => onChange(cat.value)}
        >
          <span className="cs-cat-tile__icon">{cat.label.split(" ")[0]}</span>
          <span className="cs-cat-tile__name">{cat.label.slice(2)}</span>
          <span className="cs-cat-tile__group">{cat.group}</span>
          <span className="cs-cat-tile__priority" data-p={cat.priority}>P{cat.priority}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Image Upload Zone ─── */
function ImageUpload({ value, onChange, error, uploading }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // Fix 6: create object URL once and revoke on cleanup — prevents memory leak
  const previewUrl = useMemo(() => value ? URL.createObjectURL(value) : null, [value]);
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    onChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={["cs-upload", dragOver ? "cs-upload--dragover" : "", error ? "cs-upload--err" : "", value ? "cs-upload--has-file" : ""].filter(Boolean).join(" ")}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !value && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {uploading ? (
        <div className="cs-upload__uploading">
          <span className="cs-upload__spin" />
          <span>Dispatching image to the Citadel…</span>
        </div>
      ) : value ? (
        <div className="cs-upload__preview">
          <img src={previewUrl} alt="Preview" className="cs-upload__img" />
          <div className="cs-upload__preview-overlay">
            <button type="button" className="cs-upload__change" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
              🔄 Change Image
            </button>
            <button type="button" className="cs-upload__remove" onClick={(e) => { e.stopPropagation(); onChange(null); }}>
              ✕ Remove
            </button>
          </div>
          <div className="cs-upload__file-name">{value.name}</div>
        </div>
      ) : (
        <div className="cs-upload__idle">
          <span className="cs-upload__icon">📸</span>
          <p className="cs-upload__title">Capture evidence of the issue</p>
          <p className="cs-upload__sub">Drag & drop or click to select · JPG, PNG, WEBP</p>
          <span className="cs-upload__btn">Choose Image</span>
        </div>
      )}
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ msg, type, onDismiss }) {
  return (
    <div className={`cs-toast cs-toast--${type}`} onClick={onDismiss}>
      <span className="cs-toast__icon">{type === "success" ? "⚔" : "🐉"}</span>
      <span>{msg}</span>
      <span className="cs-toast__close">✕</span>
    </div>
  );
}

/* ─── Success Overlay ─── */
function SuccessOverlay({ complaintId, onViewComplaints, onSubmitAnother }) {
  return (
    <div className="cs-success">
      <div className="cs-success__ring">
        <div className="cs-success__ring-inner">
          <span className="cs-success__check">📜</span>
        </div>
      </div>
      <div className="cs-success__confetti" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`cs-confetti-dot cs-confetti-dot--${i % 4}`} style={{ "--i": i }} />
        ))}
      </div>
      <h2 className="cs-success__title">Complaint Submitted!</h2>
      <p className="cs-success__sub">
        Your grievance hath been recorded in the scrolls of the Realm. A worker
        shall be dispatched to your area with due haste.
      </p>
      <div className="cs-success__id-badge">
        <span className="cs-success__id-label">Complaint Seal</span>
        <span className="cs-success__id-val">{complaintId || "Registered by the Citadel"}</span>
      </div>
      <div className="cs-success__info">
        <div className="cs-success__info-row"><span>🦅</span><span>Raven dispatched — your complaint is in the system</span></div>
        <div className="cs-success__info-row"><span>⚔</span><span>A worker shall be assigned to your area forthwith</span></div>
        <div className="cs-success__info-row"><span>🔮</span><span>Track the progress from your complaints scroll</span></div>
      </div>
      <div className="cs-success__actions">
        <button className="cs-btn cs-btn--ghost" onClick={onSubmitAnother}>⚔ Submit Another</button>
        <button className="cs-btn cs-btn--primary" onClick={onViewComplaints}>View My Complaints →</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   Identity: JWT → userId → CitizenAccount
   No citizenId in URLs — identity is server-side.
════════════════════════════════════════════ */
export default function ComplaintSubmissionPage() {
  const navigate = useNavigate();

  // Fix 5: pre-render guard — evaluated before hooks run JSX
  const token = localStorage.getItem("accessToken")?.trim();
  const role  = localStorage.getItem("accountType");
  const isAuthorized = !!(token && role === "CITIZEN");

  const [form, setForm] = useState({
    areaId:      "",
    areaName:    "",
    category:    "",
    description: "",
    imageFile:   null,
    latitude:    null,
    longitude:   null,
  });

  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [toast,      setToast]      = useState(null);
  const [success,    setSuccess]    = useState(null);
  const [visible,    setVisible]    = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [authError,  setAuthError]  = useState(null);

  const [areas,        setAreas]        = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError,   setAreasError]   = useState(null);

  // Redirect fires in effect (hooks must all run before early return in React)
  useEffect(() => {
    if (!isAuthorized) { navigate("/login", { replace: true }); }
  }, [isAuthorized, navigate]);

  /* ── Fetch areas — worker resolved from JWT, no citizenId in path ── */
  const fetchAreas = async () => {
    setAreasLoading(true);
    setAreasError(null);
    try {
      const res = await apiFetch(`${API}/citizen/areas`, {}, navigate);
      if (!res) return;
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setAreas(Array.isArray(data) ? data : []);
    } catch (e) {
      setAreasError(e.message);
    } finally {
      setAreasLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    fetchAreas();
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Suppress all JSX for non-citizens — redirect already in flight
  if (!isAuthorized) return null;

  const handleAreaChange     = (id, name) => { setForm((f) => ({ ...f, areaId: id, areaName: name })); setErrors((e) => ({ ...e, areaId: "" })); };
  const handleCategoryChange = (val)      => { setForm((f) => ({ ...f, category: val }));               setErrors((e) => ({ ...e, category: "" })); };
  const handleImageChange    = (file)     => { setForm((f) => ({ ...f, imageFile: file }));             setErrors((e) => ({ ...e, imageFile: "" })); };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setToast({ msg: "Geolocation is not supported by your device", type: "error" });
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocLoading(false);
      },
      () => {
        setToast({ msg: "Could not retrieve location — check browser permissions", type: "error" });
        setLocLoading(false);
      }
    );
  };

  const validate = () => {
    const e = {};
    if (!form.areaId)                               e.areaId      = "A territory must be selected";
    if (!form.category)                             e.category    = "A category must be chosen for the complaint";
    if (!form.description.trim())                   e.description = "A description is required";
    else if (form.description.trim().length > 1000) e.description = "Description cannot exceed 1000 runes";
    if (!form.imageFile)                            e.imageFile   = "An image of the issue is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      /* ── Step 1: Upload before image ──
         Fix 2: no citizenId in URL — backend resolves identity from JWT */
      let beforeImageUrl;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", form.imageFile);
        // No Content-Type header — browser sets multipart boundary automatically
        const upRes = await apiFetch(`${API}/citizen/files/complaint-file`, { method: "POST", body: fd }, navigate);
        if (!upRes) return; // auth failed, redirect triggered
        if (!upRes.ok) throw new Error(`Upload failed: ${upRes.status}`);
        const upData = await upRes.json();
        beforeImageUrl = upData.url;
      } catch (uploadErr) {
        setToast({ msg: "Image upload failed — try again or check your connection", type: "error" });
        return;
      } finally {
        setUploading(false);
      }

      /* ── Step 2: Submit complaint ── */
      const res = await apiFetch(`${API}/citizen/complaints`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          areaId:         Number(form.areaId),
          category:       form.category,
          description:    form.description.trim(),
          beforeImageUrl: beforeImageUrl,
          latitude:       form.latitude,
          longitude:      form.longitude,
        }),
      }, navigate);

      if (!res) return; // auth failed

      // Fix 7: cleaner complaint ID extraction
      const text = await res.text();
      let complaintId = null;
      try {
        const parsed = JSON.parse(text);
        complaintId = parsed?.complaintId ?? parsed?.id ?? null;
      } catch { /* plain-text response is fine */ }

      setSuccess({ complaintId });

    } catch (err) {
      if (err.code === 403) {
        setAuthError("You do not have permission to perform this action.");
      } else {
        setToast({ msg: "The ravens could not reach the Citadel — check your connection", type: "error" });
      }
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleSubmitAnother = () => {
    setSuccess(null);
    setForm({ areaId: "", areaName: "", category: "", description: "", imageFile: null, latitude: null, longitude: null });
    setErrors({});
  };

  const filledCount = [form.areaId, form.category, form.description, form.imageFile].filter(Boolean).length;
  const pct = Math.round((filledCount / 4) * 100);

  return (
    <>
      <Navbar />

      <div className="cs-page">
        <div className="cs-ambient" aria-hidden="true">
          <div className="cs-orb cs-orb--1" />
          <div className="cs-orb cs-orb--2" />
          <div className="cs-orb cs-orb--3" />
          <div className="cs-grid" />
        </div>

        {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}

        <div className={`cs-wrap${visible ? " cs-wrap--visible" : ""}`}>

          <button className="cs-back" onClick={() => navigate("/citizen/dashboard")} type="button">
            <span>←</span>
            <span>Return to Dashboard</span>
          </button>

          <header className="cs-header">
            <div className="cs-header__badge">
              <span className="cs-header__badge-dot" />
              <span className="cs-header__badge-pulse" />
              📜 Citizen Grievance System
            </div>
            <h1 className="cs-header__title">
              <span className="cs-title-line1">Lodge a</span>
              <span className="cs-title-line2">Complaint</span>
            </h1>
            <p className="cs-header__sub">
              Record your grievance in the scrolls of the Realm. A sworn
              servant shall be dispatched to your territory forthwith.
            </p>
            <div className="cs-header__deco" aria-hidden="true">
              <div className="cs-header__deco-line" />
              <div className="cs-header__deco-dot" />
              <div className="cs-header__deco-line" />
            </div>
          </header>

          {authError && (
            <div className="cs-error cs-error--auth">🔒 {authError}</div>
          )}

          {success ? (
            <SuccessOverlay
              complaintId={success.complaintId}
              onViewComplaints={() => navigate("/citizen/complaints")}
              onSubmitAnother={handleSubmitAnother}
            />
          ) : (
            <div className="cs-card">
              <div className="cs-card__glow" aria-hidden="true" />
              <div className="cs-card__accent" />

              <div className="cs-card__head">
                <div className="cs-card__icon">
                  <span className="cs-card__icon-ring" aria-hidden="true" />
                  <span className="cs-card__icon-inner">📜</span>
                </div>
                <div className="cs-card__head-text">
                  <h2 className="cs-card__title">Complaint Chronicle</h2>
                  <p className="cs-card__sub">Fields marked * are binding upon the realm.</p>
                </div>
                <div className="cs-card__progress">
                  <div className="cs-card__progress-track">
                    <div className="cs-card__progress-fill" style={{ width: `${pct}%` }}>
                      <div className="cs-card__progress-shimmer" />
                    </div>
                  </div>
                  <span className="cs-card__progress-label">{pct}%</span>
                </div>
              </div>

              <div className="cs-body">

                <Field
                  label="Area — Location of Issue"
                  required
                  error={errors.areaId}
                  hint={!areasLoading && !areasError && areas.length ? `${areas.length} area${areas.length !== 1 ? "s" : ""} in your village` : undefined}
                >
                  <AreaDropdown
                    areas={areas}
                    loading={areasLoading}
                    fetchError={areasError}
                    value={form.areaId}
                    onChange={handleAreaChange}
                    onRetry={fetchAreas}
                    hasError={!!errors.areaId}
                  />
                </Field>

                <Field label="Issue Category" required error={errors.category}>
                  <CategorySelector value={form.category} onChange={handleCategoryChange} error={!!errors.category} />
                </Field>

                <Field
                  label="Description of the Issue"
                  required
                  error={errors.description}
                  hint={`${form.description.length}/1000`}
                >
                  <div className={`cs-textarea-wrap${errors.description ? " cs-textarea-wrap--err" : ""}`}>
                    <textarea
                      className="cs-textarea"
                      name="description"
                      value={form.description}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, description: e.target.value }));
                        setErrors((er) => ({ ...er, description: "" }));
                      }}
                      placeholder="Describe the issue in detail — the more you provide, the swifter the response…"
                      maxLength={1000}
                      rows={4}
                    />
                  </div>
                </Field>

                <Field label="Evidence Image — Before Photo" required error={errors.imageFile}>
                  <ImageUpload
                    value={form.imageFile}
                    onChange={handleImageChange}
                    error={!!errors.imageFile}
                    uploading={uploading}
                  />
                </Field>

                <div className="cs-location-row">
                  <div className="cs-location-info">
                    <span className="cs-location-label">📍 GPS Location</span>
                    <span className="cs-location-sub">Optional — helps route complaints precisely</span>
                  </div>
                  {form.latitude ? (
                    <div className="cs-location-coords">
                      <span className="cs-location-dot" />
                      <span>{form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}</span>
                      <button
                        type="button"
                        className="cs-location-clear"
                        onClick={() => setForm((f) => ({ ...f, latitude: null, longitude: null }))}
                      >✕</button>
                    </div>
                  ) : (
                    <button type="button" className="cs-location-btn" onClick={handleGetLocation} disabled={locLoading}>
                      {locLoading ? <><span className="cs-btn-spin" /> Locating…</> : "📡 Get Location"}
                    </button>
                  )}
                </div>

                <div className="cs-callout">
                  <span className="cs-callout__icon">⚔</span>
                  <div>
                    <p className="cs-callout__title">The Rite of Complaint</p>
                    <p className="cs-callout__text">
                      Once submitted, your grievance shall be assigned to the worker
                      responsible for your area. The before image you provide will be
                      used by the Citadel's AI to verify resolution when the task is
                      completed. You may track the progress from your complaints scroll.
                    </p>
                  </div>
                </div>

              </div>

              <div className="cs-foot">
                <button
                  className="cs-btn cs-btn--ghost"
                  onClick={() => navigate("/citizen/dashboard")}
                  type="button"
                  disabled={loading}
                >
                  Withdraw
                </button>
                <button
                  className={`cs-btn cs-btn--primary${loading ? " cs-btn--busy" : ""}`}
                  onClick={handleSubmit}
                  type="button"
                  disabled={loading || uploading}
                >
                  {loading ? (
                    <><span className="cs-btn__spin" />Lodging the Complaint…</>
                  ) : (
                    <><span>📜</span>Submit Complaint</>
                  )}
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