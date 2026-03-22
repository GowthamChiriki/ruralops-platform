import { useEffect, useRef } from "react";
import "./VaoProfileModal.css";

/* ─────────────────────────────────────────────
   VAO PROFILE MODAL
   Shows a beautiful read-only profile card.
   "Update Profile" button navigates to the form.
   No logic changes — pure UI layer.
───────────────────────────────────────────── */

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  }) : "—";
}

export default function VaoProfileModal({ open, onClose, profile, vaoId, onUpdateProfile }) {
  const overlayRef = useRef(null);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  /* Trap focus inside modal */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const p        = profile ?? {};
  const name     = p.fullName     || "—";
  const village  = p.villageName  || "—";
  const dob      = fmtDate(p.dateOfBirth);
  const gender   = p.gender       || "—";
  const qual     = p.qualification || "—";
  const phone    = p.alternatePhone ? `+91 ${p.alternatePhone}` : "—";
  const address  = p.officeAddress || "—";
  const complete = p.profileCompleted === true;

  const photoUrl = p.profilePhotoUrl && !p.profilePhotoUrl.startsWith("blob:")
    ? p.profilePhotoUrl : null;
  const sigUrl   = p.signaturePhotoUrl && !p.signaturePhotoUrl.startsWith("blob:")
    ? p.signaturePhotoUrl : null;

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="vpm-backdrop"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="VAO Profile"
    >
      <div className="vpm-modal">

        {/* ── Top accent bar ── */}
        <div className="vpm-accent-bar" aria-hidden="true" />

        {/* ── Header ── */}
        <div className="vpm-header">
          <div className="vpm-header__left">
            <div className="vpm-avatar">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name}
                  className="vpm-avatar__img"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <span className="vpm-avatar__initials">{initials}</span>
              )}
              <span className={`vpm-avatar__dot${complete ? " vpm-avatar__dot--ok" : ""}`} />
            </div>
            <div className="vpm-header__info">
              <p className="vpm-eyebrow">Village Administrative Officer</p>
              <h2 className="vpm-name">{name}</h2>
              <div className="vpm-chips">
                <span className={`vpm-chip${complete ? " vpm-chip--ok" : " vpm-chip--warn"}`}>
                  {complete ? "✓ Verified" : "⚠ Incomplete"}
                </span>
                <span className="vpm-chip vpm-chip--village">⚔ {village}</span>
                {vaoId && (
                  <span className="vpm-chip vpm-chip--id">{vaoId}</span>
                )}
              </div>
            </div>
          </div>
          <button
            className="vpm-close"
            onClick={onClose}
            aria-label="Close profile"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="vpm-body">

          {/* Left column — details */}
          <div className="vpm-details">
            <h3 className="vpm-section-title">Personal Details</h3>

            <div className="vpm-grid">
              <div className="vpm-row">
                <span className="vpm-row__icon">🎂</span>
                <div className="vpm-row__body">
                  <span className="vpm-row__label">Date of Birth</span>
                  <span className="vpm-row__val">{dob}</span>
                </div>
              </div>

              <div className="vpm-row">
                <span className="vpm-row__icon">⚥</span>
                <div className="vpm-row__body">
                  <span className="vpm-row__label">Gender</span>
                  <span className="vpm-row__val">{gender}</span>
                </div>
              </div>

              <div className="vpm-row">
                <span className="vpm-row__icon">🎓</span>
                <div className="vpm-row__body">
                  <span className="vpm-row__label">Qualification</span>
                  <span className="vpm-row__val">{qual}</span>
                </div>
              </div>

              <div className="vpm-row">
                <span className="vpm-row__icon">📱</span>
                <div className="vpm-row__body">
                  <span className="vpm-row__label">Alternate Phone</span>
                  <span className="vpm-row__val">{phone}</span>
                </div>
              </div>
            </div>

            <div className="vpm-row vpm-row--full">
              <span className="vpm-row__icon">🏢</span>
              <div className="vpm-row__body">
                <span className="vpm-row__label">Office Address</span>
                <span className="vpm-row__val vpm-row__val--address">{address}</span>
              </div>
            </div>
          </div>

          {/* Right column — photo + signature */}
          <div className="vpm-docs">
            <h3 className="vpm-section-title">Documents</h3>

            <div className="vpm-photo-wrap">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile photo"
                  className="vpm-photo"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <div className="vpm-photo-placeholder">
                  <span>👤</span>
                  <p>No photo</p>
                </div>
              )}
              <span className="vpm-photo-label">Profile Photo</span>
            </div>

            {sigUrl && (
              <div className="vpm-sig-wrap">
                <span className="vpm-photo-label">Signature</span>
                <div className="vpm-sig-box">
                  <img
                    src={sigUrl}
                    alt="Signature"
                    className="vpm-sig"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </div>
              </div>
            )}

            {!sigUrl && (
              <div className="vpm-sig-wrap">
                <span className="vpm-photo-label">Signature</span>
                <div className="vpm-sig-box vpm-sig-box--empty">
                  <p>Not uploaded</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="vpm-footer">
          <button className="vpm-btn vpm-btn--ghost" onClick={onClose}>
            Close
          </button>
          <button
            className="vpm-btn vpm-btn--primary"
            onClick={() => {
              onClose();
              onUpdateProfile();
            }}
          >
            <span>✏</span>
            {complete ? "Update Profile" : "Complete Profile"}
          </button>
        </div>

      </div>
    </div>
  );
}