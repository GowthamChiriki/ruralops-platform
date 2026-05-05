import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Menu, X, ChevronDown, ArrowRight, Sun, Moon, Shield, Users } from "lucide-react";
import logo from "../assets/ruralops-logo.png";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/#services" },
  { 
    label: "Dashboards", 
    children: [
      { label: "Citizen Dashboard", path: "/citizen/register" },
      { label: "VAO Dashboard", path: "/login" },
      { label: "Admin Dashboard", path: "/login" },
    ] 
  },
  { 
    label: "Resources", 
    children: [
      { label: "Documentation", path: "/docs" },
      { label: "Help Center", path: "/help" },
      { label: "Village Stats", path: "/stats" },
    ] 
  },
  { label: "About Us", path: "/about" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem("ruralops-theme") || "light");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Auth State
  const token = localStorage.getItem("accessToken");
  const accountType = localStorage.getItem("accountType");
  const accountId = localStorage.getItem("accountId");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    document.documentElement.setAttribute("data-theme", theme);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("ruralops-theme", newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("accountType");
    localStorage.removeItem("accountId");
    localStorage.removeItem("villageId");
    navigate("/login");
  };

  const getDashboardPath = () => {
    if (!token) return "/";
    switch (accountType) {
      case "CITIZEN": return "/citizen/dashboard";
      case "VAO":     return `/vao/dashboard/${accountId}`;
      case "WORKER":  return "/worker/dashboard";
      case "MAO":     return "/mao/dashboard";
      default:        return "/";
    }
  };

  const isHome = location.pathname === "/";

  return (
    <nav className={`nb-root ${scrolled ? "nb-scrolled" : ""} ${isHome && !scrolled ? "nb-on-hero" : ""}`}>
      <style>{`
        .nb-root {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 100px;
          display: flex;
          align-items: center;
          padding: 0 5%;
          z-index: 2000;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background: transparent;
          width: 100%;
        }

        .nb-scrolled {
          background: var(--bg-glass);
          backdrop-filter: blur(16px);
          height: 80px;
          box-shadow: 0 4px 30px rgba(0,0,0,0.08);
          border-bottom: 1px solid var(--border);
        }

        .nb-logo-area {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
          cursor: pointer;
        }

        .nb-logo {
          height: 56px;
          width: auto;
          object-fit: contain;
          transition: 0.3s;
        }

        .nb-scrolled .nb-logo {
          height: 48px;
        }

        .nb-logo-text {
          display: flex;
          flex-direction: column;
        }

        .nb-brand {
          font-size: 24px;
          font-weight: 900;
          color: var(--text-1);
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .nb-tagline {
          font-size: 11px;
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 4px;
        }

        .nb-on-hero .nb-brand,
        .nb-on-hero .nb-link,
        .nb-on-hero .nb-lang,
        .nb-on-hero .nb-user-role {
          color: #ffffff !important;
        }
        
        .nb-on-hero .nb-theme-btn {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          color: #ffffff;
        }

        .nb-links {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 32px;
          margin: 0 40px;
        }

        .nb-link-item {
          position: relative;
        }

        .nb-link {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-2);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: 0.2s;
          padding: 10px 0;
          white-space: nowrap;
        }

        .nb-link:hover, .nb-link.active {
          color: var(--accent) !important;
        }

        .nb-dropdown {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-0);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 10px;
          min-width: 240px;
          box-shadow: var(--shadow-2xl);
          display: none;
          animation: nb-fade-up 0.3s ease;
        }

        .nb-link-item:hover .nb-dropdown {
          display: block;
        }

        @keyframes nb-fade-up {
          from { opacity: 0; transform: translateX(-50%) translateY(15px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .nb-dd-link {
          display: block;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-2);
          text-decoration: none;
          border-radius: 10px;
          transition: 0.2s;
        }

        .nb-dd-link:hover {
          background: var(--accent-soft);
          color: var(--accent);
        }

        .nb-actions {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 20px;
        }

        .nb-lang {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 800;
          color: var(--text-2);
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 10px;
          transition: 0.2s;
          white-space: nowrap;
        }

        .nb-theme-btn {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          background: var(--bg-0);
          color: var(--text-2);
          cursor: pointer;
          transition: 0.2s;
        }

        .nb-user-role {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-2);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--accent-soft);
          color: var(--accent) !important;
          border-radius: 8px;
          text-transform: capitalize;
        }

        .nb-btn-login {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-2);
          text-decoration: none;
          white-space: nowrap;
        }

        .nb-btn-cta {
          background: var(--accent);
          color: white !important;
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 15px;
          text-decoration: none;
          transition: 0.3s;
          box-shadow: 0 4px 15px rgba(34,197,94,0.3);
          white-space: nowrap;
        }

        .nb-btn-cta:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(34,197,94,0.45);
        }

        .nb-btn-logout {
          background: #ef4444;
          color: white !important;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: 0.2s;
        }
        .nb-btn-logout:hover { background: #dc2626; transform: scale(1.02); }

        .nb-mobile-toggle {
          display: none;
          color: var(--text-1);
        }

        @media (max-width: 1300px) {
          .nb-links { gap: 20px; margin: 0 20px; }
          .nb-link { font-size: 14px; }
        }

        @media (max-width: 1200px) {
          .nb-links { display: none; }
          .nb-mobile-toggle { display: block; }
          .nb-actions .nb-btn-login, .nb-actions .nb-lang { display: none; }
        }
      `}</style>

      <div className="nb-logo-area" onClick={() => navigate(getDashboardPath())}>
        <img src={logo} alt="RuralOps" className="nb-logo" />
        <div className="nb-logo-text">
          <span className="nb-brand">RuralOps</span>
          <span className="nb-tagline">Empowering Rural</span>
        </div>
      </div>

      <div className="nb-links">
        {NAV_LINKS.map((link) => (
          <div key={link.label} className="nb-link-item">
            <Link 
              to={link.label === "Home" && token ? getDashboardPath() : (link.path || "#")} 
              className={`nb-link ${location.pathname === link.path ? "active" : ""}`}
            >
              {link.label}
              {link.children && <ChevronDown size={14} />}
            </Link>
            {link.children && (
              <div className="nb-dropdown">
                {link.children.map((child) => (
                  <Link key={child.label} to={child.path} className="nb-dd-link">
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="nb-actions">
        <div className="nb-lang">
          <Globe size={18} />
          <span>EN</span>
          <ChevronDown size={14} />
        </div>
        
        <button className="nb-theme-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {!token ? (
          <>
            <Link to="/login" className="nb-btn-login">Login</Link>
            <Link to="/citizen/register" className="nb-btn-cta">Get Started</Link>
          </>
        ) : (
          <>
            <div className="nb-user-role">
              <Shield size={14} />
              <span>
                {accountType === "VAO" ? "Officer Portal" : 
                 accountType === "CITIZEN" ? "Citizen Portal" : 
                 accountType === "WORKER" ? "Field Staff" : accountType}
              </span>
            </div>
            <button className="nb-btn-logout" onClick={handleLogout}>Logout</button>
          </>
        )}
        
        <button className="nb-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
    </nav>
  );
}