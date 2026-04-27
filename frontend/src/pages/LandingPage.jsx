import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import SystemIntroSection from "../components/SystemIntroSection";
import RolesSection from "../components/RolesSection";
import ProblemSection from "../components/ProblemSection";
import HowItWorksSection from "../components/HowItWorksSection";
import DesignPromisesSection from "../components/DesignPromisesSection";
import Footer from "../components/Footer";

/* ─── STATIC DATA — unchanged ─── */
const STATS = [
  { value: "45,400+", label: "Villages Connected"  },
  { value: "9.2M",    label: "Citizens Registered" },
  { value: "98.4%",   label: "Uptime SLA"          },
  { value: "814+",    label: "Districts Deployed"  },
];

const TRUST_LOGOS = [
  { name: "Govt. of Telangana",      abbr: "GoT"  },
  { name: "Govt. of Andhra Pradesh", abbr: "GoAP" },
  { name: "Ministry of Rural Dev.",  abbr: "MoRD" },
  { name: "NABARD",                  abbr: "NAB"  },
  { name: "National Informatics",    abbr: "NIC"  },
  { name: "Digital India Corp.",     abbr: "DIC"  },
  { name: "Govt. of India",          abbr: "GoI"  },
];

const FEATURE_HIGHLIGHTS = [
  { icon: "01", title: "Role-Based Access Control",  desc: "Every officer, field worker, and administrator gets precisely scoped access — no more, no less." },
  { icon: "02", title: "Real-Time Field Sync",       desc: "Data from VAO inspections and citizen submissions reaches district dashboards within seconds." },
  { icon: "03", title: "Village-Level Analytics",    desc: "Aggregated health scores, scheme enrollment gaps, and grievance trends — all in one command view." },
  { icon: "04", title: "Works Offline Too",          desc: "Field staff can collect data in low-connectivity areas. Syncs automatically when network is restored." },
  { icon: "05", title: "Escalation Alerts",          desc: "Critical cases — overdue grievances, unassigned VAOs, crisis villages — surface automatically." },
  { icon: "06", title: "Scheme Compliance Engine",   desc: "Tracks enrollment, disbursement, and eligibility coverage across all active government schemes." },
];

const TESTIMONIALS = [
  { quote: "RuralOps gave our district administration real visibility for the first time. Grievances that used to linger for weeks are now tracked and resolved within days.", name: "District Administrator", role: "Warangal District, Telangana", initial: "DA" },
  { quote: "Being able to see scheme enrollment gaps across all villages in one screen — that's a capability we couldn't have imagined two years ago.", name: "District Administrator", role: "Visakhapatnam District, Andhra Pradesh", initial: "DA" },
  { quote: "The inspection workflow is simple and fast. I can submit VAO reports directly from the field, even without connectivity, and they sync the moment I'm back in range.", name: "Village Officer", role: "Mandal Revenue Office, Karimnagar", initial: "VO" },
  { quote: "Every village record is digital, every update is instant, and nothing slips through because of missing paperwork.", name: "Village Officer", role: "Gram Panchayat, Guntur District", initial: "VO" },
  { quote: "The offline sync feature changed everything for us. I collect data in remote areas all day and it all uploads automatically once I reach the mandal office.", name: "Field Worker", role: "MGNREGS Supervisor, Nalgonda", initial: "FW" },
  { quote: "I registered my family for PM Awas in under ten minutes and tracked the approval right from my phone. Zero office visits required.", name: "Citizen User", role: "PM Awas Beneficiary, Medak District", initial: "CU" },
];

const TICKER_ITEMS = [
  { state: "Telangana",      text: "6,400 villages — field sync completed",         status: "ok"   },
  { state: "Andhra Pradesh", text: "Grievance #GV-2041 resolved — Karimnagar",      status: "ok"   },
  { state: "Maharashtra",    text: "VAO inspection completed — 24 villages",        status: "ok"   },
  { state: "Rajasthan",      text: "348 new citizen registrations processed today", status: "ok"   },
  { state: "Uttar Pradesh",  text: "Escalation raised — PM Awas delay, Medak",     status: "warn" },
  { state: "Karnataka",      text: "District collector reviewed 6 pending approvals",status: "ok"  },
  { state: "Tamil Nadu",     text: "Scheme compliance score updated — 94.2%",      status: "ok"   },
  { state: "West Bengal",    text: "Grievance portal login spike — 1,240 sessions", status: "info" },
  { state: "Madhya Pradesh", text: "PM Kisan disbursement verified — 4,200 farmers",status: "ok"  },
  { state: "Punjab",         text: "Crop survey submitted — 6 villages, Ludhiana", status: "ok"   },
  { state: "Bihar",          text: "Overdue grievances flagged — 18 cases escalated",status: "warn"},
  { state: "Kerala",         text: "Health scheme enrollment hit 98% coverage",    status: "ok"   },
];

/* ─── THEME HOOK ─── */
function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ruralops-theme") === "dark" ||
        (!localStorage.getItem("ruralops-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("ruralops-theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, setDark];
}

/* ─── ANIMATED COUNTER ─── */
function useCountUp(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    const numeric = parseFloat(target.replace(/[^0-9.]/g, ""));
    if (isNaN(numeric)) { setVal(target); return; }
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(eased * numeric);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return val;
}

