import { useState } from "react";

/* ── 3 metallic colors cycling across 8 cards ── */
const C = [
  { bright:"#3ab8d8", mid:"#1e7ea0", dark:"#0c4560", bg:"rgba(58,184,216,.10)",  border:"rgba(58,184,216,.26)"  },
  { bright:"#f5c842", mid:"#c98a18", dark:"#a86208", bg:"rgba(197,138,24,.10)",  border:"rgba(197,138,24,.28)"  },
  { bright:"#5ed48a", mid:"#2a9a58", dark:"#0f5228", bg:"rgba(94,212,138,.10)",  border:"rgba(94,212,138,.24)"  },
];

const PROMISES = [
  {
    icon:"📡", title:"Low-Bandwidth Resilience",
    tag:"Environmental Reality",
    desc:"Village offices often operate on fragile networks. RuralOps ensures essential tasks — viewing records, filing updates, tracking progress — remain reliable even when internet conditions are imperfect.",
    quote:"The system respects the reality that infrastructure is uneven.",
  },
  {
    icon:"👁", title:"Instant Clarity",
    tag:"Human Cognitive Limits",
    desc:"Workers should not decode complicated dashboards after long field hours. Typography, spacing, and visual hierarchy ensure the most important information becomes visible within seconds.",
    quote:"The interface is designed so the mind can recognize patterns instantly.",
  },
  {
    icon:"🎯", title:"Role-Focused Simplicity",
    tag:"Human Cognitive Limits",
    desc:"A citizen, field worker, or administrator operates at different levels of responsibility. RuralOps removes unnecessary complexity by tailoring each interface to the user's responsibilities.",
    quote:"Reduce mental load — not increase it.",
  },
  {
    icon:"💻", title:"Device Realism",
    tag:"Environmental Reality",
    desc:"Many public institutions operate on older computers or shared devices. RuralOps avoids heavy graphical elements and unnecessary processing demands to stay responsive on everyday hardware.",
    quote:"Technology should adapt to reality — not the other way around.",
  },
  {
    icon:"🌐", title:"Language Inclusivity",
    tag:"Environmental Reality",
    desc:"Governance operates across many languages and dialects. RuralOps is designed with multilingual capability so interfaces can adapt to regional contexts and local administrative needs.",
    quote:"Understanding should never depend on language barriers.",
  },
  {
    icon:"🧘", title:"Calm Interaction",
    tag:"Human Cognitive Limits",
    desc:"Constant notifications, flashing animations, and cluttered layouts fragment attention. RuralOps favors a calm visual environment so users can focus on tasks rather than interface noise.",
    quote:"A quiet interface allows clear thinking under pressure.",
  },
  {
    icon:"🔍", title:"Actionable Visibility",
    tag:"Operational Integrity",
    desc:"Information without guidance creates paralysis. RuralOps ensures alerts, reports, and indicators connect directly to next steps — so users always know how to respond.",
    quote:"Visibility exists not for observation alone, but for intervention.",
  },
  {
    icon:"🏛", title:"Trustworthy Records",
    tag:"Operational Integrity",
    desc:"Public systems require accountability. RuralOps maintains clear records of actions, updates, and decisions so administrators can review events and maintain full transparency.",
    quote:"A system becomes trustworthy when history cannot quietly disappear.",
  },
];

const EASE  = "cubic-bezier(0.22,1,0.36,1)";
const EASEP = "cubic-bezier(0.34,1.56,0.64,1)";

/* tag → color key */
const TAG_COLOR = {
  "Environmental Reality":  0,
  "Human Cognitive Limits": 1,
  "Operational Integrity":  2,
};

