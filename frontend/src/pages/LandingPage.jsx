import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  CheckCircle2, Users, ArrowRight, Smartphone,
  MapPin, FileText, Layout, ShieldCheck, LogIn, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Assets
import villageImg from "../assets/hero-village.png";
import dashboardImg from "../assets/hero-dashboard.png";
import appImg from "../assets/ruralops-app-preview.png";
import avatarImg from "../assets/avatar-trusted.png";
import logo from "../assets/ruralops-logo.png";
import step1Img from "../assets/step1-citizen.png";
import step2Img from "../assets/step2-officer.png";
import step3Img from "../assets/step3-work.png";
import step4Img from "../assets/step4-resolved.png";
import charCitizenImg from "../assets/citizen-character.png";
import charOfficerImg from "../assets/officer-character.png";
import charAdminImg from "../assets/admin-character.png";
import qrImg from "../assets/qr-code.png";

export default function LandingPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  const accountType = localStorage.getItem("accountType");
  const accountId = localStorage.getItem("accountId");

  const [introVisible, setIntroVisible] = useState(!token);
  const [introDone, setIntroDone] = useState(!!token);

  useEffect(() => {
    if (token) return; // Skip animation if logged in
    const t1 = setTimeout(() => setIntroDone(true), 2200);
    const t2 = setTimeout(() => setIntroVisible(false), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [token]);

  const getDashboardPath = () => {
    switch (accountType) {
      case "CITIZEN": return "/citizen/dashboard";
      case "VAO":     return `/vao/dashboard/${accountId}`;
      case "WORKER":  return "/worker/dashboard";
      case "MAO":     return "/mao/dashboard";
      default:        return "/";
    }
  };

  return (
    <>
      {/* ══ LOGO INTRO OVERLAY ══ */}
      <AnimatePresence>
        {introVisible && (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            animate={{ opacity: introDone ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "var(--bg-main)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <div style={{ position: "relative", width: 300, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Spinning dashed ring */}
              <svg
                width="300" height="300"
                viewBox="0 0 300 300"
                style={{ position: "absolute", zIndex: 1, animation: "lp-spin 1.6s linear infinite" }}
              >
                <circle
                  cx="150" cy="150" r="115"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeDasharray="115 607"
                  strokeLinecap="round"
                  opacity="0.9"
                />
              </svg>
              {/* Second slower ring */}
              <svg
                width="300" height="300"
                viewBox="0 0 300 300"
                style={{ position: "absolute", zIndex: 1, animation: "lp-spin-rev 2.4s linear infinite" }}
              >
                <circle
                  cx="150" cy="150" r="115"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.2"
                  strokeDasharray="36 686"
                  strokeLinecap="round"
                  opacity="0.35"
                />
              </svg>
              {/* Logo centred */}
              <motion.img
                src={logo}
                alt="RuralOps"
                style={{ width: 220, height: 220, objectFit: "contain", borderRadius: 36, position: "relative", zIndex: 2 }}
                initial={{ scale: 0.65, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15, type: "spring", stiffness: 200 }}
              />
            </div>
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ delay: 0.45, duration: 0.45 }}
              style={{
                marginTop: 24, fontSize: 16, fontWeight: 700,
                color: "var(--text-3)", letterSpacing: "0.2em",
                textTransform: "uppercase", fontFamily: "'Outfit', sans-serif"
              }}
            >
              RuralOps
            </motion.span>

            <style>{`
              @keyframes lp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes lp-spin-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lp-root">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700;800&display=swap');

          :root {
            --font-display: 'DM Serif Display', serif;
            --font-body: 'Outfit', sans-serif;
          }

          .lp-root {
            background: var(--bg-main);
            color: var(--text-main);
            font-family: var(--font-body);
            transition: background 0.3s ease, color 0.3s ease;
            overflow-x: hidden;
          }

          /* ══ HERO ══ */
          .lp-hero {
            position: relative;
            min-height: 90vh;
            display: flex;
            align-items: center;
            overflow: hidden;
          }

          .lp-hero-bg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 40%;
            z-index: 0;
          }

          .lp-hero-overlay {
            position: absolute;
            inset: 0;
            z-index: 1;
            background: linear-gradient(
              112deg,
              rgba(0,0,0,0.84) 0%,
              rgba(0,0,0,0.62) 48%,
              rgba(0,0,0,0.22) 100%
            );
          }

          .lp-hero-inner {
            position: relative;
            z-index: 2;
            width: 100%;
            display: flex;
            align-items: center;
            padding: calc(var(--nav-h) + 20px) 8% 70px;
            gap: 56px;
          }

          .lp-hero-content { flex: 1; max-width: 520px; }

          .lp-trust-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            background: rgba(255,255,255,0.10);
            backdrop-filter: blur(12px);
            border-radius: 99px;
            border: 1px solid rgba(255,255,255,0.18);
            margin-bottom: 18px;
          }
          .lp-trust-avatars { display: flex; align-items: center; }
          .lp-trust-avatars img { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.35); margin-left: -7px; }
          .lp-trust-avatars img:first-child { margin-left: 0; }
          .lp-trust-text { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.88); }
          .lp-trust-text span { color: var(--accent); }

          .lp-hero h1 {
            font-family: var(--font-display);
            font-size: clamp(30px, 3.6vw, 48px);
            line-height: 1.08;
            font-weight: 400;
            color: #fff;
            margin-bottom: 16px;
          }
          .lp-hero h1 em { font-style: italic; color: var(--accent); }

          .lp-hero-desc {
            font-size: 14px;
            color: rgba(255,255,255,0.7);
            line-height: 1.65;
            margin-bottom: 28px;
            max-width: 430px;
          }

          .lp-hero-btns { display: flex; align-items: center; gap: 14px; margin-bottom: 44px; flex-wrap: wrap; }

          .lp-btn-primary {
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
            color: white;
            padding: 12px 28px;
            border-radius: 14px;
            font-weight: 700;
            display: flex; align-items: center; gap: 10px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            text-decoration: none;
            font-size: 15px;
            box-shadow: 0 4px 15px rgba(34, 197, 94, 0.25);
          }
          .lp-btn-primary:hover { 
            transform: translateY(-3px) scale(1.02); 
            box-shadow: 0 12px 30px rgba(34, 197, 94, 0.4); 
            filter: brightness(1.1);
          }

          .lp-btn-ghost {
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(12px);
            color: white;
            padding: 12px 28px;
            border-radius: 14px;
            font-weight: 700;
            display: flex; align-items: center; gap: 10px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            text-decoration: none;
            font-size: 15px;
            border: 1px solid rgba(255,255,255,0.15);
          }
          .lp-btn-ghost:hover { 
            background: rgba(255,255,255,0.15); 
            transform: translateY(-3px);
            border-color: rgba(255,255,255,0.3);
          }

          .lp-hero-stats {
            display: flex;
            gap: 28px;
            padding-top: 26px;
            border-top: 1px solid rgba(255,255,255,0.14);
            flex-wrap: wrap;
          }
          .lp-hero-stat b { display: block; font-size: 19px; color: #fff; font-weight: 800; line-height: 1; }
          .lp-hero-stat span { font-size: 10px; color: rgba(255,255,255,0.52); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }

          /* ── HERO VISUAL ── */
          .lp-hero-visual {
            flex: 1.2;
            position: relative;
            height: 480px;
          }

          /* Dashboard: fills right area */
          .lp-hero-dashboard {
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 90%;
            border-radius: 12px;
            overflow: hidden;
          }
          .lp-hero-dashboard img {
            width: 100%;
            display: block;
            border-radius: 12px;
          }

          /* Floating phone: bottom-left, overlapping dashboard */
          @keyframes lp-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          .lp-hero-phone {
            position: absolute;
            left: -10px;
            bottom: -10px;
            z-index: 4;
            animation: lp-float 3.8s ease-in-out infinite;
          }
          .lp-hero-phone img {
            width: 155px;
            display: block;
            border-radius: 28px;
          }

          /* ── SECTIONS ── */
          .lp-section { padding: 64px 8%; }
          .lp-section-alt { background: var(--bg-1); }

          .lp-section-header {
            text-align: center;
            margin-bottom: 40px;
            max-width: 580px;
            margin-left: auto;
            margin-right: auto;
          }
          .lp-section-eyebrow {
            color: var(--accent);
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            display: block;
            margin-bottom: 8px;
          }
          .lp-section-title {
            font-family: var(--font-display);
            font-size: 27px;
            font-weight: 400;
            color: var(--text-1);
            line-height: 1.2;
          }

          /* ── SERVICES ── */
          .lp-services-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            max-width: 1060px;
            margin: 0 auto;
          }
          .lp-service-card {
            background: var(--bg-0);
            padding: 20px 18px;
            border-radius: 13px;
            border: 1px solid var(--border);
            transition: 0.2s;
            display: flex;
            align-items: flex-start;
            gap: 13px;
          }
          .lp-service-card:hover { transform: translateY(-3px); border-color: var(--accent); }
          .lp-service-icon {
            width: 36px; height: 36px; min-width: 36px;
            background: var(--accent-soft);
            color: var(--accent);
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
          }
          .lp-service-card h3 { font-size: 13px; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
          .lp-service-card p { font-size: 12px; color: var(--text-3); line-height: 1.5; }

          /* ── HOW IT WORKS ── */
          .lp-how-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 13px;
            max-width: 1060px;
            margin: 0 auto;
          }
          .lp-how-card {
            background: var(--bg-0);
            border-radius: 13px;
            padding: 22px 16px;
            text-align: center;
            border: 1px solid var(--border);
          }
          .lp-how-num {
            width: 26px; height: 26px;
            background: var(--accent); color: white;
            border-radius: 50%; font-size: 11.5px; font-weight: 800;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 12px;
          }
          .lp-how-icon-box {
            width: 68px; height: 68px;
            background: var(--bg-1); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 12px;
            border: 1px solid var(--border);
          }
          .lp-how-icon-box img { width: 50%; }
          .lp-how-card h4 { font-size: 13px; font-weight: 700; color: var(--text-1); margin-bottom: 5px; }
          .lp-how-card p { font-size: 11.5px; color: var(--text-3); line-height: 1.5; }

          /* ── DASHBOARDS ── */
          .lp-dash-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
            max-width: 1060px;
            margin: 0 auto;
          }
          .lp-dash-card {
            background: var(--bg-0);
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid var(--border);
            transition: 0.22s;
            display: flex; flex-direction: column;
          }
          .lp-dash-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.09); }
          .lp-dash-content { padding: 22px; flex: 1; }
          .lp-dash-content h3 {
            font-family: var(--font-display);
            font-size: 17px; font-weight: 400;
            color: var(--text-1); margin-bottom: 7px;
          }
          .lp-dash-content p { font-size: 12px; color: var(--text-3); margin-bottom: 13px; line-height: 1.5; }
          .lp-dash-list { list-style: none; padding: 0; margin: 0 0 14px; }
          .lp-dash-list li {
            display: flex; align-items: center; gap: 7px;
            font-size: 11.5px; font-weight: 600;
            color: var(--text-2); margin-bottom: 6px;
          }
          .lp-dash-list li svg { color: var(--accent); flex-shrink: 0; }
          .lp-dash-link {
            color: var(--accent); text-decoration: none;
            font-weight: 700; display: inline-flex; align-items: center; gap: 5px;
            font-size: 12px; transition: gap 0.18s;
          }
          .lp-dash-link:hover { gap: 9px; }
          .lp-dash-img-box {
            background: var(--bg-1);
            padding: 18px 18px 0;
            display: flex; justify-content: center; overflow: hidden;
          }
          .lp-dash-img-box img { width: 76%; transform: translateY(5px); }

          /* ── IMPACT & APP ── */
          .lp-impact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            max-width: 1060px;
            margin: 0 auto;
          }

          .lp-app-card {
            background: var(--bg-0);
            border: 1px solid var(--border);
            border-radius: 20px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .lp-app-card-body { padding: 28px 28px 18px; }
          .lp-app-card h2 {
            font-family: var(--font-display);
            font-size: 21px; font-weight: 400;
            color: var(--text-1); margin-bottom: 7px;
          }
          .lp-app-card p { font-size: 12.5px; color: var(--text-3); margin-bottom: 18px; line-height: 1.6; }
          .lp-app-badges { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
          .lp-app-badges img { height: 32px; cursor: pointer; border-radius: 5px; }
          .lp-qr-area {
            display: flex; align-items: center; gap: 12px;
            padding-top: 16px; border-top: 1px solid var(--border);
          }
          .lp-qr-img { width: 54px; height: 54px; border: 1px solid var(--border); border-radius: 8px; padding: 3px; background: white; }
          .lp-qr-text { font-size: 11.5px; font-weight: 700; color: var(--text-2); line-height: 1.5; }

          /* Mobile preview pinned to bottom of app card, animated float */
          .lp-app-phone-area {
            background: var(--bg-1);
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: center;
            align-items: flex-end;
            padding-top: 18px;
            overflow: hidden;
            min-height: 190px;
          }
          .lp-app-phone-area img {
            width: 138px;
            display: block;
            border-radius: 20px 20px 0 0;
            animation: lp-float 3.6s ease-in-out infinite;
          }

          /* Stats banner */
          .lp-stats-banner {
            position: relative;
            border-radius: 20px;
            overflow: hidden;
            padding: 34px 30px;
            display: flex; flex-direction: column; justify-content: center;
            color: white;
            min-height: 360px;
          }
          .lp-stats-bg {
            position: absolute; inset: 0; width: 100%; height: 100%;
            object-fit: cover; z-index: 1; filter: brightness(0.25);
          }
          .lp-stats-content { position: relative; z-index: 2; }
          .lp-stats-content h2 {
            font-family: var(--font-display);
            font-size: 23px; font-weight: 400; margin-bottom: 7px;
          }
          .lp-stats-content p {
            font-size: 12.5px; opacity: 0.76; margin-bottom: 26px;
            max-width: 360px; line-height: 1.6;
          }
          .lp-stats-row {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px;
            background: rgba(255,255,255,0.07);
            backdrop-filter: blur(14px);
            padding: 16px; border-radius: 13px;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .lp-stat-box h4 {
            font-family: var(--font-display);
            font-size: 19px; font-weight: 400; margin-bottom: 2px;
            color: var(--accent);
          }
          .lp-stat-box span {
            font-size: 9.5px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7;
          }

          /* ── RESPONSIVE ── */
          @media (max-width: 1100px) {
            .lp-hero-inner { flex-direction: column; text-align: center; padding-top: 100px; }
            .lp-hero-content { max-width: 100%; align-items: center; display: flex; flex-direction: column; }
            .lp-hero-desc { text-align: center; }
            .lp-hero-stats { justify-content: center; }
            .lp-hero-visual { width: 100%; height: 300px; }
            .lp-hero-dashboard { right: auto; left: 50%; transform: translate(-50%, -50%); width: 90%; }
            .lp-hero-phone { left: 2%; bottom: 0; }
            .lp-hero-phone img { width: 110px; }
            .lp-impact-grid { grid-template-columns: 1fr; }
            .lp-services-grid, .lp-dash-grid { grid-template-columns: repeat(2, 1fr); }
            .lp-how-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 700px) {
            .lp-services-grid, .lp-dash-grid, .lp-how-grid { grid-template-columns: 1fr; }
            .lp-stats-row { grid-template-columns: repeat(2, 1fr); }
            .lp-hero h1 { font-size: 26px; }
            .lp-section { padding: 50px 5%; }
            .lp-hero-inner { padding: 86px 5% 48px; }
          }
        `}</style>

        <Navbar />

        {/* ══ HERO ══ */}
        <section className="lp-hero">
          <img src={villageImg} alt="Village" className="lp-hero-bg" />
          <div className="lp-hero-overlay" />

          <div className="lp-hero-inner">
            {/* LEFT: copy */}
            <div className="lp-hero-content">
              <motion.div
                className="lp-trust-pill"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 2.9 }}
              >
                <div className="lp-trust-avatars">
                  <img src={avatarImg} alt="" />
                  <img src={avatarImg} alt="" />
                  <img src={avatarImg} alt="" />
                </div>
                <p className="lp-trust-text">Trusted by <span>50,000+</span> Citizens</p>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 3.0 }}
              >
                Building Cleaner,<br />
                <em>Stronger Villages</em><br />
                Together
              </motion.h1>

              <motion.p
                className="lp-hero-desc"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 3.1 }}
              >
                RuralOps is a unified platform to report issues, track progress, and get things resolved —
                making rural areas cleaner, healthier, and better places to live.
              </motion.p>

              <motion.div
                className="lp-hero-btns"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: token ? 0.2 : 3.2 }}
              >
                {!token ? (
                  <>
                    <Link to="/citizen/register" className="lp-btn-primary">
                      <UserPlus size={15} /> Register Now
                    </Link>
                    <Link to="/login" className="lp-btn-ghost">
                      <LogIn size={15} /> Login
                    </Link>
                  </>
                ) : (
                  <Link to={getDashboardPath()} className="lp-btn-primary">
                    <Layout size={15} /> Go to Dashboard
                  </Link>
                )}
              </motion.div>

              <motion.div
                className="lp-hero-stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 3.35 }}
              >
                <div className="lp-hero-stat"><b>50,000+</b><span>Citizens</span></div>
                <div className="lp-hero-stat"><b>1,200+</b><span>Villages</span></div>
                <div className="lp-hero-stat"><b>15,000+</b><span>Resolved</span></div>
              </motion.div>
            </div>

            {/* RIGHT: dashboard + floating phone, no shadow boxes */}
            <motion.div
              className="lp-hero-visual"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 3.1 }}
            >
              <div className="lp-hero-dashboard">
                <img src={dashboardImg} alt="RuralOps Dashboard" />
              </div>
              <div className="lp-hero-phone">
                <img src={appImg} alt="RuralOps App" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section id="services" className="lp-section lp-section-alt">
          <div className="lp-section-header">
            <span className="lp-section-eyebrow">Everything You Need</span>
            <h2 className="lp-section-title">All Services. One Platform.</h2>
          </div>
          <div className="lp-services-grid">
            {[
              { icon: <FileText size={17} />, title: "Issue Reporting", desc: "Report any issue in your village in just a few clicks." },
              { icon: <MapPin size={17} />, title: "Real-time Tracking", desc: "Track the status of your issue in real time." },
              { icon: <Layout size={17} />, title: "Multiple Services", desc: "Access a wide range of rural services online." },
              { icon: <Users size={17} />, title: "Role-based Access", desc: "Separate dashboards for citizens, officers & admins." },
              { icon: <ShieldCheck size={17} />, title: "Transparency", desc: "Every step is tracked and visible to everyone." },
              { icon: <Smartphone size={17} />, title: "Mobile App", desc: "Use our app for faster and easier access." }
            ].map((s, idx) => (
              <motion.div
                key={idx}
                className="lp-service-card"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.38, delay: idx * 0.055 }}
              >
                <div className="lp-service-icon">{s.icon}</div>
                <div><h3>{s.title}</h3><p>{s.desc}</p></div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="lp-section">
          <div className="lp-section-header">
            <span className="lp-section-eyebrow">Our Process</span>
            <h2 className="lp-section-title">How RuralOps Works</h2>
          </div>
          <div className="lp-how-grid">
            {[
              { img: step1Img, num: 1, title: "Citizen Reports", desc: "Citizen submits an issue with details and location." },
              { img: step2Img, num: 2, title: "Officer Reviews", desc: "The concerned officer reviews and takes action." },
              { img: step3Img, num: 3, title: "Work in Progress", desc: "Issue is assigned and work is initiated." },
              { img: step4Img, num: 4, title: "Issue Resolved", desc: "Citizen is notified once the issue is resolved." }
            ].map((h, i) => (
              <motion.div
                key={i}
                className="lp-how-card"
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.38, delay: i * 0.065 }}
              >
                <div className="lp-how-num">{h.num}</div>
                <div className="lp-how-icon-box"><img src={h.img} alt={`Step ${h.num}`} /></div>
                <h4>{h.title}</h4>
                <p>{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── DASHBOARDS ── */}
        <section className="lp-section lp-section-alt">
          <div className="lp-section-header">
            <span className="lp-section-eyebrow">Tailored Experience</span>
            <h2 className="lp-section-title">Dashboards for Every Role</h2>
          </div>
          <div className="lp-dash-grid">
            {[
              { title: "Citizen Dashboard", desc: "Report issues, track status, and get updates.", feats: ["Report Issue", "Track Issue", "View Notifications", "Service Requests"], img: charCitizenImg, link: "/citizen/register" },
              { title: "VAO Dashboard", desc: "Manage issues, assign tasks, and update progress.", feats: ["Assigned Issues", "Update Status", "Field Verification", "Reports & Analytics"], img: charOfficerImg, link: "/login" },
              { title: "Admin Dashboard", desc: "Monitor all activities, manage users and services.", feats: ["User Management", "Issue Analytics", "Service Management", "System Settings"], img: charAdminImg, link: "/login" }
            ].map((d, i) => (
              <motion.div
                key={i}
                className="lp-dash-card"
                initial={{ opacity: 0, y: 13 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.42, delay: i * 0.08 }}
              >
                <div className="lp-dash-content">
                  <h3>{d.title}</h3>
                  <p>{d.desc}</p>
                  <ul className="lp-dash-list">
                    {d.feats.map(f => <li key={f}><CheckCircle2 size={12} /> {f}</li>)}
                  </ul>
                  <Link to={d.link} className="lp-dash-link">Explore Dashboard <ArrowRight size={12} /></Link>
                </div>
                <div className="lp-dash-img-box"><img src={d.img} alt={d.title} /></div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── IMPACT & APP ── */}
        <section className="lp-section">
          <div className="lp-impact-grid">

            {/* Left: App download card with floating phone at bottom */}
            <motion.div
              className="lp-app-card"
              initial={{ opacity: 0, x: -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="lp-app-card-body">
                <h2>Take RuralOps Anywhere</h2>
                <p>Download our mobile app and stay connected with your village anytime, anywhere.</p>
                <div className="lp-app-badges">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" />
                </div>
                <div className="lp-qr-area">
                  <img src={qrImg} alt="QR Code" className="lp-qr-img" />
                  <div className="lp-qr-text">Scan to download<br />RuralOps Mobile App</div>
                </div>
              </div>
              {/* Floating phone preview pinned to bottom of card */}
              <div className="lp-app-phone-area">
                <img src={appImg} alt="App Preview" />
              </div>
            </motion.div>

            {/* Right: Stats banner */}
            <motion.div
              className="lp-stats-banner"
              initial={{ opacity: 0, x: 14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <img src={villageImg} alt="Impact" className="lp-stats-bg" />
              <div className="lp-stats-content">
                <h2>Making a Real Impact</h2>
                <p>Together, we are building a better tomorrow for rural communities across the nation.</p>
                <div className="lp-stats-row">
                  <div className="lp-stat-box"><h4>50K+</h4><span>Citizens</span></div>
                  <div className="lp-stat-box"><h4>1,200+</h4><span>Villages</span></div>
                  <div className="lp-stat-box"><h4>15K+</h4><span>Resolved</span></div>
                  <div className="lp-stat-box"><h4>98%</h4><span>Success</span></div>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}