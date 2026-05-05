import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ==========================================
   FONTS injected via style tag
========================================== */
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600;700;800;900&family=IM+Fell+English:ital@0;1&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');`;

/* ==========================================
   DATA
========================================== */
const FEATURES = [
  { icon: "👤", sigil: "⚔️", title: "Citizens",            desc: "Track welfare schemes, submit grievances before the council, and monitor your approval scroll — all from your palm." },
  { icon: "🔧", sigil: "🛠️", title: "Field Workers",       desc: "Receive task assignments from the VAO, submit field reports, and sync the ledger even in low-bandwidth keeps."       },
  { icon: "🏛",  sigil: "⚜️", title: "VAO / MAO Officials", desc: "Review pending oaths, monitor mandal activity, and dispatch announcements across the realm instantly."              },
];

const STATS = [
  { value: "40+",   label: "Villages in Dominion" },
  { value: "2K+",   label: "Active Subjects"       },
  { value: "99.2%", label: "Citadel Uptime"        },
  { value: "48hr",  label: "VAO Turnaround"        },
];

const INSTALL_STEPS = [
  { step: "I",   title: "Download the Scroll",      desc: "Tap the button above or request the APK from your VAO. Distributed directly by the realm's administration."              },
  { step: "II",  title: "Grant Entry Passage",       desc: "Navigate to Settings → Security → Install Unknown Apps and grant passage to your browser or file warden."               },
  { step: "III", title: "Install & Enter the Keep",  desc: "Locate the downloaded scroll in your notifications or Downloads vault and tap Install."                                  },
  { step: "IV",  title: "Speak Your Sigil",          desc: "Sign in with your registered phone number and passphrase. The app shall guide you through activation if required."       },
];

const TICKER_ITEMS = [
  { state: "CHINTALAPUDI", dot: "green", text: "12 new citizens sworn to the ledger" },
  { state: "KALIGOTLA",    dot: "gold",  text: "VAO verification: 3 scrolls pending" },
  { state: "TARUVA",       dot: "green", text: "Welfare tribute: ₹48,000 disbursed"  },
  { state: "RAIWADA",      dot: "blue",  text: "Land records updated"                 },
  { state: "SAMMEDA",      dot: "green", text: "8 oaths sworn and approved"           },
  { state: "GARISINGI",    dot: "red",   text: "2 scrolls require re-submission"      },
];

/* ==========================================
   PHONE SCREENS DATA
========================================== */
const APP_SCREENS = [
  {
    id: "dashboard", tab: "Dashboard", bg: "#04090c",
    content: [
      { t: "greeting",  text: "Good morrow, Ravi ⚔️" },
      { t: "subtitle",  text: "Chintalapudi Mandal"   },
      { t: "gap" },
      { t: "pills", items: ["4 Schemes", "1 Pending", "2 Alerts"] },
      { t: "gap" },
      { t: "label", text: "Recent Decrees" },
      { t: "row", icon: "✓", iconColor: "#4ade80", text: "Ration scroll updated",  sub: "2 hrs past"  },
      { t: "row", icon: "⏳", iconColor: "#f5d76e", text: "PM-KISAN tribute due",  sub: "Awaits seal" },
      { t: "row", icon: "📜", iconColor: "#60a5fa", text: "VAO proclamation",      sub: "This morn"   },
    ],
  },
  {
    id: "schemes", tab: "Schemes", bg: "#04090f",
    content: [
      { t: "label", text: "Welfare Schemes of the Realm" },
      { t: "gap" },
      { t: "scheme", name: "PM-KISAN",       status: "Active",   color: "#22c55e" },
      { t: "scheme", name: "PMAY-G Housing", status: "Pending",  color: "#f5d76e" },
      { t: "scheme", name: "MGNREGS",        status: "Active",   color: "#22c55e" },
      { t: "scheme", name: "PM Ujjwala",     status: "Approved", color: "#60a5fa" },
    ],
  },
  {
    id: "status", tab: "My Oath", bg: "#060a0d",
    content: [
      { t: "profile" },
      { t: "gap" },
      { t: "statusHero", label: "OATH SWORN", color: "#22c55e" },
      { t: "gap" },
      { t: "info", label: "Account Sigil", value: "RLOC-4821"    },
      { t: "info", label: "Village",       value: "Chintalapudi" },
      { t: "info", label: "VAO Lord",      value: "K. Suresh"    },
      { t: "info", label: "Sealed",        value: "14 Jan 2026"  },
    ],
  },
];

