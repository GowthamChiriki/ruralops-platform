import { useState } from "react";

/* ── 3 metallic colors ── */
const C = {
  teal:  { bright:"#3ab8d8", mid:"#1e7ea0", dark:"#0c4560", bg:"rgba(58,184,216,.10)",  border:"rgba(58,184,216,.26)"  },
  gold:  { bright:"#f5c842", mid:"#c98a18", dark:"#a86208", bg:"rgba(197,138,24,.10)",  border:"rgba(197,138,24,.28)"  },
  green: { bright:"#5ed48a", mid:"#2a9a58", dark:"#0f5228", bg:"rgba(94,212,138,.10)",  border:"rgba(94,212,138,.24)"  },
};
const COLS = [C.teal, C.gold, C.green];

const PILLARS = [
  {
    icon:"👁", title:"Observe", subtitle:"Continuous signal capture",
    body:"Every village, worker, and public program generates signals — reports, delays, complaints, approvals, outcomes. RuralOps captures them all to build a living picture of governance activity across the entire system.",
    stat:"45,400+", statLabel:"Villages monitored",
  },
  {
    icon:"🧠", title:"Analyze", subtitle:"Pattern recognition & risk",
    body:"Patterns inside the data reveal risks before they escalate. By analyzing workloads, delays, and response patterns the system surfaces warning signals that would otherwise remain hidden inside manual records.",
    stat:"< 24h", statLabel:"Risk detection cycle",
  },
  {
    icon:"⚡", title:"Act", subtitle:"Coordinated intervention",
    body:"Once risks are visible, administrators intervene immediately. Tasks reassigned, resources redirected, field teams coordinated — turning reactive firefighting into proactive system management.",
    stat:"≤ 1h", statLabel:"Decision to execution",
  },
];

const EASE  = "cubic-bezier(0.22,1,0.36,1)";
const EASEP = "cubic-bezier(0.34,1.56,0.64,1)";

