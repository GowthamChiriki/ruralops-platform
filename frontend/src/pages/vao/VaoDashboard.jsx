import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { 
  LayoutDashboard, Users, UserCog, ClipboardList, Map, Shield, 
  Settings, LogOut, Search, Bell, Moon, Sun, 
  ChevronRight, ArrowRight, RefreshCw, CheckCircle2, 
  Clock, AlertTriangle, Filter, MoreVertical, Plus,
  TrendingUp, Activity, BarChart3, PieChart, Info,
  Check, X, Camera, MapPin, Calendar, Smartphone, ChevronDown, UserSquare2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ruralopsLogo from "../../assets/ruralops-logo.png";
import VaoProfileModal from "./VaoProfileModal";
import "../../Styles/VaoDashboard.css";

/* ═══════════════════════════════════════════════
   BASE CONFIG & AUTH (Robust logic from snippet)
   ═══════════════════════════════════════════════ */
const BASE = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

function getToken() { return localStorage.getItem("accessToken"); }
function getRefreshToken() { return localStorage.getItem("refreshToken"); }
function getAccountId() { return localStorage.getItem("accountId"); }
function getAccountType() { return localStorage.getItem("accountType"); }

let _refreshPromise = null;
async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data?.accessToken) localStorage.setItem("accessToken", data.accessToken);
      if (data?.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      return true;
    } catch { return false; }
    finally { _refreshPromise = null; }
  })();
  return _refreshPromise;
}

async function authFetch(url, options = {}) {
  const makeRequest = (token) => fetch(url, {
    ...options,
    headers: { 
      "Content-Type": "application/json", 
      ...(token ? { Authorization: `Bearer ${token}` } : {}), 
      ...(options.headers ?? {}) 
    },
  });
  let res = await makeRequest(getToken());
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await makeRequest(getToken());
    if (res.status === 401) {
      localStorage.clear();
      const err = new Error("Session expired. Please log in again.");
      err.code = 401; throw err;
    }
  }
  if (res.status === 403) {
    const err = new Error("Access Forbidden.");
    err.code = 403; throw err;
  }
  return res;
}

async function fetchAllPages(urlBase, pageSize = 5) {
  const all = []; let page = 0; const SAFETY = 500;
  while (page < SAFETY) {
    const res = await authFetch(`${urlBase}?page=${page}`);
    if (!res.ok) break;
    const raw = await res.json().catch(() => []);
    const list = Array.isArray(raw) ? raw : (raw?.content ?? raw?.data ?? []);
    if (!list.length) break;
    all.push(...list);
    if (list.length < pageSize) break;
    page++;
  }
  return all;
}