/* ==========================================
   PHONE SCREEN RENDERER
========================================== */
function PhoneScreen({ screen, tabIndex, onTab }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Status bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"52px 18px 8px", fontSize:"9.5px", fontWeight:"700", color:"rgba(201,162,39,.55)", fontFamily:"'Cinzel', serif", letterSpacing:".04em" }}>
        <span>IX:XLI</span>
        <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>
          <span style={{ fontSize:"8px", letterSpacing:".08em" }}>REALM</span>
          <span style={{ letterSpacing:"-1px", fontSize:"9px" }}>▐▐▐</span>
          <span>⚡</span>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display:"flex", borderBottom:"1px solid rgba(201,162,39,.12)", padding:"0 8px", background:"rgba(0,0,0,.3)" }}>
        {APP_SCREENS.map((s, i) => (
          <button key={s.id} onClick={() => onTab(i)} style={{
            flex:1, padding:"7px 2px", background:"transparent", border:"none",
            borderBottom: tabIndex === i ? "2px solid #c9a227" : "2px solid transparent",
            color: tabIndex === i ? "#f5d76e" : "rgba(201,162,39,.30)",
            fontSize:"8px", fontWeight:"800", cursor:"pointer",
            fontFamily:"'Cinzel', serif", letterSpacing:".08em", textTransform:"uppercase",
            transition:"color .2s",
          }}>
            {s.tab}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ flex:1, padding:"11px 12px 0", background:screen.bg, display:"flex", flexDirection:"column", gap:"7px", overflow:"hidden" }}>
        {screen.content.map((item, i) => {
          if (item.t === "gap")      return <div key={i} style={{ height:"3px" }} />;

          if (item.t === "greeting") return (
            <div key={i} style={{ fontSize:"13px", fontWeight:"700", color:"#e8d9aa", letterSpacing:".02em", fontFamily:"'Cinzel', serif" }}>{item.text}</div>
          );

          if (item.t === "subtitle") return (
            <div key={i} style={{ fontSize:"9px", color:"rgba(201,162,39,.45)", marginTop:"-4px", fontFamily:"'Cinzel', serif", letterSpacing:".10em", textTransform:"uppercase" }}>{item.text}</div>
          );

          if (item.t === "label") return (
            <div key={i} style={{ fontSize:"8.5px", fontWeight:"700", color:"rgba(201,162,39,.50)", textTransform:"uppercase", letterSpacing:".14em", fontFamily:"'Cinzel', serif", display:"flex", alignItems:"center", gap:"6px" }}>
              <span style={{ display:"block", width:"12px", height:"1px", background:"rgba(201,162,39,.35)" }} />
              {item.text}
            </div>
          );

          if (item.t === "pills") return (
            <div key={i} style={{ display:"flex", gap:"5px" }}>
              {item.items.map((p, j) => (
                <div key={j} style={{ padding:"4px 7px", borderRadius:"4px", background:"rgba(201,162,39,.08)", border:"1px solid rgba(201,162,39,.20)", fontSize:"8.5px", fontWeight:"700", color:"#f5d76e", fontFamily:"'Cinzel', serif", letterSpacing:".04em" }}>{p}</div>
              ))}
            </div>
          );

          if (item.t === "row") return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"7px 10px", borderRadius:"8px", background:"rgba(201,162,39,.03)", border:"1px solid rgba(201,162,39,.08)" }}>
              <span style={{ fontSize:"11px", color:item.iconColor, width:"14px", textAlign:"center" }}>{item.icon}</span>
              <span style={{ flex:1, fontSize:"9.5px", fontWeight:"600", color:"#c8b98a", fontFamily:"'Crimson Pro', serif" }}>{item.text}</span>
              <span style={{ fontSize:"8.5px", color:"rgba(201,162,39,.35)", fontFamily:"'Cinzel', serif", letterSpacing:".04em" }}>{item.sub}</span>
            </div>
          );

          if (item.t === "scheme") return (
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", borderRadius:"8px", background:"rgba(201,162,39,.03)", border:"1px solid rgba(201,162,39,.08)" }}>
              <span style={{ fontSize:"9.5px", fontWeight:"600", color:"#c8b98a", fontFamily:"'Crimson Pro', serif" }}>{item.name}</span>
              <span style={{ fontSize:"8px", fontWeight:"800", padding:"3px 7px", borderRadius:"4px", background:`${item.color}18`, color:item.color, border:`1px solid ${item.color}28`, fontFamily:"'Cinzel', serif", letterSpacing:".06em", textTransform:"uppercase" }}>{item.status}</span>
            </div>
          );

          if (item.t === "profile") return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 10px", borderRadius:"10px", background:"rgba(201,162,39,.05)", border:"1px solid rgba(201,162,39,.14)" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#c9a227,#8b6914)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:"800", color:"#04070a", flexShrink:0, fontFamily:"'Cinzel', serif", boxShadow:"0 0 12px rgba(201,162,39,.35)" }}>R</div>
              <div>
                <div style={{ fontSize:"10px", fontWeight:"800", color:"#e8d9aa", fontFamily:"'Cinzel', serif", letterSpacing:".04em" }}>Ravi Kumar</div>
                <div style={{ fontSize:"8.5px", color:"rgba(201,162,39,.45)", fontFamily:"'Crimson Pro', serif" }}>Citizen · RLOC-4821</div>
              </div>
              <div style={{ marginLeft:"auto", width:"7px", height:"7px", borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 6px rgba(34,197,94,.70)" }} />
            </div>
          );

          if (item.t === "statusHero") return (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"6px", padding:"14px", borderRadius:"10px", background:`${item.color}0d`, border:`1px solid ${item.color}22`, boxShadow:`0 0 20px ${item.color}0a` }}>
              <span style={{ fontSize:"18px" }}>⚜️</span>
              <span style={{ fontSize:"11px", fontWeight:"800", color:item.color, letterSpacing:".16em", fontFamily:"'Cinzel', serif", textTransform:"uppercase" }}>{item.label}</span>
            </div>
          );

          if (item.t === "info") return (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid rgba(201,162,39,.07)" }}>
              <span style={{ fontSize:"9px", color:"rgba(201,162,39,.40)", fontWeight:"600", fontFamily:"'Cinzel', serif", letterSpacing:".08em", textTransform:"uppercase" }}>{item.label}</span>
              <span style={{ fontSize:"9.5px", color:"#c8b98a", fontWeight:"600", fontFamily:"'Crimson Pro', serif" }}>{item.value}</span>
            </div>
          );

          return null;
        })}
      </div>

      {/* Home indicator */}
      <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 14px", background:screen.bg }}>
        <div style={{ width:"80px", height:"3px", borderRadius:"2px", background:"rgba(201,162,39,.18)" }} />
      </div>
    </div>
  );
}

