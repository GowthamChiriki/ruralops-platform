import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Menu, X, ChevronDown, ArrowRight, Sun, Moon, 
  Shield, Users, LogOut, User, Layout, Settings, RefreshCw
} from "lucide-react";
import logo from "../assets/ruralops-logo.png";

const API = "https://ruralops-platform-production.up.railway.app";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/#services" },
  { 
    label: "Dashboards", 
    children: [
      { label: "Citizen Dashboard", path: "/citizen/register" },
      { label: "VAO Dashboard", path: "/login" },
      { label: "Worker Dashboard", path: "/login" },
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

const ROLE_CONFIG = {
  CITIZEN: { label: "Citizen", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", icon: User, path: "/citizen/dashboard" },
  VAO:     { label: "Village Officer", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", icon: Shield, path: "/vao/dashboard" },
  WORKER:  { label: "Field Worker", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", icon: Users, path: "/worker/dashboard" },
  MAO:     { label: "Mandal Officer", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)", icon: Shield, path: "/mao/dashboard" },
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem("ruralops-theme") || "light");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const roleDropdownRef = useRef(null);

  // Auth State
  const token = localStorage.getItem("accessToken");
  const accountType = localStorage.getItem("accountType");
  const accountId = localStorage.getItem("accountId");
  const rawRoles = localStorage.getItem("roles");
  const roles = rawRoles ? JSON.parse(rawRoles) : [];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleClickOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setRoleOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousedown", handleClickOutside);
    document.documentElement.setAttribute("data-theme", theme);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("ruralops-theme", newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accountType");
    localStorage.removeItem("accountId");
    localStorage.removeItem("villageId");
    localStorage.removeItem("roles");
    navigate("/login");
  };

  const switchRole = async (newRole) => {
    if (newRole === accountType) {
      setRoleOpen(false);
      return;
    }

    setSwitching(true);
    setRoleOpen(false);

    const currentToken = localStorage.getItem("accessToken");
    
    try {
      // 1. Call the specific role switching endpoint with the current token
      const res = await fetch(`${API}/auth/switch-role`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Switch failed");

      const data = await res.json();
      
      // 2. Update session with the new role-specific token
      localStorage.setItem("accessToken",  data.accessToken);
      // Preserve existing refresh token if the switch response doesn't provide a new one
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      localStorage.setItem("accountType",  newRole);
      localStorage.setItem("accountId",    data.accountId);
      localStorage.setItem("villageId",    data.villageId ?? "");
      
      // 3. Navigate to the appropriate dashboard
      const path = ROLE_CONFIG[newRole]?.path || "/";
      if (newRole === "VAO") {
        navigate(`${path}/${data.accountId}`);
      } else {
        navigate(path);
      }
      
      // 4. Force a clean reload to initialize the new portal context
      window.location.reload();
    } catch (err) {
      console.error("Role switch error:", err);
      // Fallback: update accountType and reload, though backend may still 403 
      // if the token doesn't have the necessary claims.
      localStorage.setItem("accountType", newRole);
      window.location.reload();
    } finally {
      setSwitching(false);
    }
  };

  const getDashboardPath = () => {
    if (!token) return "/";
    const base = ROLE_CONFIG[accountType]?.path || "/";
    return accountType === "VAO" ? `${base}/${accountId}` : base;
  };

  const isHome = location.pathname === "/";
  const currentRole = ROLE_CONFIG[accountType] || { label: accountType, color: "var(--accent)", icon: Shield };

  return (
    <nav className={`nb-root ${scrolled ? "nb-scrolled" : ""} ${isHome && !scrolled ? "nb-on-hero" : ""}`}>
      <style>{`
        .nb-root {
          position: fixed; top: 0; left: 0; right: 0;
          height: 100px; display: flex; align-items: center;
          padding: 0 5%; z-index: 2000;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background: transparent; width: 100%;
        }

        .nb-scrolled {
          background: var(--bg-glass); backdrop-filter: blur(16px);
          height: 80px; box-shadow: 0 4px 30px rgba(0,0,0,0.08);
          border-bottom: 1px solid var(--border);
        }

        .nb-logo-area {
          display: flex; align-items: center; gap: 14px;
          text-decoration: none; cursor: pointer; flex-shrink: 0;
          margin-right: 48px;
        }

        .nb-logo {
          height: 52px; width: auto; object-fit: contain;
          transition: 0.3s; filter: drop-shadow(0 0 8px rgba(0,0,0,0.1));
        }

        .nb-scrolled .nb-logo { height: 44px; }

        .nb-brand {
          font-size: 24px; font-weight: 900; color: var(--text-1);
          line-height: 1; letter-spacing: -0.03em;
        }

        .nb-tagline {
          font-size: 10px; font-weight: 800; color: var(--accent);
          text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;
        }

        .nb-on-hero .nb-brand, .nb-on-hero .nb-link, 
        .nb-on-hero .nb-lang, .nb-on-hero .nb-btn-login {
          color: #ffffff !important;
        }
        
        .nb-on-hero .nb-theme-btn {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          color: #ffffff;
        }

        .nb-links {
          flex: 1; display: flex; align-items: center; gap: 32px;
        }

        .nb-link-item { position: relative; }

        .nb-link {
          font-size: 15px; font-weight: 600; color: var(--text-2);
          text-decoration: none; display: flex; align-items: center;
          gap: 5px; transition: 0.25s; padding: 10px 0; white-space: nowrap;
        }

        .nb-link:hover, .nb-link.active { color: var(--accent) !important; }

        .nb-dropdown {
          position: absolute; top: 100%; left: 0;
          background: var(--bg-0); border: 1px solid var(--border);
          border-radius: 16px; padding: 8px; min-width: 220px;
          box-shadow: var(--shadow-2xl); display: none;
          animation: nb-fade-up 0.3s ease;
        }

        .nb-link-item:hover .nb-dropdown { display: block; }

        @keyframes nb-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes nb-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .nb-spin { animation: nb-spin 1.5s linear infinite; }

        .nb-dd-link {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; font-size: 14px; font-weight: 600;
          color: var(--text-2); text-decoration: none;
          border-radius: 10px; transition: 0.2s;
        }

        .nb-dd-link:hover { background: var(--accent-soft); color: var(--accent); }

        .nb-actions {
          display: flex; align-items: center; gap: 16px;
        }

        .nb-theme-btn {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border); background: var(--bg-0);
          color: var(--text-2); cursor: pointer; transition: 0.2s;
        }
        .nb-theme-btn:hover { border-color: var(--accent); color: var(--accent); }

        /* Portal Switcher Pill */
        .nb-portal-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 14px;
          cursor: pointer; position: relative;
          transition: 0.3s; font-weight: 700; font-size: 13px;
          border: 1px solid var(--border);
          background: var(--bg-0); color: var(--text-1);
        }
        .nb-portal-pill:hover { border-color: var(--accent); transform: translateY(-1px); }
        
        .nb-portal-icon {
          width: 24px; height: 24px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 0 12px rgba(0,0,0,0.1);
        }

        .nb-portal-dropdown {
          position: absolute; top: calc(100% + 12px); right: 0;
          width: 260px; background: var(--bg-0); border: 1px solid var(--border);
          border-radius: 20px; padding: 12px; box-shadow: var(--shadow-2xl);
          animation: nb-fade-up 0.3s ease; z-index: 2001;
        }

        .nb-pd-header {
          font-size: 11px; font-weight: 800; color: var(--text-3);
          text-transform: uppercase; letter-spacing: 0.08em;
          margin: 4px 8px 12px;
        }

        .nb-pd-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 12px;
          cursor: pointer; transition: 0.2s; margin-bottom: 4px;
        }
        .nb-pd-item:last-child { margin-bottom: 0; }
        .nb-pd-item:hover { background: var(--bg-1); }
        .nb-pd-item.active { background: var(--accent-soft); border: 1px solid var(--accent-soft); }

        .nb-pd-icon {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }

        .nb-pd-info { display: flex; flex-direction: column; }
        .nb-pd-label { font-size: 14px; font-weight: 700; color: var(--text-1); }
        .nb-pd-status { font-size: 11px; color: var(--text-3); font-weight: 500; }

        .nb-btn-login {
          font-size: 15px; font-weight: 700; color: var(--text-2);
          text-decoration: none; margin-right: 8px;
        }

        .nb-btn-cta {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
          color: white !important; padding: 12px 24px; border-radius: 14px;
          font-weight: 700; font-size: 14px; text-decoration: none;
          transition: 0.3s; box-shadow: 0 4px 15px rgba(34,197,94,0.25);
          display: flex; align-items: center; gap: 8px;
        }
        .nb-btn-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(34,197,94,0.4); }

        .nb-btn-logout {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 12px;
          font-weight: 700; font-size: 13px; cursor: pointer;
          transition: 0.2s; border: none;
          background: rgba(239, 68, 68, 0.1); color: #ef4444;
        }
        .nb-btn-logout:hover { background: #ef4444; color: #ffffff; }

        .nb-mobile-toggle { display: none; color: var(--text-1); cursor: pointer; }

        @media (max-width: 1200px) {
          .nb-links { display: none; }
          .nb-mobile-toggle { display: block; }
          .nb-actions .nb-btn-login { display: none; }
        }
      `}</style>

      <div className="nb-logo-area" onClick={() => navigate("/")}>
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
        <button className="nb-theme-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {!token ? (
          <>
            <Link to="/login" className="nb-btn-login">Login</Link>
            <Link to="/citizen/register" className="nb-btn-cta">
              Get Started <ArrowRight size={16} />
            </Link>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="nb-portal-switcher" ref={roleDropdownRef} style={{ position: "relative" }}>
              <div 
                className="nb-portal-pill" 
                onClick={() => setRoleOpen(!roleOpen)}
              >
                <div className="nb-portal-icon" style={{ backgroundColor: currentRole.color }}>
                  {switching ? <RefreshCw size={14} className="nb-spin" /> : <currentRole.icon size={14} />}
                </div>
                <span>{switching ? "Switching..." : currentRole.label}</span>
                {roles.length > 1 && !switching && <ChevronDown size={14} opacity={0.5} />}
              </div>

              <AnimatePresence>
                {roleOpen && roles.length > 1 && (
                  <motion.div 
                    className="nb-portal-dropdown"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="nb-pd-header">Switch Portal</div>
                    {roles.map((r) => {
                      const cfg = ROLE_CONFIG[r];
                      if (!cfg) return null;
                      return (
                        <div 
                          key={r} 
                          className={`nb-pd-item ${accountType === r ? "active" : ""}`}
                          onClick={() => switchRole(r)}
                        >
                          <div className="nb-pd-icon" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                            <cfg.icon size={18} />
                          </div>
                          <div className="nb-pd-info">
                            <span className="nb-pd-label">{cfg.label}</span>
                            <span className="nb-pd-status">{accountType === r ? "Active" : "Switch to Portal"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="nb-btn-logout" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
        
        <button className="nb-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            className="nb-mobile-menu"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="nb-mm-header">
              <img src={logo} alt="RuralOps" height="32" />
              <button className="nb-mm-close" onClick={() => setMenuOpen(false)}><X size={24} /></button>
            </div>
            <div className="nb-mm-links">
              {NAV_LINKS.map((link) => (
                <div key={link.label} className="nb-mm-link-group">
                  <Link 
                    to={link.label === "Home" && token ? getDashboardPath() : (link.path || "#")} 
                    className="nb-mm-link"
                    onClick={() => !link.children && setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="nb-mm-sublinks">
                      {link.children.map((child) => (
                        <Link 
                          key={child.label} 
                          to={child.path} 
                          className="nb-mm-sublink"
                          onClick={() => setMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!token && (
              <div className="nb-mm-actions">
                <Link to="/login" className="nb-btn-login" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/citizen/register" className="nb-btn-cta" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        .nb-mobile-menu {
          position: fixed; inset: 0; background: var(--bg-0);
          z-index: 2100; padding: 24px; display: flex; flex-direction: column;
        }
        .nb-mm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .nb-mm-close { background: none; border: none; color: var(--text-1); cursor: pointer; }
        .nb-mm-links { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
        .nb-mm-link { font-size: 20px; font-weight: 800; color: var(--text-1); text-decoration: none; }
        .nb-mm-sublinks { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; padding-left: 16px; border-left: 2px solid var(--accent-soft); }
        .nb-mm-sublink { font-size: 16px; font-weight: 600; color: var(--text-3); text-decoration: none; }
        .nb-mm-actions { padding-top: 24px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 16px; }
      `}</style>
    </nav>
  );
}
