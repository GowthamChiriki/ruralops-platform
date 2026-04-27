import { useState } from "react";

const PILLARS = [
  {
    icon: "👁",
    title: "Observe",
    subtitle: "Continuous signal capture",
    body: "Every village, worker, and public program generates signals — reports, delays, complaints, approvals, outcomes. RuralOps captures them all to build a living picture of governance activity across the entire system.",
    stat: "45,400+",
    statLabel: "Villages monitored",
    color: "var(--info)",
    sub:   "var(--info-sub)",
    brd:   "var(--info-brd)",
    glow:  "rgba(90,122,154,0.12)",
  },
  {
    icon: "🧠",
    title: "Analyze",
    subtitle: "Pattern recognition & risk",
    body: "Patterns inside the data reveal risks before they escalate. By analyzing workloads, delays, and response patterns the system surfaces warning signals that would otherwise remain hidden inside manual records.",
    stat: "< 24h",
    statLabel: "Risk detection cycle",
    color: "var(--warn)",
    sub:   "var(--warn-sub)",
    brd:   "var(--warn-brd)",
    glow:  "rgba(196,154,58,0.12)",
  },
  {
    icon: "⚡",
    title: "Act",
    subtitle: "Coordinated intervention",
    body: "Once risks are visible, administrators intervene immediately. Tasks reassigned, resources redirected, field teams coordinated — turning reactive firefighting into proactive system management.",
    stat: "≤ 1h",
    statLabel: "Decision to execution",
    color: "var(--success)",
    sub:   "var(--success-sub)",
    brd:   "var(--success-brd)",
    glow:  "rgba(107,140,90,0.12)",
  },
];

/* ── Card ── */
function PillarCard({ pillar, index }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${hov ? pillar.brd : "var(--border)"}`,
        borderRadius: "var(--r-lg)",
        padding: "28px",
        position: "relative", overflow: "hidden", cursor: "default",
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hov
          ? `var(--shadow-md), 0 0 0 3px ${pillar.sub}, 0 0 40px ${pillar.glow}`
          : "var(--shadow-xs)",
        transition:
          "transform 0.26s cubic-bezier(0.22,1,0.36,1), box-shadow 0.26s ease, border-color 0.22s ease",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(90deg, ${pillar.color}, transparent)`,
        opacity: hov ? 0.9 : 0, transition: "opacity 0.3s ease",
      }}/>

      {/* icon + badge */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "22px",
      }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "var(--r-md)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
          background: hov ? pillar.sub : "var(--bg-subtle)",
          border: `1px solid ${hov ? pillar.brd : "var(--border)"}`,
          transform: hov ? "scale(1.12) rotate(-5deg)" : "scale(1) rotate(0deg)",
          transition:
            "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, border-color 0.2s ease",
        }}>
          {pillar.icon}
        </div>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase",
          color: pillar.color, background: pillar.sub, border: `1px solid ${pillar.brd}`,
          padding: "3px 10px", borderRadius: "100px",
        }}>
          {pillar.title}
        </span>
      </div>

      <h3 style={{
        fontFamily: "var(--font-head)",
        fontSize: "20px", fontWeight: 800, letterSpacing: "-0.04em",
        color: "var(--text-1)", marginBottom: "4px",
      }}>
        {pillar.title}
      </h3>
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px", fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase",
        color: "var(--text-3)", marginBottom: "14px",
      }}>
        {pillar.subtitle}
      </p>

      <p style={{
        fontSize: "13.5px", color: "var(--text-2)", lineHeight: 1.68,
        fontWeight: 300, marginBottom: "22px",
      }}>
        {pillar.body}
      </p>

      {/* stat strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px",
        paddingTop: "16px", borderTop: "1px solid var(--border)",
      }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
          padding: "12px 8px",
          background: hov ? pillar.sub : "var(--bg-subtle)",
          border: `1px solid ${hov ? pillar.brd : "var(--border)"}`,
          borderRadius: "var(--r-md)",
          transition: "background 0.2s ease, border-color 0.2s ease",
        }}>
          <span style={{
            fontFamily: "var(--font-head)",
            fontSize: "16px", fontWeight: 700, letterSpacing: "-0.03em",
            color: hov ? pillar.color : "var(--text-1)",
            transition: "color 0.2s ease",
          }}>
            {pillar.stat}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8px", fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase",
            color: "var(--text-3)",
          }}>
            {pillar.statLabel}
          </span>
        </div>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "12px 8px",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
        }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "16px", fontWeight: 700,
            color: "var(--text-3)", lineHeight: 1,
          }}>
            0{index + 1}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8px", fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase",
            color: "var(--text-4)", marginTop: "5px",
          }}>
            Pillar
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Section ── */
export default function SystemIntroSection() {
  return (
    <div style={{ position: "relative", width: "100%" }}>

      <div style={{ marginBottom: "56px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          fontFamily: "var(--font-mono)",
          fontSize: "10px", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase",
          color: "var(--accent-text)", background: "var(--accent-sub)", border: "1px solid var(--accent-brd)",
          padding: "5px 13px", borderRadius: "100px", marginBottom: "22px",
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }}/>
          System Philosophy
        </div>

        <h2 style={{
          fontFamily: "var(--font-head)",
          fontSize: "clamp(28px,3.2vw,44px)", fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.05, color: "var(--text-1)", marginBottom: "16px", marginTop: 0,
        }}>
          How RuralOps{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 60%, var(--accent) 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            thinks
          </span>
        </h2>

        <p style={{
          fontSize: "15.5px", color: "var(--text-2)", lineHeight: 1.75,
          maxWidth: "540px", fontWeight: 300,
        }}>
          RuralOps is not just a dashboard — it is a living system designed to observe,
          understand, and coordinate rural governance in real time across every village,
          officer, and citizen in the region.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px",
        width: "100%",
      }}>
        {PILLARS.map((p, i) => <PillarCard key={p.title} pillar={p} index={i} />)}
      </div>
    </div>
  );
}