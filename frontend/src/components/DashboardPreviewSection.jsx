import { useState } from "react";
import saoImg from "../assets/citizen-dashboard.png";
import daoImg from "../assets/citizen-dashboard.png";
import maoImg from "../assets/citizen-dashboard.png";
import vaoImg from "../assets/citizen-dashboard.png";
import workerImg from "../assets/citizen-dashboard.png";
import citizenImg from "../assets/citizen-dashboard.png";

/* ── Sovereign Earth role tokens ── */
const ROLE_STYLES = {
  MAO:     {
    color: "var(--accent)",
    sub:   "var(--accent-sub)",
    brd:   "var(--accent-brd)",
    glow:  "rgba(180,154,90,0.14)",
  },
  VAO:     {
    color: "var(--danger)",
    sub:   "var(--danger-sub)",
    brd:   "var(--danger-brd)",
    glow:  "rgba(184,92,58,0.14)",
  },
  Worker:  {
    color: "var(--success)",
    sub:   "var(--success-sub)",
    brd:   "var(--success-brd)",
    glow:  "rgba(107,140,90,0.14)",
  },
  Citizen: {
    color: "var(--warn)",
    sub:   "var(--warn-sub)",
    brd:   "var(--warn-brd)",
    glow:  "rgba(196,154,58,0.14)",
  },
};

const DASHBOARDS = [
  {
    key: "MAO",
    title: "MAO Dashboard",
    image: maoImg,
    description: "Mandal-level visibility into program health, village performance, and early risk signals.",
  },
  {
    key: "VAO",
    title: "VAO Dashboard",
    image: vaoImg,
    description: "Daily operational view for task coordination, reporting, and worker management at village level.",
  },
  {
    key: "Worker",
    title: "Worker View",
    image: workerImg,
    description: "Simple, mobile-first interface for daily tasks, guidance, and reporting from the field.",
  },
  {
    key: "Citizen",
    title: "Citizen Portal",
    image: citizenImg,
    description: "Transparent access to scheme status, benefits received, applications, and grievance tracking.",
  },
];

/* ── Card ── */
function DashCard({ dash }) {
  const [hov, setHov] = useState(false);
  const s = ROLE_STYLES[dash.key];

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${hov ? s.brd : "var(--border)"}`,
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        position: "relative",
        cursor: "default",
        transform: hov ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hov
          ? `var(--shadow-lg), 0 0 0 3px ${s.sub}, 0 0 40px ${s.glow}`
          : "var(--shadow-sm)",
        transition:
          "transform 0.30s cubic-bezier(0.22,1,0.36,1), box-shadow 0.30s ease, border-color 0.22s ease",
      }}
    >
      {/* top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(90deg, ${s.color}, transparent)`,
        opacity: hov ? 1 : 0,
        transition: "opacity 0.3s ease",
        zIndex: 2,
      }}/>

      {/* role badge */}
      <div style={{
        position: "absolute", top: "13px", right: "14px",
        fontFamily: "var(--font-mono)",
        fontSize: "9px", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase",
        color: s.color, background: s.sub, border: `1px solid ${s.brd}`,
        padding: "3px 10px", borderRadius: "100px", zIndex: 3,
      }}>
        {dash.key}
      </div>

      {/* image */}
      <div style={{
        background: "var(--bg-subtle)",
        borderBottom: `1px solid var(--border)`,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* field-map grid over image */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(180,154,90,0.04) 19px, rgba(180,154,90,0.04) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(180,154,90,0.04) 19px, rgba(180,154,90,0.04) 20px)",
          pointerEvents: "none",
        }}/>
        <img
          src={dash.image}
          alt={`${dash.title} preview`}
          style={{
            width: "100%", display: "block",
            transform: hov ? "scale(1.04)" : "scale(1)",
            transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>

      {/* body */}
      <div style={{ padding: "22px 24px 26px" }}>
        <h3 style={{
          fontFamily: "var(--font-head)",
          fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em",
          color: "var(--text-1)", marginBottom: "9px",
        }}>
          {dash.title}
        </h3>
        <p style={{
          fontSize: "13.5px", color: "var(--text-2)", lineHeight: 1.65,
          fontWeight: 300, margin: 0,
        }}>
          {dash.description}
        </p>

        {/* animated underline */}
        <div style={{
          marginTop: "18px", height: "1.5px", borderRadius: "999px",
          background: `linear-gradient(90deg, ${s.color}, transparent)`,
          transform: hov ? "scaleX(1)" : "scaleX(0.10)",
          transformOrigin: "left",
          opacity: hov ? 0.8 : 0.2,
          transition:
            "transform 0.40s cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease",
        }}/>
      </div>
    </div>
  );
}

/* ── Section ── */
function DashboardPreviewSection() {
  return (
    <div style={{ position: "relative", width: "100%" }}>

      {/* header */}
      <div style={{ marginBottom: "56px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          fontFamily: "var(--font-mono)",
          fontSize: "10px", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase",
          color: "var(--accent-text)", background: "var(--accent-sub)", border: "1px solid var(--accent-brd)",
          padding: "5px 13px", borderRadius: "100px", marginBottom: "22px",
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }}/>
          Role-Based Access
        </div>

        <h2 style={{
          fontFamily: "var(--font-head)",
          fontSize: "clamp(28px,3.2vw,44px)", fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.05, color: "var(--text-1)", marginBottom: "16px", marginTop: 0,
        }}>
          Role-based{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 60%, var(--accent) 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            dashboards
          </span>
        </h2>

        <p style={{
          fontSize: "15.5px", color: "var(--text-2)", lineHeight: 1.75,
          maxWidth: "520px", fontWeight: 300,
        }}>
          Dashboards are tailored to administrative responsibility — from district oversight
          to village execution and citizen access. Views are available only to authorized
          roles after activation.
        </p>
      </div>

      {/* grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px",
        width: "100%",
      }}>
        {DASHBOARDS.map((dash) => <DashCard key={dash.key} dash={dash} />)}
      </div>
    </div>
  );
}

export default DashboardPreviewSection;