import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// ✅ fixed: was VITE_API_URL — standardized to match rest of the app
const API = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS — Iron Throne Edition
══════════════════════════════════════════════════════════════ */
const T = {
  bg:         "#010507",
  surface:    "#060c0f",
  elevated:   "#0c1820",
  raised:     "#101f28",

  border:     "rgba(201,162,39,0.12)",
  borderHov:  "rgba(201,162,39,0.35)",
  borderFoc:  "rgba(201,162,39,0.60)",
  borderErr:  "rgba(176,58,46,0.60)",
  borderOk:   "rgba(61,153,96,0.55)",

  gold:       "#c9a227",
  goldBright: "#f5d76e",
  goldDark:   "#8b6914",
  goldPale:   "rgba(201,162,39,0.06)",
  goldGlow:   "rgba(201,162,39,0.22)",

  emerald:    "#3d9960",
  emeraldD:   "#2d7748",
  rose:       "#b03a2e",
  amber:      "#d4881a",
  steel:      "#5d7a8a",

  txtP:       "#e8dfc8",
  txtS:       "#8a7a5a",
  txtM:       "#4a3e28",
  txtF:       "#2a1e10",

  r:          "10px",
  rLg:        "16px",
  rXl:        "22px",
  sh:         "0 8px 48px rgba(0,0,0,0.75), 0 2px 10px rgba(0,0,0,0.55)",
};

/* ══════════════════════════════════════════════════════════════
   INJECTED STYLES
══════════════════════════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;500;600;700;800;900&family=Crimson+Pro:ital,opsz,wght@0,6..37,300;0,6..37,400;0,6..37,500;0,6..37,600;1,6..37,300;1,6..37,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Crimson Pro',Georgia,serif;background:#010507;color:#e8dfc8;-webkit-font-smoothing:antialiased}

@keyframes gotFadeUp{from{opacity:0;transform:translateY(32px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes gotFadeIn{from{opacity:0}to{opacity:1}}
@keyframes gotSlideR{from{opacity:0;transform:translateX(40px) scale(0.96)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes gotSlideL{from{opacity:0;transform:translateX(-40px) scale(0.96)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes gotToastIn{from{opacity:0;transform:translateX(80px) scale(0.92)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes gotToastOut{from{opacity:1;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(80px) scale(0.92)}}
@keyframes gotShim{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes gotSpin{to{transform:rotate(360deg)}}
@keyframes gotSpinRev{to{transform:rotate(-360deg)}}
@keyframes gotPulseGold{0%,100%{box-shadow:0 0 0 0 rgba(201,162,39,0.55)}50%{box-shadow:0 0 0 10px rgba(201,162,39,0)}}
@keyframes gotPulseGreen{0%,100%{box-shadow:0 0 0 0 rgba(61,153,96,0.50)}50%{box-shadow:0 0 0 8px rgba(61,153,96,0)}}
@keyframes gotBlink{0%,100%{opacity:1}50%{opacity:0.20}}
@keyframes gotFlicker{0%,100%{opacity:0.80;transform:scale(1) rotate(-1deg)}33%{opacity:1;transform:scale(1.07) rotate(1deg)}66%{opacity:0.85;transform:scale(0.97) rotate(-0.5deg)}}
@keyframes gotOrbA{0%{transform:translate(0,0) scale(1)}100%{transform:translate(-60px,55px) scale(1.14)}}
@keyframes gotOrbB{0%{transform:translate(0,0) scale(1)}100%{transform:translate(55px,-50px) scale(1.16)}}
@keyframes gotStepPop{0%{transform:scale(0.70);opacity:0}65%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes gotConnFill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes gotCheckDraw{from{stroke-dashoffset:40}to{stroke-dashoffset:0}}
@keyframes gotCardGlow{0%,100%{opacity:0.55}50%{opacity:0.90}}
@keyframes gotSegFill{from{width:0}to{width:100%}}
@keyframes gotRingRotate{to{transform:rotate(360deg)}}
@keyframes gotRingRev{to{transform:rotate(-360deg)}}

input:-webkit-autofill,input:-webkit-autofill:focus{
  -webkit-box-shadow:0 0 0 1000px #0c1820 inset !important;
  -webkit-text-fill-color:#e8dfc8 !important;caret-color:#e8dfc8}
input[type="date"]::-webkit-calendar-picker-indicator{
  filter:invert(0.55) sepia(0.5) saturate(1.8) hue-rotate(5deg);cursor:pointer;opacity:0.70}
::selection{background:rgba(201,162,39,0.22);color:#e8dfc8}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:#010507}
::-webkit-scrollbar-thumb{background:#0c1820;border-radius:3px}
select option{background:#0c1820;color:#e8dfc8;font-family:'Crimson Pro',serif}
`;

/* ══════════════════════════════════════════════════════════════
   STEPS
══════════════════════════════════════════════════════════════ */
const STEPS = [
  { id:"personal",  label:"Personal",  icon:"👤", desc:"Your sworn identity",         fields:["firstName","lastName","gender","dateOfBirth","age"] },
  { id:"family",    label:"Lineage",   icon:"🏰", desc:"Parent & guardian bloodline",  fields:["fatherName","motherName"] },
  { id:"documents", label:"Seals",     icon:"📜", desc:"Royal seals & identification", fields:["aadhaarNumber","rationCardNumber"] },
  { id:"dominion",  label:"Dominion",  icon:"⚔️", desc:"Your lands & address",        fields:["houseNumber","street","pincode"] },
  { id:"likeness",  label:"Likeness",  icon:"🖼️", desc:"Portrait for the realm",      fields:[] },
];

