import { useState } from "react";

const STEP_ICONS = ["⚙️", "✅", "🔑", "🛡", "📊", "📢", "🔍", "🚀"];

const STEP_COLORS = [
  { base: "#236e80", bright: "#38a0b8", bg: "rgba(35,110,128,.12)",  border: "rgba(35,110,128,.26)"  },
  { base: "#378a55", bright: "#52b874", bg: "rgba(55,138,85,.12)",   border: "rgba(55,138,85,.26)"   },
  { base: "#c07818", bright: "#e8a830", bg: "rgba(192,120,24,.12)",  border: "rgba(192,120,24,.26)"  },
  { base: "#7c5cfc", bright: "#a080ff", bg: "rgba(124,92,252,.12)",  border: "rgba(124,92,252,.26)"  },
  { base: "#9e3328", bright: "#c84030", bg: "rgba(158,51,40,.12)",   border: "rgba(158,51,40,.26)"   },
  { base: "#2f7d7b", bright: "#4fd1c5", bg: "rgba(47,125,123,.12)",  border: "rgba(47,125,123,.26)"  },
  { base: "#8b5e3c", bright: "#c78a5a", bg: "rgba(139,94,60,.12)",   border: "rgba(139,94,60,.26)"   },
  { base: "#3c5c9e", bright: "#6f9cff", bg: "rgba(60,92,158,.12)",   border: "rgba(60,92,158,.26)"   },
];

const STEPS = [
  {
    title: "Provisioning & Registration",
    description: "Administrative accounts are provisioned by authority. Citizens may self-register, but no access is granted yet.",
  },
  {
    title: "Approval & Verification",
    description: "Citizen records are reviewed and approved by village administration before becoming official.",
  },
  {
    title: "Secure Activation",
    description: "Approved users activate accounts using a secure, one-time key and set credentials.",
  },
  {
    title: "Role-Based Access",
    description: "Each user sees only what their role permits — from state oversight to village execution.",
  },
  {
    title: "Monitoring & Intervention",
    description: "Progress, delays, and risks are surfaced early so support and intervention happen on time.",
  },
  {
    title: "Citizen Feedback Loop",
    description: "Citizens and workers submit feedback, complaints, and suggestions which become actionable signals for administrators.",
  },
  {
    title: "Auditing & Accountability",
    description: "All actions are logged and auditable, ensuring transparency and responsibility across every administrative level.",
  },
  {
    title: "Policy Improvement",
    description: "Insights from field data guide improvements to workflows, policies, and resource allocation across the system.",
  },
];

/* ── Pipeline segment row ── */
function PipelineBar({ total, activeIndex, activeColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "16px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "3px",
            flex: i === activeIndex ? 2 : 1,
            borderRadius: "999px",
            background:
              i === activeIndex
                ? `linear-gradient(90deg, ${activeColor.base}, ${activeColor.bright})`
                : i < activeIndex
                  ? "rgba(255,255,255,.18)"
                  : "rgba(255,255,255,.06)",
            transition: "flex .3s ease",
          }}
        />
      ))}
    </div>
  );
}

function StepCard({ step, index }) {
  const [hovered, setHovered] = useState(false);
  const c = STEP_COLORS[index];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "linear-gradient(145deg, #0c1519 0%, #091014 100%)",
        border: `1px solid ${hovered ? c.border : "rgba(255,255,255,.07)"}`,
        borderRadius: "12px",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,.60), 0 0 28px ${c.bg}`
          : "0 2px 8px rgba(0,0,0,.65), 0 10px 28px rgba(0,0,0,.55)",
        transition:
          "transform .28s cubic-bezier(0.22,1,0.36,1), box-shadow .28s ease, border-color .28s ease",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "2px",
          background: `linear-gradient(90deg, ${c.base}, ${c.bright}, transparent)`,
          transform: hovered ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform .4s cubic-bezier(0.22,1,0.36,1)",
        }}
      />

      {/* Corner glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-60px", right: "-60px",
          width: "160px", height: "160px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c.bg} 0%, transparent 70%)`,
          opacity: hovered ? 1 : 0,
          transform: hovered ? "scale(1)" : "scale(.6)",
          transition: "opacity .4s ease, transform .4s cubic-bezier(0.22,1,0.36,1)",
          pointerEvents: "none",
        }}
      />

      {/* Step pill + icon row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "18px",
        }}
      >
        {/* Step number pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: c.bright,
            background: c.bg,
            border: `1px solid ${c.border}`,
            padding: "4px 11px",
            borderRadius: "999px",
          }}
        >
          <span
            style={{
              width: "5px", height: "5px",
              borderRadius: "50%",
              background: c.base,
              flexShrink: 0,
              boxShadow: `0 0 5px ${c.base}`,
            }}
          />
          Step {index + 1}
        </div>

        {/* Icon */}
        <div
          style={{
            width: "42px", height: "42px",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
            background: hovered
              ? `linear-gradient(135deg, ${c.bg} 0%, rgba(255,255,255,.04) 100%)`
              : `linear-gradient(135deg, ${c.bg} 0%, rgba(255,255,255,.02) 100%)`,
            border: `1px solid ${hovered ? c.border : c.bg}`,
            transform: hovered ? "scale(1.12) rotate(-5deg)" : "scale(1) rotate(0deg)",
            transition:
              "transform .28s cubic-bezier(0.34,1.56,0.64,1), background .28s ease, border-color .28s ease",
            boxShadow: hovered ? `0 0 18px ${c.bg}` : "none",
          }}
        >
          {STEP_ICONS[index]}
        </div>
      </div>

      {/* Pipeline progress bar */}
      <PipelineBar total={STEPS.length} activeIndex={index} activeColor={c} />

      {/* Title */}
      <h3
        style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: ".07em",
          color: hovered ? c.bright : "#dde9dd",
          marginBottom: "10px",
          marginTop: 0,
          transition: "color .2s ease",
        }}
      >
        {step.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: "14.5px",
          color: "#5d785d",
          lineHeight: 1.74,
          margin: 0,
        }}
      >
        {step.description}
      </p>

      {/* Bottom expanding bar */}
      <div
        style={{
          marginTop: "18px",
          height: "3px",
          borderRadius: "999px",
          background: `linear-gradient(90deg, ${c.base}, ${c.bright})`,
          width: hovered ? "100%" : "24px",
          opacity: hovered ? 1 : 0.35,
          transition: "width .4s cubic-bezier(0.22,1,0.36,1), opacity .3s ease",
        }}
      />
    </div>
  );
}

