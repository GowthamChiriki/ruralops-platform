import { useState } from "react";

const ROLE_COLORS = {
  MAO:     { base: "#7c5cfc", bright: "#a080ff", bg: "rgba(124,92,252,.12)", border: "rgba(124,92,252,.26)" },
  VAO:     { base: "#9e3328", bright: "#c84030", bg: "rgba(158,51,40,.12)",  border: "rgba(158,51,40,.26)"  },
  Workers: { base: "#378a55", bright: "#52b874", bg: "rgba(55,138,85,.12)",  border: "rgba(55,138,85,.26)"  },
  Citizens:{ base: "#c07818", bright: "#e8a830", bg: "rgba(192,120,24,.12)", border: "rgba(192,120,24,.26)" },
};

const ROLES = [
  {
    key: "MAO",
    title: "MAO",
    subtitle: "Mandal Administrative Officer",
    icon: "🏛",
    description:
      "Mandal-level visibility, program health monitoring, and early risk detection across villages.",
    stats: [
      { label: "Villages", value: "60+" },
      { label: "Programs", value: "12"  },
      { label: "Risk Flags", value: "Live" },
    ],
  },
  {
    key: "VAO",
    title: "VAO",
    subtitle: "Village Administrative Officer",
    icon: "🏘",
    description:
      "Daily coordination, task oversight, worker management, and citizen approvals at village level.",
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
    description:
      "Clear daily tasks, simple guidance, and easy progress reporting from the field. Make villages undisputed.",
    stats: [
      { label: "Daily Tasks", value: "5"      },
      { label: "Offline",     value: "✓"      },
      { label: "Sync",        value: "Auto"   },
    ],
  },
  {
    key: "Citizens",
    title: "Citizens",
    subtitle: "Public Beneficiaries",
    icon: "👤",
    description:
      "Transparency into schemes, benefit status, applications, and grievance tracking.",
    stats: [
      { label: "Schemes",    value: "3+"  },
      { label: "Grievances", value: "0"   },
      { label: "Status",     value: "Live"},
    ],
  },
];

function RoleCard({ role }) {
  const [hovered, setHovered] = useState(false);
  const c = ROLE_COLORS[role.key];

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

      {/* Icon + badge row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "48px", height: "48px",
            borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px",
            background: hovered
              ? `linear-gradient(135deg, ${c.bg.replace(".12", ".22")} 0%, ${c.bg.replace(".12", ".08")} 100%)`
              : `linear-gradient(135deg, ${c.bg} 0%, ${c.bg.replace(".12", ".04")} 100%)`,
            border: `1px solid ${hovered ? c.border : c.bg}`,
            transform: hovered ? "scale(1.12) rotate(-4deg)" : "scale(1) rotate(0deg)",
            transition:
              "transform .28s cubic-bezier(0.34,1.56,0.64,1), background .28s ease, border-color .28s ease",
            boxShadow: hovered ? `0 0 20px ${c.bg}` : "none",
          }}
        >
          {role.icon}
        </div>

        {/* Role badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: ".12em",
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
          {role.title}
        </div>
      </div>

      {/* Title + subtitle */}
      <h3
        style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: ".06em",
          color: hovered ? c.bright : "#dde9dd",
          margin: "0 0 5px",
          transition: "color .2s ease",
        }}
      >
        {role.title}
      </h3>
      <p
        style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: "9.5px",
          fontWeight: 600,
          letterSpacing: ".10em",
          textTransform: "uppercase",
          color: "#394e39",
          margin: "0 0 14px",
        }}
      >
        {role.subtitle}
      </p>

      {/* Description */}
      <p
        style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: "14.5px",
          color: "#5d785d",
          lineHeight: 1.74,
          margin: "0 0 20px",
        }}
      >
        {role.description}
      </p>

      {/* Stats strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          paddingTop: "16px",
          borderTop: "1px solid rgba(255,255,255,.05)",
        }}
      >
        {role.stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "8px 4px",
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: "7px",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: "13px",
                fontWeight: 800,
                color: c.bright,
                lineHeight: 1,
              }}
            >
              {stat.value}
            </span>
            <span
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: "7.5px",
                fontWeight: 600,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: c.base,
                lineHeight: 1,
              }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
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

function RolesSection() {
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
          ⚔ Administrative Hierarchy
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
          Built for{" "}
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
            Every Role
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
          RuralOps supports the operational hierarchy — from mandal oversight
          to village execution and citizen participation.
        </p>
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {ROLES.map((role) => (
          <RoleCard key={role.key} role={role} />
        ))}
      </div>
    </div>
  );
}

export default RolesSection;