const FIELD_META = {
  firstName:        { label:"First Name",        placeholder:"Enter your first name",      required:true,  type:"text" },
  lastName:         { label:"Family Name",        placeholder:"Enter your family name",     required:false, type:"text" },
  gender:           { label:"Gender",             placeholder:null,                         required:true,  type:"select", options:["Male","Female","Other","Prefer not to say"] },
  dateOfBirth:      { label:"Date of Birth",      placeholder:null,                         required:false, type:"date" },
  age:              { label:"Age (Years)",         placeholder:"e.g. 28",                   required:false, type:"number" },
  fatherName:       { label:"Father's Full Name", placeholder:"Enter father's name",        required:true,  type:"text" },
  motherName:       { label:"Mother's Full Name", placeholder:"Enter mother's name",        required:false, type:"text" },
  aadhaarNumber:    { label:"Aadhaar Number",     placeholder:"XXXX XXXX XXXX",             required:false, type:"text", maxLength:14 },
  rationCardNumber: { label:"Ration Card No.",    placeholder:"Enter ration card number",   required:false, type:"text" },
  houseNumber:      { label:"House / Flat No.",   placeholder:"e.g. 12B",                  required:false, type:"text" },
  street:           { label:"Street / Locality",  placeholder:"Enter street or area name",  required:false, type:"text" },
  pincode:          { label:"Pincode",            placeholder:"6-digit pincode",            required:false, type:"text", maxLength:6 },
};

/* ══════════════════════════════════════════════════════════════
   AUTH HELPERS
══════════════════════════════════════════════════════════════ */
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
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
        // NOTE: do NOT set Content-Type for FormData — browser sets boundary automatically
      },
    });

  // ✅ fixed: navigate with replace:true so Back button doesn't land on broken page
  const clearAuth = () => {
    ["accessToken", "refreshToken", "accountId", "accountType"]
      .forEach((k) => localStorage.removeItem(k));
    navigateFn("/login", { replace: true });
  };

  // ✅ fixed: trim token to prevent malformed "Bearer  null" headers
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

/* ── Small atoms ── */
const LiveDot = () => (
  <span style={{
    display:"inline-block",width:7,height:7,borderRadius:"50%",
    background:T.gold,flexShrink:0,
    boxShadow:`0 0 8px ${T.gold},0 0 16px rgba(201,162,39,0.4)`,
    animation:"gotBlink 2.2s ease-in-out infinite",
  }}/>
);