function HowItWorksSection() {
  return (
    <div style={{ position: "relative" }}>

      {/* Section header */}
      <div style={{ marginBottom: "56px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "9px",
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "#c9a227",
            background: "rgba(201,162,39,.09)",
            border: "1px solid rgba(201,162,39,.26)",
            padding: "7px 16px",
            borderRadius: "2px",
            marginBottom: "20px",
            boxShadow: "0 0 18px rgba(201,162,39,.10), inset 0 0 10px rgba(201,162,39,.04)",
          }}
        >
          ⚔ Process Overview
        </div>

        <h2
          style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: "clamp(24px, 2.8vw, 40px)",
            fontWeight: 800,
            letterSpacing: ".04em",
            lineHeight: 1.17,
            color: "#dde9dd",
            marginBottom: "16px",
            marginTop: 0,
          }}
        >
          How{" "}
          <span
            style={{
              fontStyle: "italic",
              background:
                "linear-gradient(270deg, #c9a227, #f5d76e, #e8c547, #c9a227, #a87d1a, #e8c547, #c9a227)",
              backgroundSize: "400% 400%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmerGold 5s ease infinite",
            }}
          >
            RuralOps Works
          </span>
        </h2>

        <p
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: "17px",
            color: "#5d785d",
            lineHeight: 1.84,
            maxWidth: "540px",
            margin: 0,
          }}
        >
          RuralOps follows official administrative hierarchies to ensure
          accountability, transparency, and controlled access at every level —
          forming a complete closed-loop governance engine.
        </p>

        {/* Closed-loop indicator strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
            marginTop: "28px",
            maxWidth: "580px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {STEPS.map((s, i) => {
            const c = STEP_COLORS[i];
            const isLast = i === STEPS.length - 1;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <div
                    style={{
                      width: "28px", height: "28px",
                      borderRadius: "50%",
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px",
                      boxShadow: `0 0 8px ${c.bg}`,
                    }}
                  >
                    {STEP_ICONS[i]}
                  </div>
                  <span
                    style={{
                      fontFamily: "'Cinzel', Georgia, serif",
                      fontSize: "7px",
                      fontWeight: 700,
                      letterSpacing: ".06em",
                      color: c.bright,
                      opacity: .7,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {i + 1}
                  </span>
                </div>

                {/* Connector arrow */}
                {!isLast && (
                  <div
                    style={{
                      width: "22px", height: "1px",
                      background: `linear-gradient(90deg, ${c.border}, ${STEP_COLORS[i + 1].border})`,
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: "-1px", top: "-3px",
                        width: 0, height: 0,
                        borderTop: "3.5px solid transparent",
                        borderBottom: "3.5px solid transparent",
                        borderLeft: `5px solid ${STEP_COLORS[i + 1].border}`,
                      }}
                    />
                  </div>
                )}

                {/* Loop-back arrow on last item */}
                {isLast && (
                  <div
                    style={{
                      marginLeft: "6px",
                      fontFamily: "'Cinzel', Georgia, serif",
                      fontSize: "9px",
                      color: c.bright,
                      opacity: .6,
                    }}
                  >
                    ↺
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Steps grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {STEPS.map((step, index) => (
          <StepCard key={index} step={step} index={index} />
        ))}
      </div>
    </div>
  );
}

export default HowItWorksSection;