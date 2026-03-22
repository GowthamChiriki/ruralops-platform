import { useState } from "react";
import saoImg from "../assets/citizen-dashboard.png";
import daoImg from "../assets/citizen-dashboard.png";
import maoImg from "../assets/citizen-dashboard.png";
import vaoImg from "../assets/citizen-dashboard.png";
import workerImg from "../assets/citizen-dashboard.png";
import citizenImg from "../assets/citizen-dashboard.png";

const ROLE_COLORS = {
  MAO:     { base: "#7c5cfc", bright: "#a080ff", bg: "rgba(124,92,252,.12)",  border: "rgba(124,92,252,.26)"  },
  VAO:     { base: "#9e3328", bright: "#c84030", bg: "rgba(158,51,40,.12)",   border: "rgba(158,51,40,.26)"   },
  Worker:  { base: "#378a55", bright: "#52b874", bg: "rgba(55,138,85,.12)",   border: "rgba(55,138,85,.26)"   },
  Citizen: { base: "#c07818", bright: "#e8a830", bg: "rgba(192,120,24,.12)",  border: "rgba(192,120,24,.26)"  },
};

const DASHBOARDS = [
  { key: "MAO",     title: "MAO Dashboard",  image: maoImg,     description: "Mandal-level visibility into program health, village performance, and early risk signals."                  },
  { key: "VAO",     title: "VAO Dashboard",  image: vaoImg,     description: "Daily operational view for task coordination, reporting, and worker management at village level."           },
  { key: "Worker",  title: "Worker View",    image: workerImg,  description: "Simple, mobile-first interface for daily tasks, guidance, and reporting from the field."                    },
  { key: "Citizen", title: "Citizen Portal", image: citizenImg, description: "Transparent access to scheme status, benefits received, applications, and grievance tracking."             },
];

function DashCard({ dash }) {
  const [hovered, setHovered] = useState(false);
  const c = ROLE_COLORS[dash.key];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "linear-gradient(145deg, #0c1519 0%, #091014 100%)",
        border: `1px solid ${hovered ? c.border : "rgba(255,255,255,.07)"}`,
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        cursor: "default",
        transform: hovered ? "translateY(-7px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,.60), 0 0 28px ${c.bg}`
          : "0 2px 8px rgba(0,0,0,.65), 0 10px 28px rgba(0,0,0,.55)",
        transition: "transform .28s cubic-bezier(0.22,1,0.36,1), box-shadow .28s ease, border-color .28s ease",
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
          zIndex: 2,
        }}
      />

      {/* Role badge */}
      <div
        style={{
          position: "absolute",
          top: "10px", right: "12px",
          display: "inline-flex",
          alignItems: "center",
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: "8.5px",
          fontWeight: 700,
          letterSpacing: ".10em",
          textTransform: "uppercase",
          padding: "3px 10px",
          borderRadius: "999px",
          background: c.bg,
          border: `1px solid ${c.border}`,
          color: c.bright,
          zIndex: 3,
        }}
      >
        {dash.key}
      </div>

      {/* Image */}
      <div
        style={{
          width: "100%",
          background: "#060d10",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          overflow: "hidden",
        }}
      >
        <img
          src={dash.image}
          alt={`${dash.title} preview`}
          style={{
            width: "100%",
            display: "block",
            transform: hovered ? "scale(1.03)" : "scale(1)",
            transition: "transform .46s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>

      {/* Body */}
      <div style={{ padding: "18px 20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span
            style={{
              width: "7px", height: "7px",
              borderRadius: "50%",
              background: c.base,
              flexShrink: 0,
              boxShadow: `0 0 6px ${c.base}`,
            }}
          />
          <h3
            style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: ".07em",
              color: hovered ? c.bright : "#dde9dd",
              margin: 0,
              transition: "color .2s ease",
            }}
          >
            {dash.title}
          </h3>
        </div>

        <p
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: "14.5px",
            color: "#5d785d",
            lineHeight: 1.74,
            margin: 0,
          }}
        >
          {dash.description}
        </p>

        {/* Animated bottom bar */}
        <div
          style={{
            marginTop: "16px",
            height: "3px",
            borderRadius: "999px",
            background: `linear-gradient(90deg, ${c.base}, ${c.bright})`,
            width: hovered ? "100%" : "28px",
            opacity: hovered ? 1 : 0.4,
            transition: "width .4s cubic-bezier(0.22,1,0.36,1), opacity .3s ease",
          }}
        />
      </div>
    </div>
  );
}

function DashboardPreviewSection() {
  return (
    <div style={{ position: "relative" }}>

      {/* Section header — matches lp-section-header pattern */}
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
          ⚔ Role-Based Access
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
          Role-Based{" "}
          <span
            style={{
              display: "inline",
              fontStyle: "italic",
              background: "linear-gradient(270deg, #c9a227, #f5d76e, #e8c547, #c9a227, #a87d1a, #e8c547, #c9a227)",
              backgroundSize: "400% 400%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmerGold 5s ease infinite",
            }}
          >
            Dashboards
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
          Dashboards are tailored to administrative responsibility — from state and
          district oversight to village execution and citizen access. Views are available
          only to authorized roles after activation.
        </p>
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {DASHBOARDS.map((dash) => (
          <DashCard key={dash.key} dash={dash} />
        ))}
      </div>
    </div>
  );
}

export default DashboardPreviewSection;