function StatCard({ value, label, inView }) {
  const suffix = value.replace(/[0-9.,]/g, "");
  const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
  const counted = useCountUp(value, 1600, inView);
  const display = isNaN(numeric) ? value :
    (value.includes(".") ? counted.toFixed(1) + suffix : Math.round(counted).toLocaleString() + suffix);
  return (
    <div className="ro-stat">
      <span className="ro-stat-val">{display}</span>
      <span className="ro-stat-lbl">{label}</span>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useTheme();
  const statsRef = useRef(null);
  const [statsInView, setStatsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsInView(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@300;400;500;600&display=swap');

        /* ══════════════════════════════════════════
           LIGHT MODE — BizLink-inspired: Clean white, deep navy sidebar, crisp borders
        ══════════════════════════════════════════ */
        :root,
        [data-theme="light"] {
          --bg:            #f4f5f7;
          --bg-0:          #ffffff;
          --bg-1:          #f9fafb;
          --bg-card:       #ffffff;
          --bg-elevated:   #f0f2f5;
          --bg-sidebar:    #1a1d23;
          --bg-glass:      rgba(255,255,255,0.96);

          --border:        #e5e7eb;
          --border-med:    #d1d5db;
          --border-strong: #9ca3af;

          --text-1:   #111827;
          --text-2:   #374151;
          --text-3:   #6b7280;
          --text-4:   #9ca3af;
          --text-inv: #ffffff;

          /* Primary — deep navy/indigo like BizLink's dark button */
          --accent:       #1a1d23;
          --accent-mid:   #252830;
          --accent-light: #2d3139;
          --accent-dim:   #374151;
          --accent-sub:   rgba(26,29,35,0.05);
          --accent-brd:   rgba(26,29,35,0.12);
          --accent-text:  #1a1d23;
          --accent-glow:  rgba(26,29,35,0.08);
          --accent-glow2: rgba(26,29,35,0.04);

          /* Green — status / success only */
          --green:        #10b981;
          --green-sub:    rgba(16,185,129,0.08);
          --green-brd:    rgba(16,185,129,0.2);
          --green-text:   #059669;

          /* Semantic */
          --warn:         #f59e0b;
          --warn-sub:     rgba(245,158,11,0.08);
          --danger:       #ef4444;
          --danger-sub:   rgba(239,68,68,0.08);
          --success:      #10b981;
          --success-sub:  rgba(16,185,129,0.08);
          --info:         #3b82f6;
          --info-sub:     rgba(59,130,246,0.08);

          --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04);
          --shadow-lg: 0 10px 15px rgba(0,0,0,0.07), 0 4px 6px rgba(0,0,0,0.05);
          --shadow-xl: 0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04);
          --shadow-2xl:0 25px 50px rgba(0,0,0,0.12);
          --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);

          --r-xs:   3px;
          --r-sm:   6px;
          --r-md:   8px;
          --r-lg:   12px;
          --r-xl:   16px;
          --r-2xl:  20px;
          --r-3xl:  24px;
          --r-pill: 9999px;

          --font-display: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
          --font-body:    'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
          --font-mono:    'Geist Mono', 'SF Mono', monospace;

          --ease:        cubic-bezier(0.16,1,0.3,1);
          --ease-spring: cubic-bezier(0.34,1.56,0.64,1);
          --ease-out:    cubic-bezier(0.16,1,0.3,1);
        }

        /* ══════════════════════════════════════════
           DARK MODE — Pure black/white inverse of light mode. Zero color tints.
        ══════════════════════════════════════════ */
        [data-theme="dark"] {
          --bg:            #0a0a0a;
          --bg-0:          #111111;
          --bg-1:          #141414;
          --bg-card:       #161616;
          --bg-elevated:   #1e1e1e;
          --bg-sidebar:    #000000;
          --bg-glass:      rgba(16,16,16,0.97);

          --border:        rgba(255,255,255,0.08);
          --border-med:    rgba(255,255,255,0.13);
          --border-strong: rgba(255,255,255,0.22);

          --text-1:   #f5f5f5;
          --text-2:   #a3a3a3;
          --text-3:   #525252;
          --text-4:   #303030;
          --text-inv: #0a0a0a;

          --accent:       #f5f5f5;
          --accent-mid:   #e5e5e5;
          --accent-light: #ffffff;
          --accent-dim:   #a3a3a3;
          --accent-sub:   rgba(245,245,245,0.05);
          --accent-brd:   rgba(245,245,245,0.10);
          --accent-text:  #f5f5f5;
          --accent-glow:  rgba(245,245,245,0.04);
          --accent-glow2: rgba(245,245,245,0.02);

          --green:        #22c55e;
          --green-sub:    rgba(34,197,94,0.08);
          --green-brd:    rgba(34,197,94,0.18);
          --green-text:   #22c55e;

          --warn:         #eab308;
          --warn-sub:     rgba(234,179,8,0.08);
          --danger:       #ef4444;
          --danger-sub:   rgba(239,68,68,0.08);
          --success:      #22c55e;
          --success-sub:  rgba(34,197,94,0.08);
          --info:         #a3a3a3;
          --info-sub:     rgba(163,163,163,0.08);

          --shadow-xs: 0 1px 2px rgba(0,0,0,0.6);
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.6);
          --shadow-md: 0 4px 6px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.6);
          --shadow-lg: 0 10px 15px rgba(0,0,0,0.8), 0 4px 6px rgba(0,0,0,0.6);
          --shadow-xl: 0 20px 25px rgba(0,0,0,0.85), 0 8px 10px rgba(0,0,0,0.7);
          --shadow-2xl:0 25px 50px rgba(0,0,0,0.9);
          --shadow-card: 0 1px 3px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.6);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ══════════════════════════════════════════
           BASE PAGE
        ══════════════════════════════════════════ */
        .ro-page {
          background: var(--bg);
          color: var(--text-1);
          font-family: var(--font-body);
          font-size: 14px;
          line-height: 1.5;
          overflow-x: hidden;
          transition: background 0.3s var(--ease), color 0.3s var(--ease);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ══════════════════════════════════════════
           THEME TOGGLE — Clean pill button
        ══════════════════════════════════════════ */
        .ro-theme-toggle {
          position: fixed;
          bottom: 24px; right: 24px; z-index: 1000;
          height: 36px;
          padding: 0 14px;
          border-radius: var(--r-pill);
          background: var(--bg-card);
          border: 1px solid var(--border-med);
          color: var(--text-3);
          cursor: pointer;
          display: flex; align-items: center; gap: 7px;
          box-shadow: var(--shadow-lg);
          transition: all 0.2s var(--ease);
          font-family: var(--font-body);
          font-size: 12px; font-weight: 500;
          white-space: nowrap;
        }
        .ro-theme-toggle:hover {
          color: var(--text-1);
          border-color: var(--border-strong);
          box-shadow: var(--shadow-xl);
          transform: translateY(-1px);
        }

        /* ══════════════════════════════════════════
           HERO
        ══════════════════════════════════════════ */
        .ro-hero {
          position: relative;
          min-height: 92vh;
          padding: 72px 56px 60px;
          display: flex; align-items: center;
          max-width: 1440px; margin: 0 auto;
          gap: 72px;
        }

        .ro-hero-left {
          flex: 1; min-width: 0;
          animation: heroUp 0.7s var(--ease-out) both;
        }
        .ro-hero-right {
          flex: 1.2; min-width: 0;
          animation: heroUp 0.7s 0.1s var(--ease-out) both;
        }

        @keyframes heroUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Status badge */
        .ro-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-mono);
          font-size: 11px; font-weight: 400;
          color: var(--green-text);
          background: var(--green-sub);
          border: 1px solid var(--green-brd);
          padding: 4px 12px;
          border-radius: var(--r-pill);
          margin-bottom: 28px;
          letter-spacing: 0.02em;
        }
        .ro-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--green); flex-shrink: 0;
          animation: pulseGlow 2.5s ease infinite;
        }
        @keyframes pulseGlow {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }

        /* H1 */
        .ro-hero-h1 {
          font-family: var(--font-display);
          font-size: clamp(40px, 5vw, 68px);
          font-weight: 700;
          line-height: 1.06;
          letter-spacing: -0.04em;
          color: var(--text-1);
          margin-bottom: 20px;
        }

        .ro-hero-h1-accent {
          color: var(--text-3);
          font-weight: 400;
        }

        .ro-hero-desc {
          font-size: 16px; font-weight: 400;
          color: var(--text-3);
          line-height: 1.65;
          margin-bottom: 36px;
          max-width: 420px;
          letter-spacing: -0.01em;
        }

        .ro-hero-actions {
          display: flex; gap: 10px; flex-wrap: wrap;
          margin-bottom: 44px;
        }

        /* Buttons */
        .ro-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 18px;
          border-radius: var(--r-md);
          font-family: var(--font-body);
          font-size: 13.5px; font-weight: 600;
          cursor: pointer;
          transition: all 0.18s var(--ease);
          border: none; text-decoration: none; white-space: nowrap;
          letter-spacing: -0.01em;
        }
        .ro-btn-icon { transition: transform 0.18s var(--ease-spring); }
        .ro-btn:hover .ro-btn-icon { transform: translateX(3px); }

        .ro-btn--primary {
          background: var(--accent);
          color: var(--text-inv);
          box-shadow: var(--shadow-sm);
        }
        .ro-btn--primary:hover {
          background: var(--accent-mid);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .ro-btn--secondary {
          background: var(--bg-card);
          color: var(--text-2);
          border: 1px solid var(--border-med);
          box-shadow: var(--shadow-xs);
        }
        .ro-btn--secondary:hover {
          border-color: var(--border-strong);
          color: var(--text-1);
          background: var(--bg-1);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        /* Trust row */
        .ro-hero-trust {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .ro-hero-trust-label {
          font-size: 11px; color: var(--text-4);
          font-weight: 500; letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .ro-hero-trust-sep { width: 1px; height: 12px; background: var(--border-med); }
        .ro-hero-trust-item {
          font-family: var(--font-mono);
          font-size: 11px; font-weight: 400;
          color: var(--text-4);
          padding: 3px 8px;
          border: 1px solid var(--border);
          border-radius: var(--r-xs);
          background: var(--bg-card);
          transition: all 0.15s;
        }
        .ro-hero-trust-item:hover {
          color: var(--text-2);
          border-color: var(--border-med);
        }

        /* ══════════════════════════════════════════
           DASHBOARD MOCKUP — BizLink CRM style
        ══════════════════════════════════════════ */
        .ro-dash-wrap {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--r-xl);
          overflow: hidden;
          box-shadow: var(--shadow-2xl);
          transition: all 0.3s var(--ease);
        }
        .ro-dash-wrap:hover {
          box-shadow: var(--shadow-2xl), 0 0 0 1px var(--border-med);
          transform: translateY(-2px);
        }

        /* Browser chrome */
        .ro-dash-chrome {
          background: var(--bg-1);
          border-bottom: 1px solid var(--border);
          padding: 10px 16px;
          display: flex; align-items: center; gap: 12px;
        }
        .ro-dash-dots { display: flex; gap: 5px; }
        .ro-dash-dot { width: 10px; height: 10px; border-radius: 50%; }
        .ro-dash-dot--r { background: #ff5f57; }
        .ro-dash-dot--y { background: #febc2e; }
        .ro-dash-dot--g { background: #28c840; }
        .ro-dash-url {
          flex: 1;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          padding: 4px 12px;
          font-family: var(--font-mono);
          font-size: 10.5px; color: var(--text-4);
          display: flex; align-items: center; gap: 6px;
          max-width: 280px; margin: 0 auto;
        }
        .ro-dash-lock { color: var(--green); font-size: 9px; }

        /* Inner layout: sidebar + main */
        .ro-dash-layout {
          display: flex;
          height: 380px;
          overflow: hidden;
        }

        /* Left sidebar */
        .ro-dash-sidebar {
          width: 148px; flex-shrink: 0;
          background: var(--bg-sidebar);
          padding: 14px 0;
          display: flex; flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.04);
        }
        .ro-dash-brand {
          padding: 0 14px 12px;
          font-family: var(--font-display);
          font-size: 13px; font-weight: 700;
          color: #ffffff; letter-spacing: -0.02em;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 8px;
        }
        .ro-dash-nav { flex: 1; }
        .ro-dash-nav-item {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 14px;
          font-size: 11.5px; font-weight: 500;
          color: rgba(255,255,255,0.45);
          cursor: pointer; transition: all 0.15s;
          border-radius: 0;
        }
        .ro-dash-nav-item:hover { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.04); }
        .ro-dash-nav-item--active {
          color: #ffffff !important;
          background: rgba(255,255,255,0.08) !important;
        }
        .ro-dash-nav-icon { font-size: 12px; width: 14px; text-align: center; }
        .ro-dash-nav-badge {
          margin-left: auto;
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.6);
          font-size: 9px; font-weight: 600;
          padding: 1px 5px;
          border-radius: var(--r-pill);
          font-family: var(--font-mono);
        }
        .ro-dash-nav-section {
          padding: 12px 14px 4px;
          font-size: 9.5px; font-weight: 500;
          color: rgba(255,255,255,0.22); letter-spacing: 0.08em; text-transform: uppercase;
        }

        /* Main content */
        .ro-dash-main {
          flex: 1; overflow: hidden;
          display: flex; flex-direction: column;
          background: var(--bg-1);
        }

        /* Top toolbar */
        .ro-dash-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          gap: 10px;
        }
        .ro-dash-search {
          display: flex; align-items: center; gap: 7px;
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 5px 11px;
          font-size: 11px; color: var(--text-4);
          font-family: var(--font-body);
          flex: 1; max-width: 200px;
        }
        .ro-dash-toolbar-actions {
          display: flex; align-items: center; gap: 7px;
        }
        .ro-dash-toolbar-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 11px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          font-size: 11px; font-weight: 500; color: var(--text-3);
          cursor: pointer;
        }
        .ro-dash-toolbar-btn--primary {
          background: var(--accent);
          color: var(--text-inv);
          border-color: var(--accent);
        }

        /* Metric cards row */
        .ro-dash-metrics {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 1px;
          background: var(--border);
          border-bottom: 1px solid var(--border);
        }
        .ro-dash-metric {
          background: var(--bg-card);
          padding: 14px 16px;
        }
        .ro-dash-metric-label { font-size: 10.5px; color: var(--text-4); margin-bottom: 6px; font-weight: 500; }
        .ro-dash-metric-val {
          font-family: var(--font-display);
          font-size: 22px; font-weight: 700;
          letter-spacing: -0.04em; line-height: 1;
          color: var(--text-1);
        }
        .ro-dash-metric-val--green { color: var(--green); }
        .ro-dash-metric-val--warn  { color: var(--warn); }
        .ro-dash-metric-val--red   { color: var(--danger); }
        .ro-dash-metric-sub { font-size: 10px; color: var(--text-4); margin-top: 3px; }
        .ro-dash-metric-up { color: var(--green); font-size: 10px; margin-top: 3px; font-weight: 600; }

        /* Table / list content */
        .ro-dash-content {
          flex: 1; overflow: hidden;
          display: grid; grid-template-columns: 1fr 0.85fr;
          gap: 1px; background: var(--border);
        }
        .ro-dash-col {
          background: var(--bg-card);
          overflow: hidden;
        }
        .ro-dash-col-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px 8px;
          border-bottom: 1px solid var(--border);
        }
        .ro-dash-col-title { font-size: 11px; font-weight: 600; color: var(--text-2); }
        .ro-dash-col-count {
          font-size: 10px; font-weight: 600;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-3);
          padding: 1px 6px; border-radius: var(--r-pill);
          font-family: var(--font-mono);
        }

        /* Row items */
        .ro-dash-row {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 14px;
          border-bottom: 1px solid var(--border);
          cursor: pointer; transition: background 0.12s;
        }
        .ro-dash-row:hover { background: var(--bg-1); }
        .ro-dash-row:last-child { border-bottom: none; }

        .ro-dash-row-avatar {
          width: 28px; height: 28px; border-radius: var(--r-sm);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; flex-shrink: 0;
          font-family: var(--font-mono);
        }
        .ro-dash-row-name { font-size: 11.5px; font-weight: 600; color: var(--text-1); }
        .ro-dash-row-sub  { font-size: 10px; color: var(--text-4); margin-top: 1px; }
        .ro-dash-row-date {
          margin-left: auto; flex-shrink: 0;
          font-size: 10px; color: var(--text-4); font-family: var(--font-mono);
        }

        /* Avatar colors */
        .av-blue   { background: #dbeafe; color: #1d4ed8; }
        .av-purple { background: #ede9fe; color: #6d28d9; }
        .av-orange { background: #ffedd5; color: #c2410c; }
        .av-green  { background: #d1fae5; color: #065f46; }
        .av-pink   { background: #fce7f3; color: #9d174d; }
        .av-teal   { background: #ccfbf1; color: #0f766e; }

        [data-theme="dark"] .av-blue   { background: rgba(255,255,255,0.07); color: #a3a3a3; }
        [data-theme="dark"] .av-purple { background: rgba(255,255,255,0.07); color: #a3a3a3; }
        [data-theme="dark"] .av-orange { background: rgba(255,255,255,0.07); color: #a3a3a3; }
        [data-theme="dark"] .av-green  { background: rgba(255,255,255,0.07); color: #a3a3a3; }
        [data-theme="dark"] .av-pink   { background: rgba(255,255,255,0.07); color: #a3a3a3; }
        [data-theme="dark"] .av-teal   { background: rgba(255,255,255,0.07); color: #a3a3a3; }

        /* Activity panel */
        .ro-dash-activity {
          display: flex; flex-direction: column;
        }
        .ro-dash-act-row {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 8px 14px;
          border-bottom: 1px solid var(--border);
        }
        .ro-dash-act-row:last-child { border-bottom: none; }
        .ro-dash-act-icon {
          width: 26px; height: 26px; border-radius: var(--r-sm);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; flex-shrink: 0; margin-top: 1px;
        }
        .act-green { background: var(--green-sub); color: var(--green-text); }
        .act-warn  { background: var(--warn-sub); color: var(--warn); }
        .act-red   { background: var(--danger-sub); color: var(--danger); }
        .act-info  { background: var(--accent-sub); color: var(--accent-dim); }
        .ro-dash-act-title { font-size: 11.5px; font-weight: 600; color: var(--text-1); }
        .ro-dash-act-sub   { font-size: 10px; color: var(--text-4); margin-top: 1px; }
        .ro-dash-act-time  { font-size: 10px; color: var(--text-4); margin-left: auto; flex-shrink: 0; font-family: var(--font-mono); }

        /* Live ticker */
        .ro-ticker {
          border-top: 1px solid var(--border);
          padding: 8px 16px;
          display: flex; align-items: center; gap: 12px;
          overflow: hidden;
          background: var(--bg-card);
        }
        .ro-ticker-tag {
          display: flex; align-items: center; gap: 5px;
          font-size: 10.5px; font-weight: 600;
          color: var(--green-text);
          flex-shrink: 0;
          font-family: var(--font-mono);
        }
        .ro-ticker-live-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--green);
          animation: blink 2s ease infinite;
        }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .ro-ticker-scroll { overflow: hidden; flex: 1; }
        .ro-ticker-inner {
          display: flex; gap: 40px;
          animation: ticker 40s linear infinite;
          white-space: nowrap; width: max-content;
        }
        .ro-ticker-inner:hover { animation-play-state: paused; }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ro-ticker-item {
          font-size: 10.5px; color: var(--text-4);
          display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
          font-family: var(--font-mono);
        }
        .ro-ticker-state { font-weight: 600; color: var(--text-3); }
        .ro-ticker-status { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }
        .ro-ticker-status--ok   { background: var(--green); }
        .ro-ticker-status--warn { background: var(--warn); }
        .ro-ticker-status--info { background: var(--info); }

        /* ══════════════════════════════════════════
           STATS BAR
        ══════════════════════════════════════════ */
        .ro-stats {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: var(--bg-card);
        }
        .ro-stats-inner {
          max-width: 1440px; margin: 0 auto; padding: 0 56px;
          display: grid; grid-template-columns: repeat(4,1fr);
        }
        .ro-stat {
          padding: 48px 0;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          position: relative; text-align: center;
        }
        .ro-stat + .ro-stat::before {
          content: '';
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          height: 36px; width: 1px; background: var(--border);
        }
        .ro-stat-val {
          font-family: var(--font-display);
          font-size: 44px; font-weight: 700;
          letter-spacing: -0.05em; color: var(--text-1); line-height: 1;
        }
        .ro-stat-lbl {
          font-size: 12px; color: var(--text-4);
          letter-spacing: 0.02em; font-weight: 500;
        }

        /* ══════════════════════════════════════════
           TRUST BAR
        ══════════════════════════════════════════ */
        .ro-trust {
          padding: 24px 56px; max-width: 100%; margin: 0;
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          justify-content: space-between;
        }
        .ro-trust-label {
          font-size: 10px; color: var(--text-3);
          font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; flex-shrink: 0;
        }
        [data-theme="dark"] .ro-trust-label { color: rgba(255,255,255,0.35); }
        .ro-trust-divider { width: 1px; height: 14px; background: var(--border-med); flex-shrink: 0; }
        .ro-trust-logos { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1; justify-content: space-evenly; }
        .ro-trust-logo {
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          color: var(--text-3);
          padding: 5px 12px; border: 1px solid var(--border-med);
          border-radius: var(--r-sm); background: var(--bg-card);
          transition: all 0.15s; cursor: default;
          letter-spacing: 0.04em;
        }
        .ro-trust-logo:hover { color: var(--text-1); border-color: var(--border-strong); background: var(--bg-elevated); }
        [data-theme="dark"] .ro-trust-logo {
          color: rgba(255,255,255,0.55);
          border-color: rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.04);
        }
        [data-theme="dark"] .ro-trust-logo:hover {
          color: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.08);
        }

        /* ══════════════════════════════════════════
           SHARED SECTION
        ══════════════════════════════════════════ */
        .ro-section {
          padding: 100px 56px;
          max-width: 1440px; margin: 0 auto;
        }
        .ro-section-center { text-align: center; }

        .ro-section-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--green-text);
          margin-bottom: 14px;
        }
        .ro-section-center .ro-section-eyebrow { display: block; }

        .ro-section-h2 {
          font-family: var(--font-display);
          font-size: clamp(28px, 3.2vw, 44px); font-weight: 700;
          letter-spacing: -0.04em; color: var(--text-1); line-height: 1.1; margin-bottom: 14px;
        }
        .ro-section-h2-accent { color: var(--text-3); font-weight: 400; }
        .ro-section-sub {
          font-size: 15px; color: var(--text-3); font-weight: 400;
          line-height: 1.65; max-width: 480px; margin: 0 auto;
        }

        .ro-section-divider {
          height: 1px; background: var(--border);
        }

        /* ══════════════════════════════════════════
           QUICK ACCESS TILES
        ══════════════════════════════════════════ */
        .ro-qa-grid {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-top: 48px;
        }
        .ro-qa-tile {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 24px 20px 20px;
          cursor: pointer;
          transition: all 0.2s var(--ease);
          text-align: left;
          display: flex; flex-direction: column; gap: 8px;
          box-shadow: var(--shadow-card);
        }
        .ro-qa-tile:hover {
          border-color: var(--border-med);
          box-shadow: var(--shadow-lg);
          transform: translateY(-3px);
        }
        .ro-qa-tile-num {
          font-family: var(--font-mono); font-size: 10px; color: var(--text-4);
          font-weight: 500;
        }
        .ro-qa-tile-title {
          font-family: var(--font-display);
          font-size: 14px; font-weight: 700; color: var(--text-1);
          letter-spacing: -0.02em; line-height: 1.25;
        }
        .ro-qa-tile-desc {
          font-size: 12.5px; color: var(--text-3); line-height: 1.6; font-weight: 400; flex: 1;
        }
        .ro-qa-tile-cta {
          font-size: 12px; font-weight: 600; color: var(--text-2);
          display: flex; align-items: center; gap: 5px; margin-top: 6px;
        }
        .ro-qa-tile-cta-arrow { transition: transform 0.18s var(--ease-spring); }
        .ro-qa-tile:hover .ro-qa-tile-cta-arrow { transform: translateX(4px); }
        .ro-qa-tile:hover .ro-qa-tile-cta { color: var(--text-1); }

        /* ══════════════════════════════════════════
           FEATURES GRID
        ══════════════════════════════════════════ */
        .ro-features-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1px; background: var(--border);
          border: 1px solid var(--border);
          border-radius: var(--r-xl); overflow: hidden;
          margin-top: 52px;
          box-shadow: var(--shadow-card);
        }
        .ro-feature-card {
          background: var(--bg-card);
          padding: 36px 32px;
          transition: background 0.18s;
          position: relative;
        }
        .ro-feature-card:hover { background: var(--bg-1); }
        .ro-feature-num {
          font-family: var(--font-mono); font-size: 10px; color: var(--text-4);
          font-weight: 500; margin-bottom: 16px;
        }
        .ro-feature-title {
          font-family: var(--font-display);
          font-size: 15px; font-weight: 700; color: var(--text-1);
          letter-spacing: -0.02em; margin-bottom: 10px; line-height: 1.25;
        }
        .ro-feature-desc {
          font-size: 13px; color: var(--text-3); line-height: 1.68; font-weight: 400;
        }

        /* ══════════════════════════════════════════
           TESTIMONIALS
        ══════════════════════════════════════════ */
        .ro-testimonials-grid {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top: 52px;
        }
        .ro-testimonial {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 24px;
          display: flex; flex-direction: column; gap: 14px;
          transition: all 0.2s var(--ease);
          box-shadow: var(--shadow-card);
        }
        .ro-testimonial:hover {
          border-color: var(--border-med);
          box-shadow: var(--shadow-lg);
          transform: translateY(-3px);
        }
        .ro-testimonial-quote {
          font-family: var(--font-display);
          font-size: 36px; line-height: 1;
          color: var(--text-4); margin-bottom: -6px;
          font-weight: 700;
        }
        .ro-testimonial-text {
          font-size: 13px; color: var(--text-2); line-height: 1.75; font-weight: 400; flex: 1;
        }
        .ro-testimonial-author {
          display: flex; align-items: center; gap: 10px;
          border-top: 1px solid var(--border); padding-top: 14px;
        }
        .ro-testimonial-avatar {
          width: 32px; height: 32px; border-radius: var(--r-md);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono);
          font-size: 9px; font-weight: 600; color: var(--text-3); flex-shrink: 0;
        }
        .ro-testimonial-name {
          font-size: 12.5px; font-weight: 700; color: var(--text-1); letter-spacing: -0.02em;
        }
        .ro-testimonial-role { font-size: 11px; color: var(--text-4); margin-top: 1px; }

        /* ══════════════════════════════════════════
           CTA BANNER
        ══════════════════════════════════════════ */
        .ro-cta-wrap {
          padding: 0 56px 100px;
          max-width: 1440px; margin: 0 auto;
        }
        .ro-cta {
          border-radius: var(--r-3xl);
          background: var(--accent);
          padding: 80px 64px;
          text-align: center;
          position: relative; overflow: hidden;
          box-shadow: var(--shadow-2xl);
        }
        [data-theme="light"] .ro-cta {
          background: var(--accent);
        }
        [data-theme="dark"] .ro-cta {
          background: var(--bg-card);
          border: 1px solid var(--border-med);
        }

        /* Subtle grid texture on CTA */
        .ro-cta-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .ro-cta-badge {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
          margin-bottom: 22px;
          position: relative; z-index: 1;
        }
        [data-theme="light"] .ro-cta-badge { color: rgba(255,255,255,0.7); }
        [data-theme="dark"]  .ro-cta-badge { color: var(--green-text); }
        .ro-cta-badge-dot {
          width: 5px; height: 5px; border-radius: 50%;
          animation: blink 2s ease infinite;
        }
        [data-theme="light"] .ro-cta-badge-dot { background: rgba(255,255,255,0.6); }
        [data-theme="dark"]  .ro-cta-badge-dot { background: var(--green); box-shadow: 0 0 6px var(--green); }

        .ro-cta-h2 {
          font-family: var(--font-display);
          font-size: clamp(28px, 3.8vw, 48px); font-weight: 700;
          letter-spacing: -0.04em; line-height: 1.08; margin-bottom: 16px;
          position: relative; z-index: 1;
        }
        [data-theme="light"] .ro-cta-h2 { color: #ffffff; }
        [data-theme="dark"]  .ro-cta-h2 { color: var(--text-1); }

        .ro-cta p {
          font-size: 15px; font-weight: 400;
          line-height: 1.7; max-width: 460px; margin: 0 auto 40px;
          position: relative; z-index: 1;
        }
        [data-theme="light"] .ro-cta p { color: rgba(255,255,255,0.72); }
        [data-theme="dark"]  .ro-cta p { color: var(--text-3); }

        .ro-cta-actions {
          display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap;
          margin-bottom: 20px; position: relative; z-index: 1;
        }

        .ro-cta-btn--primary {
          padding: 10px 22px; border-radius: var(--r-md);
          font-family: var(--font-body);
          font-size: 13.5px; font-weight: 600;
          cursor: pointer; border: none;
          transition: all 0.2s var(--ease);
          letter-spacing: -0.01em;
        }
        [data-theme="light"] .ro-cta-btn--primary {
          background: #ffffff; color: var(--accent);
          box-shadow: var(--shadow-sm);
        }
        [data-theme="light"] .ro-cta-btn--primary:hover {
          background: #f9fafb;
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
        [data-theme="dark"]  .ro-cta-btn--primary {
          background: var(--text-1); color: var(--text-inv);
          box-shadow: var(--shadow-sm);
        }
        [data-theme="dark"]  .ro-cta-btn--primary:hover {
          background: var(--accent-mid);
          transform: translateY(-1px);
        }

        .ro-cta-btn--outline {
          padding: 10px 22px; border-radius: var(--r-md);
          font-family: var(--font-body);
          font-size: 13.5px; font-weight: 500;
          cursor: pointer;
          transition: all 0.2s var(--ease); letter-spacing: -0.01em;
        }
        [data-theme="light"] .ro-cta-btn--outline {
          background: rgba(255,255,255,0.12);
          color: #ffffff;
          border: 1px solid rgba(255,255,255,0.25);
        }
        [data-theme="light"] .ro-cta-btn--outline:hover {
          background: rgba(255,255,255,0.2);
        }
        [data-theme="dark"]  .ro-cta-btn--outline {
          background: transparent; color: var(--text-2);
          border: 1px solid var(--border-strong);
        }
        [data-theme="dark"]  .ro-cta-btn--outline:hover {
          background: var(--bg-elevated);
          color: var(--text-1);
          border-color: var(--border-strong);
        }

        .ro-cta-links {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          flex-wrap: wrap; margin-bottom: 28px; position: relative; z-index: 1;
        }
        .ro-cta-link {
          font-size: 12px; text-decoration: none;
          transition: opacity 0.15s; font-weight: 400;
        }
        [data-theme="light"] .ro-cta-link { color: rgba(255,255,255,0.55); }
        [data-theme="light"] .ro-cta-link:hover { color: rgba(255,255,255,0.85); }
        [data-theme="dark"]  .ro-cta-link { color: var(--text-4); }
        [data-theme="dark"]  .ro-cta-link:hover { color: var(--text-2); }
        .ro-cta-dot { color: rgba(255,255,255,0.25); }
        [data-theme="dark"] .ro-cta-dot { color: var(--text-4); }

        .ro-cta-reassurance {
          display: flex; align-items: center; justify-content: center; gap: 16px;
          flex-wrap: wrap;
          font-size: 11px; font-weight: 500;
          position: relative; z-index: 1;
        }
        [data-theme="light"] .ro-cta-reassurance { color: rgba(255,255,255,0.5); }
        [data-theme="dark"]  .ro-cta-reassurance { color: var(--text-4); }
        .ro-cta-reassurance-item { display: flex; align-items: center; gap: 6px; }
        .ro-cta-reassurance-dot { width: 3px; height: 3px; border-radius: 50%; }
        [data-theme="light"] .ro-cta-reassurance-dot { background: rgba(255,255,255,0.4); }
        [data-theme="dark"]  .ro-cta-reassurance-dot { background: var(--green); }
        .ro-cta-divider { opacity: 0.3; }

        /* ══════════════════════════════════════════
           IMPORTED SECTIONS WRAPPER
        ══════════════════════════════════════════ */
        .ro-imported {
          max-width: 1440px; margin: 0 auto; padding: 0 56px;
        }

        /* ══════════════════════════════════════════
           RESPONSIVE
        ══════════════════════════════════════════ */
        @media (max-width: 1080px) {
          .ro-hero { flex-direction: column; padding: 48px 28px 36px; min-height: auto; gap: 48px; }
          .ro-stats-inner { grid-template-columns: repeat(2,1fr); }
          .ro-qa-grid { grid-template-columns: repeat(2,1fr); }
          .ro-features-grid { grid-template-columns: repeat(2,1fr); }
          .ro-testimonials-grid { grid-template-columns: repeat(2,1fr); }
          .ro-cta { padding: 60px 40px; }
          .ro-section { padding: 72px 28px; }
          .ro-trust, .ro-stats-inner { padding-left: 28px; padding-right: 28px; }
          .ro-cta-wrap { padding: 0 28px 72px; }
          .ro-imported { padding: 0 28px; }
          .ro-dash-layout { height: 300px; }
          .ro-dash-sidebar { width: 120px; }
        }
        @media (max-width: 768px) {
          .ro-hero { padding: 36px 16px 28px; }
          .ro-qa-grid { grid-template-columns: 1fr; }
          .ro-features-grid { grid-template-columns: 1fr; }
          .ro-testimonials-grid { grid-template-columns: 1fr; }
          .ro-dash-metrics { grid-template-columns: repeat(2,1fr); }
          .ro-dash-content { grid-template-columns: 1fr; }
          .ro-cta { padding: 44px 20px; border-radius: var(--r-xl); }
          .ro-cta-wrap { padding: 0 16px 56px; }
          .ro-section { padding: 56px 16px; }
          .ro-trust { padding: 14px 16px; }
          .ro-stats-inner { padding: 0 16px; grid-template-columns: repeat(2,1fr); }
          .ro-imported { padding: 0 16px; }
          .ro-dash-sidebar { display: none; }
        }
      `}</style>

      <div className="ro-page">
        {/* ── NAVBAR ── */}
        <Navbar />

        {/* Theme toggle */}
        <button
          onClick={() => setDark(d => !d)}
          className="ro-theme-toggle"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              Light
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              Dark
            </>
          )}
        </button>

        {/* ── HERO ── */}
        <section className="ro-hero" aria-label="Hero">
          <div className="ro-hero-left">
            <div className="ro-eyebrow">
              <span className="ro-eyebrow-dot" />
              Live · Government Operations Platform v2.4
            </div>
            <h1 className="ro-hero-h1">
              The operating system<br />
              for <span className="ro-hero-h1-accent">rural governance</span>
            </h1>
            <p className="ro-hero-desc">
              Monitor programs, detect risks early, and coordinate action
              across villages, mandals, and districts — in real time.
            </p>
            <div className="ro-hero-actions">
              <button className="ro-btn ro-btn--primary" onClick={() => navigate("/citizen/register")}>
                Register as Citizen
                <svg className="ro-btn-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
              <button className="ro-btn ro-btn--secondary" onClick={() => navigate("/login")}>
                Official Login
              </button>
            </div>
            <div className="ro-hero-trust">
              <span className="ro-hero-trust-label">Trusted by</span>
              <span className="ro-hero-trust-sep" />
              {["GoT", "GoAP", "MoRD", "NIC"].map(a => (
                <span key={a} className="ro-hero-trust-item">{a}</span>
              ))}
            </div>
          </div>

          {/* Dashboard mockup — BizLink CRM style */}
          <div className="ro-hero-right" aria-label="Dashboard preview">
            <div className="ro-dash-wrap">
              {/* Browser chrome */}
              <div className="ro-dash-chrome">
                <div className="ro-dash-dots">
                  <div className="ro-dash-dot ro-dash-dot--r" />
                  <div className="ro-dash-dot ro-dash-dot--y" />
                  <div className="ro-dash-dot ro-dash-dot--g" />
                </div>
                <div className="ro-dash-url">
                  <span className="ro-dash-lock">🔒</span>
                  ruralops.gov.in/district/command
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  {["−","□","×"].map(c => (
                    <span key={c} style={{ fontSize: 10, color: "var(--text-4)", cursor: "default" }}>{c}</span>
                  ))}
                </div>
              </div>

              {/* App layout */}
              <div className="ro-dash-layout">
                {/* Sidebar */}
                <div className="ro-dash-sidebar">
                  <div className="ro-dash-brand">RuralOps</div>
                  <nav className="ro-dash-nav">
                    {[
                      { icon: "⊞", label: "Dashboard",   active: false },
                      { icon: "✓", label: "Grievances",  active: false, badge: "142" },
                      { icon: "◉", label: "Villages",    active: true  },
                      { icon: "↑", label: "Field Sync",  active: false },
                      { icon: "⚙", label: "Settings",    active: false },
                    ].map(item => (
                      <div key={item.label} className={`ro-dash-nav-item${item.active ? " ro-dash-nav-item--active" : ""}`}>
                        <span className="ro-dash-nav-icon">{item.icon}</span>
                        {item.label}
                        {item.badge && <span className="ro-dash-nav-badge">{item.badge}</span>}
                      </div>
                    ))}
                    <div className="ro-dash-nav-section">Projects</div>
                    {["Telangana", "Andhra Pr.", "Maharashtra"].map(p => (
                      <div key={p} className="ro-dash-nav-item">
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                        {p}
                      </div>
                    ))}
                  </nav>
                </div>

                {/* Main */}
                <div className="ro-dash-main">
                  {/* Toolbar */}
                  <div className="ro-dash-toolbar">
                    <div className="ro-dash-search">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      Search village or district...
                    </div>
                    <div className="ro-dash-toolbar-actions">
                      <div className="ro-dash-toolbar-btn">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                        </svg>
                        Filter
                      </div>
                      <div className="ro-dash-toolbar-btn ro-dash-toolbar-btn--primary">
                        + Add Village
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="ro-dash-metrics">
                    {[
                      { label: "Villages Active", val: "6,400+", color: "", sub: "↑ 48 this week", up: true },
                      { label: "Grievances Open", val: "142", color: "warn", sub: "18 escalated", up: false },
                      { label: "Compliance Rate", val: "94.2%", color: "green", sub: "↑ 1.3% vs last mo.", up: true },
                      { label: "Citizens Registered", val: "9.2M", color: "", sub: "348 today", up: true },
                    ].map((m, i) => (
                      <div key={i} className="ro-dash-metric">
                        <div className="ro-dash-metric-label">{m.label}</div>
                        <div className={`ro-dash-metric-val${m.color ? " ro-dash-metric-val--" + m.color : ""}`}>{m.val}</div>
                        <div className={m.up ? "ro-dash-metric-up" : "ro-dash-metric-sub"}>{m.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Two-column content */}
                  <div className="ro-dash-content">
                    {/* Left: village list */}
                    <div className="ro-dash-col">
                      <div className="ro-dash-col-head">
                        <span className="ro-dash-col-title">District Overview</span>
                        <span className="ro-dash-col-count">814</span>
                      </div>
                      {[
                        { name: "Hyderabad Dist.", sub: "97% compliant · 0 escalations", av: "HY", c: "av-blue",   date: "2m" },
                        { name: "Visakhapatnam",   sub: "94% compliant · 2 grievances",  av: "VS", c: "av-purple", date: "5m" },
                        { name: "Karimnagar",       sub: "85% compliant · 5 escalations", av: "KN", c: "av-orange", date: "12m" },
                        { name: "Guntur District",  sub: "91% compliant · 1 pending",     av: "GN", c: "av-green",  date: "18m" },
                        { name: "Medak District",   sub: "78% compliant · 8 escalations", av: "MD", c: "av-pink",   date: "24m" },
                      ].map((r, i) => (
                        <div key={i} className="ro-dash-row">
                          <div className={`ro-dash-row-avatar ${r.c}`}>{r.av}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="ro-dash-row-name">{r.name}</div>
                            <div className="ro-dash-row-sub">{r.sub}</div>
                          </div>
                          <span className="ro-dash-row-date">{r.date}</span>
                        </div>
                      ))}
                    </div>

                    {/* Right: activity */}
                    <div className="ro-dash-col">
                      <div className="ro-dash-col-head">
                        <span className="ro-dash-col-title">Recent Activity</span>
                      </div>
                      <div className="ro-dash-activity">
                        {[
                          { icon: "✓", c: "act-green", title: "GV-2041 resolved",    sub: "Karimnagar district",   t: "2m"  },
                          { icon: "↑", c: "act-info",  title: "Field sync complete", sub: "24 villages updated",   t: "5m"  },
                          { icon: "!", c: "act-warn",  title: "Escalation raised",   sub: "PM Awas delay, Medak",  t: "12m" },
                          { icon: "✓", c: "act-green", title: "PM Kisan verified",   sub: "4,200 farmers paid",    t: "18m" },
                          { icon: "✗", c: "act-red",   title: "18 overdue cases",    sub: "Bihar district flagged",t: "1h"  },
                        ].map((a, i) => (
                          <div key={i} className="ro-dash-act-row">
                            <div className={`ro-dash-act-icon ${a.c}`}>{a.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="ro-dash-act-title">{a.title}</div>
                              <div className="ro-dash-act-sub">{a.sub}</div>
                            </div>
                            <span className="ro-dash-act-time">{a.t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live ticker */}
              <div className="ro-ticker">
                <div className="ro-ticker-tag">
                  <span className="ro-ticker-live-dot" />
                  Live
                </div>
                <div className="ro-ticker-scroll">
                  <div className="ro-ticker-inner" aria-hidden="true">
                    {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                      <span key={i} className="ro-ticker-item">
                        <span className={`ro-ticker-status ro-ticker-status--${item.status}`} />
                        <span className="ro-ticker-state">{item.state}</span>
                        — {item.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p style={{
              textAlign: "center",
              fontSize: 10, color: "var(--text-4)",
              marginTop: 8, letterSpacing: "0.04em", fontWeight: 400,
              fontFamily: "var(--font-mono)",
            }}>
              Live platform data · Visibility scoped by role and authorization
            </p>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <div className="ro-stats" ref={statsRef} aria-label="Platform statistics">
          <div className="ro-stats-inner">
            {STATS.map((s) => (
              <StatCard key={s.label} value={s.value} label={s.label} inView={statsInView} />
            ))}
          </div>
        </div>

        {/* ── TRUST BAR ── */}
        <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", width: "100%" }}>
          <div className="ro-trust" aria-label="Trusted partners">
            <span className="ro-trust-label">Deployed with</span>
            <div className="ro-trust-divider" />
            <div className="ro-trust-logos">
              {TRUST_LOGOS.map((l) => (
                <span key={l.abbr} className="ro-trust-logo" title={l.name}>{l.abbr}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="ro-section-divider" />

        {/* ── SYSTEM INTRO ── */}
        <div className="ro-imported" style={{ paddingTop: 100, paddingBottom: 100 }}>
          <SystemIntroSection />
        </div>

        <div className="ro-section-divider" />

        {/* ── QUICK ACCESS ── */}
        <section className="ro-section" aria-labelledby="qa-heading">
          <div className="ro-section-eyebrow">Get Started</div>
          <h2 id="qa-heading" className="ro-section-h2">
            Where would you like to <span className="ro-section-h2-accent">begin?</span>
          </h2>
          <div className="ro-qa-grid">
            {[
              { n: "01", t: "Register as Citizen",  d: "Create your RuralOps account and access government services and scheme enrollment.", cta: "Get started", path: "/citizen/register" },
              { n: "02", t: "Check Status",          d: "Track your registration, approval progress, and scheme application status in real time.", cta: "Track now",   path: "/citizen/status" },
              { n: "03", t: "Activate Account",      d: "Complete account activation with your official credentials and unlock full platform access.", cta: "Activate",    path: "/activate-account" },
              { n: "04", t: "Download Mobile App",   d: "Access RuralOps from the field. Works offline and syncs automatically when reconnected.", cta: "Download",    path: "/mobile-app" },
            ].map((tile) => (
              <button key={tile.n} className="ro-qa-tile" onClick={() => navigate(tile.path)}>
                <span className="ro-qa-tile-num">{tile.n}</span>
                <span className="ro-qa-tile-title">{tile.t}</span>
                <span className="ro-qa-tile-desc">{tile.d}</span>
                <span className="ro-qa-tile-cta">
                  {tile.cta}
                  <svg className="ro-qa-tile-cta-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="ro-section-divider" />

        {/* ── IMPORTED SECTIONS ── */}
        <div className="ro-imported" style={{ paddingTop: 100, paddingBottom: 100 }}>
          <ProblemSection />
        </div>
        <div className="ro-section-divider" />
        <div className="ro-imported" style={{ paddingTop: 100, paddingBottom: 100 }}>
          <RolesSection />
        </div>
        <div className="ro-section-divider" />
        <div className="ro-imported" style={{ paddingTop: 100, paddingBottom: 100 }}>
          <HowItWorksSection />
        </div>

        <div className="ro-section-divider" />

        {/* ── FEATURES ── */}
        <section className="ro-section" aria-labelledby="features-heading">
          <div className="ro-section-center">
            <div className="ro-section-eyebrow">Platform Capabilities</div>
            <h2 id="features-heading" className="ro-section-h2">
              Built for the complexity of{" "}
              <span className="ro-section-h2-accent">real-world governance</span>
            </h2>
            <p className="ro-section-sub">
              Every feature was designed around actual workflows observed across
              mandals, districts, and field teams.
            </p>
          </div>
          <div className="ro-features-grid">
            {FEATURE_HIGHLIGHTS.map((f) => (
              <article key={f.icon} className="ro-feature-card">
                <div className="ro-feature-num">{f.icon}</div>
                <h3 className="ro-feature-title">{f.title}</h3>
                <p className="ro-feature-desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="ro-section-divider" />

        {/* ── TESTIMONIALS ── */}
        <section className="ro-section" aria-labelledby="testimonials-heading">
          <div className="ro-section-center">
            <div className="ro-section-eyebrow">Voices from the Field</div>
            <h2 id="testimonials-heading" className="ro-section-h2">
              What administrators &amp;{" "}
              <span className="ro-section-h2-accent">programme leaders say</span>
            </h2>
          </div>
          <div className="ro-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="ro-testimonial">
                <div className="ro-testimonial-quote">"</div>
                <p className="ro-testimonial-text">{t.quote}</p>
                <figcaption className="ro-testimonial-author">
                  <div className="ro-testimonial-avatar">{t.initial}</div>
                  <div>
                    <div className="ro-testimonial-name">{t.name}</div>
                    <div className="ro-testimonial-role">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <div className="ro-section-divider" />

        {/* ── DESIGN PROMISES ── */}
        <div className="ro-imported" style={{ paddingTop: 100, paddingBottom: 100 }}>
          <DesignPromisesSection />
        </div>

        {/* ── CTA BANNER ── */}
        <div className="ro-cta-wrap">
          <section className="ro-cta" aria-label="Call to action">
            <div className="ro-cta-grid" />
            <div className="ro-cta-badge">
              <span className="ro-cta-badge-dot" />
              Ready to Deploy
            </div>
            <h2 className="ro-cta-h2">
              Bring clarity to your<br />rural operations today
            </h2>
            <p>
              Whether you're a district collector, a mandal officer, or a field worker —
              RuralOps gives you the tools to do your job better, faster, and with full accountability.
            </p>
            <div className="ro-cta-actions">
              <button className="ro-cta-btn--primary" onClick={() => navigate("/citizen/register")}>
                Register as Citizen
              </button>
              <button className="ro-cta-btn--outline" onClick={() => navigate("/login")}>
                Official Login
              </button>
            </div>
            <div className="ro-cta-links">
              <Link to="/activate-account"   className="ro-cta-link">Activate Account</Link>
              <span className="ro-cta-dot">·</span>
              <Link to="/activation/request" className="ro-cta-link">Request Activation Key</Link>
              <span className="ro-cta-dot">·</span>
              <Link to="/citizen/status"     className="ro-cta-link">Check Status</Link>
              <span className="ro-cta-dot">·</span>
              <Link to="/mobile-app"         className="ro-cta-link">Mobile App</Link>
            </div>
            <div className="ro-cta-reassurance">
              <span className="ro-cta-reassurance-item">
                <span className="ro-cta-reassurance-dot" />
                Secure &amp; government-compliant
              </span>
              <span className="ro-cta-divider">·</span>
              <span className="ro-cta-reassurance-item">
                <span className="ro-cta-reassurance-dot" />
                Available on web &amp; mobile
              </span>
              <span className="ro-cta-divider">·</span>
              <span className="ro-cta-reassurance-item">
                <span className="ro-cta-reassurance-dot" />
                24/7 operational support
              </span>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </>
  );
}