import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/ruralops-logo.png";
import "../Styles/Navbar.css";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const NAV_LINKS = [
  {
    label: "Platform",
    to: "/platform",
    icon: "⚔",
    dropdown: [
      { label: "Overview",         to: "/platform",         desc: "The full might of RuralOps",          icon: "🌐", tag: "Core"   },
      { label: "Citizen Portal",   to: "/citizen/register", desc: "Register and claim your account",     icon: "👤", tag: "Access" },
      { label: "Status Check",     to: "/citizen/status",   desc: "Track complaints & scheme status",    icon: "📋", tag: "Track"  },
      { label: "Activate Account", to: "/activate-account", desc: "Complete your account setup",         icon: "✅", tag: "Setup"  },
      { label: "Live Dashboard",   to: "/live",             desc: "Real-time operations command center", icon: "📡", tag: "Live"   },
    ],
  },
  {
    label: "Roles",
    to: "/roles",
    icon: "🏛",
    dropdown: [
      { label: "Citizens",         to: "/roles/citizen",  icon: "🏘️" },
      { label: "Field Workers",    to: "/roles/worker",   icon: "🔧" },
      { label: "Village Officers", to: "/roles/vao",      icon: "🏛️" },
      { label: "Mandal Officers",  to: "/roles/mao",      icon: "⚖️" },
      { label: "District Admin",   to: "/roles/district", icon: "🗺️" },
    ],
  },
  {
    label: "Documentation",
    to: "/documentation",
    icon: "📖",
  },
];

