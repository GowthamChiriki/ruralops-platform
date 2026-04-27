import { useState } from "react";

const STEP_ICONS = ["⚙️", "✅", "🔑", "🛡", "📊", "📢", "🔍", "🚀"];

const STEPS = [
  { title: "Provisioning & Registration",  description: "Administrative accounts are provisioned by authority. Citizens may self-register, but no access is granted yet." },
  { title: "Approval & Verification",       description: "Citizen records are reviewed and approved by village administration before becoming official." },
  { title: "Secure Activation",             description: "Approved users activate accounts using a secure, one-time key and set credentials." },
  { title: "Role-Based Access",             description: "Each user sees only what their role permits — from state oversight to village execution." },
  { title: "Monitoring & Intervention",     description: "Progress, delays, and risks are surfaced early so support and intervention happen on time." },
  { title: "Citizen Feedback Loop",         description: "Citizens and workers submit feedback, complaints, and suggestions which become actionable signals." },
  { title: "Auditing & Accountability",     description: "All actions are logged and auditable, ensuring transparency and responsibility across every level." },
  { title: "Policy Improvement",            description: "Insights from field data guide improvements to workflows, policies, and resource allocation." },
];

/* ── Card ── */
function StepCard({ step, index }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${hov ? "var(--accent-brd)" : "var(--border)"}`,
        borderRadius: "var(--r-lg)",
        padding: "26px",
        position: "relative", overflow: "hidden", cursor: "default",
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hov
          ? "var(--shadow-md), 0 0 0 3px var(--accent-sub), 0 0 32px rgba(180,154,90,0.10)"
          : "var(--shadow-xs)",
        transition:
          "transform 0.26s cubic-bezier(0.22,1,0.36,1), box-shadow 0.26s ease, border-color 0.22s ease",
      }}
    >
      {/* top accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, var(--accent), var(--accent-2), transparent)",
        opacity: hov ? 1 : 0, transition: "opacity 0.3s ease",
      }}/>

      {/* step pill + icon */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "18px",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase",
          color: "var(--accent-text)",
          background: "var(--accent-sub)",
          border: "1px solid var(--accent-brd)",
          padding: "3px 10px", borderRadius: "100px",
        }}>
          Step {index + 1}
        </span>

        <div style={{
          width: "42px", height: "42px", borderRadius: "var(--r-md)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px",
          background: hov ? "var(--accent-sub)" : "var(--bg-subtle)",
          border: `1px solid ${hov ? "var(--accent-brd)" : "var(--border)"}`,
          transform: hov ? "scale(1.12) rotate(-6deg)" : "scale(1) rotate(0deg)",
          transition:
            "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, border-color 0.2s ease",
        }}>
          {STEP_ICONS[index]}
        </div>
      </div>

      {/* progress bar — 8 segments */}
      <div style={{ display: "flex", gap: "3px", marginBottom: "18px" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            height: "2px",
            flex: i === index ? 3 : 1,
            borderRadius: "999px",
            background: i < index
              ? "var(--accent)"
              : i === index
              ? "linear-gradient(90deg, var(--accent), var(--accent-2))"
              : "var(--border)",
            transition: "flex 0.3s ease",
          }}/>
        ))}
      </div>

      <h3 style={{
        fontFamily: "var(--font-head)",
        fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em",
        color: "var(--text-1)", marginBottom: "10px",
      }}>
        {step.title}
      </h3>

      <p style={{
        fontSize: "13.5px", color: "var(--text-2)", lineHeight: 1.68, fontWeight: 300,
      }}>
        {step.description}
      </p>
    </div>
  );
}

/* ── Section ── */
function HowItWorksSection() {
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
          Process Overview
        </div>

        <h2 style={{
          fontFamily: "var(--font-head)",
          fontSize: "clamp(28px,3.2vw,44px)", fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.05, color: "var(--text-1)", marginBottom: "16px", marginTop: 0,
        }}>
          How{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 60%, var(--accent) 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            RuralOps works
          </span>
        </h2>

        <p style={{
          fontSize: "15.5px", color: "var(--text-2)", lineHeight: 1.75,
          maxWidth: "540px", fontWeight: 300,
        }}>
          RuralOps follows official administrative hierarchies to ensure
          accountability, transparency, and controlled access at every level —
          forming a complete closed-loop governance engine.
        </p>

        {/* step flow strip */}
        <div style={{
          display: "flex", alignItems: "center",
          marginTop: "32px", maxWidth: "620px",
          overflowX: "auto", paddingBottom: "6px",
          gap: 0,
        }}>
          {STEPS.map((s, i) => {
            const isLast = i === STEPS.length - 1;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "5px",
                }}>
                  <div style={{
                    width: "30px", height: "30px", borderRadius: "50%",
                    background: "var(--accent-sub)", border: "1px solid var(--accent-brd)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px",
                  }}>
                    {STEP_ICONS[i]}
                  </div>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "8px", fontWeight: 600,
                    color: "var(--accent-text)", opacity: 0.65,
                    letterSpacing: "0.06em",
                  }}>
                    {i + 1}
                  </span>
                </div>
                {!isLast && (
                  <div style={{
                    width: "22px", height: "1px",
                    background: "linear-gradient(90deg, var(--accent-brd), var(--border))",
                    position: "relative", flexShrink: 0,
                  }}>
                    <div style={{
                      position: "absolute", right: "-1px", top: "-3px",
                      width: 0, height: 0,
                      borderTop: "3px solid transparent",
                      borderBottom: "3px solid transparent",
                      borderLeft: "5px solid var(--accent-brd)",
                    }}/>
                  </div>
                )}
                {isLast && (
                  <div style={{
                    marginLeft: "7px",
                    fontFamily: "var(--font-mono)", fontSize: "11px",
                    color: "var(--accent-text)", opacity: 0.5,
                  }}>↺</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "16px",
        width: "100%",
      }}>
        {STEPS.map((step, index) => (
          <StepCard key={index} step={step} index={index} />
        ))}
      </div>
    </div>
  );
}

export default HowItWorksSection;