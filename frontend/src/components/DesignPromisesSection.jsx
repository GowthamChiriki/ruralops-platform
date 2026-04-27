import { useState } from "react";

/* ── Sovereign Earth tag palette ── */
const TAG_COLORS = {
  "Environmental Reality":  {
    color: "var(--info)",
    sub:   "var(--info-sub)",
    brd:   "var(--info-brd)",
    glow:  "rgba(90,122,154,0.12)",
  },
  "Human Cognitive Limits": {
    color: "var(--warn)",
    sub:   "var(--warn-sub)",
    brd:   "var(--warn-brd)",
    glow:  "rgba(196,154,58,0.12)",
  },
  "Operational Integrity":  {
    color: "var(--success)",
    sub:   "var(--success-sub)",
    brd:   "var(--success-brd)",
    glow:  "rgba(107,140,90,0.12)",
  },
};

const PROMISES = [
  {
    icon: "📡", title: "Low-Bandwidth Resilience",
    tag: "Environmental Reality",
    desc: "Village offices often operate on fragile networks. RuralOps ensures essential tasks — viewing records, filing updates, tracking progress — remain reliable even when internet conditions are imperfect.",
    quote: "The system respects the reality that infrastructure is uneven.",
  },
  {
    icon: "👁", title: "Instant Clarity",
    tag: "Human Cognitive Limits",
    desc: "Workers should not decode complicated dashboards after long field hours. Typography, spacing, and visual hierarchy ensure the most important information becomes visible within seconds.",
    quote: "The interface is designed so the mind can recognize patterns instantly.",
  },
  {
    icon: "🎯", title: "Role-Focused Simplicity",
    tag: "Human Cognitive Limits",
    desc: "A citizen, field worker, or administrator operates at different levels of responsibility. RuralOps removes unnecessary complexity by tailoring each interface to the user's responsibilities.",
    quote: "Reduce mental load — not increase it.",
  },
  {
    icon: "💻", title: "Device Realism",
    tag: "Environmental Reality",
    desc: "Many public institutions operate on older computers or shared devices. RuralOps avoids heavy graphical elements and unnecessary processing demands to stay responsive on everyday hardware.",
    quote: "Technology should adapt to reality — not the other way around.",
  },
  {
    icon: "🌐", title: "Language Inclusivity",
    tag: "Environmental Reality",
    desc: "Governance operates across many languages and dialects. RuralOps is designed with multilingual capability so interfaces can adapt to regional contexts and local administrative needs.",
    quote: "Understanding should never depend on language barriers.",
  },
  {
    icon: "🧘", title: "Calm Interaction",
    tag: "Human Cognitive Limits",
    desc: "Constant notifications, flashing animations, and cluttered layouts fragment attention. RuralOps favors a calm visual environment so users can focus on tasks rather than interface noise.",
    quote: "A quiet interface allows clear thinking under pressure.",
  },
  {
    icon: "🔍", title: "Actionable Visibility",
    tag: "Operational Integrity",
    desc: "Information without guidance creates paralysis. RuralOps ensures alerts, reports, and indicators connect directly to next steps — so users always know how to respond.",
    quote: "Visibility exists not for observation alone, but for intervention.",
  },
  {
    icon: "🏛", title: "Trustworthy Records",
    tag: "Operational Integrity",
    desc: "Public systems require accountability. RuralOps maintains clear records of actions, updates, and decisions so administrators can review events and maintain full transparency.",
    quote: "A system becomes trustworthy when history cannot quietly disappear.",
  },
];

/* ── Card ── */
function PromiseCard({ item }) {
  const [hov, setHov] = useState(false);
  const tc = TAG_COLORS[item.tag];

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${hov ? tc.brd : "var(--border)"}`,
        borderRadius: "var(--r-lg)",
        padding: "26px",
        position: "relative", overflow: "hidden", cursor: "default",
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hov
          ? `var(--shadow-md), 0 0 0 3px ${tc.sub}, 0 0 32px ${tc.glow}`
          : "var(--shadow-xs)",
        transition:
          "transform 0.26s cubic-bezier(0.22,1,0.36,1), box-shadow 0.26s ease, border-color 0.22s ease",
      }}
    >
      {/* top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(90deg, ${tc.color}, transparent)`,
        opacity: hov ? 0.85 : 0, transition: "opacity 0.3s ease",
      }}/>

      {/* icon + tag */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "18px",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "var(--r-md)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px",
          background: hov ? tc.sub : "var(--bg-subtle)",
          border: `1px solid ${hov ? tc.brd : "var(--border)"}`,
          transform: hov ? "scale(1.10) rotate(-5deg)" : "scale(1) rotate(0deg)",
          transition:
            "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, border-color 0.2s ease",
        }}>
          {item.icon}
        </div>

        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase",
          color: tc.color, background: tc.sub, border: `1px solid ${tc.brd}`,
          padding: "3px 9px", borderRadius: "100px",
        }}>
          {item.tag}
        </span>
      </div>

      <h3 style={{
        fontFamily: "var(--font-head)",
        fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em",
        color: "var(--text-1)", marginBottom: "10px",
      }}>
        {item.title}
      </h3>

      <p style={{
        fontSize: "13.5px", color: "var(--text-2)", lineHeight: 1.68,
        fontWeight: 300, marginBottom: "14px",
      }}>
        {item.desc}
      </p>

      <p style={{
        fontSize: "12.5px", fontStyle: "italic",
        color: hov ? "var(--text-2)" : "var(--text-3)",
        lineHeight: 1.6,
        paddingLeft: "12px",
        borderLeft: `2px solid ${hov ? tc.color : "var(--border)"}`,
        transition: "color 0.2s ease, border-color 0.22s ease",
      }}>
        {item.quote}
      </p>
    </div>
  );
}

/* ── Section ── */
export default function DesignPromisesSection() {
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
          Design Principles
        </div>

        <h2 style={{
          fontFamily: "var(--font-head)",
          fontSize: "clamp(28px,3.2vw,44px)", fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.05, color: "var(--text-1)", marginBottom: "16px", marginTop: 0,
        }}>
          The 8 real promises{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 60%, var(--accent) 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            of RuralOps
          </span>
        </h2>

        <p style={{
          fontSize: "15.5px", color: "var(--text-2)", lineHeight: 1.75,
          maxWidth: "540px", fontWeight: 300, marginBottom: "24px",
        }}>
          Every design decision reflects the actual conditions our users work in —
          patchy networks, shared devices, long shifts, and regional languages.
        </p>

        {/* legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Object.entries(TAG_COLORS).map(([label, tc]) => (
            <div key={label} style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              fontFamily: "var(--font-mono)",
              fontSize: "9px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase",
              color: tc.color, background: tc.sub, border: `1px solid ${tc.brd}`,
              padding: "4px 11px", borderRadius: "100px",
            }}>
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: tc.color, flexShrink: 0,
              }}/>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "16px",
        width: "100%",
      }}>
        {PROMISES.map((item) => <PromiseCard key={item.title} item={item} />)}
      </div>
    </div>
  );
}