import { useState } from "react";

/* ── Sovereign Earth role tokens ── */
const ROLE_STYLES = {
  MAO:      { accent: "var(--accent)",   sub: "var(--accent-sub)",  brd: "var(--accent-brd)",  glow: "rgba(180,154,90,0.12)"   },
  VAO:      { accent: "var(--danger)",   sub: "var(--danger-sub)",  brd: "var(--danger-brd)",  glow: "rgba(184,92,58,0.12)"    },
  Workers:  { accent: "var(--success)",  sub: "var(--success-sub)", brd: "var(--success-brd)", glow: "rgba(107,140,90,0.12)"   },
  Citizens: { accent: "var(--warn)",     sub: "var(--warn-sub)",    brd: "var(--warn-brd)",    glow: "rgba(196,154,58,0.12)"   },
};

const ROLES = [
  {
    key: "MAO",
    title: "MAO",
    subtitle: "Mandal Administrative Officer",
    icon: "🏛",
    description: "Mandal-level visibility, program health monitoring, and early risk detection across villages.",
    stats: [
      { label: "Villages",  value: "60+" },
      { label: "Programs",  value: "12"  },
      { label: "Risk Flags",value: "Live"},
    ],
  },
  {
    key: "VAO",
    title: "VAO",
    subtitle: "Village Administrative Officer",
    icon: "🏘",
    description: "Daily coordination, task oversight, worker management, and citizen approvals at village level.",
    stats: [
      { label: "Tasks/Day", value: "28"   },
      { label: "Workers",   value: "9"    },
      { label: "Approvals", value: "Live" },
    ],
  },
  {
    key: "Workers",
    title: "Field Workers",
    subtitle: "On-ground Staff",
    icon: "🌾",
    description: "Clear daily tasks, simple guidance, and easy progress reporting from the field.",
    stats: [
      { label: "Daily Tasks", value: "5"    },
      { label: "Offline",     value: "✓"    },
      { label: "Sync",        value: "Auto" },
    ],
  },
  {
    key: "Citizens",
    title: "Citizens",
    subtitle: "Public Beneficiaries",
    icon: "👤",
    description: "Transparency into schemes, benefit status, applications, and grievance tracking.",
    stats: [
      { label: "Schemes",    value: "3+"  },
      { label: "Grievances", value: "0"   },
      { label: "Status",     value: "Live"},
    ],
  },
];

/* ── Card ── */
function RoleCard({ role }) {
  const [hov, setHov] = useState(false);
  const s = ROLE_STYLES[role.key];

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${hov ? s.brd : "var(--border)"}`,
        borderRadius: "var(--r-lg)",
        padding: "28px",
        position: "relative", overflow: "hidden", cursor: "default",
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hov
          ? `var(--shadow-md), 0 0 0 3px ${s.sub}, 0 0 32px ${s.glow}`
          : "var(--shadow-xs)",
        transition:
          "transform 0.26s cubic-bezier(0.22,1,0.36,1), box-shadow 0.26s ease, border-color 0.22s ease",
      }}
    >
      {/* top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(90deg, ${s.accent}, transparent)`,
        opacity: hov ? 1 : 0, transition: "opacity 0.3s ease",
      }}/>

      {/* icon + badge */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "20px",
      }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "var(--r-md)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px",
          background: hov ? s.sub : "var(--bg-subtle)",
          border: `1px solid ${hov ? s.brd : "var(--border)"}`,
          transform: hov ? "scale(1.10) rotate(-5deg)" : "scale(1) rotate(0deg)",
          transition:
            "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, border-color 0.2s ease",
        }}>
          {role.icon}
        </div>

        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase",
          color: s.accent, background: s.sub, border: `1px solid ${s.brd}`,
          padding: "3px 10px", borderRadius: "100px",
        }}>
          {role.title}
        </span>
      </div>

      <h3 style={{
        fontFamily: "var(--font-head)",
        fontSize: "18px", fontWeight: 800, letterSpacing: "-0.03em",
        color: "var(--text-1)", marginBottom: "4px",
      }}>
        {role.title}
      </h3>
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px", fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase",
        color: "var(--text-3)", marginBottom: "14px",
      }}>
        {role.subtitle}
      </p>

      <p style={{
        fontSize: "13.5px", color: "var(--text-2)", lineHeight: 1.68,
        fontWeight: 300, marginBottom: "22px",
      }}>
        {role.description}
      </p>

      {/* stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px",
        paddingTop: "16px", borderTop: "1px solid var(--border)",
      }}>
        {role.stats.map((stat) => (
          <div key={stat.label} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
            padding: "10px 4px",
            background: hov ? s.sub : "var(--bg-subtle)",
            border: `1px solid ${hov ? s.brd : "var(--border)"}`,
            borderRadius: "var(--r-md)",
            transition: "background 0.2s ease, border-color 0.2s ease",
          }}>
            <span style={{
              fontFamily: "var(--font-head)",
              fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em",
              color: hov ? s.accent : "var(--text-1)", lineHeight: 1,
              transition: "color 0.2s ease",
            }}>
              {stat.value}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "8px", fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase",
              color: "var(--text-3)", lineHeight: 1,
            }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Section ── */
function RolesSection() {
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
          Administrative Hierarchy
        </div>

        <h2 style={{
          fontFamily: "var(--font-head)",
          fontSize: "clamp(28px,3.2vw,44px)", fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.05, color: "var(--text-1)", marginBottom: "16px", marginTop: 0,
        }}>
          Built for{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 60%, var(--accent) 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            every role
          </span>
        </h2>

        <p style={{
          fontSize: "15.5px", color: "var(--text-2)", lineHeight: 1.75,
          maxWidth: "520px", fontWeight: 300,
        }}>
          RuralOps supports the full operational hierarchy — from mandal oversight
          to village execution and citizen participation.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "16px",
        width: "100%",
      }}>
        {ROLES.map((role) => <RoleCard key={role.key} role={role} />)}
      </div>
    </div>
  );
}

export default RolesSection;