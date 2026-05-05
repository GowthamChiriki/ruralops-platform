import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../Styles/ComplaintDetail.css";

/* Fix — centralised API base URL */
const API = "https://ruralops-platform-production.up.railway.app";

/* ═══════════════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════════════ */
const STATUS_CFG = {
  SUBMITTED:   { label:"Submitted",    icon:"📜", color:"#6aa4d8", desc:"Received and logged in the civic registry." },
  ASSIGNED:    { label:"Assigned",     icon:"⚔️",  color:"#9e80d0", desc:"A field officer has been dispatched." },
  IN_PROGRESS: { label:"In Progress",  icon:"🔨", color:"#d4a428", desc:"Active remediation is underway." },
  RESOLVED:    { label:"Resolved",     icon:"✅", color:"#3da858", desc:"Issue addressed. Awaiting verification." },
  VERIFIED:    { label:"AI Verified",  icon:"🔮", color:"#44b474", desc:"Resolution confirmed by image analysis." },
  CLOSED:      { label:"Closed",       icon:"🏁", color:"#607a8a", desc:"Formally closed and archived." },
};

const CATEGORY_ICONS  = { GARBAGE:"🗑️",DRAINAGE:"🌊",ROAD_DAMAGE:"🛤️",STREET_LIGHT:"💡",WATER_SUPPLY:"💧",PUBLIC_HEALTH:"⚕️",OTHER:"📋" };
const CATEGORY_LABELS = { GARBAGE:"Garbage & Waste",DRAINAGE:"Drainage & Flooding",ROAD_DAMAGE:"Road Damage",STREET_LIGHT:"Street Lighting",WATER_SUPPLY:"Water Supply",PUBLIC_HEALTH:"Public Health",OTHER:"General Complaint" };
const STEPS           = ["SUBMITTED","ASSIGNED","IN_PROGRESS","RESOLVED","VERIFIED","CLOSED"];
const PRIORITY_MAP    = { DRAINAGE:"High",ROAD_DAMAGE:"High",PUBLIC_HEALTH:"High",GARBAGE:"Medium",WATER_SUPPLY:"Medium",STREET_LIGHT:"Low",OTHER:"Low" };
const PRIORITY_COLOR  = { High:"#d46050",Medium:"#d4a428",Low:"#44b474" };
const STAGE_DESC = {
  SUBMITTED:   "Logged in the registry — awaiting assignment.",
  ASSIGNED:    "A sworn officer has been designated for inspection.",
  IN_PROGRESS: "Remediation actively underway by the field team.",
  RESOLVED:    "Worker has marked resolved. Awaiting verification.",
  VERIFIED:    "AI system confirmed resolution with high confidence.",
  CLOSED:      "Formally closed and archived. No further action.",
};

/* ── Animated counter ── */
function Counter({ value, suffix="" }) {
  const [n, setN] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 800, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{n}{suffix}</>;
}