function PillarCard({ pillar, index }) {
  const [hov, setHov] = useState(false);
  const c = COLS[index];

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
        transform: hov ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hov
          ? `0 20px 48px rgba(0,0,0,.60),0 0 28px ${c.bg}`
          : "0 2px 8px rgba(0,0,0,.65),0 10px 28px rgba(0,0,0,.55)",
        transition:`transform .28s ${EASE},box-shadow .28s ease,border-color .28s ease`,
        animation:`siIn .40s ${EASE} ${index * 0.09}s both`,
      }}
    >
      {/* top accent line */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:"2px",
        background:`linear-gradient(90deg,${c.dark},${c.bright},transparent)`,
        transform: hov ? "scaleX(1)" : "scaleX(0)",
        transformOrigin:"left",
        transition:`transform .4s ${EASE}`,
      }}/>

      {/* corner glow */}
      <div style={{
        position:"absolute", bottom:"-60px", right:"-60px",
        width:"160px", height:"160px", borderRadius:"50%",
        background:`radial-gradient(circle,${c.bg} 0%,transparent 70%)`,
        opacity: hov ? 1 : 0,
        transform: hov ? "scale(1)" : "scale(.6)",
        transition:`opacity .4s ease,transform .4s ${EASE}`,
        pointerEvents:"none",
      }}/>

      {/* icon + badge */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
        <div style={{
          width:"48px", height:"48px", borderRadius:"12px",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px",
          background: hov
            ? `linear-gradient(135deg,rgba(${index===0?"58,184,216":index===1?"197,138,24":"94,212,138"},.22),rgba(${index===0?"58,184,216":index===1?"197,138,24":"94,212,138"},.08))`
            : c.bg,
          border:`1px solid ${hov ? c.border : c.bg}`,
          transform: hov ? "scale(1.12) rotate(-4deg)" : "scale(1) rotate(0deg)",
          transition:`transform .28s ${EASEP},background .28s ease,border-color .28s ease`,
          boxShadow: hov ? `0 0 20px ${c.bg}` : "none",
        }}>
          {pillar.icon}
        </div>

        <div style={{
          display:"inline-flex", alignItems:"center", gap:"6px",
          fontFamily:"'Cinzel',Georgia,serif",
          fontSize:"9px", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase",
          color:c.bright, background:c.bg, border:`1px solid ${c.border}`,
          padding:"4px 11px", borderRadius:"999px",
        }}>
          <span style={{width:"5px",height:"5px",borderRadius:"50%",background:c.mid,flexShrink:0}}/>
          {pillar.title}
        </div>
      </div>

      {/* title */}
      <h3 style={{
        fontFamily:"'Cinzel',Georgia,serif",
        fontSize:"14px", fontWeight:700, letterSpacing:".06em",
        color: hov ? c.bright : "#dde9dd",
        margin:"0 0 4px", transition:"color .2s ease",
      }}>
        {pillar.title}
      </h3>

      {/* subtitle */}
      <p style={{
        fontFamily:"'Cinzel',Georgia,serif",
        fontSize:"9.5px", fontWeight:600, letterSpacing:".10em", textTransform:"uppercase",
        color:"#394e39", margin:"0 0 14px",
      }}>
        {pillar.subtitle}
      </p>

      {/* description */}
      <p style={{
        fontFamily:"'Crimson Pro',Georgia,serif",
        fontSize:"14.5px", color:"#5d785d", lineHeight:1.74, margin:"0 0 20px",
      }}>
        {pillar.body}
      </p>

      {/* stat strip */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px",
        paddingTop:"16px", borderTop:"1px solid rgba(255,255,255,.05)",
      }}>
        <div style={{
          gridColumn:"span 2",
          display:"flex", flexDirection:"column", alignItems:"center", gap:"4px",
          padding:"8px 4px",
          background:c.bg, border:`1px solid ${c.border}`, borderRadius:"7px",
        }}>
          <span style={{fontFamily:"'Cinzel',Georgia,serif",fontSize:"13px",fontWeight:800,color:c.bright,lineHeight:1}}>
            {pillar.stat}
          </span>
          <span style={{fontFamily:"'Cinzel',Georgia,serif",fontSize:"7.5px",fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",color:c.mid,lineHeight:1}}>
            {pillar.statLabel}
          </span>
        </div>
        <div style={{
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          padding:"8px 4px",
          background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.05)", borderRadius:"7px",
        }}>
          <span style={{fontFamily:"'Cinzel',Georgia,serif",fontSize:"13px",fontWeight:800,color:"rgba(255,255,255,.18)",lineHeight:1}}>
            0{index+1}
          </span>
          <span style={{fontFamily:"'Cinzel',Georgia,serif",fontSize:"7.5px",fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",color:"rgba(255,255,255,.10)",lineHeight:1,marginTop:"4px"}}>
            Step
          </span>
        </div>
      </div>

      {/* bottom bar */}
      <div style={{
        marginTop:"18px", height:"3px", borderRadius:"999px",
        background:`linear-gradient(90deg,${c.dark},${c.bright})`,
        width: hov ? "100%" : "24px",
        opacity: hov ? 1 : 0.35,
        transition:`width .4s ${EASE},opacity .3s ease`,
      }}/>
    </div>
  );
}

export default function SystemIntroSection() {
  return (
    <div style={{ position:"relative" }}>

      <style>{`
        @keyframes siIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes siGold { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
      `}</style>

      {/* ── section header ── */}
      <div style={{ marginBottom:"56px" }}>

        {/* eyebrow — matches RolesSection exactly */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:"9px",
          fontFamily:"'Cinzel',Georgia,serif",
          fontSize:"10px", fontWeight:600, letterSpacing:".22em", textTransform:"uppercase",
          color:"#c9a227",
          background:"rgba(201,162,39,.09)",
          border:"1px solid rgba(201,162,39,.26)",
          padding:"7px 16px", borderRadius:"2px", marginBottom:"20px",
          boxShadow:"0 0 18px rgba(201,162,39,.10),inset 0 0 10px rgba(201,162,39,.04)",
        }}>
          ⚙ System Philosohpy
        </div>

        <h2 style={{
          fontFamily:"'Cinzel',Georgia,serif",
          fontSize:"clamp(24px,2.8vw,40px)", fontWeight:800, letterSpacing:".04em",
          lineHeight:1.17, color:"#dde9dd", marginBottom:"16px", marginTop:0,
        }}>
          How RuralOps{" "}
          <span style={{
            fontStyle:"italic",
            background:"linear-gradient(270deg,#f5c842,#c98a18,#f5c842,#a86208,#f5c842)",
            backgroundSize:"400% 400%",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            animation:"siGold 5s ease infinite",
          }}>
            Thinks
          </span>
        </h2>

        <p style={{
          fontFamily:"'Crimson Pro',Georgia,serif",
          fontSize:"17px", color:"#5d785d", lineHeight:1.84, maxWidth:"540px", margin:0,
        }}>
          RuralOps is not just a dashboard — it is a living system designed to observe,
          understand, and coordinate rural governance in real time across every village,
          officer, and citizen in the realm.
        </p>
      </div>

      {/* ── 3 cards ── */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
        gap:"20px",
      }}>
        {PILLARS.map((p,i) => <PillarCard key={p.key || p.title} pillar={p} index={i}/>)}
      </div>

    </div>
  );
}