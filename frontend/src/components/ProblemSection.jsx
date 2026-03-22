import { useState } from "react";

const PROBLEMS = [
  {
    icon: "🏗️",
    title: "Basic Infrastructure Failures",
    description:
      "Electricity outages, drainage clogs, irregular water supply, and road failures are reported informally and travel slowly through administrative layers — leaving communities waiting weeks or months for resolution.",
    quote: "When infrastructure fails quietly, communities suffer loudly.",
  },
  {
    icon: "📢",
    title: "Limited Scheme Awareness",
    description:
      "Many citizens remain unaware of welfare programs designed for them — housing schemes, agricultural subsidies, pensions. Information spreads through informal channels, meaning eligibility rarely translates into participation.",
    quote: "Opportunities meant for public benefit remain unused simply because people never hear about them.",
  },
  {
    icon: "📂",
    title: "Complex Documentation Processes",
    description:
      "Applying for government services involves multiple forms, certificates, and office visits. For citizens unfamiliar with bureaucratic procedures, even simple requests become time-consuming. Small errors delay approvals for long periods.",
    quote: "The process itself becomes the barrier.",
  },
  {
    icon: "⏱",
    title: "Slow Administrative Approvals",
    description:
      "Requests move slowly through several layers — village, mandal, district, sometimes state. Without streamlined coordination, simple processes become prolonged journeys. Pensions, land records, and citizen services are all affected.",
    quote: "Delay at every tier compounds into months of inaction.",
  },
  {
    icon: "🔭",
    title: "Lack of Status Transparency",
    description:
      "Citizens have no reliable way to track requests or complaints. Without clear updates, people must repeatedly visit offices or depend on intermediaries just to learn whether an application is pending or approved.",
    quote: "Uncertainty becomes part of the process.",
  },
  {
    icon: "🔔",
    title: "Limited Grievance Resolution",
    description:
      "When services fail or benefits are delayed, citizens struggle to file complaints effectively. Existing grievance mechanisms are fragmented and difficult to access. Without clear escalation paths, many problems remain permanently unresolved.",
    quote: "A complaint that cannot be heard is a complaint that cannot be fixed.",
  },
  {
    icon: "📡",
    title: "Field-to-Administrator Communication Gaps",
    description:
      "Village-level staff and higher administrators operate on disconnected reporting systems. Infrastructure failures, program delays, and critical field updates can take days to reach decision-makers — long after the window for early intervention has closed.",
    quote: "Slow communication leads to slow response.",
  },
  {
    icon: "🔗",
    title: "Fragmented Inter-Department Coordination",
    description:
      "Rural development requires coordination across revenue, agriculture, welfare, infrastructure, and local governance. Without integrated tracking, responsibilities blur and progress stalls. Projects that depend on collaboration move the slowest.",
    quote: "When no one owns the handoff, everyone blames the other.",
  },
];

const EASE  = "cubic-bezier(0.22,1,0.36,1)";
const EASEP = "cubic-bezier(0.34,1.56,0.64,1)";

const CR = {
  bright: "#c84030",
  mid:    "#9e3328",
  dark:   "#7a2020",
  bg:     "rgba(158,51,40,.10)",
  border: "rgba(158,51,40,.26)",
};