/* ── AI Score Ring ── */
function AIRing({ score }) {
  const r = 32, circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score || 0));
  const col = pct >= 80 ? "#44b474" : pct >= 50 ? "#d4a428" : "#d46050";
  return (
    <div className="cdp-ring">
      <svg viewBox="0 0 80 80" width="80" height="80" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={col} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(pct/100)*circ} ${circ}`}
          style={{ transition:"stroke-dasharray 1.1s cubic-bezier(0.22,1,0.36,1)" }}/>
      </svg>
      <div className="cdp-ring__val" style={{ color:col }}>
        <Counter value={pct} suffix="%" />
      </div>
    </div>
  );
}

/* ── Image Modal ── */
function ImgModal({ src, label, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="cdp-imgmodal" onClick={onClose}>
      <div className="cdp-imgmodal__box" onClick={(e) => e.stopPropagation()}>
        <button className="cdp-imgmodal__close" onClick={onClose}>✕</button>
        {label && <p className="cdp-imgmodal__lbl">{label}</p>}
        <img src={src} alt={label} className="cdp-imgmodal__img"/>
      </div>
    </div>
  );
}

/* ── Detail Grid Cell ── */
function DetailCell({ label, value, mono=false, hint=null, accent="#a87420" }) {
  return (
    <div className="cdp-dg-item" style={{ "--accent":accent }}>
      <span className="cdp-dg-lbl">{label}</span>
      <span className={`cdp-dg-val${mono?" mono":""}`}>{value}</span>
      {hint && <span className="cdp-dg-hint">{hint}</span>}
    </div>
  );
}

/* ── Stat Chip ── */
function Chip({ label, value, sub, color }) {
  return (
    <div className="cdp-chip">
      <span className="cdp-chip__lbl">{label}</span>
      <span className="cdp-chip__val" style={color ? { color } : {}}>{value}</span>
      {sub && <span className="cdp-chip__sub">{sub}</span>}
    </div>
  );
}

/* ── Ornamental divider ── */
function Divider() {
  return (
    <div className="cdp-divider">
      <div className="cdp-divider__line"/>
      <div className="cdp-divider__gem"/>
      <div className="cdp-divider__line"/>
    </div>
  );
}

/* ── Ambient orbs ── */
function Ambient({ color }) {
  return (
    <div className="cdp-ambient" aria-hidden="true">
      <div className="cdp-orb cdp-orb--1" style={{ "--orb-color":color }}/>
      <div className="cdp-orb cdp-orb--2"/>
      <div className="cdp-grid"/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function ComplaintDetailPage() {
  const { complaintId } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [visible,   setVisible]   = useState(false);
  const [modal,     setModal]     = useState(null);

  useEffect(() => {
    // Read token fresh inside effect
    const token = localStorage.getItem("accessToken");

    // No token → redirect immediately
    if (!token) {
      navigate("/login");
      return;
    }

    (async () => {
      try {
        // /citizen/complaints/:id → ROLE_CITIZEN required
        const res = await fetch(`${API}/citizen/complaints/${complaintId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 401 → token expired, clear and redirect
        if (res.status === 401) {
          ["accessToken","refreshToken","accountId","accountType"]
            .forEach(k => localStorage.removeItem(k));
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error(`Status ${res.status}`);

        setComplaint(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 55);
      }
    })();
  }, [complaintId, navigate]);

  const fmt = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", { day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit" });
  };
  const fmtShort = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day:"2-digit",month:"short",year:"numeric" });
  };
  const elapsed = (a, b) => {
    if (!a || !b) return null;
    const m = Math.floor((new Date(b) - new Date(a)) / 60000);
    if (m < 60)  return `${m}m`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ${m%60}m` : `${Math.floor(h/24)}d ${h%24}h`;
  };

  /* ── Loading ── */
  if (loading) return (
    <>
      <Navbar/>
      <div className="cdp-page">
        <Ambient color="#a87420"/>
        <div className="cdp-loading">
          <span className="cdp-spin"/>
          Retrieving record from the Citadel…
        </div>
      </div>
      <Footer/>
    </>
  );

  /* ── Error ── */
  if (error || !complaint) return (
    <>
      <Navbar/>
      <div className="cdp-page">
        <Ambient color="#a87420"/>
        <div className={`cdp-outer${visible?" cdp-outer--in":""}`}>
          {/* ✅ Fixed: was /citizen/complaints/${citizenId} */}
          <button className="cdp-back" onClick={() => navigate("/citizen/complaints")}>← Return</button>
          <div className="cdp-error-box">
            <span className="cdp-error-box__icon">🐉</span>
            <p className="cdp-error-box__title">Record could not be retrieved</p>
            <p className="cdp-error-box__sub">{error || "Not found in the civic registry."}</p>
            <button className="cdp-btn cdp-btn--ghost" onClick={() => window.location.reload()}>↻ Retry</button>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );

  /* ── Derive values ── */
  const cfg        = STATUS_CFG[complaint.status] || STATUS_CFG.SUBMITTED;
  const catIcon    = CATEGORY_ICONS[complaint.category]  || "📋";
  const catLabel   = CATEGORY_LABELS[complaint.category] || complaint.category?.replace(/_/g," ") || "—";
  const stepIdx    = STEPS.indexOf(complaint.status);
  const stageClass = `cdp-stage--${complaint.status?.toLowerCase().replace(/_/g,"-")}`;
  const priority   = PRIORITY_MAP[complaint.category] || "Medium";
  const priColor   = PRIORITY_COLOR[priority];

  /* Timeline */
  const tl = [
    { key:"SUBMITTED",   label:"Complaint Submitted",      time:complaint.createdAt,  icon:"📜", color:"#6aa4d8" },
    { key:"ASSIGNED",    label:"Officer Assigned",         time:complaint.assignedAt, icon:"⚔️",  color:"#9e80d0" },
    { key:"IN_PROGRESS", label:"Remediation Commenced",    time:complaint.startedAt,  icon:"🔨", color:"#d4a428" },
    { key:"RESOLVED",    label:"Marked Resolved",          time:complaint.resolvedAt, icon:"✅", color:"#3da858" },
    { key:"VERIFIED",    label:"AI Verification Complete", time:complaint.verifiedAt, icon:"🔮", color:"#44b474" },
    { key:"CLOSED",      label:"Formally Closed",          time:complaint.closedAt,   icon:"🏁", color:"#607a8a" },
  ].filter(t => t.time);

  const hasImages = complaint.beforeImageUrl || complaint.afterImageUrl;
  const hasAI     = complaint.workerRating != null;
  const hasNote   = !!complaint.vaoNote;
  const hasGPS    = complaint.latitude && complaint.longitude;
  const duration  = complaint.closedAt
    ? elapsed(complaint.createdAt, complaint.closedAt)
    : elapsed(complaint.createdAt, new Date().toISOString());

  return (
    <>
      <Navbar/>
      {modal && <ImgModal src={modal.src} label={modal.label} onClose={() => setModal(null)}/>}

      <div className="cdp-page">
        <Ambient color={cfg.color}/>

        <div className={`cdp-outer${visible?" cdp-outer--in":""}`}>

          {/* ── Back ── */}
          {/* ✅ Fixed: was /citizen/complaints/${citizenId} */}
          <button className="cdp-back" onClick={() => navigate("/citizen/complaints")}>
            ← All Complaints
          </button>

          {/* ══ STAGE BANNER ══ */}
          <div className={`cdp-stage-banner ${stageClass}`}>
            <span className="cdp-stage-banner__icon">{cfg.icon}</span>
            <div>
              <p className="cdp-stage-banner__label">{cfg.label}</p>
              <p className="cdp-stage-banner__desc">{STAGE_DESC[complaint.status] || cfg.desc}</p>
            </div>
            <div className="cdp-stage-banner__pill">
              <span className="cdp-stage-banner__dot"/>
              LIVE STATUS
            </div>
          </div>

          {/* ══ HERO ══ */}
          <div className="cdp-hero" style={{ "--stage-color":cfg.color }}>
            <div className="cdp-hero__body">

              <div className="cdp-hero__eyerow">
                <div className="cdp-hero__cat">
                  <span className="cdp-hero__cat-icon">{catIcon}</span>
                  <div>
                    <span className="cdp-hero__cat-name">{catLabel}</span>
                    <span className="cdp-hero__cat-sub">Citizen Complaint · {fmtShort(complaint.createdAt)}</span>
                  </div>
                </div>
                <div className="cdp-status-pill" style={{ "--sc":cfg.color }}>
                  <span className="cdp-status-pill__dot"/>
                  {cfg.icon} {cfg.label}
                </div>
              </div>

              <div className="cdp-hero__id metal-text">#{complaint.complaintId}</div>
              <p className="cdp-hero__desc">{complaint.description}</p>

              <div className="cdp-hero__meta">
                <span>📅 {fmt(complaint.createdAt)}</span>
                {complaint.areaName    && <span>🏘️ {complaint.areaName}</span>}
                {complaint.villageName && <span>⚔️ {complaint.villageName}</span>}
                {complaint.workerName  && <span>⚒️ {complaint.workerName}</span>}
                <span style={{ color:priColor, borderColor:`${priColor}28` }}>⚡ {priority} Priority</span>
              </div>
            </div>

            {/* Stepper */}
            <div className="cdp-stepper-wrap">
              <div className="cdp-stepper">
                {STEPS.map((step, i) => {
                  const done   = i <= stepIdx;
                  const active = i === stepIdx;
                  const sc     = STATUS_CFG[step];
                  const col    = done ? sc.color : "rgba(255,255,255,0.06)";
                  return (
                    <div key={step}
                      className={`cdp-step${done?" done":""}${active?" active":""}`}
                      style={{ "--sc":col }}>
                      {i < STEPS.length - 1 && (
                        <div
                          className={`cdp-step__connector${done&&i<stepIdx?" filled":""}`}
                          style={{ "--lc":done&&i<stepIdx ? sc.color : "rgba(255,255,255,0.05)" }}
                        />
                      )}
                      <div className="cdp-step__node">{sc.icon}</div>
                      <span className="cdp-step__lbl">{sc.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ══ STAT CHIPS ══ */}
          <div className="cdp-chips">
            <Chip
              label="Complaint ID"
              value={<span style={{ fontFamily:"'Courier New',monospace", fontSize:13, color:"var(--gld-1)" }}>
                #{complaint.complaintId}
              </span>}
              sub="Unique registry reference"
            />
            <Chip
              label="Priority Level"
              value={`${priority === "High" ? "🔴" : priority === "Medium" ? "🟡" : "🟢"} ${priority}`}
              sub={priority === "High" ? "Urgent attention" : priority === "Medium" ? "Standard timeline" : "Routine handling"}
              color={priColor}
            />
            <Chip
              label="Duration"
              value={duration || "Ongoing"}
              sub={complaint.closedAt ? "Total resolution time" : "Since submission"}
            />
            {hasAI && (
              <Chip
                label="AI Score"
                value={`${complaint.workerRating}/100`}
                sub={complaint.workerRating >= 80 ? "Resolution verified" : complaint.workerRating >= 50 ? "Partial verification" : "Not verified"}
                color={complaint.workerRating >= 80 ? "#44b474" : complaint.workerRating >= 50 ? "#d4a428" : "#d46050"}
              />
            )}
            {complaint.workerName && (
              <Chip label="Assigned Worker" value={`⚒️ ${complaint.workerName}`} sub="Field officer"/>
            )}
          </div>

          <Divider/>

          {/* ══ ROW A: Details + Timeline ══ */}
          <div className="cdp-row cdp-row--wide" style={{ marginTop:16 }}>

            <div className="cdp-card cdp-card--details cdp-card--featured" style={{ "--accent":cfg.color }}>
              <span className="corner corner--tl"/><span className="corner corner--tr"/>
              <span className="corner corner--bl"/><span className="corner corner--br"/>
              <p className="cdp-card__label">📋 Complaint Details</p>
              <div className="cdp-dg">
                <DetailCell label="Complaint ID"          value={complaint.complaintId}                         mono  hint="Unique civic record reference"   accent={cfg.color}/>
                <DetailCell label="Category"              value={catLabel}                                            hint={`${catIcon} ${complaint.category?.replace(/_/g," ")}`} accent={cfg.color}/>
                <DetailCell label="Status"                value={`${cfg.icon} ${cfg.label}`}                         hint={cfg.desc}                         accent={cfg.color}/>
                <DetailCell label="Priority"              value={priority}                                            hint={priority==="High"?"Urgent attention":priority==="Medium"?"Standard timeline":"Routine handling"} accent={priColor}/>
                <DetailCell label="Reporting Area"        value={complaint.areaName    || "—"}                       hint={complaint.villageName?`Village: ${complaint.villageName}`:undefined} accent={cfg.color}/>
                <DetailCell label="Village / Ward"        value={complaint.villageName || "—"}                       hint="Administrative subdivision"        accent={cfg.color}/>
                <DetailCell label="Date Filed"            value={fmt(complaint.createdAt)}                            hint="Date & time of submission"         accent={cfg.color}/>
                <DetailCell label="Assigned Worker"       value={complaint.workerName  || "Pending"}                 hint={complaint.workerName?"Field officer responsible":"Worker assigned shortly"} accent={complaint.workerName?"#9e80d0":"#d4a428"}/>
                <DetailCell label="AI Verification Score" value={hasAI?`${complaint.workerRating} / 100`:"Pending"}  hint={hasAI?(complaint.workerRating>=80?"Satisfactory":complaint.workerRating>=50?"Partial":"Failed"):"Awaiting resolution image"} accent={hasAI?(complaint.workerRating>=80?"#44b474":"#d4a428"):"#4a4a4a"}/>
                <DetailCell label="Total Duration"        value={duration||"Ongoing"}                                hint={complaint.closedAt?"Submission to closure":"Elapsed since submission"} accent={cfg.color}/>
              </div>
            </div>

            {tl.length > 0 && (
              <div className="cdp-card cdp-card--timeline" style={{ "--accent":cfg.color }}>
                <p className="cdp-card__label">⏳ Status Timeline</p>
                <div className="cdp-timeline">
                  {tl.map((t, i) => (
                    <div key={t.key} className="cdp-tl-item">
                      <div className="cdp-tl-left">
                        <div className="cdp-tl-dot" style={{ "--dc":t.color }}>{t.icon}</div>
                        {i < tl.length - 1 && <div className="cdp-tl-line" style={{ "--lc":t.color }}/>}
                      </div>
                      <div className="cdp-tl-body">
                        <p className="cdp-tl-label" style={{ color:t.color }}>{t.label}</p>
                        <p className="cdp-tl-time">{fmt(t.time)}</p>
                        {i > 0 && elapsed(tl[i-1].time, t.time) && (
                          <p className="cdp-tl-elapsed">⏱ +{elapsed(tl[i-1].time, t.time)} since prev</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══ ROW B: Gallery + AI ══ */}
          {(hasImages || hasAI) && (
            <div className="cdp-row cdp-row--60-40">
              {hasImages && (
                <div className="cdp-card" style={{ "--accent":"#6aa4d8" }}>
                  <p className="cdp-card__label">📸 Evidence Gallery</p>
                  <div className="cdp-gallery">
                    {complaint.beforeImageUrl ? (
                      <div className="cdp-photo"
                        onClick={() => setModal({ src:complaint.beforeImageUrl, label:"Before — Issue Evidence" })}>
                        <span className="cdp-photo__badge cdp-photo__badge--before">Before</span>
                        <img src={complaint.beforeImageUrl} alt="Before" className="cdp-photo__img"/>
                        <div className="cdp-photo__hover">🔍 Full Resolution</div>
                      </div>
                    ) : (
                      <div className="cdp-photo cdp-photo--empty">
                        <span>📷</span><span>No before image</span>
                      </div>
                    )}
                    {complaint.afterImageUrl ? (
                      <div className="cdp-photo"
                        onClick={() => setModal({ src:complaint.afterImageUrl, label:"After — Resolution Confirmed" })}>
                        <span className="cdp-photo__badge cdp-photo__badge--after">After</span>
                        <img src={complaint.afterImageUrl} alt="After" className="cdp-photo__img"/>
                        <div className="cdp-photo__hover">🔍 Full Resolution</div>
                      </div>
                    ) : (
                      <div className="cdp-photo cdp-photo--empty">
                        <span>⏳</span><span>Awaiting resolution image</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasAI && (
                <div className="cdp-card cdp-card--ai" style={{ "--accent":"#44b474" }}>
                  <p className="cdp-card__label">🔮 AI Verification</p>
                  <div className="cdp-ai">
                    <div className="cdp-ai__top">
                      <AIRing score={complaint.workerRating}/>
                      <div>
                        <p className="cdp-ai__verdict">
                          {complaint.workerRating >= 80 ? "✅ Verified"
                            : complaint.workerRating >= 50 ? "⚠️ Partial"
                            : "❌ Failed"}
                        </p>
                        <p style={{ fontFamily:"'Crimson Pro',serif",fontSize:12,color:"var(--t3)",marginTop:3 }}>
                          Confidence Score
                        </p>
                      </div>
                    </div>
                    <p className="cdp-ai__desc">
                      Before/after image comparison yielded a score of{" "}
                      <strong style={{ color:"var(--t1)" }}>{complaint.workerRating}/100</strong>.{" "}
                      {complaint.workerRating >= 80
                        ? "Site appears satisfactorily restored."
                        : complaint.workerRating >= 50
                        ? "Partial address detected. Further inspection may be needed."
                        : "Resolution could not be confirmed from the submitted evidence."}
                    </p>
                    {complaint.aiNote && (
                      <p className="cdp-ai__note">🔮 {complaint.aiNote}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ ROW C: Officer note + GPS ══ */}
          {(hasNote || hasGPS) && (
            <div className={`cdp-row ${hasNote && hasGPS ? "cdp-row--2col" : "cdp-row--full"}`}>
              {hasNote && (
                <div className="cdp-card cdp-card--note" style={{ "--accent":"#9e80d0" }}>
                  <p className="cdp-card__label">📜 Officer's Field Note</p>
                  <div className="cdp-note">
                    <span className="cdp-note__icon">⚔️</span>
                    <p className="cdp-note__text">{complaint.vaoNote}</p>
                  </div>
                </div>
              )}
              {hasGPS && (
                <div className="cdp-card cdp-card--gps" style={{ "--accent":"#44b474" }}>
                  <p className="cdp-card__label">📍 Reported Location</p>
                  <div className="cdp-gps">
                    <span className="cdp-gps__dot"/>
                    <span className="cdp-gps__coords">
                      {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                    </span>
                    <a href={`https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}`}
                      target="_blank" rel="noreferrer"
                      className="cdp-btn cdp-btn--ghost cdp-btn--sm">
                      🗺️ Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="cdp-foot">
            {/* ✅ Fixed: was /citizen/complaints/${citizenId} */}
            <button className="cdp-btn cdp-btn--ghost"
              onClick={() => navigate("/citizen/complaints")}>
              ← All Complaints
            </button>
            {/* ✅ Fixed: was /citizen/complaint/${citizenId} */}
            <button className="cdp-btn cdp-btn--primary"
              onClick={() => navigate("/citizen/complaint/new")}>
              📜 Lodge New Complaint
            </button>
          </div>

        </div>
      </div>
      <Footer/>
    </>
  );
}