/* ── ROLE_CONFIG ── */
const ROLE_CONFIG = {
  CITIZEN: {
    label:  "Citizen",
    badge:  "Citizen",
    icon:   "👤",
    color:  "#378a55",
    bg:     "rgba(55,138,85,0.10)",
    border: "rgba(55,138,85,0.28)",
  },
  VAO: {
    label:  "Village Officer",
    badge:  "VAO",
    icon:   "🏛️",
    color:  "#236e80",
    bg:     "rgba(35,110,128,0.10)",
    border: "rgba(35,110,128,0.28)",
  },
  MAO: {
    label:  "Mandal Officer",
    badge:  "MAO",
    icon:   "⚖️",
    color:  "#c07818",
    bg:     "rgba(192,120,24,0.10)",
    border: "rgba(192,120,24,0.28)",
  },
  WORKER: {
    label:  "Field Worker",
    badge:  "Worker",
    icon:   "🔧",
    color:  "#7c5cfc",
    bg:     "rgba(124,92,252,0.10)",
    border: "rgba(124,92,252,0.28)",
  },
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [activeDD,      setActiveDD]      = useState(null);
  const [scrolled,      setScrolled]      = useState(false);
  const [isLoggedIn,    setIsLoggedIn]    = useState(false);
  const [loggingOut,    setLoggingOut]    = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const navRef = useRef(null);

  /* Close menu + dropdown on route change */
  useEffect(() => {
    setMenuOpen(false);
    setActiveDD(null);
  }, [location.pathname]);

  /* Scroll shadow */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* Click-outside closes dropdown */
  useEffect(() => {
    const fn = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setActiveDD(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* Session validation — runs once on mount */
  useEffect(() => {
    const validateSession = async () => {
      const token        = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!token) { setIsLoggedIn(false); return; }

      try {
        const res = await fetch(`${API}/auth/validate`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) { setIsLoggedIn(true); return; }

        if (refreshToken) {
          const refreshRes = await fetch(`${API}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (!refreshRes.ok) throw new Error("Session expired");

          const data = await refreshRes.json();
          localStorage.setItem("accessToken",  data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          setIsLoggedIn(true);
          return;
        }

        throw new Error("No refresh token");

      } catch {
        ["accessToken", "refreshToken", "accountId", "accountType", "villageId", "roles"]
          .forEach(k => localStorage.removeItem(k));
        setIsLoggedIn(false);
      }
    };

    validateSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Logout */
  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    const refreshToken = localStorage.getItem("refreshToken");
    const accessToken  = localStorage.getItem("accessToken");
    try {
      if (refreshToken) {
        await fetch(`${API}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {}
    ["accessToken", "refreshToken", "accountId", "accountType", "villageId", "roles"]
      .forEach(k => localStorage.removeItem(k));
    setIsLoggedIn(false);
    setLoggingOut(false);
    navigate("/login");
  }, [navigate]);

  /* ── Role switch — calls POST /auth/switch-role, gets new JWT ── */
  const handleRoleSwitch = useCallback(async (newRole) => {
    if (switchingRole) return;
    setActiveDD(null);
    setSwitchingRole(true);
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API}/auth/switch-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Role switch failed");

      const data = await res.json();
      localStorage.setItem("accessToken",  data.accessToken);
      localStorage.setItem("accountType",  data.activeRole);
      // accountId unchanged — same user, different role
      if (data.accountId) localStorage.setItem("accountId", data.accountId);

      // Navigate to the correct dashboard for the new role
      switch (data.activeRole) {
        case "CITIZEN": navigate("/citizen/dashboard");           break;
        case "WORKER":  navigate("/worker/dashboard");           break; // JWT carries identity
        case "VAO":     navigate(`/vao/dashboard/${data.accountId}`); break;
        case "MAO":     navigate("/mao/dashboard");              break;
        default:        navigate("/");
      }
    } catch (err) {
      console.error("Role switch error:", err);
    } finally {
      setSwitchingRole(false);
    }
  }, [navigate, switchingRole]);

  /* ── Derived values (read fresh on every render) ── */
  const accountType = (localStorage.getItem("accountType") || "").toUpperCase();
  const accountId   = localStorage.getItem("accountId") || "";

  // Multi-role support: only show switcher when user has > 1 role
  const availableRoles = (() => {
    try { return JSON.parse(localStorage.getItem("roles") || "[]"); }
    catch { return []; }
  })();
  const canSwitchRoles = availableRoles.length > 1;

  const role = ROLE_CONFIG[accountType] ?? {
    label:  "Account",
    badge:  "User",
    icon:   "👤",
    color:  "#236e80",
    bg:     "rgba(35,110,128,0.10)",
    border: "rgba(35,110,128,0.26)",
  };

  // Fix: WORKER uses identity-agnostic route — no accountId in path
  const dashboardPath = (() => {
    if (accountType === "CITIZEN") return "/citizen/dashboard";
    if (accountType === "VAO")     return `/vao/dashboard/${accountId}`;
    if (accountType === "MAO")     return "/mao/dashboard";
    if (accountType === "WORKER")  return "/worker/dashboard";   // JWT carries identity
    return "/";
  })();

  const isActive = (link) =>
    location.pathname === link.to ||
    link.dropdown?.some((d) => location.pathname === d.to);

  return (
    <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}`} ref={navRef}>

      <div className="nb-top-line" />

      {/* ── BRAND ── */}
      <div className="nb-brand" onClick={() => navigate("/")}>
        <div className="nb-logo-wrap">
          <img src={logo} alt="RuralOps" className="nb-logo" />
        </div>
        <div className="nb-brand-text">
          <div className="nb-brand-row">
            <span className="nb-brand-name">RuralOps</span>
            <span className="nb-version">v2.0</span>
            <span className="nb-gov-seal">⚔</span>
          </div>
          <span className="nb-tagline">Governance · Justice · Command</span>
        </div>
      </div>

      {/* ── DESKTOP NAV LINKS ── */}
      <div className="nb-links">
        {NAV_LINKS.map((link) => (
          <div key={link.label} className="nb-item">
            {link.dropdown ? (
              <>
                <button
                  className={`nb-link ${isActive(link) ? "nb-link--active" : ""}`}
                  onClick={() => setActiveDD(p => p === link.label ? null : link.label)}
                >
                  <span className="nb-link-icon">{link.icon}</span>
                  {link.label}
                  <span className={`nb-chevron${activeDD === link.label ? " nb-chevron--open" : ""}`}>›</span>
                </button>

                {activeDD === link.label && (
                  <div className="nb-dropdown">
                    <div className="nb-dropdown-inner">
                      <div className="nb-dd-header">
                        <span className="nb-dd-header-icon">{link.icon}</span>
                        <span className="nb-dd-header-label">{link.label}</span>
                      </div>
                      {link.dropdown.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`nb-dd-item${location.pathname === item.to ? " nb-dd-item--active" : ""}`}
                        >
                          <span className="nb-dd-emoji">{item.icon}</span>
                          <span className="nb-dd-text">
                            <span className="nb-dd-label">{item.label}</span>
                            {item.desc && <span className="nb-dd-desc">{item.desc}</span>}
                          </span>
                          {item.tag && <span className="nb-dd-tag">{item.tag}</span>}
                          <span className="nb-dd-arrow">›</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link
                to={link.to}
                className={`nb-link ${isActive(link) ? "nb-link--active" : ""}`}
              >
                <span className="nb-link-icon">{link.icon}</span>
                {link.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* ── RIGHT CONTROLS ── */}
      <div className="nb-right">
        {isLoggedIn ? (
          <div className="nb-auth-logged">

            {/* Role pill — simple badge if 1 role, dropdown switcher if multiple */}
            {canSwitchRoles ? (
              <div className="nb-role-wrapper">
                <button
                  className="nb-role-pill"
                  onClick={() => setActiveDD(p => p === "roles" ? null : "roles")}
                  style={{ "--rc": role.color, "--rb": role.bg, "--rbd": role.border }}
                  disabled={switchingRole}
                >
                  <span className="nb-role-crown">♛</span>
                  <span className="nb-role-icon">{role.icon}</span>
                  <span className="nb-role-label">{switchingRole ? "Switching…" : role.label}</span>
                  {accountId && <span className="nb-role-id">#{accountId.slice(-5)}</span>}
                  <span className={`nb-chevron${activeDD === "roles" ? " nb-chevron--open" : ""}`}>›</span>
                  <span className="nb-online-dot" />
                </button>

                {activeDD === "roles" && (
                  <div className="nb-role-switch-menu">
                    <div className="nb-role-switch-menu__header">Switch Role</div>
                    {availableRoles.map((r) => {
                      const cfg = ROLE_CONFIG[r];
                      if (!cfg) return null;
                      return (
                        <button
                          key={r}
                          className={`nb-role-switch-item${r === accountType ? " active" : ""}`}
                          onClick={() => handleRoleSwitch(r)}
                          style={{ "--rc": cfg.color }}
                        >
                          <span className="nb-role-switch-item__icon">{cfg.icon}</span>
                          <span className="nb-role-switch-item__label">{cfg.label}</span>
                          {r === accountType && <span className="nb-role-switch-item__check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Single role — original behaviour, click goes to dashboard */
              <button
                className="nb-role-pill"
                onClick={() => navigate(dashboardPath)}
                style={{ "--rc": role.color, "--rb": role.bg, "--rbd": role.border }}
              >
                <span className="nb-role-crown">♛</span>
                <span className="nb-role-icon">{role.icon}</span>
                <span className="nb-role-label">{role.label}</span>
                {accountId && <span className="nb-role-id">#{accountId.slice(-5)}</span>}
                <span className="nb-online-dot" />
              </button>
            )}

            <button
              className="nb-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut
                ? <><span className="nb-logout-spinner" /> Retreating…</>
                : <>🚪 Logout</>
              }
            </button>
          </div>
        ) : (
          <div className="nb-auth-guest">
            <button className="nb-register-btn" onClick={() => navigate("/citizen/register")}>
              Register
            </button>
            <button className="nb-login-btn" onClick={() => navigate("/login")}>
              ⚔ Enter the Realm
            </button>
          </div>
        )}
      </div>

      {/* ── HAMBURGER ── */}
      <button
        className={`nb-hamburger${menuOpen ? " nb-hamburger--open" : ""}`}
        onClick={() => setMenuOpen(p => !p)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div className="nb-mobile-menu">
          {NAV_LINKS.map((link) => (
            <div key={link.label} className="nb-mob-section">
              {link.dropdown ? (
                <>
                  <button
                    className="nb-mob-group"
                    onClick={() => setActiveDD(p => p === link.label ? null : link.label)}
                  >
                    <span className="nb-mob-icon">{link.icon}</span>
                    {link.label}
                    <span className={`nb-chevron${activeDD === link.label ? " nb-chevron--open" : ""}`}>›</span>
                  </button>
                  {activeDD === link.label && (
                    <div className="nb-mob-sub">
                      {link.dropdown.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`nb-mob-sub-item${location.pathname === item.to ? " nb-link--active" : ""}`}
                        >
                          {item.icon} {item.label}
                          {item.tag && <span className="nb-mob-tag">{item.tag}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={link.to}
                  className={`nb-mob-link${isActive(link) ? " nb-link--active" : ""}`}
                >
                  <span className="nb-mob-icon">{link.icon}</span>
                  {link.label}
                </Link>
              )}
            </div>
          ))}

          <div className="nb-mob-footer">
            {isLoggedIn ? (
              <>
                <div
                  className="nb-mob-role-card"
                  style={{ "--rb": role.bg, "--rbd": role.border }}
                >
                  <div className="nb-mob-role-icon">{role.icon}</div>
                  <div className="nb-mob-role-info">
                    <p className="nb-mob-role-label">{role.label}</p>
                    <p className="nb-mob-role-id">{accountId}</p>
                  </div>
                  <span
                    className="nb-mob-role-badge"
                    style={{ background: role.bg, color: role.color, border: `1px solid ${role.border}` }}
                  >
                    {role.badge}
                  </span>
                </div>

                {/* Mobile role switcher — only when multiple roles available */}
                {canSwitchRoles && (
                  <div className="nb-mob-role-switcher">
                    <p className="nb-mob-role-switcher__label">Switch Role</p>
                    <div className="nb-mob-role-switcher__list">
                      {availableRoles.map((r) => {
                        const cfg = ROLE_CONFIG[r];
                        if (!cfg) return null;
                        return (
                          <button
                            key={r}
                            className={`nb-mob-role-switch-btn${r === accountType ? " active" : ""}`}
                            onClick={() => handleRoleSwitch(r)}
                            style={{ "--rc": cfg.color }}
                            disabled={switchingRole}
                          >
                            {cfg.icon} {cfg.label}
                            {r === accountType && <span> ✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="nb-mob-btn-row">
                  <button className="nb-mob-btn nb-mob-btn--dash" onClick={() => navigate(dashboardPath)}>
                    ⚔ Command
                  </button>
                  <button
                    className="nb-mob-btn nb-mob-btn--logout"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? "Retreating…" : "🚪 Logout"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="nb-mob-gov-badge">
                  <span className="nb-gov-dot" />
                  <span>⚖</span>
                  Govt. of India · Official Portal
                </div>
                <div className="nb-mob-btn-row">
                  <button className="nb-mob-btn nb-mob-btn--login" onClick={() => navigate("/login")}>
                    ⚔ Enter the Realm
                  </button>
                  <button className="nb-mob-btn nb-mob-btn--register" onClick={() => navigate("/citizen/register")}>
                    Register
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </nav>
  );
}