function ProblemCard({ problem, index }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "linear-gradient(145deg,#0c1519 0%,#091014 100%)",
        border: `1px solid ${hov ? CR.border : "rgba(255,255,255,.07)"}`,
        borderRadius: "12px",
        padding: "24px",
        position: "relative", overflow: "hidden", cursor: "default",
        /* transform + border-color only — no box-shadow in transition */
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        boxShadow: "0 2px 8px rgba(0,0,0,.65),0 10px 28px rgba(0,0,0,.55)",
        transition: `transform .28s ${EASE},border-color .22s ease`,
        animation: `pbIn .38s ${EASE} ${index * 0.06}s both`,
      }}
    >
      {/* top accent — transform only */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:"2px",
        background:`linear-gradient(90deg,${CR.dark},${CR.bright},transparent)`,
        transform: hov ? "scaleX(1)" : "scaleX(0)",
        transformOrigin:"left",
        transition:`transform .36s ${EASE}`,
      }}/>

      {/* corner glow — opacity + transform only */}
      <div style={{
        position:"absolute", bottom:"-60px", right:"-60px",
        width:"160px", height:"160px", borderRadius:"50%",
        background:`radial-gradient(circle,${CR.bg} 0%,transparent 70%)`,
        opacity: hov ? 1 : 0,
        transform: hov ? "scale(1)" : "scale(.6)",
        transition:`opacity .36s ease,transform .36s ${EASE}`,
        pointerEvents:"none",
      }}/>

      {/* pill + icon row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px"}}>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:"6px",
          fontFamily:"'Cinzel',Georgia,serif",
          fontSize:"9px", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase",
          color:CR.bright, background:CR.bg, border:`1px solid ${CR.border}`,
          padding:"4px 11px", borderRadius:"999px",
        }}>
          {/* dot — opacity blink, no box-shadow animation */}
          <span style={{
            width:"5px", height:"5px", borderRadius:"50%",
            background:CR.mid, flexShrink:0,
          }}/>
          Problem {index + 1}
        </div>

        {/* icon — transform only, no box-shadow on hover */}
        <div style={{
          width:"42px", height:"42px", borderRadius:"10px",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px",
          background:`linear-gradient(135deg,rgba(158,51,40,.10),rgba(158,51,40,.04))`,
          border:`1px solid ${hov ? CR.border : "rgba(158,51,40,.16)"}`,
          transform: hov ? "scale(1.12) rotate(-5deg)" : "scale(1) rotate(0deg)",
          transition:`transform .28s ${EASEP},border-color .22s ease`,
        }}>
          {problem.icon}
        </div>
      </div>

      {/* severity bar — static, no hover transition needed */}
      <div style={{display:"flex",alignItems:"center",gap:"3px",marginBottom:"16px"}}>
        {Array.from({length:8}).map((_,i) => (
          <div key={i} style={{
            height:"3px", flex:1, borderRadius:"999px",
            background: i <= index
              ? `linear-gradient(90deg,${CR.dark},${CR.bright})`
              : "rgba(255,255,255,.06)",
            opacity: i <= index ? (0.25 + (i / 8) * 0.75) : 1,
          }}/>
        ))}
      </div>

      {/* title — color only */}
      <h3 style={{
        fontFamily:"'Cinzel',Georgia,serif",
        fontSize:"13px", fontWeight:700, letterSpacing:".07em",
        color: hov ? CR.bright : "#dde9dd",
        margin:"0 0 10px", transition:"color .18s ease",
      }}>
        {problem.title}
      </h3>

      {/* description */}
      <p style={{
        fontFamily:"'Crimson Pro',Georgia,serif",
        fontSize:"14.5px", color:"#5d785d", lineHeight:1.74, margin:"0 0 14px",
      }}>
        {problem.description}
      </p>

      {/* italic quote — color + border-color only */}
      <p style={{
        fontFamily:"'IM Fell English',Georgia,serif",
        fontSize:"13px", fontStyle:"italic",
        color: hov ? CR.mid : "#394e39",
        lineHeight:1.6, margin:0,
        paddingLeft:"10px",
        borderLeft:`2px solid ${hov ? CR.border : "rgba(255,255,255,.06)"}`,
        transition:"color .18s ease,border-color .18s ease",
      }}>
        {problem.quote}
      </p>

      {/* bottom bar — scaleX NOT width (no layout reflow) */}
      <div style={{
        marginTop:"18px", height:"3px", borderRadius:"999px",
        background:`linear-gradient(90deg,${CR.dark},${CR.bright})`,
        transformOrigin:"left",
        transform: hov ? "scaleX(1)" : "scaleX(0.06)",
        opacity: hov ? 1 : 0.35,
        transition:`transform .38s ${EASE},opacity .28s ease`,
      }}/>
    </div>
  );
}

export default function ProblemSection() {
  return (
    <div style={{ position:"relative" }}>

      <style>{`
        @keyframes pbIn   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes pbRed  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes pbDot  { 0%,100%{opacity:.9} 55%{opacity:.2} }
      `}</style>

      {/* ── header ── */}
      <div style={{ marginBottom:"56px" }}>

        <div style={{
          display:"inline-flex", alignItems:"center", gap:"9px",
          fontFamily:"'Cinzel',Georgia,serif",
          fontSize:"10px", fontWeight:600, letterSpacing:".22em", textTransform:"uppercase",
          color:CR.bright, background:CR.bg, border:`1px solid ${CR.border}`,
          padding:"7px 16px", borderRadius:"2px", marginBottom:"20px",
        }}>
          <span style={{
            width:"6px", height:"6px", borderRadius:"50%",
            background:CR.mid, flexShrink:0,
            animation:"pbDot 2s ease-in-out infinite",
          }}/>
          The Problem
        </div>

        <h2 style={{
          fontFamily:"'Cinzel',Georgia,serif",
          fontSize:"clamp(24px,2.8vw,40px)", fontWeight:800, letterSpacing:".04em",
          lineHeight:1.17, color:"#dde9dd", marginBottom:"16px", marginTop:0, maxWidth:"720px",
        }}>
          Rural programs are complex.{" "}
          <span style={{
            fontStyle:"italic",
            background:"linear-gradient(270deg,#9e3328,#c84030,#ef4444,#9e3328,#7a2020,#c84030,#9e3328)",
            backgroundSize:"400% 400%",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            animation:"pbRed 5s ease infinite",
          }}>
            Coordination failures make them fragile.
          </span>
        </h2>

        <p style={{
          fontFamily:"'Crimson Pro',Georgia,serif",
          fontSize:"17px", color:"#5d785d", lineHeight:1.84, maxWidth:"640px", margin:"0 0 28px",
        }}>
          Across rural governance and development initiatives, challenges rarely arise
          from lack of intent or effort. They arise when information is delayed,
          fragmented, or unavailable at the moment decisions need to be made.
        </p>

        <div style={{
          display:"inline-flex", alignItems:"center", gap:"8px",
          padding:"10px 18px",
          background:"rgba(158,51,40,.08)", border:"1px solid rgba(158,51,40,.20)",
          borderRadius:"8px",
          fontFamily:"'Cinzel',Georgia,serif",
          fontSize:"10.5px", fontWeight:600, letterSpacing:".08em", color:CR.bright,
        }}>
          <span style={{fontSize:"13px"}}>⚠️</span>
          Each problem compounds the next — left unaddressed, they become systemic
        </div>
      </div>

      {/* ── 8 cards ── */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
        gap:"20px",
      }}>
        {PROBLEMS.map((p,i) => <ProblemCard key={p.title} problem={p} index={i}/>)}
      </div>

    </div>
  );
}