const RuneDivider = ({ w=240, op=0.4 }) => (
  <svg width={w} height={18} viewBox={`0 0 ${w} 18`} style={{display:"block",opacity:op}}>
    <line x1="0" y1="9" x2={w/2-18} y2="9" stroke={T.gold} strokeWidth="0.8"/>
    <polygon points={`${w/2-12},9 ${w/2},3 ${w/2+12},9 ${w/2},15`} fill="none" stroke={T.gold} strokeWidth="0.9"/>
    <line x1={w/2+18} y1="9" x2={w} y2="9" stroke={T.gold} strokeWidth="0.8"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════════ */
function Toast({ toasts }) {
  const cfg = {
    success:{ bg:"rgba(61,153,96,0.11)",  border:"rgba(61,153,96,0.32)",  icon:"✅", accent:T.emerald },
    error:  { bg:"rgba(176,58,46,0.12)",  border:"rgba(176,58,46,0.32)",  icon:"⚠",  accent:T.rose    },
    info:   { bg:"rgba(201,162,39,0.09)", border:"rgba(201,162,39,0.28)", icon:"⚔",  accent:T.gold    },
  };
  return (
    <div style={{position:"fixed",top:30,right:30,zIndex:9999,display:"flex",flexDirection:"column",gap:10,pointerEvents:"none"}}>
      {toasts.map(t => {
        const c = cfg[t.type]||cfg.info;
        return (
          <div key={t.id} style={{
            display:"flex",alignItems:"flex-start",gap:13,
            padding:"15px 20px",
            background:c.bg,border:`1px solid ${c.border}`,
            borderRadius:T.rLg,maxWidth:360,minWidth:270,
            backdropFilter:"blur(20px)",
            boxShadow:`0 10px 36px rgba(0,0,0,0.65),0 0 0 1px ${c.border}`,
            animation:t.leaving?"gotToastOut 0.32s ease forwards":"gotToastIn 0.42s cubic-bezier(0.34,1.56,0.64,1) both",
            pointerEvents:"all",position:"relative",overflow:"hidden",
          }}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,transparent,${c.accent},transparent)`,opacity:0.7}}/>
            <span style={{fontSize:18,flexShrink:0,marginTop:2}}>{c.icon}</span>
            <div style={{flex:1}}>
              <p style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:c.accent,marginBottom:4}}>
                {t.title}
              </p>
              {t.message && <p style={{fontFamily:"'Crimson Pro',serif",fontSize:14,color:T.txtS,lineHeight:1.6}}>{t.message}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FIELD
══════════════════════════════════════════════════════════════ */
function Field({ name, value, onChange, touched, error, animDir, index=0 }) {
  const meta      = FIELD_META[name];
  const [focused, setFocused] = useState(false);
  const hasValue  = value && value.toString().length > 0;
  const isInvalid = touched && error;
  const isValid   = touched && !error && hasValue;

  const borderColor = isInvalid ? T.borderErr : isValid ? T.borderOk : focused ? T.borderFoc : T.border;
  const glowColor   = isInvalid ? "rgba(176,58,46,0.14)" : "rgba(201,162,39,0.12)";
  const anim        = animDir === "right" ? "gotSlideR" : "gotSlideL";

  const baseInput = {
    width:"100%", padding:"13px 16px",
    background: focused ? T.elevated : T.surface,
    border:`1.5px solid ${borderColor}`,
    borderRadius:T.r, color:T.txtP,
    fontSize:15, fontFamily:"'Crimson Pro',Georgia,serif",
    outline:"none", WebkitAppearance:"none",
    transition:"all 0.22s cubic-bezier(0.4,0,0.2,1)",
    boxShadow: focused ? `0 0 0 3px ${glowColor},inset 0 1px 0 rgba(201,162,39,0.06)` : "none",
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:6,animation:`${anim} 0.38s cubic-bezier(0.4,0,0.2,1) ${index*0.065}s both`}}>
      <label style={{
        fontFamily:"'Cinzel',serif",
        fontSize:9.5,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",
        color:isInvalid?T.rose:focused?T.gold:T.txtM,
        transition:"color 0.2s ease",
        display:"flex",alignItems:"center",gap:5,
      }}>
        {meta.label}
        {meta.required && <span style={{color:T.rose,fontSize:13,lineHeight:1,fontFamily:"serif"}}>*</span>}
      </label>

      {meta.type === "select" ? (
        <select name={name} value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...baseInput,cursor:"pointer",
            backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a7a5a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",paddingRight:38,
          }}
        >
          <option value="" disabled>Choose {meta.label}…</option>
          {meta.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={meta.type} name={name} value={value}
          placeholder={meta.placeholder}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={meta.maxLength}
          required={meta.required}
          style={baseInput}
        />
      )}

      <div style={{minHeight:18,display:"flex",alignItems:"center",gap:5}}>
        {isInvalid && (
          <p style={{fontFamily:"'Crimson Pro',serif",fontSize:12,color:T.rose,animation:"gotFadeIn 0.2s ease",display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:10}}>⚠</span>{error}
          </p>
        )}
        {isValid && (
          <p style={{fontFamily:"'Crimson Pro',serif",fontSize:12,color:T.emerald,animation:"gotFadeIn 0.2s ease",display:"flex",alignItems:"center",gap:4}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.emerald} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" strokeDasharray="40" style={{animation:"gotCheckDraw 0.35s ease both"}}/>
            </svg>
            Sealed to the ledger
          </p>
        )}
        {meta.maxLength && !isInvalid && (
          <p style={{fontFamily:"'Cinzel',serif",fontSize:9,color:T.txtF,marginLeft:"auto",letterSpacing:"0.06em"}}>
            {(value||"").length}/{meta.maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PHOTO UPLOADER
══════════════════════════════════════════════════════════════ */
function PhotoUploader({ photo, setPhoto, animDir }) {
  const [preview, setPreview] = useState(null);
  const [drag,    setDrag]    = useState(false);
  const inputRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPhoto(file);
    const r = new FileReader();
    r.onload = e => setPreview(e.target.result);
    r.readAsDataURL(file);
  }, [setPhoto]);

  const anim = animDir === "right" ? "gotSlideR" : "gotSlideL";

  return (
    <div style={{animation:`${anim} 0.38s cubic-bezier(0.4,0,0.2,1) both`}}>
      <p style={{fontFamily:"'Cinzel',serif",fontSize:9.5,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:T.txtM,marginBottom:14}}>
        Your Portrait for the Realm
      </p>

      {preview ? (
        <div style={{
          display:"flex",alignItems:"center",gap:26,padding:"22px 26px",
          background:T.surface,border:`1.5px solid ${T.borderOk}`,
          borderRadius:T.rLg,
          boxShadow:"0 0 32px rgba(61,153,96,0.12),inset 0 1px 0 rgba(61,153,96,0.08)",
          animation:"gotFadeIn 0.35s ease",position:"relative",overflow:"hidden",
        }}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,transparent,${T.emerald},transparent)`,opacity:0.55}}/>
          <div style={{position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",inset:-6,borderRadius:"50%",border:`1.5px solid rgba(61,153,96,0.35)`,animation:"gotRingRotate 10s linear infinite"}}/>
            <img src={preview} alt="portrait" style={{width:90,height:90,borderRadius:"50%",objectFit:"cover",border:`2px solid ${T.borderOk}`,boxShadow:"0 0 0 3px rgba(61,153,96,0.22),0 4px 22px rgba(0,0,0,0.55)",display:"block"}}/>
            <div style={{position:"absolute",bottom:2,right:2,width:24,height:24,borderRadius:"50%",background:`linear-gradient(135deg,${T.emerald},${T.emeraldD})`,border:`2.5px solid ${T.surface}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,boxShadow:"0 2px 8px rgba(61,153,96,0.50)"}}>✓</div>
          </div>
          <div style={{flex:1}}>
            <p style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,letterSpacing:"0.08em",color:T.emerald,marginBottom:5}}>✓ Portrait Sealed</p>
            <p style={{fontFamily:"'Crimson Pro',serif",fontSize:14,color:T.txtS,marginBottom:14}}>{photo?.name}</p>
            <button type="button" onClick={() => { setPreview(null); setPhoto(null); }}
              style={{padding:"6px 18px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:T.r,color:T.txtS,fontFamily:"'Cinzel',serif",fontSize:9.5,fontWeight:700,letterSpacing:"0.10em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s ease"}}
              onMouseEnter={e => { e.currentTarget.style.borderColor=T.rose; e.currentTarget.style.color=T.rose; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.txtS; }}
            >
              Remove Portrait
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          style={{
            border:`2px dashed ${drag?T.gold:T.border}`,borderRadius:T.rLg,
            padding:"52px 28px",textAlign:"center",cursor:"pointer",
            background:drag?"rgba(201,162,39,0.05)":T.surface,
            transition:"all 0.25s ease",
            boxShadow:drag?"0 0 45px rgba(201,162,39,0.10),inset 0 0 0 1px rgba(201,162,39,0.08)":"none",
            position:"relative",overflow:"hidden",
          }}
        >
          {[
            {top:"10px",left:"10px",borderTop:`1.5px solid`,borderLeft:`1.5px solid`},
            {top:"10px",right:"10px",borderTop:`1.5px solid`,borderRight:`1.5px solid`},
            {bottom:"10px",left:"10px",borderBottom:`1.5px solid`,borderLeft:`1.5px solid`},
            {bottom:"10px",right:"10px",borderBottom:`1.5px solid`,borderRight:`1.5px solid`},
          ].map((s,i) => (
            <div key={i} style={{position:"absolute",width:16,height:16,...s,borderColor:drag?T.gold:"rgba(201,162,39,0.28)",transition:"border-color 0.2s ease"}}/>
          ))}
          <div style={{fontSize:42,marginBottom:16,display:"inline-block",animation:"gotFlicker 3s ease-in-out infinite",filter:drag?`drop-shadow(0 0 12px ${T.gold})`:"none",transition:"filter 0.3s ease"}}>🖼️</div>
          <p style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:700,letterSpacing:"0.06em",color:T.txtP,marginBottom:8}}>
            {drag ? "Release to seal your portrait" : (<>Drop your portrait here or{" "}<span style={{background:`linear-gradient(135deg,${T.goldBright},${T.gold})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",textDecoration:"underline",textDecorationColor:"rgba(201,162,39,0.45)"}}>summon from your scrolls</span></>)}
          </p>
          <p style={{fontFamily:"'Crimson Pro',serif",fontSize:14,color:T.txtM}}>JPG · PNG · WEBP &nbsp;·&nbsp; Max 5MB</p>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e => handleFile(e.target.files[0])}/>

      <div style={{marginTop:16,padding:"14px 18px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:T.r,display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{fontSize:15,flexShrink:0,marginTop:1}}>⚔</span>
        <p style={{fontFamily:"'Crimson Pro',serif",fontSize:14,color:T.txtS,lineHeight:1.75}}>
          Your portrait shall be inscribed upon your citizen seal. Ensure it is a clear, recent likeness — facing forward — as befits a sworn citizen of the crown.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEPPER
══════════════════════════════════════════════════════════════ */
function Stepper({ current, completed }) {
  return (
    <div style={{display:"flex",alignItems:"center",marginBottom:44}}>
      {STEPS.map((step,i) => {
        const done   = completed.includes(i);
        const active = current === i;
        return (
          <div key={step.id} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"none"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,flexShrink:0,position:"relative"}}>
              {active && (
                <div style={{position:"absolute",inset:-8,borderRadius:"50%",border:"1px solid rgba(201,162,39,0.38)",animation:"gotPulseGold 2.5s ease-in-out infinite",pointerEvents:"none"}}/>
              )}
              <div style={{
                width:46,height:46,borderRadius:"50%",
                background:done?`linear-gradient(145deg,${T.emerald},${T.emeraldD})`:active?`linear-gradient(145deg,${T.gold},${T.goldDark})`:`linear-gradient(145deg,${T.elevated},${T.surface})`,
                border:`2px solid ${done?T.borderOk:active?T.borderFoc:T.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:18,flexShrink:0,
                transition:"all 0.38s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow:done?"0 0 22px rgba(61,153,96,0.40),0 0 0 3px rgba(61,153,96,0.10)":active?"0 0 22px rgba(201,162,39,0.45),0 0 0 3px rgba(201,162,39,0.12)":"none",
                animation:active?"gotStepPop 0.52s cubic-bezier(0.34,1.56,0.64,1) both":"none",
              }}>
                {done ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#060400" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" strokeDasharray="40" style={{animation:"gotCheckDraw 0.42s ease both"}}/>
                  </svg>
                ) : (
                  <span style={{filter:active?"none":"grayscale(0.5)",opacity:active?1:0.5,transition:"all 0.3s ease"}}>{step.icon}</span>
                )}
              </div>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:done?T.emerald:active?T.gold:T.txtM,whiteSpace:"nowrap",transition:"color 0.3s ease"}}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length-1 && (
              <div style={{flex:1,height:2,margin:"0 5px",marginBottom:26,background:T.border,position:"relative",overflow:"hidden",borderRadius:99}}>
                {done && (
                  <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,${T.emerald},rgba(61,153,96,0.55))`,transformOrigin:"left center",animation:"gotConnFill 0.48s ease both"}}/>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════════════════════════ */
function ProgressBar({ completed, current, total }) {
  const pct = Math.round((completed.length / total) * 100);
  return (
    <div style={{marginBottom:38}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <LiveDot/>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:9.5,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:T.txtM}}>
            Oath Completion
          </span>
        </div>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:800,letterSpacing:"0.04em",color:pct===100?T.emerald:T.gold,transition:"color 0.4s ease"}}>
          {pct}%
        </span>
      </div>
      <div style={{display:"flex",gap:4}}>
        {Array.from({length:total}).map((_,i) => (
          <div key={i} style={{flex:1,height:5,borderRadius:99,background:T.surface,overflow:"hidden",position:"relative"}}>
            {completed.includes(i) && (
              <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,${T.emerald},rgba(61,153,96,0.65))`,borderRadius:99,animation:"gotSegFill 0.45s ease both"}}/>
            )}
            {i===current && !completed.includes(i) && (
              <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,${T.gold},rgba(201,162,39,0.45))`,borderRadius:99,backgroundSize:"200% 100%",animation:"gotShim 2.4s ease-in-out infinite"}}/>
            )}
          </div>
        ))}
      </div>
      <p style={{fontFamily:"'Crimson Pro',serif",fontSize:13,color:T.txtF,marginTop:8,fontStyle:"italic"}}>
        {completed.length} of {total} scrolls sealed in the ledger
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEP HINT
══════════════════════════════════════════════════════════════ */
function StepHint({ step }) {
  const hints = [
    {icon:"ℹ️",bg:"rgba(201,162,39,0.06)",border:"rgba(201,162,39,0.22)",text:"Fields marked * are required. Your name must match your government-issued scroll exactly. The realm accepts no false proclamations."},
    null,
    {icon:"🔒",bg:"rgba(61,153,96,0.06)",border:"rgba(61,153,96,0.22)",text:"Your Aadhaar and ration seal numbers are encrypted under the Royal Data Protection Decree and used only for identity verification within the realm."},
    {icon:"📍",bg:"rgba(93,122,138,0.06)",border:"rgba(93,122,138,0.22)",text:"Enter your permanent dominion address. This will be used for all official ravens and proclamations from the crown."},
    null,
  ];
  const h = hints[step];
  if (!h) return null;
  return (
    <div style={{marginTop:18,padding:"14px 18px",background:h.bg,border:`1px solid ${h.border}`,borderRadius:T.r,display:"flex",gap:11,alignItems:"flex-start",animation:"gotFadeIn 0.45s ease 0.28s both"}}>
      <span style={{fontSize:15,flexShrink:0,marginTop:2}}>{h.icon}</span>
      <p style={{fontFamily:"'Crimson Pro',serif",fontSize:14,color:T.txtS,lineHeight:1.75}}>{h.text}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
function CitizenProfileForm() {
  const navigate = useNavigate();

  // ✅ fixed: role guard — fail immediately instead of relying on apiFetch to redirect
  const token = localStorage.getItem("accessToken")?.trim();
  const role  = localStorage.getItem("accountType");
  if (!token || role !== "CITIZEN") {
    navigate("/login", { replace: true });
    return null;
  }

  const [step,           setStep]           = useState(0);
  const [direction,      setDir]            = useState("right");
  const [completed,      setCompleted]      = useState([]);
  const [submitting,     setSubmitting]     = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isUpdate,       setIsUpdate]       = useState(false);
  const [toasts,         setToasts]         = useState([]);
  const [form, setForm] = useState({
    firstName:"",lastName:"",gender:"",dateOfBirth:"",
    age:"",fatherName:"",motherName:"",aadhaarNumber:"",
    rationCardNumber:"",houseNumber:"",street:"",pincode:"",
  });
  const [touched,          setTouched]          = useState({});
  const [errors,           setErrors]           = useState({});
  const [photo,            setPhoto]            = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);

  /* ── Prefill existing profile ── */
  useEffect(() => {
    (async () => {
      // GET /citizen/profile — backend resolves identity from JWT, no path param
      const res = await apiFetch(`${API}/citizen/profile`, {}, navigate);
      if (!res) return;

      try {
        if (res.ok) {
          const data = await res.json();
          if (data && data.firstName) {
            setIsUpdate(true);
            setForm({
              firstName:        data.firstName        || "",
              lastName:         data.lastName         || "",
              gender:           data.gender           || "",
              dateOfBirth:      data.dateOfBirth      || "",
              age:              data.age ? String(data.age) : "",
              fatherName:       data.fatherName       || "",
              motherName:       data.motherName       || "",
              aadhaarNumber:    data.aadhaarNumber    || "",
              rationCardNumber: data.rationCardNumber || "",
              houseNumber:      data.houseNumber      || "",
              street:           data.street           || "",
              pincode:          data.pincode          || "",
            });
            if (data.profilePhotoUrl) setExistingPhotoUrl(data.profilePhotoUrl);

            // ✅ fixed: .every instead of .some — step only marked complete if ALL its fields exist
            const auto = [];
            STEPS.forEach((s, i) => {
              if (s.fields.length === 0) return;
              if (s.fields.every(f => !!data[f])) auto.push(i);
            });
            setCompleted(auto);
          }
        }
      } catch (e) {
        console.warn("Profile prefill error:", e);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [navigate]);

  const addToast = useCallback((title, message, type="info") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, title, message, type, leaving:false }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id===id ? {...t, leaving:true} : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id!==id)), 340);
    }, 3900);
  }, []);

  const validate = useCallback((fields) => {
    const errs = {};
    fields.forEach(f => {
      const m = FIELD_META[f]; if (!m) return;
      if (m.required && !form[f]) errs[f] = `${m.label} is required`;
      if (f==="aadhaarNumber" && form[f] && !/^\d{12}$/.test(form[f].replace(/\s/g,""))) errs[f] = "Must be 12 digits";
      if (f==="pincode"       && form[f] && !/^\d{6}$/.test(form[f]))                    errs[f] = "Must be 6 digits";
      if (f==="age"           && form[f] && (isNaN(form[f]) || +form[f]<1 || +form[f]>120)) errs[f] = "Enter a valid age (1–120)";
    });
    return errs;
  }, [form]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({...p, [name]:value}));
    setTouched(p => ({...p, [name]:true}));
    setErrors(p => ({...p, [name]:validate([name])[name] || null}));
  };

  const goNext = () => {
    const sf = STEPS[step].fields;
    setTouched(p => ({...p, ...Object.fromEntries(sf.map(f => [f, true]))}));
    const errs = validate(sf);
    setErrors(p => ({...p, ...errs}));
    if (Object.keys(errs).length) { addToast("Scroll Incomplete","Some fields bear false marks or are missing.","error"); return; }
    setCompleted(p => p.includes(step) ? p : [...p, step]);
    setDir("right"); setStep(p => p+1);
    addToast(`Scroll ${step+1} Sealed`, `${STEPS[step].label} recorded in the royal ledger.`, "success");
  };

  const goPrev = () => { setDir("left"); setStep(p => p-1); };

  /*
   * ✅ fixed: POST /citizen/files/profile-photo (no citizenId in URL)
   * Worker identity resolved from JWT server-side.
   *
   * If your backend still requires citizenId in the path, use:
   *   const citizenId = localStorage.getItem("accountId");
   *   `${API}/citizen/files/${citizenId}/profile-photo`
   */
  const uploadPhoto = async (file) => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await apiFetch(
      `${API}/citizen/files/profile-photo`,
      { method: "POST", body: fd },
      navigate
    );

    if (!res || !res.ok) {
      throw new Error(`Photo upload failed (${res?.status})`);
    }

    const text = await res.text();
    try {
      const j = JSON.parse(text);
      return j.url || j.profilePhotoUrl || j.photoUrl || text;
    } catch {
      return text;
    }
  };

  const submitProfile = async () => {
    // ✅ fixed: validate all fields before submitting — prevents empty final submit
    const allFields = Object.keys(FIELD_META);
    const allErrs = validate(allFields);
    if (Object.keys(allErrs).length) {
      setErrors(allErrs);
      setTouched(Object.fromEntries(allFields.map(f => [f, true])));
      addToast("Scroll Incomplete", "Some required fields remain unsealed.", "error");
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = existingPhotoUrl;
      if (photo) {
        addToast("Dispatching the raven…", "Uploading your portrait.", "info");
        photoUrl = await uploadPhoto(photo);
      }

      addToast("Sealing the scroll…", "Almost done!", "info");

      // POST /citizen/profile → createProfile
      // PUT  /citizen/profile → updateProfile
      // Backend resolves identity from JWT — no citizenId in path
      const res = await apiFetch(
        `${API}/citizen/profile`,
        {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, profilePhotoUrl: photoUrl }),
        },
        navigate
      );

      if (!res) return;
      if (!res.ok) throw new Error(isUpdate ? "Profile update failed" : "Profile creation failed");

      setCompleted(p => p.includes(step) ? p : [...p, step]);
      addToast(
        isUpdate ? "⚔ Oath Updated!" : "⚔ Oath Sworn!",
        "Your scroll is sealed. Returning to your command centre…",
        "success"
      );

      // Navigate to dashboard — no citizenId in URL
      setTimeout(() => navigate("/citizen/dashboard"), 2000);

    } catch (err) {
      addToast("The Raven Was Lost", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const curStep = STEPS[step];

  /* ── Loading ── */
  if (loadingProfile) return (
    <>
      <style>{STYLES}</style>
      <Navbar/>
      <div style={{minHeight:"70vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:22,position:"relative",zIndex:1}}>
        <div style={{position:"relative",width:64,height:64}}>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${T.border}`,borderTopColor:T.gold,animation:"gotSpin 0.9s linear infinite"}}/>
          <div style={{position:"absolute",inset:8,borderRadius:"50%",border:`1.5px solid ${T.border}`,borderBottomColor:T.gold,animation:"gotSpinRev 1.3s linear infinite"}}/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>⚔</div>
        </div>
        <p style={{fontFamily:"'Cinzel',serif",color:T.txtM,fontSize:11,letterSpacing:"0.22em",textTransform:"uppercase"}}>
          Consulting the Maester…
        </p>
      </div>
      <Footer/>
    </>
  );

  /* ════════════════════ FULL RENDER ════════════════════ */
  return (
    <>
      <style>{STYLES}</style>
      <Toast toasts={toasts}/>

      {/* ── Ambient ── */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",width:700,height:700,top:-260,left:-220,borderRadius:"50%",filter:"blur(100px)",background:"radial-gradient(circle,rgba(201,162,39,0.09) 0%,transparent 65%)",animation:"gotOrbA 22s ease-in-out infinite alternate"}}/>
        <div style={{position:"absolute",width:560,height:560,bottom:-160,right:-150,borderRadius:"50%",filter:"blur(100px)",background:"radial-gradient(circle,rgba(61,153,96,0.07) 0%,transparent 65%)",animation:"gotOrbB 28s ease-in-out infinite alternate"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(201,162,39,0.04) 1px,transparent 1px)",backgroundSize:"32px 32px",maskImage:"radial-gradient(ellipse 80% 70% at 50% 50%,black 30%,transparent 100%)",WebkitMaskImage:"radial-gradient(ellipse 80% 70% at 50% 50%,black 30%,transparent 100%)"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E")`}}/>
      </div>

      <Navbar/>

      <div style={{minHeight:"100vh",background:T.bg,padding:"48px 24px 110px",position:"relative",zIndex:1,fontFamily:"'Crimson Pro',Georgia,serif"}}>
        <div style={{maxWidth:820,margin:"0 auto",animation:"gotFadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both"}}>

          {/* ══ HEADER ══ */}
          <div style={{marginBottom:42}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:9,marginBottom:16}}>
              <LiveDot/>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:700,letterSpacing:"0.22em",textTransform:"uppercase",color:T.gold}}>Citizen Portal</span>
              <span style={{width:1,height:14,background:T.border}}/>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:600,letterSpacing:"0.16em",textTransform:"uppercase",color:T.txtM}}>
                {isUpdate ? "Update Sworn Record" : "Swear the Oath"}
              </span>
            </div>

            <h1 style={{fontFamily:"'Cinzel Decorative',Georgia,serif",fontSize:36,fontWeight:900,lineHeight:1.1,letterSpacing:"-0.01em",marginBottom:16,background:`linear-gradient(180deg,${T.goldBright} 0%,${T.gold} 55%,${T.goldDark} 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              {isUpdate ? "Amend Your Record" : "Complete Your Oath"}
            </h1>

            {isUpdate && (
              <div style={{display:"inline-flex",alignItems:"center",gap:9,padding:"8px 18px",background:"rgba(61,153,96,0.09)",border:"1px solid rgba(61,153,96,0.28)",borderRadius:T.r,marginBottom:14,animation:"gotFadeIn 0.5s ease 0.3s both"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.emerald} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" strokeDasharray="40"/></svg>
                <span style={{fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:T.emerald}}>
                  Sworn record found — amend any scroll below
                </span>
              </div>
            )}

            <p style={{fontFamily:"'Crimson Pro',serif",fontSize:16,color:T.txtS,lineHeight:1.85,maxWidth:560}}>
              {isUpdate
                ? "Your sealed details have been recalled from the royal archives. Amend any section and submit to update the ledger of the realm."
                : "Your sworn record grants access to royal decrees, welfare schemes, and official correspondence. All information is encrypted and guarded under the realm's laws."}
            </p>
          </div>

          {/* ══ PROGRESS ══ */}
          <ProgressBar completed={completed} current={step} total={STEPS.length}/>

          {/* ══ STEPPER ══ */}
          <Stepper current={step} completed={completed}/>

          {/* ══ FORM CARD ══ */}
          <div style={{
            background:`linear-gradient(160deg,${T.elevated} 0%,#0a1720 50%,${T.elevated} 100%)`,
            border:`1px solid ${T.border}`,borderRadius:T.rXl,
            boxShadow:`${T.sh},0 0 0 1px rgba(201,162,39,0.05)`,
            overflow:"hidden",position:"relative",
          }}>
            <div style={{position:"absolute",inset:0,borderRadius:T.rXl,background:"radial-gradient(ellipse 80% 55% at 50% 0%,rgba(201,162,39,0.04) 0%,transparent 65%)",pointerEvents:"none",animation:"gotCardGlow 4s ease-in-out infinite"}}/>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.gold},transparent)`,opacity:0.50,zIndex:2}}/>

            {/* Card Header */}
            <div style={{
              padding:"24px 32px",borderBottom:`1px solid ${T.border}`,
              background:`linear-gradient(135deg,${T.surface},${T.elevated})`,
              display:"flex",alignItems:"center",gap:18,
              position:"relative",overflow:"hidden",
            }}>
              <div style={{position:"absolute",inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.80' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.020'/%3E%3C/svg%3E")`,pointerEvents:"none"}}/>

              <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(145deg,${T.elevated},${T.surface})`,border:`1.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:`0 0 24px ${T.goldGlow},0 0 0 3px rgba(201,162,39,0.08)`,animation:"gotPulseGold 3s ease-in-out infinite",position:"relative",zIndex:1}}>
                {curStep.icon}
              </div>

              <div style={{position:"relative",zIndex:1}}>
                <p style={{fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:700,letterSpacing:"0.24em",textTransform:"uppercase",color:T.gold,marginBottom:5}}>
                  Scroll {step+1} of {STEPS.length}
                </p>
                <h2 style={{fontFamily:"'Cinzel',Georgia,serif",fontSize:20,fontWeight:800,color:T.txtP,letterSpacing:"0.05em",lineHeight:1}}>
                  {curStep.label}
                </h2>
              </div>

              <div style={{marginLeft:"auto",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,position:"relative",zIndex:1}}>
                <p style={{fontFamily:"'Crimson Pro',serif",fontSize:14,color:T.txtM,fontStyle:"italic"}}>{curStep.desc}</p>
                <div style={{display:"flex",gap:5}}>
                  {STEPS.map((_,i) => (
                    <div key={i} style={{width:i===step?22:7,height:7,borderRadius:99,background:completed.includes(i)?T.emerald:i===step?T.gold:T.border,transition:"all 0.35s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:i===step?`0 0 8px ${T.goldGlow}`:"none"}}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <form onSubmit={e => e.preventDefault()}>
              <div style={{padding:"32px 32px 26px",position:"relative",zIndex:1}}>
                {step < STEPS.length-1 ? (
                  <div style={{display:"grid",gridTemplateColumns:curStep.fields.length>2?"1fr 1fr":"1fr",gap:"2px 30px"}}>
                    {curStep.fields.map((f,i) => (
                      <Field key={f} name={f} value={form[f]} onChange={handleChange} touched={touched[f]} error={errors[f]} animDir={direction} index={i}/>
                    ))}
                  </div>
                ) : (
                  <PhotoUploader photo={photo} setPhoto={setPhoto} animDir={direction}/>
                )}
                <StepHint step={step}/>
              </div>

              {/* Card Footer */}
              <div style={{
                padding:"20px 32px",borderTop:`1px solid ${T.border}`,
                background:`linear-gradient(135deg,${T.surface},${T.elevated})`,
                display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,
                position:"relative",zIndex:1,overflow:"hidden",
              }}>
                <div style={{position:"absolute",inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.80' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.018'/%3E%3C/svg%3E")`,pointerEvents:"none"}}/>

                <button type="button" onClick={goPrev} disabled={step===0}
                  style={{padding:"11px 24px",background:"transparent",border:`1.5px solid ${step===0?"transparent":T.border}`,borderRadius:T.r,color:step===0?T.txtF:T.txtS,fontFamily:"'Cinzel',serif",fontSize:10.5,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:step===0?"default":"pointer",transition:"all 0.22s ease",opacity:step===0?0:1,display:"flex",alignItems:"center",gap:7,position:"relative",zIndex:1}}
                  onMouseEnter={e=>{ if(step>0){e.currentTarget.style.borderColor=T.borderHov;e.currentTarget.style.color=T.txtP;e.currentTarget.style.background=T.goldPale;}}}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.txtS;e.currentTarget.style.background="transparent"; }}
                >
                  ← Return
                </button>

                <p style={{fontFamily:"'Cinzel',serif",fontSize:9.5,fontWeight:600,letterSpacing:"0.14em",color:T.txtF,position:"relative",zIndex:1}}>
                  {completed.length} / {STEPS.length} sealed
                </p>

                {step < STEPS.length-1 ? (
                  <button type="button" onClick={goNext}
                    style={{padding:"11px 28px",background:`linear-gradient(135deg,${T.goldBright},${T.gold},${T.goldDark})`,border:"none",borderRadius:T.r,color:"#060400",fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.24s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:`0 4px 20px rgba(201,162,39,0.42),inset 0 1px 0 rgba(255,255,255,0.22)`,display:"flex",alignItems:"center",gap:8,position:"relative",zIndex:1}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 28px rgba(201,162,39,0.55),inset 0 1px 0 rgba(255,255,255,0.22)`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=`0 4px 20px rgba(201,162,39,0.42),inset 0 1px 0 rgba(255,255,255,0.22)`;}}
                    onMouseDown={e=>{e.currentTarget.style.transform="scale(0.97)";}}
                    onMouseUp={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
                  >
                    Advance the Scroll →
                  </button>
                ) : (
                  <button type="button" onClick={submitProfile} disabled={submitting}
                    style={{padding:"11px 28px",background:submitting?T.elevated:`linear-gradient(135deg,#52b874,${T.emerald},${T.emeraldD})`,border:"none",borderRadius:T.r,color:submitting?T.txtM:"#020a04",fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",cursor:submitting?"not-allowed":"pointer",transition:"all 0.24s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:submitting?"none":`0 4px 20px rgba(61,153,96,0.42),inset 0 1px 0 rgba(255,255,255,0.20)`,display:"flex",alignItems:"center",gap:9,position:"relative",zIndex:1}}
                    onMouseEnter={e=>{if(!submitting){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 28px rgba(61,153,96,0.55),inset 0 1px 0 rgba(255,255,255,0.20)`;}}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";if(!submitting)e.currentTarget.style.boxShadow=`0 4px 20px rgba(61,153,96,0.42),inset 0 1px 0 rgba(255,255,255,0.20)`;}}
                  >
                    {submitting ? (
                      <><span style={{width:13,height:13,border:`2px solid ${T.txtM}`,borderTopColor:"transparent",borderRadius:"50%",animation:"gotSpin 0.75s linear infinite",display:"inline-block",flexShrink:0}}/>Sealing the Scroll…</>
                    ) : (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#020a04" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{isUpdate ? "Update the Oath" : "Swear the Oath"}</>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ══ FOOTER ══ */}
          <div style={{marginTop:28,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            <RuneDivider w={260} op={0.35}/>
            <p style={{fontFamily:"'Crimson Pro',serif",fontSize:13.5,color:T.txtF,lineHeight:1.85,textAlign:"center",maxWidth:500}}>
              🔒 Your data is encrypted and protected under the Royal Data Privacy Guidelines of the Realm.<br/>
              For assistance, dispatch a raven to your local Gram Panchayat office.
            </p>
          </div>

        </div>
      </div>
      <Footer/>
    </>
  );
}

export default CitizenProfileForm;