function PromiseCard({ item, index }) {
  const [hov, setHov] = useState(false);
  const c = C[TAG_COLOR[item.tag]];

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:"linear-gradient(145deg,#0c1519 0%,#091014 100%)",
        border:`1px solid ${hov ? c.border : "rgba(255,255,255,.07)"}`,
        borderRadius:"12px",
        padding:"24px",
        position:"relative", overflow:"hidden", cursor:"default",
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        boxShadow:"0 2px 8px rgba(0,0,0,.65),0 10px 28px rgba(0,0,0,.55)",
        transition:`transform .28s ${EASE},border-color .22s ease`,
        animation:`dpIn .38s ${EASE} ${index * 0.06}s both`,
      }}
    >
      {/* top accent line */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:"2px",
        background:`linear-gradient(90deg,${c.dark},${c.bright},transparent)`,
        transform: hov ? "scaleX(1)" : "scaleX(0)",
        transformOrigin:"left",
        transition:`transform .36s ${EASE}`,
      }}/>

      {/* corner glow — opacity + transform only */}
      <div style={{
        position:"absolute", bottom:"-60px", right:"-60px",
        width:"160px", height:"160px", borderRadius:"50%",
        background:`radial-gradient(circle,${c.bg} 0%,transparent 70%)`,
        opacity: hov ? 1 : 0,
        transform: hov ? "scale(1)" : "scale(.6)",
        transition:`opacity .36s ease,transform .36s ${EASE}`,
        pointerEvents:"none",
      }}/>

      {/* icon + tag row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
        {/* icon — transform + border-color only, no box-shadow */}
        <div style={{
          width:"46px", height:"46px", borderRadius:"10px",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px",
          background:`linear-gradient(135deg,${c.bg},${c.bg.replace(".10",".04")})`,
          border:`1px solid ${hov ? c.border : c.bg}`,
          transform: hov ? "scale(1.10) rotate(-4deg)" : "scale(1) rotate(0deg)",
          transition:`transform .28s ${EASEP},border-color .22s ease`,
        }}>
          {item.icon}
        </div>

        {/* tag pill */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:"5px",
          fontFamily:"'Cinzel',Georgia,serif",
          fontSize:"8px", fontWeight:700, letterSpacing:".10em", textTransform:"uppercase",
          color:c.bright, background:c.bg, border:`1px solid ${c.border}`,
          padding:"3px 9px", borderRadius:"999px",
        }}>
          <span style={{width:"4px",height:"4px",borderRadius:"50%",background:c.mid,flexShrink:0}}/>
          {item.tag}
        </div>
      </div>

      {/* title */}
      <h3 style={{
        fontFamily:"'Cinzel',Georgia,serif",
        fontSize:"13px", fontWeight:700, letterSpacing:".07em",
        color: hov ? c.bright : "#dde9dd",
        margin:"0 0 10px", transition:"color .18s ease",
      }}>
        {item.title}
      </h3>

      {/* description */}
      <p style={{
        fontFamily:"'Crimson Pro',Georgia,serif",
        fontSize:"14.5px", color:"#5d785d", lineHeight:1.74, margin:"0 0 14px",
      }}>
        {item.desc}
      </p>

      {/* italic quote */}
      <p style={{
        fontFamily:"'IM Fell English',Georgia,serif",
        fontSize:"13px", fontStyle:"italic",
        color: hov ? c.mid : "#394e39",
        lineHeight:1.6, margin:0,
        paddingLeft:"10px",
        borderLeft:`2px solid ${hov ? c.border : "rgba(255,255,255,.06)"}`,
        transition:"color .18s ease,border-color .18s ease",
      }}>
        {item.quote}
      </p>

      {/* bottom bar — scaleX not width */}
      <div style={{
        marginTop:"18px", height:"3px", borderRadius:"999px",
        background:`linear-gradient(90deg,${c.dark},${c.bright})`,
        transformOrigin:"left",
        transform: hov ? "scaleX(1)" : "scaleX(0.06)",
        opacity: hov ? 1 : 0.35,
        transition:`transform .38s ${EASE},opacity .28s ease`,
      }}/>
    </div>
  );
}

export default function DesignPromisesSection() {
  return (
    <div style={{ position:"relative" }}>

      <style>{`
        @keyframes dpIn   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes dpGold { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
      `}</style>

      {/* ── header ── */}
      <div style={{ marginBottom:"56px" }}>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:"9px",
          fontFamily:"'Cinzel',Georgia,serif",
          fontSize:"10px", fontWeight:600, letterSpacing:".22em", textTransform:"uppercase",
          color:"#c9a227", background:"rgba(201,162,39,.09)", border:"1px solid rgba(201,162,39,.26)",
          padding:"7px 16px", borderRadius:"2px", marginBottom:"20px",
        }}>
          ⚔ Design Principles
        </div>

        <h2 style={{
          fontFamily:"'Cinzel',Georgia,serif",
          fontSize:"clamp(24px,2.8vw,40px)", fontWeight:800, letterSpacing:".04em",
          lineHeight:1.17, color:"#dde9dd", marginBottom:"16px", marginTop:0,
        }}>
          The 8 Real Promises{" "}
          <span style={{
            fontStyle:"italic",
            background:"linear-gradient(270deg,#c9a227,#f5d76e,#e8c547,#c9a227,#a87d1a,#e8c547,#c9a227)",
            backgroundSize:"400% 400%",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            animation:"dpGold 5s ease infinite",
          }}>
            of RuralOps
          </span>
        </h2>

        <p style={{
          fontFamily:"'Crimson Pro',Georgia,serif",
          fontSize:"17px", color:"#5d785d", lineHeight:1.84, maxWidth:"540px", margin:"0 0 20px",
        }}>
          Every design decision reflects the actual conditions our users work in —
          patchy networks, shared devices, long shifts, and regional languages.
        </p>

        {/* 3-layer legend */}
        <div style={{display:"flex", flexWrap:"wrap", gap:"10px"}}>
          {[
            { label:"Environmental Reality",  ci:0 },
            { label:"Human Cognitive Limits", ci:1 },
            { label:"Operational Integrity",  ci:2 },
          ].map(({label,ci}) => {
            const c = C[ci];
            return (
              <div key={label} style={{
                display:"inline-flex", alignItems:"center", gap:"6px",
                fontFamily:"'Cinzel',Georgia,serif",
                fontSize:"9px", fontWeight:700, letterSpacing:".10em", textTransform:"uppercase",
                color:c.bright, background:c.bg, border:`1px solid ${c.border}`,
                padding:"4px 11px", borderRadius:"999px",
              }}>
                <span style={{width:"5px",height:"5px",borderRadius:"50%",background:c.mid,flexShrink:0}}/>
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 8 cards ── */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
        gap:"20px",
      }}>
        {PROMISES.map((item,i) => (
          <PromiseCard key={item.title} item={item} index={i}/>
        ))}
      </div>

    </div>
  );
}