/* ═══════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════ */
function extractArray(data) {
  if (Array.isArray(data)) return data;
  return data?.content || data?.data || data?.workers || data?.citizens || data?.complaints || data?.areas || [];
}
function normalizeStatus(s) {
  if (!s) return "";
  return String(s).toUpperCase().replace(/[\s-]+/g, "_");
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}
function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function fmtShort(d) { return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"; }

/* ═══════════════════════════════════════════════
   ATOMIC COMPONENTS
   ═══════════════════════════════════════════════ */
const Counter = ({ to = 0, ms = 1000 }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(to);
    if (start === end) { setN(end); return; }
    let totalMiliseconds = ms;
    let increment = end > start ? 1 : -1;
    let stepTime = Math.abs(Math.floor(totalMiliseconds / end));
    let timer = setInterval(() => {
      start += increment;
      setN(start);
      if (start === end) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [to]);
  return <>{n}</>;
};

const StatusPill = ({ status }) => {
  const ns = normalizeStatus(status);
  const map = {
    ACTIVE: "p-green",
    INACTIVE: "p-red",
    ON_LEAVE: "p-amber",
    PENDING: "p-blue",
    SUBMITTED: "p-blue",
    RESOLVED: "p-green",
    VERIFIED: "p-violet",
    REJECTED: "p-red",
  };
  return <span className={`vd-pill ${map[ns] || "p-muted"}`}>{ns.replace("_", " ")}</span>;
};

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════ */
export default function VaoDashboard() {
  const navigate = useNavigate();
  const { vaoId: urlVaoId } = useParams();
  
  // App Logic State
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isAreaModalOpen, setAreaModalOpen] = useState(false);
  const [isLoggingOut, setLoggingOut] = useState(false);

  // Data State
  const [profile, setProfile] = useState(null);
  const [dash, setDash] = useState(null);
  const [citizens, setCitizens] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialization
  const vaoId = getAccountId();
  const token = getToken();

  const loadData = useCallback(async (showLoader = false) => {
    if (!token) { navigate("/login"); return; }
    if (showLoader) setLoading(true);
    setIsSyncing(true);
    
    try {
      const [profRes, dashRes, citRes, workRes, compRes, areaRes] = await Promise.all([
        authFetch(`${BASE}/vao/profile`),
        authFetch(`${BASE}/vao/dashboard`),
        authFetch(`${BASE}/vao/citizens/all`),
        authFetch(`${BASE}/workers/village`),
        authFetch(`${BASE}/vao/complaints/village`),
        authFetch(`${BASE}/vao/areas`)
      ]);

      if (profRes.ok) setProfile(await profRes.json());
      if (dashRes.ok) setDash(await dashRes.json());
      if (citRes.ok) setCitizens(extractArray(await citRes.json()));
      if (workRes.ok) setWorkers(extractArray(await workRes.json()));
      if (compRes.ok) setComplaints(extractArray(await compRes.json()));
      if (areaRes.ok) setAreas(extractArray(await areaRes.json()));

      setLastSynced(new Date());
    } catch (err) {
      console.error("Load Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [token, navigate]);

  useEffect(() => { loadData(true); }, [loadData]);
  // Auto-refresh every 60s
  useEffect(() => { const t = setInterval(() => loadData(false), 60000); return () => clearInterval(t); }, [loadData]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const rt = getRefreshToken();
      if (rt) {
        await fetch(`${BASE}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ refreshToken: rt }),
        });
      }
    } catch (e) { console.error("Logout error", e); }
    localStorage.clear();
    setLoggingOut(false);
    navigate("/login");
  };

  const complianceScore = useMemo(() => {
    if (!profile?.profileCompleted) return 0;
    // Simple mock logic for score calculation
    let score = 40; // Base for profile complete
    if (citizens.length > 0) score += 20;
    if (workers.length > 0) score += 20;
    if (complaints.length > 0) score += 20;
    return Math.min(score, 100);
  }, [profile, citizens, workers, complaints]);

  const TABS = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard, group: "Main" },
    { id: "citizens", label: "Directory", icon: Users, group: "Citizens", badge: citizens.length },
    { id: "approvals", label: "Approvals", icon: Shield, group: "Citizens", badge: citizens.filter(c => normalizeStatus(c.status) === "PENDING").length, external: true, path: `/vao/${vaoId}/citizens/approvals` },
    { id: "workers", label: "Workforce", icon: UserCog, group: "Workers", badge: workers.length },
    { id: "add_worker", label: "Hire Worker", icon: Plus, group: "Workers", external: true, path: `/vao/${vaoId}/workers/add` },
    { id: "areas", label: "Territories", icon: Map, group: "Infrastructure", badge: areas.length },
    { id: "complaints", label: "Grievances", icon: ClipboardList, group: "Complaints", badge: complaints.length },
    { id: "unassigned", label: "Unassigned", icon: AlertTriangle, group: "Complaints", badge: complaints.filter(c => UNASSIGNED_STATUSES.has(normalizeStatus(c.status))).length, external: true, path: `/vao/${vaoId}/complaints/unassigned` },
    { id: "analytics", label: "Analytics", icon: BarChart3, group: "Analytics", external: true, path: `/vao/${vaoId}/complaints/analytics` },
    { id: "edit_profile", label: "Full Profile", icon: UserSquare2, group: "System", external: true, path: `/vao/profile/${vaoId}` },
    { id: "settings", label: "Settings", icon: Settings, group: "System" },
  ];

  const handleNavClick = (tab) => {
    if (tab.external) {
      navigate(tab.path);
    } else {
      setActiveTab(tab.id);
    }
  };

  if (loading) {
    return (
      <div className="vao-page-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="nb-spin" style={{ color: "var(--primary)" }}><RefreshCw size={48} /></div>
        <p style={{ marginTop: "16px", fontWeight: "600", color: "var(--text-3)" }}>Synchronizing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="vao-page-wrapper">
      <Navbar />

      <div className="vao-dashboard-container">
        {/* Sidebar */}
        <aside className={`vao-sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <div className="vao-sidebar-brand">
            <span className="vao-brand-title">Command Center</span>
            <span className="vao-brand-sub">Village Administration v2.0</span>
          </div>

          <nav className="vao-sidebar-nav">
            {["Main", "Citizens", "Workers", "Infrastructure", "Complaints", "Analytics", "System"].map(group => (
              <div key={group} className="vao-nav-group">
                <div className="vao-nav-title">{group}</div>
                {TABS.filter(t => t.group === group).map(tab => (
                  <div 
                    key={tab.id} 
                    className={`vao-nav-item ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => handleNavClick(tab)}
                  >
                    <tab.icon size={20} />
                    <span>{tab.label}</span>
                    {tab.badge > 0 && <span className="vao-nav-badge">{tab.badge}</span>}
                  </div>
                ))}
              </div>
            ))}
          </nav>

          <div className="vao-sidebar-footer">
            <div className="vao-logout-btn" onClick={handleLogout}>
              {isLoggingOut ? <RefreshCw className="nb-spin" size={18} /> : <LogOut size={18} />}
              <span>{isLoggingOut ? "Signing out..." : "Logout Session"}</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="vao-main-content">
          <div className="vao-dashboard-body">
            <header className="vao-dashboard-header">
              <div className="vao-header-title-wrap">
                <h1>{TABS.find(t => t.id === activeTab)?.label}</h1>
                <p>Welcome back, Officer <strong>{profile?.fullName?.split(" ")[0]}</strong>. {lastSynced && `Last synced ${timeAgo(lastSynced)}.`}</p>
              </div>
              <div className="vao-header-actions">
                <button 
                  className={`nb-btn-secondary ${isSyncing ? "loading" : ""}`} 
                  onClick={() => loadData(false)}
                  disabled={isSyncing}
                >
                  <RefreshCw size={16} /> {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
                <button className="nb-btn-cta" onClick={() => setProfileModalOpen(true)}>
                  <UserSquare2 size={16} /> Profile
                </button>
              </div>
            </header>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {activeTab === "overview" && (
                  <OverviewTab 
                    profile={profile} 
                    dash={dash} 
                    complianceScore={complianceScore}
                    citizens={citizens}
                    workers={workers}
                    complaints={complaints}
                    areas={areas}
                    vaoId={vaoId}
                  />
                )}
                {activeTab === "citizens" && <CitizensTab citizens={citizens} vaoId={vaoId} />}
                {activeTab === "workers" && <WorkersTab workers={workers} vaoId={vaoId} />}
                {activeTab === "complaints" && <ComplaintsTab complaints={complaints} vaoId={vaoId} />}
                {activeTab === "areas" && <AreasTab areas={areas} onAdd={() => setAreaModalOpen(true)} vaoId={vaoId} />}
                
                {/* Placeholder for other tabs */}
                {!["overview", "citizens", "workers", "complaints", "areas"].includes(activeTab) && (
                  <div className="bento-card" style={{ gridColumn: "span 12", textAlign: "center", padding: "80px" }}>
                    <Activity size={48} color="var(--primary)" style={{ marginBottom: "24px" }} />
                    <h2 className="welcome-title">Module Under Optimization</h2>
                    <p className="welcome-desc">The {activeTab} engine is being upgraded to support high-fidelity analytics.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <Footer />
        </main>
      </div>

      <VaoProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
        profileData={profile} 
      />
      {/* Area Modal can be integrated here similarly */}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DASHBOARD OVERVIEW
   ═══════════════════════════════════════════════ */
function OverviewTab({ profile, dash, complianceScore, citizens, workers, complaints, areas, vaoId }) {
  const navigate = useNavigate();
  return (
    <div className="bento-grid">
      {/* Welcome Hero */}
      <div className="bento-card bento-welcome">
        <div className="welcome-info">
          <div className="welcome-badge">
            <span className="vao-status-dot dot-active"></span> Active Governance
          </div>
          <h2 className="welcome-title">{getGreeting()},<br />Officer {profile?.fullName || "Administrative"}</h2>
          <p className="welcome-desc">
            Your village <strong>{profile?.villageName || "Jurisdiction"}</strong> is currently operating at 
            excellent efficiency. All critical metrics are stable.
          </p>
          <div className="welcome-stats">
            <div className="welcome-stat-item">
              <span className="welcome-stat-val"><Counter to={citizens.length} /></span>
              <span className="welcome-stat-label">Total Citizens</span>
            </div>
            <div className="welcome-stat-item">
              <span className="welcome-stat-val"><Counter to={workers.length} /></span>
              <span className="welcome-stat-label">Active Workers</span>
            </div>
          </div>
        </div>
        <div className="welcome-visual">
          <div className="compliance-circle-wrap">
            <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-card-alt)" strokeWidth="8" />
              <motion.circle 
                cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" strokeWidth="8"
                strokeDasharray="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (283 * complianceScore) / 100 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="compliance-center">
              <span className="compliance-val">{complianceScore}%</span>
              <span className="compliance-lbl">Gov Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="bento-card bento-kpi">
        <div className="kpi-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}><Users /></div>
        <div className="kpi-val"><Counter to={dash?.totalCitizens || citizens.length} /></div>
        <div className="kpi-label">Registered Citizens</div>
        <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--primary)", fontWeight: "700" }}>
          <button className="nb-btn-secondary" style={{ padding: "4px 8px", width: "100%" }} onClick={() => navigate(`/vao/${vaoId}/citizens/approvals`)}>
            Review {citizens.filter(c => normalizeStatus(c.status) === "PENDING").length} Pending
          </button>
        </div>
      </div>

      <div className="bento-card bento-kpi">
        <div className="kpi-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}><ClipboardList /></div>
        <div className="kpi-val"><Counter to={complaints.filter(c => UNASSIGNED_STATUSES.has(normalizeStatus(c.status))).length} /></div>
        <div className="kpi-label">Pending Complaints</div>
        <div style={{ marginTop: "12px", fontSize: "12px", color: "#ef4444", fontWeight: "700" }}>
          <button className="nb-btn-cta" style={{ padding: "4px 8px", width: "100%", background: "#ef4444" }} onClick={() => navigate(`/vao/${vaoId}/complaints/unassigned`)}>
            Assign Now
          </button>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bento-card bento-list">
        <div className="card-hdr">
          <h3 className="card-title">Recent Activity Feed</h3>
          <Link to={`/vao/${vaoId}/complaints`} className="nb-link-cta">Full Log</Link>
        </div>
        <div className="activity-items">
          {[
            { id: 1, name: "New Citizen Registered", sub: "Rahul Sharma · Area 4", time: "2h ago", icon: Users, color: "#3b82f6" },
            { id: 2, name: "Complaint Resolved", sub: "Road Fix · Worker: Somesh", time: "5h ago", icon: CheckCircle2, color: "#10b981" },
            { id: 3, name: "Worker on Leave", sub: "Kiran · Sanitation Dept", time: "1d ago", icon: UserCog, color: "#f59e0b" },
            { id: 4, name: "Area Boundary Updated", sub: "East Ward Extension", time: "2d ago", icon: Map, color: "#8b5cf6" },
          ].map(act => (
            <div key={act.id} className="activity-item">
              <div className="activity-icon" style={{ color: act.color }}><act.icon size={18} /></div>
              <div className="activity-info">
                <div className="activity-name">{act.name}</div>
                <div className="activity-sub">{act.sub}</div>
              </div>
              <div className="activity-time">{act.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Territory Glance */}
      <div className="bento-card bento-list">
        <div className="card-hdr">
          <h3 className="card-title">Village Profile</h3>
          <button className="nb-btn-secondary" style={{ padding: "4px 12px" }} onClick={() => navigate(`/vao/profile/${vaoId}`)}>View Full</button>
        </div>
        <div className="village-profile-content" style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div className="vd-avatar" style={{ width: "48px", height: "48px", fontSize: "20px" }}>{profile?.villageName?.[0]}</div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "16px" }}>{profile?.villageName || "Not Set"}</div>
              <div style={{ fontSize: "12px", opacity: 0.6 }}>Primary Jurisdiction</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="kpi-mini-card">
              <span className="lbl">Areas</span>
              <span className="val">{areas.length}</span>
            </div>
            <div className="kpi-mini-card">
              <span className="lbl">Population</span>
              <span className="val">{citizens.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB COMPONENTS (CITIZENS, WORKERS, etc.)
   ═══════════════════════════════════════════════ */

function CitizensTab({ citizens, vaoId }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredCitizens = citizens.filter(c => 
    c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.citizenId?.toString().includes(searchTerm)
  );

  return (
    <div className="bento-card" style={{ gridColumn: "span 12" }}>
      <div className="card-hdr" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "20px", marginBottom: "20px" }}>
        <h3 className="card-title">Citizen Directory</h3>
        <div className="vao-header-actions" style={{ gap: "16px" }}>
          <div className="vao-search">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              className="vao-search-input" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="nb-btn-cta" onClick={() => navigate(`/vao/${vaoId}/citizens/approvals`)}>
            <Shield size={16} /> Review Approvals
          </button>
        </div>
      </div>
      <div className="vd-table-container">
        <table className="vd-table">
          <thead>
            <tr>
              <th>CITIZEN NAME</th>
              <th>ACCOUNT ID</th>
              <th>GENDER</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCitizens.map(c => (
              <tr key={c.citizenId}>
                <td>
                  <div className="vd-entity-cell">
                    <div className="vd-avatar">{c.fullName?.[0]}</div>
                    <div style={{ fontWeight: "700" }}>{c.fullName}</div>
                  </div>
                </td>
                <td><code style={{ fontSize: "12px", opacity: 0.6 }}>{c.citizenId}</code></td>
                <td>{c.gender}</td>
                <td><StatusPill status={c.status} /></td>
                <td>
                  <button 
                    className="nb-btn-secondary" 
                    style={{ padding: "6px 16px", fontSize: "12px" }}
                    onClick={() => navigate(`/vao/profile/${vaoId}`)}
                  >
                    View Account
                  </button>
                </td>
              </tr>
            ))}
            {filteredCitizens.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "60px", opacity: 0.5 }}>No citizens found matching your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkersTab({ workers, vaoId }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredWorkers = workers.filter(w => 
    w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.workerId?.toString().includes(searchTerm)
  );

  return (
    <div className="bento-card" style={{ gridColumn: "span 12" }}>
      <div className="card-hdr" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "20px", marginBottom: "20px" }}>
        <h3 className="card-title">Village Workforce</h3>
        <div className="vao-header-actions" style={{ gap: "16px" }}>
          <div className="vao-search">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Find worker..." 
              className="vao-search-input" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="nb-btn-cta" onClick={() => navigate(`/vao/${vaoId}/workers/add`)}>
            <Plus size={16} /> Hire Worker
          </button>
        </div>
      </div>
      <div className="vd-table-container">
        <table className="vd-table">
          <thead>
            <tr>
              <th>WORKER NAME</th>
              <th>ROLE</th>
              <th>AREA</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.map(w => (
              <tr key={w.workerId}>
                <td>
                  <div className="vd-entity-cell">
                    <div className="vd-avatar" style={{ background: "rgba(16, 185, 129, 0.1)" }}>{w.name?.[0]}</div>
                    <div style={{ fontWeight: "700" }}>{w.name}</div>
                  </div>
                </td>
                <td>Field Worker</td>
                <td>{w.areaName || "Global"}</td>
                <td><StatusPill status={w.status} /></td>
                <td>
                  <button 
                    className="nb-btn-secondary" 
                    style={{ padding: "6px 16px", fontSize: "12px" }}
                    onClick={() => navigate(`/vao/${vaoId}/complaints/worker/${w.workerId}`)}
                  >
                    Assignments
                  </button>
                </td>
              </tr>
            ))}
            {filteredWorkers.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "60px", opacity: 0.5 }}>No workers matching your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplaintsTab({ complaints, vaoId }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("ALL");
  const filtered = complaints.filter(c => filter === "ALL" || normalizeStatus(c.status) === filter);

  return (
    <div className="bento-card" style={{ gridColumn: "span 12" }}>
      <div className="card-hdr" style={{ flexWrap: "wrap", gap: "16px" }}>
        <h3 className="card-title">Grievance Backlog</h3>
        <div className="vao-header-actions" style={{ flex: 1, justifyContent: "flex-end" }}>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "4px" }}>
            {["ALL", "SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map(s => (
              <button 
                key={s} 
                className={`vd-pill ${filter === s ? "p-blue active" : "p-muted"}`} 
                onClick={() => setFilter(s)}
                style={{ cursor: "pointer", border: filter === s ? "1px solid var(--primary)" : "none" }}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
          <button className="nb-btn-secondary" onClick={() => navigate(`/vao/${vaoId}/complaints/analytics`)}>
            <BarChart3 size={14} /> Full Analytics
          </button>
        </div>
      </div>
      <div className="vd-table-container">
        <table className="vd-table">
          <thead>
            <tr>
              <th>COMPLAINT ID</th>
              <th>CATEGORY</th>
              <th>AREA</th>
              <th>STATUS</th>
              <th>FILED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.complaintId}>
                <td><code style={{ fontWeight: "800" }}>#{c.complaintId}</code></td>
                <td>{c.category || "General"}</td>
                <td>{c.areaName}</td>
                <td><StatusPill status={c.status} /></td>
                <td>{fmtShort(c.createdAt)}</td>
                <td>
                  <button 
                    className="nb-btn-secondary" 
                    style={{ padding: "4px 12px", fontSize: "12px" }}
                    onClick={() => navigate(`/vao/${vaoId}/complaints/view/${c.complaintId}`)}
                  >
                    Investigate
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}>No complaints match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AreasTab({ areas, onAdd, vaoId }) {
  const navigate = useNavigate();
  return (
    <div className="bento-card" style={{ gridColumn: "span 12" }}>
      <div className="card-hdr">
        <h3 className="card-title">Territory Definitions</h3>
        <button className="nb-btn-cta" onClick={onAdd}>+ Define New Area</button>
      </div>
      <div className="vd-table-container">
        <table className="vd-table">
          <thead>
            <tr>
              <th>AREA NAME</th>
              <th>SYSTEM ID</th>
              <th>VILLAGE</th>
              <th>OPERATIONS</th>
            </tr>
          </thead>
          <tbody>
            {areas.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: "700" }}>{a.name}</td>
                <td><code style={{ fontSize: "12px" }}>{a.id}</code></td>
                <td>Primary Village</td>
                <td style={{ display: "flex", gap: "8px" }}>
                  <button 
                    className="nb-btn-secondary" 
                    style={{ padding: "4px 12px", fontSize: "12px" }}
                    onClick={() => navigate(`/vao/${vaoId}/complaints/area/${a.id}`)}
                  >
                    Grievances
                  </button>
                  <button className="nb-btn-secondary" style={{ padding: "4px 12px", fontSize: "12px" }}>Edit Boundaries</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STATUS CONSTANTS
   ═══════════════════════════════════════════════ */
const UNASSIGNED_STATUSES = new Set(["SUBMITTED", "AWAITING_ASSIGNMENT"]);