/* ==========================================
   REALISTIC PHONE WRAPPER
========================================== */
function RealisticPhone({ tabIndex, setTabIndex }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const phoneRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!phoneRef.current) return;
    const rect = phoneRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setMousePos({ x: dx, y: dy });
  };

  const rotateY = isHovered ? mousePos.x * 14 : -8;
  const rotateX = isHovered ? -mousePos.y * 8 : 3;
  const translateY = isHovered ? -16 : 0;
  const scale = isHovered ? 1.03 : 1;

  return (
    <div
      style={{ display:"flex", justifyContent:"center", alignItems:"center", perspective:"1200px", paddingRight:"20px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x:0, y:0 }); }}
    >
      {/* Reflection/shadow on ground */}
      <div style={{
        position:"absolute",
        width:"200px", height:"40px",
        borderRadius:"50%",
        background:"radial-gradient(ellipse, rgba(201,162,39,.18) 0%, transparent 70%)",
        filter:"blur(14px)",
        bottom:"-10px",
        transform:`scaleX(${isHovered ? 1.1 : 1})`,
        transition:"transform .5s ease, opacity .5s ease",
        opacity: isHovered ? 0.8 : 0.5,
        zIndex:0,
      }} />

      {/* Phone outer shell */}
      <div
        ref={phoneRef}
        style={{
          width:"252px", height:"520px",
          borderRadius:"46px",
          position:"relative",
          transform:`rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateY(${translateY}px) scale(${scale})`,
          transition: isHovered
            ? "transform .08s cubic-bezier(.22,1,.36,1)"
            : "transform .8s cubic-bezier(.34,1.2,.64,1)",
          transformStyle:"preserve-3d",
          zIndex:1,
        }}
      >
        {/* Outer titanium frame */}
        <div style={{
          position:"absolute", inset:0,
          borderRadius:"46px",
          background:"linear-gradient(145deg, #2a2218 0%, #1a1610 30%, #0c0a06 60%, #1e1a10 100%)",
          boxShadow:`
            0 0 0 1px rgba(201,162,39,.30),
            0 0 0 2px rgba(0,0,0,.90),
            inset 0 1px 0 rgba(201,162,39,.18),
            inset 0 -1px 0 rgba(0,0,0,.80),
            0 60px 120px rgba(0,0,0,.90),
            0 30px 60px rgba(0,0,0,.70),
            0 10px 20px rgba(0,0,0,.50),
            ${isHovered ? "0 0 80px rgba(201,162,39,.15), 0 0 40px rgba(201,162,39,.10)" : "0 0 40px rgba(201,162,39,.06)"}
          `,
          transition:"box-shadow .4s ease",
        }} />

        {/* Inner bezel */}
        <div style={{
          position:"absolute", inset:"3px",
          borderRadius:"43px",
          background:"linear-gradient(160deg, #0d1008 0%, #060a04 50%, #080c06 100%)",
          boxShadow:"inset 0 2px 4px rgba(0,0,0,.80), inset 0 -1px 2px rgba(201,162,39,.06)",
        }} />

        {/* Screen glass */}
        <div style={{
          position:"absolute", inset:"3px",
          borderRadius:"43px",
          overflow:"hidden",
          background:"#04070a",
        }}>
          {/* Screen glare — top-left specular */}
          <div style={{
            position:"absolute", top:0, left:0,
            width:"70%", height:"45%",
            background:"linear-gradient(135deg, rgba(255,255,255,.055) 0%, transparent 60%)",
            borderRadius:"43px 0 0 0",
            pointerEvents:"none", zIndex:10,
          }} />

          {/* Screen glare — right edge */}
          <div style={{
            position:"absolute", top:"10%", right:0,
            width:"12px", height:"40%",
            background:"linear-gradient(to left, rgba(255,255,255,.03), transparent)",
            pointerEvents:"none", zIndex:10,
          }} />

          {/* Gold vignette border glow inside screen */}
          <div style={{
            position:"absolute", inset:0,
            borderRadius:"43px",
            boxShadow:"inset 0 0 40px rgba(0,0,0,.80), inset 0 0 2px rgba(201,162,39,.10)",
            pointerEvents:"none", zIndex:9,
          }} />

          {/* Dynamic island */}
          <div style={{
            position:"absolute", top:"14px", left:"50%",
            transform:"translateX(-50%)",
            width:"92px", height:"28px",
            borderRadius:"14px",
            background:"#000",
            border:"1px solid rgba(201,162,39,.12)",
            zIndex:20,
            display:"flex", alignItems:"center", justifyContent:"center", gap:"9px",
            boxShadow:"0 2px 8px rgba(0,0,0,.80), inset 0 1px 0 rgba(255,255,255,.03)",
          }}>
            {/* Camera lens */}
            <div style={{
              width:"10px", height:"10px", borderRadius:"50%",
              background:"radial-gradient(circle at 30% 30%, #0f1a2e, #020408)",
              border:"1px solid rgba(59,130,246,.20)",
              boxShadow:"0 0 6px rgba(59,130,246,.12), inset 0 0 3px rgba(59,130,246,.08)",
            }} />
            {/* FaceID sensor */}
            <div style={{ width:"28px", height:"3px", borderRadius:"2px", background:"rgba(201,162,39,.08)" }} />
            {/* FaceID dot */}
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"rgba(201,162,39,.15)", boxShadow:"0 0 4px rgba(201,162,39,.20)" }} />
          </div>

          {/* App content */}
          <div key={tabIndex} style={{ position:"absolute", inset:0, animation:"gotScreenIn .35s cubic-bezier(.22,1,.36,1) both" }}>
            <PhoneScreen screen={APP_SCREENS[tabIndex]} tabIndex={tabIndex} onTab={setTabIndex} />
          </div>
        </div>

        {/* Side buttons — volume up */}
        <div style={{
          position:"absolute", left:"-3px", top:"130px",
          width:"3px", height:"36px", borderRadius:"2px 0 0 2px",
          background:"linear-gradient(180deg, #2a2218, #1a1610, #2a2218)",
          boxShadow:"-1px 0 3px rgba(0,0,0,.60)",
        }} />
        {/* Side buttons — volume down */}
        <div style={{
          position:"absolute", left:"-3px", top:"178px",
          width:"3px", height:"36px", borderRadius:"2px 0 0 2px",
          background:"linear-gradient(180deg, #2a2218, #1a1610, #2a2218)",
          boxShadow:"-1px 0 3px rgba(0,0,0,.60)",
        }} />
        {/* Side buttons — power */}
        <div style={{
          position:"absolute", right:"-3px", top:"148px",
          width:"3px", height:"56px", borderRadius:"0 2px 2px 0",
          background:"linear-gradient(180deg, #2a2218, #1a1610, #2a2218)",
          boxShadow:"1px 0 3px rgba(0,0,0,.60)",
        }} />

        {/* Bottom speaker grille */}
        <div style={{
          position:"absolute", bottom:"16px", left:"50%",
          transform:"translateX(-50%)",
          display:"flex", gap:"4px", alignItems:"center",
        }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ width:"2.5px", height:"7px", borderRadius:"2px", background:"rgba(201,162,39,.15)" }} />
          ))}
        </div>

        {/* Top speaker */}
        <div style={{
          position:"absolute", top:"52px", left:"50%",
          transform:"translateX(-50%)",
          display:"flex", gap:"3px", alignItems:"center",
        }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ width:"2px", height:"5px", borderRadius:"2px", background:"rgba(201,162,39,.10)" }} />
          ))}
        </div>

        {/* Rune engraving on frame — subtle gold sigil */}
        <div style={{
          position:"absolute", bottom:"8px", left:"50%",
          transform:"translateX(-50%)",
          fontSize:"8px", color:"rgba(201,162,39,.20)",
          fontFamily:"'Cinzel', serif", letterSpacing:".15em",
          whiteSpace:"nowrap",
        }}>⚜ RURALOPS ⚜</div>

      </div>
    </div>
  );
}

