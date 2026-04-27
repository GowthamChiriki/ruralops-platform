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

/* ── Card ── */
function ProblemCard({ problem, index }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${hov ? "var(--danger-brd)" : "var(--border)"}`,
        borderRadius: "var(--r-lg)",
        padding: "28px",
        position: "relative", overflow: "hidden", cursor: "default",
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hov
          ? "var(--shadow-md), 0 0 0 3px var(--danger-sub), 0 0 32px rgba(184,92,58,0.10)"
          : "var(--shadow-xs)",
        transition:
          "transform 0.26s cubic-bezier(0.22,1,0.36,1), box-shadow 0.26s ease, border-color 0.22s ease",
      }}
    >
      {/* top accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, var(--danger), transparent)",
        opacity: hov ? 0.85 : 0, transition: "opacity 0.3s ease",
      }}/>

      {/* icon + index */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", marginBottom: "20px",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "var(--r-md)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px",
          background: hov ? "var(--danger-sub)" : "var(--bg-subtle)",
          border: `1px solid ${hov ? "var(--danger-brd)" : "var(--border)"}`,
          transform: hov ? "scale(1.10) rotate(-4deg)" : "scale(1) rotate(0deg)",
          transition:
            "transform 0.26s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, border-color 0.2s ease",
        }}>
          {problem.icon}
        </div>

        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em",
          color: "var(--danger)",
          background: "var(--danger-sub)",
          border: "1px solid var(--danger-brd)",
          padding: "3px 9px", borderRadius: "100px",
          opacity: hov ? 1 : 0.6,
          transition: "opacity 0.2s ease",
        }}>
          #{String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h3 style={{
        fontFamily: "var(--font-head)",
        fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em",
        color: "var(--text-1)", marginBottom: "10px",
      }}>
        {problem.title}
      </h3>

      <p style={{
        fontSize: "13.5px", color: "var(--text-2)", lineHeight: 1.68,
        fontWeight: 300, marginBottom: "16px",
      }}>
        {problem.description}
      </p>

      <p style={{
        fontFamily: "var(--font-body)",
        fontSize: "12.5px", fontStyle: "italic",
        color: hov ? "var(--text-2)" : "var(--text-3)",
        lineHeight: 1.6,
        paddingLeft: "12px",
        borderLeft: `2px solid ${hov ? "var(--danger)" : "var(--border)"}`,
        transition: "color 0.2s ease, border-color 0.22s ease",
      }}>
        {problem.quote}
      </p>
    </div>
  );
}

/* ── Section ── */
export default function ProblemSection() {
  return (
    <div style={{ position: "relative", width: "100%" }}>

      {/* header */}
      <div style={{ marginBottom: "56px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          fontFamily: "var(--font-mono)",
          fontSize: "10px", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase",
          color: "var(--danger)",
          background: "var(--danger-sub)",
          border: "1px solid var(--danger-brd)",
          padding: "5px 13px", borderRadius: "100px",
          marginBottom: "22px",
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "var(--danger)",
            animation: "breathe 2s ease infinite",
            flexShrink: 0,
          }}/>
          The Problem
        </div>

        <h2 style={{
          fontFamily: "var(--font-head)",
          fontSize: "clamp(28px,3.2vw,44px)", fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.05, color: "var(--text-1)", marginBottom: "16px", marginTop: 0,
          maxWidth: "680px",
        }}>
          Rural programs are complex.{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--danger), #e07840)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Coordination failures make them fragile.
          </span>
        </h2>

        <p style={{
          fontSize: "15.5px", color: "var(--text-2)", lineHeight: 1.75,
          maxWidth: "600px", fontWeight: 300, marginBottom: "24px",
        }}>
          Across rural governance and development initiatives, challenges rarely arise
          from lack of intent or effort. They arise when information is delayed,
          fragmented, or unavailable at the moment decisions need to be made.
        </p>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "9px",
          padding: "10px 16px",
          background: "var(--danger-sub)",
          border: "1px solid var(--danger-brd)",
          borderRadius: "var(--r-md)",
          fontFamily: "var(--font-mono)",
          fontSize: "10px", fontWeight: 500,
          letterSpacing: "0.04em",
          color: "var(--danger)",
        }}>
          <span>⚠</span>
          Each problem compounds the next — left unaddressed, they become systemic
        </div>
      </div>

      {/* grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px",
        width: "100%",
      }}>
        {PROBLEMS.map((p, i) => <ProblemCard key={p.title} problem={p} index={i} />)}
      </div>
    </div>
  );
}