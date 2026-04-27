import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/ruralops-logo.png";
import "../styles/Navbar.css";

const API = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

const NAV_LINKS = [
  {
    label: "Platform",
    to: "/platform",
    dropdown: [
      { label: "Overview",         to: "/platform",         desc: "The full scope of RuralOps",          icon: "grid",    tag: "Core"   },
      { label: "Citizen Portal",   to: "/citizen/register", desc: "Register and create your account",    icon: "user",    tag: "Access" },
      { label: "Status Check",     to: "/citizen/status",   desc: "Track complaints & scheme status",    icon: "list",    tag: "Track"  },
      { label: "Activate Account", to: "/activate-account", desc: "Complete your account setup",         icon: "check",   tag: "Setup"  },
      { label: "Live Dashboard",   to: "/live",             desc: "Real-time operations command center", icon: "signal",  tag: "Live"   },
    ],
  },
  {
    label: "Roles",
    to: "/roles",
    dropdown: [
      { label: "Citizens",         to: "/roles/citizen",  icon: "home"    },
      { label: "Field Workers",    to: "/roles/worker",   icon: "tool"    },
      { label: "Village Officers", to: "/roles/vao",      icon: "shield"  },
      { label: "Mandal Officers",  to: "/roles/mao",      icon: "balance" },
      { label: "District Admin",   to: "/roles/district", icon: "map"     },
    ],
  },
  {
    label: "Documentation",
    to: "/documentation",
  },
];

const ROLE_CONFIG = {
  CITIZEN: { label: "Citizen",        badge: "Citizen", color: "#126b52", bg: "rgba(18,107,82,0.08)", border: "rgba(18,107,82,0.20)" },
  VAO:     { label: "Village Officer", badge: "VAO",     color: "#1d6faa", bg: "rgba(29,111,170,0.08)", border: "rgba(29,111,170,0.20)" },
  MAO:     { label: "Mandal Officer",  badge: "MAO",     color: "#b45309", bg: "rgba(180,83,9,0.08)",  border: "rgba(180,83,9,0.20)"  },
  WORKER:  { label: "Field Worker",   badge: "Worker",  color: "#6d28d9", bg: "rgba(109,40,217,0.08)", border: "rgba(109,40,217,0.20)" },
};