/* ==========================================
   MAIN PAGE COMPONENT
========================================== */
function MobileAppPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const tickerRef = useRef(null);

  /* Auto-rotate phone screens */
  useEffect(() => {
    const t = setInterval(() => setTabIndex(i => (i + 1) % APP_SCREENS.length), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background:"#04070a",
      minHeight:"100vh",
      color:"#dde9dd",
      fontFamily:"'Crimson Pro', Georgia, serif",
      overflowX:"hidden",
      position:"relative",
    }}>

      <style>{`
        ${FONT_IMPORT}

        /* Ambient orbs */
        .mob-page-wrap::before {
          content:'';
          position:fixed;
          width:700px; height:700px;
          top:-300px; right:-100px;
          border-radius:50%;
          background:conic-gradient(from 180deg, rgba(201,162,39,.07) 0deg, rgba(61,153,96,.04) 90deg, transparent 270deg);
          filter:blur(90px);
          animation:mobOrbA 20s ease-in-out infinite alternate;
          pointer-events:none; z-index:0;
        }
        .mob-page-wrap::after {
          content:'';
          position:fixed;
          width:500px; height:500px;
          bottom:-200px; left:-100px;
          border-radius:50%;
          background:radial-gradient(circle, rgba(201,162,39,.07) 0%, rgba(61,153,96,.03) 50%, transparent 80%);
          filter:blur(80px);
          animation:mobOrbB 24s ease-in-out infinite alternate;
          pointer-events:none; z-index:0;
        }

        @keyframes mobOrbA { from{transform:translate(0,0) scale(1)} to{transform:translate(-30px,20px) scale(1.08)} }
        @keyframes mobOrbB { from{transform:translate(0,0) scale(1)} to{transform:translate(20px,-16px) scale(1.05)} }

        @keyframes gotScreenIn {
          from { opacity:0; transform:translateY(8px) scale(.98); filter:blur(2px); }
          to   { opacity:1; transform:translateY(0) scale(1); filter:blur(0); }
        }
        @keyframes phoneFloat {
          0%,100% { transform:rotateY(-8deg) rotateX(3deg) translateY(0); }
          50%     { transform:rotateY(-8deg) rotateX(3deg) translateY(-10px); }
        }
        @keyframes shimmerGold {
          0%,100% { background-position:0% 50%; }
          50%     { background-position:100% 50%; }
        }
        @keyframes titleIn {
          0%   { opacity:0; transform:translateY(24px) scaleX(.96); filter:blur(5px); }
          60%  { opacity:1; filter:blur(0); }
          100% { opacity:1; transform:translateY(0) scaleX(1); }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes swordCross {
          0%,100% { transform:rotate(-8deg) scale(1); }
          50%     { transform:rotate(8deg) scale(1.06); }
        }
        @keyframes heraldPulse {
          0%,100% { filter:drop-shadow(0 0 6px rgba(201,162,39,.4)); }
          50%     { filter:drop-shadow(0 0 18px rgba(201,162,39,.8)); }
        }
        @keyframes livePulse {
          0%,100% { box-shadow:0 0 0 0 rgba(239,68,68,.75); background:#ef4444; }
          55%     { box-shadow:0 0 0 7px rgba(239,68,68,0); background:#f87171; }
        }
        @keyframes tickerScroll {
          0%   { transform:translateX(0); }
          100% { transform:translateX(-50%); }
        }
        @keyframes sweepLine {
          from { transform:scaleX(0); }
          to   { transform:scaleX(1); }
        }
        @keyframes statRoll {
          from { opacity:0; transform:translateY(10px) scale(.95); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes pulseDotGold {
          0%,100% { box-shadow:0 0 0 0 rgba(201,162,39,.65); }
          60%     { box-shadow:0 0 0 8px rgba(201,162,39,0); }
        }

        .feat-card:hover {
          border-color: rgba(201,162,39,.30) !important;
          transform: translateY(-4px) !important;
          box-shadow: 0 20px 50px rgba(0,0,0,.75), 0 0 24px rgba(201,162,39,.08) !important;
        }
        .inst-card:hover {
          border-color: rgba(201,162,39,.22) !important;
          background: rgba(201,162,39,.04) !important;
        }
        .btn-dl:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 40px rgba(61,153,96,.50) !important;
        }
        .btn-guide:hover {
          border-color: rgba(201,162,39,.35) !important;
          color: #f5d76e !important;
          background: rgba(201,162,39,.06) !important;
        }
        .stat-card:hover {
          border-color: rgba(201,162,39,.22) !important;
          transform: translateY(-3px) !important;
        }
      `}</style>

      <div className="mob-page-wrap" style={{ position:"relative", zIndex:1 }}>

        {/* ══════════════════════════════════════
            HERO
        ══════════════════════════════════════ */}
        <div style={{ maxWidth:"1180px", margin:"0 auto", padding:"120px 6% 60px", display:"grid", gridTemplateColumns:"1fr 320px", gap:"80px", alignItems:"center", position:"relative" }}>

          {/* LEFT */}
          <div style={{ display:"flex", flexDirection:"column" }}>

            {/* Eyebrow */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:"9px",
              padding:"7px 16px", borderRadius:"2px",
              background:"rgba(201,162,39,.08)", border:"1px solid rgba(201,162,39,.24)",
              fontSize:"10px", fontWeight:"600", letterSpacing:".22em", textTransform:"uppercase",
              color:"#c9a227", marginBottom:"22px", width:"fit-content",
              fontFamily:"'Cinzel', serif",
              boxShadow:"0 0 18px rgba(201,162,39,.08)",
              animation:"slideUp .7s cubic-bezier(.22,1,.36,1) .1s both",
            }}>
              <span style={{ fontSize:"11px", display:"inline-block", animation:"swordCross 4s ease-in-out infinite" }}>⚔</span>
              Now Available · v2.4.1
            </div>

            {/* H1 */}
            <h1 style={{
              fontFamily:"'Cinzel Decorative', serif",
              fontSize:"clamp(26px, 3.2vw, 46px)",
              fontWeight:"900", lineHeight:"1.1",
              color:"#dde9dd", margin:"0 0 8px 0",
              letterSpacing:".02em",
              animation:"titleIn .9s cubic-bezier(.22,1,.36,1) .2s both",
            }}>
              RuralOps
            </h1>
            <h1 style={{
              fontFamily:"'Cinzel Decorative', serif",
              fontSize:"clamp(22px, 2.8vw, 40px)",
              fontWeight:"900", lineHeight:"1.1",
              margin:"0 0 26px 0",
              letterSpacing:".02em",
              fontStyle:"italic",
              background:"linear-gradient(270deg, #c9a227, #f5d76e, #e8c547, #c9a227, #a87d1a, #e8c547, #c9a227)",
              backgroundSize:"400% 400%",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
              animation:"shimmerGold 5s ease infinite, titleIn .9s cubic-bezier(.22,1,.36,1) .3s both",
              position:"relative",
            }}>
              Mobile Command
              <span style={{
                display:"block", position:"absolute",
                bottom:"-4px", left:0,
                width:"100%", height:"2px",
                background:"linear-gradient(90deg, #8b6914, #f5d76e, transparent)",
                transformOrigin:"left",
                animation:"sweepLine .85s cubic-bezier(.22,1,.36,1) 1.1s both",
                boxShadow:"0 0 10px rgba(201,162,39,.60)",
              }} />
            </h1>

            <p style={{
              fontFamily:"'IM Fell English', serif",
              fontSize:"16px", color:"rgba(157,184,157,.75)",
              lineHeight:"1.85", maxWidth:"480px", margin:"0 0 36px 0",
              fontStyle:"italic",
              animation:"slideUp .8s cubic-bezier(.22,1,.36,1) .4s both",
            }}>
              Secure, role-based mobile access for citizens, field workers, and
              administrative officers. Built for the realm's low-bandwidth keeps
              and real operational workflows.
            </p>

            {/* CTA buttons */}
            <div style={{ display:"flex", gap:"14px", flexWrap:"wrap", marginBottom:"22px", animation:"slideUp .8s cubic-bezier(.22,1,.36,1) .5s both" }}>
              <a href="/download/ruralops.apk" className="btn-dl" style={{
                display:"inline-flex", alignItems:"center", gap:"9px",
                padding:"14px 26px", borderRadius:"9px",
                background:"linear-gradient(150deg, #52b874, #3d9960, #246644)",
                color:"white", fontWeight:"800", fontSize:"11px",
                fontFamily:"'Cinzel', serif", letterSpacing:".12em", textTransform:"uppercase",
                textDecoration:"none", border:"1.5px solid #246644",
                boxShadow:"0 6px 24px rgba(61,153,96,.38), inset 0 1px 0 rgba(255,255,255,.15)",
                transition:"all .18s ease",
              }}>
                ⬇ Download APK
              </a>
              <a href="#installation" className="btn-guide" style={{
                display:"inline-flex", alignItems:"center", gap:"9px",
                padding:"14px 22px", borderRadius:"9px",
                background:"transparent", border:"1px solid rgba(201,162,39,.28)",
                color:"rgba(201,162,39,.80)", fontWeight:"700", fontSize:"11px",
                fontFamily:"'Cinzel', serif", letterSpacing:".10em", textTransform:"uppercase",
                textDecoration:"none",
                transition:"all .18s ease",
              }}>
                📜 Installation Guide
              </a>
            </div>

            <p style={{
              fontFamily:"'Cinzel', serif",
              fontSize:"10px", color:"rgba(93,120,93,.70)",
              display:"flex", alignItems:"center", gap:"7px",
              letterSpacing:".06em",
              animation:"slideUp .8s cubic-bezier(.22,1,.36,1) .55s both",
            }}>
              🛡️ Distributed directly by the realm's administration. Not on the Google Play citadel.
            </p>
          </div>

          {/* RIGHT — Realistic Phone */}
          <div style={{ position:"relative", animation:"slideUp .9s cubic-bezier(.22,1,.36,1) .35s both" }}>
            <RealisticPhone tabIndex={tabIndex} setTabIndex={setTabIndex} />
          </div>
        </div>

        {/* ══════════════════════════════════════
            LIVE TICKER
        ══════════════════════════════════════ */}
        <div style={{ maxWidth:"1180px", margin:"0 auto", padding:"0 6% 40px" }}>
          <div style={{
            display:"flex", alignItems:"stretch",
            background:"linear-gradient(135deg, rgba(6,12,8,.97), rgba(4,8,6,.97))",
            border:"1px solid rgba(201,162,39,.20)",
            borderRadius:"6px", overflow:"hidden",
            boxShadow:"0 8px 28px rgba(0,0,0,.74), 0 0 24px rgba(201,162,39,.05)",
          }}>
            <div style={{
              display:"flex", alignItems:"center", gap:"7px", padding:"9px 14px",
              background:"linear-gradient(135deg, rgba(239,68,68,.16), rgba(139,26,26,.06))",
              borderRight:"1px solid rgba(201,162,39,.16)",
              fontFamily:"'Cinzel', serif", fontSize:"9px", fontWeight:"700",
              letterSpacing:".20em", textTransform:"uppercase",
              color:"#f87171", whiteSpace:"nowrap", flexShrink:0,
            }}>
              <div style={{ width:"7px", height:"7px", borderRadius:"50%", flexShrink:0, animation:"livePulse 1.8s ease infinite" }} />
              LIVE
            </div>
            <div style={{ flex:1, overflow:"hidden", display:"flex", alignItems:"center" }}>
              <div style={{ display:"flex", gap:0, whiteSpace:"nowrap", animation:"tickerScroll 40s linear infinite" }}>
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <div key={i} style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"9px 20px", fontSize:"12px", color:"rgba(157,184,157,.70)", borderRight:"1px solid rgba(201,162,39,.08)", whiteSpace:"nowrap", fontFamily:"'Crimson Pro', serif" }}>
                    <span style={{ fontFamily:"'Cinzel', serif", fontSize:"9px", fontWeight:"700", letterSpacing:".10em", textTransform:"uppercase", color:"#c9a227", opacity:".80" }}>{item.state}</span>
                    <span style={{ width:"5px", height:"5px", borderRadius:"50%", flexShrink:0, background: item.dot === "green" ? "#22c55e" : item.dot === "gold" ? "#c9a227" : item.dot === "blue" ? "#60a5fa" : "#f87171" }} />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            STATS
        ══════════════════════════════════════ */}
        <div style={{ maxWidth:"1180px", margin:"0 auto", padding:"0 6% 60px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
            {STATS.map((s, i) => (
              <div key={s.label} className="stat-card" style={{
                padding:"24px 22px", borderRadius:"14px",
                background:"linear-gradient(145deg, #0c1519, #091014, #060d10)",
                border:"1px solid rgba(201,162,39,.12)",
                boxShadow:"0 4px 16px rgba(0,0,0,.70), inset 0 1px 0 rgba(255,255,255,.02)",
                display:"flex", flexDirection:"column", gap:"5px",
                transition:"border-color .2s ease, transform .2s ease",
                animation:`statRoll .7s cubic-bezier(.22,1,.36,1) ${.5 + i*.1}s both`,
                position:"relative", overflow:"hidden",
              }}>
                <div style={{
                  position:"absolute", top:0, left:0, right:0, height:"1px",
                  background:"linear-gradient(90deg, transparent, rgba(201,162,39,.20), transparent)",
                }} />
                <span style={{
                  fontFamily:"'Cinzel Decorative', serif",
                  fontSize:"30px", fontWeight:"900", lineHeight:"1",
                  background:"linear-gradient(180deg, #f5d76e 0%, #c9a227 55%, #8b6914 100%)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
                }}>{s.value}</span>
                <span style={{
                  fontFamily:"'Cinzel', serif",
                  fontSize:"9px", color:"rgba(93,120,93,.70)",
                  fontWeight:"700", textTransform:"uppercase", letterSpacing:".12em",
                }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ maxWidth:"1180px", margin:"0 auto", padding:"0 6%" }}>
          <div style={{ height:"1px", background:"linear-gradient(90deg, transparent, rgba(201,162,39,.15), transparent)" }} />
        </div>

        {/* ══════════════════════════════════════
            FEATURES
        ══════════════════════════════════════ */}
        <div style={{ maxWidth:"1180px", margin:"0 auto", padding:"60px 6%" }}>

          <div style={{ marginBottom:"40px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", fontFamily:"'Cinzel', serif", fontSize:"9px", fontWeight:"700", textTransform:"uppercase", letterSpacing:".20em", color:"#c9a227", marginBottom:"12px" }}>
              <span style={{ display:"block", width:"16px", height:"1px", background:"linear-gradient(90deg, #c9a227, transparent)" }} />
              Role-Based Command
            </div>
            <h2 style={{
              fontFamily:"'Cinzel Decorative', serif",
              fontSize:"clamp(22px, 2.4vw, 34px)",
              fontWeight:"900", lineHeight:"1.15",
              color:"#dde9dd", margin:0, letterSpacing:".02em",
            }}>
              Built for every lord<br />
              <span style={{
                fontStyle:"italic",
                background:"linear-gradient(270deg, #c9a227, #f5d76e, #c9a227)",
                backgroundSize:"300% 300%",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
                animation:"shimmerGold 5s ease infinite",
              }}>in the governance chain</span>
            </h2>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"18px" }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feat-card" style={{
                padding:"28px 24px", borderRadius:"16px",
                background:"linear-gradient(145deg, #0c1519, #091014)",
                border:"1px solid rgba(201,162,39,.10)",
                boxShadow:"0 4px 16px rgba(0,0,0,.70), inset 0 1px 0 rgba(255,255,255,.02)",
                display:"flex", flexDirection:"column", gap:"16px",
                transition:"all .25s cubic-bezier(.22,1,.36,1)",
                position:"relative", overflow:"hidden",
              }}>
                <div style={{
                  position:"absolute", top:0, left:0, right:0, height:"1px",
                  background:"linear-gradient(90deg, transparent, rgba(201,162,39,.16), transparent)",
                }} />
                <div style={{
                  width:"50px", height:"50px", borderRadius:"13px",
                  background:"rgba(201,162,39,.07)",
                  border:"1px solid rgba(201,162,39,.16)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px",
                  boxShadow:"0 0 20px rgba(201,162,39,.06)",
                }}>{f.icon}</div>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
                    <span style={{ fontSize:"10px", color:"#c9a227" }}>{f.sigil}</span>
                    <p style={{ fontFamily:"'Cinzel', serif", fontSize:"13px", fontWeight:"700", color:"#dde9dd", margin:0, letterSpacing:".06em" }}>{f.title}</p>
                  </div>
                  <p style={{ fontFamily:"'IM Fell English', serif", fontSize:"14px", color:"rgba(157,184,157,.65)", lineHeight:"1.75", margin:0, fontStyle:"italic" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ maxWidth:"1180px", margin:"0 auto", padding:"0 6%" }}>
          <div style={{ height:"1px", background:"linear-gradient(90deg, transparent, rgba(201,162,39,.15), transparent)" }} />
        </div>

        {/* ══════════════════════════════════════
            INSTALLATION
        ══════════════════════════════════════ */}
        <div id="installation" style={{ maxWidth:"1180px", margin:"0 auto", padding:"60px 6% 90px", scrollMarginTop:"80px" }}>

          <div style={{ marginBottom:"40px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", fontFamily:"'Cinzel', serif", fontSize:"9px", fontWeight:"700", textTransform:"uppercase", letterSpacing:".20em", color:"#c9a227", marginBottom:"12px" }}>
              <span style={{ display:"block", width:"16px", height:"1px", background:"linear-gradient(90deg, #c9a227, transparent)" }} />
              The Path to Power
            </div>
            <h2 style={{
              fontFamily:"'Cinzel Decorative', serif",
              fontSize:"clamp(22px, 2.4vw, 34px)",
              fontWeight:"900", lineHeight:"1.15",
              color:"#dde9dd", margin:0, letterSpacing:".02em",
            }}>
              Claim your realm<br />
              <span style={{
                fontStyle:"italic",
                background:"linear-gradient(270deg, #c9a227, #f5d76e, #c9a227)",
                backgroundSize:"300% 300%",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
                animation:"shimmerGold 5s ease infinite",
              }}>in four decrees</span>
            </h2>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"16px", marginBottom:"24px" }}>
            {INSTALL_STEPS.map((s, i) => (
              <div key={s.step} className="inst-card" style={{
                display:"flex", gap:"18px", padding:"24px 22px",
                borderRadius:"14px",
                background:"linear-gradient(145deg, #0c1519, #091014)",
                border:"1px solid rgba(201,162,39,.10)",
                boxShadow:"0 4px 16px rgba(0,0,0,.70)",
                transition:"all .2s ease",
                position:"relative", overflow:"hidden",
              }}>
                <div style={{
                  position:"absolute", left:0, top:0, bottom:0, width:"3px",
                  background:"linear-gradient(180deg, #f5d76e, #c9a227, #8b6914)",
                  boxShadow:"2px 0 12px rgba(201,162,39,.35)",
                }} />
                <span style={{
                  fontFamily:"'Cinzel Decorative', serif",
                  fontSize:"18px", fontWeight:"900",
                  background:"linear-gradient(180deg, #f5d76e, #c9a227)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
                  minWidth:"28px", paddingTop:"2px", flexShrink:0,
                }}>{s.step}</span>
                <div>
                  <p style={{ fontFamily:"'Cinzel', serif", fontSize:"12px", fontWeight:"700", color:"#dde9dd", margin:"0 0 7px 0", letterSpacing:".05em" }}>{s.title}</p>
                  <p style={{ fontFamily:"'IM Fell English', serif", fontSize:"13.5px", color:"rgba(157,184,157,.65)", lineHeight:"1.65", margin:0, fontStyle:"italic" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tip banner */}
          <div style={{
            padding:"18px 22px", borderRadius:"12px",
            background:"rgba(61,153,96,.05)",
            border:"1px solid rgba(61,153,96,.18)",
            display:"flex", alignItems:"flex-start", gap:"13px",
            boxShadow:"0 0 20px rgba(61,153,96,.04)",
          }}>
            <span style={{ fontSize:"18px", flexShrink:0, animation:"heraldPulse 5s ease-in-out infinite" }}>⚜️</span>
            <p style={{ fontFamily:"'IM Fell English', serif", fontSize:"14px", color:"rgba(157,184,157,.70)", margin:0, lineHeight:"1.70", fontStyle:"italic" }}>
              <strong style={{ color:"#52b874", fontStyle:"normal", fontFamily:"'Cinzel', serif", fontSize:"11px", letterSpacing:".06em" }}>NOT YET ACTIVATED?</strong>{" "}
              The app shall guide you through account activation automatically. You may also visit the{" "}
              <a href="/activate-account" style={{ color:"#c9a227", textDecoration:"none", fontWeight:"600" }}>Activate Account</a> scroll on the web to complete your oath.
            </p>
          </div>
        </div>

        <Footer />

      </div>
    </div>
  );
}

export default MobileAppPage;