/* ── Icon components (no emoji, pure SVG) ── */
const Icon = ({ name, size = 14 }) => {
  const paths = {
    grid:    <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    user:    <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    list:    <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    check:   <><polyline points="20 6 9 17 4 12"/></>,
    signal:  <><line x1="1" y1="6" x2="1" y2="18"/><line x1="6" y1="2" x2="6" y2="22"/><line x1="11" y1="8" x2="11" y2="16"/><line x1="16" y1="4" x2="16" y2="20"/><line x1="21" y1="10" x2="21" y2="14"/></>,
    home:    <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    tool:    <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    shield:  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    balance: <><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    map:     <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
    chevron: <><polyline points="9 18 15 12 9 6"/></>,
    logout:  <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    sun:     <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    moon:    <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    menu:    <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    close:   <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

/* ── Role badge dot ── */
const RoleDot = ({ color }) => (
  <span className="nb-role-dot" style={{ background: color }} />
);

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [activeDD,      setActiveDD]      = useState(null);
  const [scrolled,      setScrolled]      = useState(false);
  const [isLoggedIn,    setIsLoggedIn]    = useState(false);
  const [loggingOut,    setLoggingOut]    = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const navRef = useRef(null);

  /* Close on route change */
  useEffect(() => { setMenuOpen(false); setActiveDD(null); }, [location.pathname]);

  /* Scroll detection */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* Click outside → close dropdown */
  useEffect(() => {
    const fn = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setActiveDD(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* Lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  /* Session validation — full backend logic preserved */
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
        ["accessToken","refreshToken","accountId","accountType","villageId","roles"]
          .forEach(k => localStorage.removeItem(k));
        setIsLoggedIn(false);
      }
    };
    validateSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Logout — full backend logic preserved */
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
    ["accessToken","refreshToken","accountId","accountType","villageId","roles"]
      .forEach(k => localStorage.removeItem(k));
    setIsLoggedIn(false);
    setLoggingOut(false);
    navigate("/login");
  }, [navigate]);

  /* Role switch — full backend logic preserved */
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
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("accountType", data.activeRole);
      if (data.accountId) localStorage.setItem("accountId", data.accountId);
      switch (data.activeRole) {
        case "CITIZEN": navigate("/citizen/dashboard"); break;
        case "WORKER":  navigate("/worker/dashboard");  break;
        case "VAO":     navigate(`/vao/dashboard/${data.accountId}`); break;
        case "MAO":     navigate("/mao/dashboard");     break;
        default:        navigate("/");
      }
    } catch (err) { console.error("Role switch error:", err); }
    finally { setSwitchingRole(false); }
  }, [navigate, switchingRole]);

  /* Derived state */
  const accountType    = (localStorage.getItem("accountType") || "").toUpperCase();
  const accountId      = localStorage.getItem("accountId") || "";
  const availableRoles = (() => {
    try { return JSON.parse(localStorage.getItem("roles") || "[]"); }
    catch { return []; }
  })();
  const canSwitchRoles = availableRoles.length > 1;
  const role           = ROLE_CONFIG[accountType] ?? {
    label: "Account", badge: "User",
    color: "#126b52", bg: "rgba(18,107,82,0.08)", border: "rgba(18,107,82,0.20)",
  };

  const dashboardPath = (() => {
    if (accountType === "CITIZEN") return "/citizen/dashboard";
    if (accountType === "VAO")     return `/vao/dashboard/${accountId}`;
    if (accountType === "MAO")     return "/mao/dashboard";
    if (accountType === "WORKER")  return "/worker/dashboard";
    return "/";
  })();

  const isActive = (link) =>
    location.pathname === link.to || link.dropdown?.some(d => location.pathname === d.to);

  return (
    <>
      <nav
        className={`nb${scrolled ? " nb--scrolled" : ""}${menuOpen ? " nb--menu-open" : ""}`}
        ref={navRef}
      >
        {/* Accent top line */}
        <div className="nb-accent-line" aria-hidden="true" />

        {/* ── Brand ── */}
        <button className="nb-brand" onClick={() => navigate("/")} aria-label="RuralOps home">
          <div className="nb-logo-mark">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect x="2"  y="2"  width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
              <rect x="10" y="2"  width="6" height="6" rx="1.5" fill="white" opacity="0.5"/>
              <rect x="2"  y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.5"/>
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
            </svg>
          </div>
          <div className="nb-brand-text">
            <div className="nb-brand-row">
              <span className="nb-brand-name">RuralOps</span>
              <span className="nb-version-tag">v2.4</span>
            </div>
            <span className="nb-brand-sub">Governance Platform</span>
          </div>
        </button>

        {/* ── Desktop nav links ── */}
        <div className="nb-links" role="navigation" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <div key={link.label} className="nb-item">
              {link.dropdown ? (
                <>
                  <button
                    className={`nb-link${isActive(link) ? " nb-link--active" : ""}`}
                    onClick={() => setActiveDD(p => p === link.label ? null : link.label)}
                    aria-expanded={activeDD === link.label}
                    aria-haspopup="true"
                  >
                    {link.label}
                    <span className={`nb-chevron-wrap${activeDD === link.label ? " nb-chevron-wrap--open" : ""}`}>
                      <Icon name="chevron" size={12} />
                    </span>
                  </button>

                  {activeDD === link.label && (
                    <div className="nb-dropdown" role="menu">
                      <div className="nb-dropdown-inner">
                        <div className="nb-dd-header">
                          <span className="nb-dd-header-label">{link.label}</span>
                        </div>
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            role="menuitem"
                            className={`nb-dd-item${location.pathname === item.to ? " nb-dd-item--active" : ""}`}
                          >
                            <span className="nb-dd-icon-wrap">
                              <Icon name={item.icon} size={13} />
                            </span>
                            <span className="nb-dd-text">
                              <span className="nb-dd-label">{item.label}</span>
                              {item.desc && <span className="nb-dd-desc">{item.desc}</span>}
                            </span>
                            {item.tag && <span className="nb-dd-tag">{item.tag}</span>}
                            <span className="nb-dd-arrow">
                              <Icon name="chevron" size={11} />
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={link.to}
                  className={`nb-link${isActive(link) ? " nb-link--active" : ""}`}
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* ── Right controls ── */}
        <div className="nb-right">
          {isLoggedIn ? (
            <div className="nb-auth-logged">

              {/* Role pill / switcher */}
              {canSwitchRoles ? (
                <div className="nb-role-wrapper">
                  <button
                    className="nb-role-pill"
                    onClick={() => setActiveDD(p => p === "roles" ? null : "roles")}
                    disabled={switchingRole}
                    aria-expanded={activeDD === "roles"}
                    style={{ "--rc": role.color, "--rb": role.bg, "--rbd": role.border }}
                  >
                    <RoleDot color={role.color} />
                    <span className="nb-role-label">
                      {switchingRole ? "Switching…" : role.label}
                    </span>
                    {accountId && (
                      <span className="nb-role-id">#{accountId.slice(-5)}</span>
                    )}
                    <span className={`nb-chevron-wrap${activeDD === "roles" ? " nb-chevron-wrap--open" : ""}`}>
                      <Icon name="chevron" size={11} />
                    </span>
                  </button>

                  {activeDD === "roles" && (
                    <div className="nb-role-menu" role="menu">
                      <div className="nb-role-menu__header">Switch Role</div>
                      {availableRoles.map((r) => {
                        const cfg = ROLE_CONFIG[r];
                        if (!cfg) return null;
                        const isCurrentRole = r === accountType;
                        return (
                          <button
                            key={r}
                            role="menuitem"
                            className={`nb-role-menu-item${isCurrentRole ? " nb-role-menu-item--active" : ""}`}
                            onClick={() => handleRoleSwitch(r)}
                            style={{ "--rc": cfg.color }}
                          >
                            <RoleDot color={cfg.color} />
                            <span className="nb-role-menu-item__label">{cfg.label}</span>
                            {isCurrentRole && (
                              <span className="nb-role-menu-item__check">
                                <Icon name="check" size={11} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="nb-role-pill"
                  onClick={() => navigate(dashboardPath)}
                  style={{ "--rc": role.color, "--rb": role.bg, "--rbd": role.border }}
                >
                  <RoleDot color={role.color} />
                  <span className="nb-role-label">{role.label}</span>
                  {accountId && (
                    <span className="nb-role-id">#{accountId.slice(-5)}</span>
                  )}
                </button>
              )}

              {/* Logout */}
              <button
                className="nb-logout-btn"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <span className="nb-spinner" aria-hidden="true" />
                ) : (
                  <Icon name="logout" size={13} />
                )}
                <span>{loggingOut ? "Logging out…" : "Logout"}</span>
              </button>
            </div>
          ) : (
            <div className="nb-auth-guest">
              <button
                className="nb-btn-ghost"
                onClick={() => navigate("/citizen/register")}
              >
                Register
              </button>
              <button
                className="nb-btn-primary"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            </div>
          )}
        </div>

        {/* ── Hamburger ── */}
        <button
          className={`nb-hamburger${menuOpen ? " nb-hamburger--open" : ""}`}
          onClick={() => setMenuOpen(p => !p)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={20} />
        </button>
      </nav>

      {/* ── Mobile menu overlay ── */}
      <div
        className={`nb-mobile-backdrop${menuOpen ? " nb-mobile-backdrop--open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`nb-mobile-menu${menuOpen ? " nb-mobile-menu--open" : ""}`}
        role="dialog"
        aria-label="Mobile navigation"
        aria-modal="true"
      >
        <div className="nb-mobile-menu-inner">

          {/* Links */}
          <div className="nb-mob-links">
            {NAV_LINKS.map((link) => (
              <div key={link.label} className="nb-mob-section">
                {link.dropdown ? (
                  <>
                    <button
                      className={`nb-mob-group-btn${isActive(link) ? " nb-mob-group-btn--active" : ""}`}
                      onClick={() => setActiveDD(p => p === link.label ? null : link.label)}
                    >
                      <span>{link.label}</span>
                      <span className={`nb-chevron-wrap${activeDD === link.label ? " nb-chevron-wrap--open" : ""}`}>
                        <Icon name="chevron" size={13} />
                      </span>
                    </button>

                    {activeDD === link.label && (
                      <div className="nb-mob-sub">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`nb-mob-sub-item${location.pathname === item.to ? " nb-mob-sub-item--active" : ""}`}
                          >
                            <span className="nb-mob-sub-icon">
                              <Icon name={item.icon} size={13} />
                            </span>
                            <span>{item.label}</span>
                            {item.tag && <span className="nb-mob-tag">{item.tag}</span>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={link.to}
                    className={`nb-mob-link${isActive(link) ? " nb-mob-link--active" : ""}`}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="nb-mob-footer">
            {isLoggedIn ? (
              <>
                {/* Role card */}
                <div
                  className="nb-mob-role-card"
                  style={{ "--rb": role.bg, "--rbd": role.border, "--rc": role.color }}
                >
                  <RoleDot color={role.color} />
                  <div className="nb-mob-role-info">
                    <p className="nb-mob-role-name">{role.label}</p>
                    {accountId && (
                      <p className="nb-mob-role-id">#{accountId}</p>
                    )}
                  </div>
                  <span
                    className="nb-mob-role-badge"
                    style={{ background: role.bg, color: role.color, borderColor: role.border }}
                  >
                    {role.badge}
                  </span>
                </div>

                {/* Role switcher in mobile */}
                {canSwitchRoles && (
                  <div className="nb-mob-role-switcher">
                    <p className="nb-mob-switcher-label">Switch Role</p>
                    <div className="nb-mob-switcher-list">
                      {availableRoles.map((r) => {
                        const cfg = ROLE_CONFIG[r];
                        if (!cfg) return null;
                        return (
                          <button
                            key={r}
                            className={`nb-mob-switch-btn${r === accountType ? " nb-mob-switch-btn--active" : ""}`}
                            onClick={() => { handleRoleSwitch(r); setMenuOpen(false); }}
                            disabled={switchingRole}
                            style={{ "--rc": cfg.color }}
                          >
                            <RoleDot color={cfg.color} />
                            {cfg.label}
                            {r === accountType && <Icon name="check" size={11} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="nb-mob-action-row">
                  <button
                    className="nb-mob-action nb-mob-action--dash"
                    onClick={() => { navigate(dashboardPath); setMenuOpen(false); }}
                  >
                    Dashboard
                  </button>
                  <button
                    className="nb-mob-action nb-mob-action--logout"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? "Logging out…" : "Logout"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="nb-mob-gov-badge">
                  <span className="nb-mob-gov-dot" />
                  <span>Govt. of India · Official Portal</span>
                </div>
                <div className="nb-mob-action-row">
                  <button
                    className="nb-mob-action nb-mob-action--login"
                    onClick={() => { navigate("/login"); setMenuOpen(false); }}
                  >
                    Login
                  </button>
                  <button
                    className="nb-mob-action nb-mob-action--register"
                    onClick={() => { navigate("/citizen/register"); setMenuOpen(false); }}
                  >
                    Register
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}