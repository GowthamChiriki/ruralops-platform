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

/* ════════════════════════════════════════════
   BASE CONFIG
   ════════════════════════════════════════════ */
const API = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

function getToken()  { return localStorage.getItem("accessToken"); }
function getAccountId() { return localStorage.getItem("accountId"); }

/* ════════════════════════════════════════════
   SUB-COMPONENTS (ATOMIC)
   ════════════════════════════════════════════ */

const Badge = ({ children, type = "default" }) => {
  const styles = {
    default: "p-muted",
    success: "p-green",
    warning: "p-amber",
    danger: "p-red",
    info: "p-blue"
  };
  return <span className={`vd-pill ${styles[type]}`}>{children}</span>;
};

/* ════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ════════════════════════════════════════════ */

export default function VaoDashboard() {
  const navigate = useNavigate();
  const { id: urlId } = useParams();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  // Auth State
  const token = getToken();
  const accountId = getAccountId();

  // Data State
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    citizens: { total: 0, approved: 0, pending: 0, rejected: 0 },
    workers: { total: 0, active: 0, onLeave: 0, inactive: 0 },
    complaints: { total: 0, unassigned: 0, inProgress: 0, resolved: 0, verified: 0 },
    areas: { total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialization
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    // If URL ID doesn't match session ID, redirect (unless admin, but for now simple)
    if (urlId && urlId !== accountId) {
      // console.warn("Session ID mismatch");
    }
    loadAllData();
  }, [token, accountId, urlId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Parallel fetching for speed
      const [profRes, statsRes, areasRes, citRes, workRes, compRes] = await Promise.all([
        authFetch(`${API}/vao/profile`),
        authFetch(`${API}/vao/dashboard`), // Combined stats endpoint
        authFetch(`${API}/vao/areas`),
        authFetch(`${API}/vao/citizens/stats`),
        authFetch(`${API}/vao/workers`),
        authFetch(`${API}/vao/complaints`)
      ]);

      if (profRes.ok) setProfile(await profRes.json());
      
      const dashboardData = statsRes.ok ? await statsRes.json() : {};
      const areasData = areasRes.ok ? await areasRes.json() : [];
      const citStats = citRes.ok ? await citRes.json() : {};
      
      // Update Stats
      setStats(prev => ({
        ...prev,
        citizens: {
          total: dashboardData.totalCitizens || 0,
          pending: dashboardData.pendingCitizenApprovals || 0,
          approved: citStats.APPROVED || 0,
          rejected: citStats.REJECTED || 0
        },
        workers: {
          total: dashboardData.workersInVillage || 0,
          active: 0, // Need detailed worker stats
          onLeave: 0
        },
        complaints: {
          total: 0, // From compRes
          unassigned: dashboardData.complaintsPending || 0
        },
        areas: {
          total: areasData.length
        }
      }));

    } catch (err) {
      console.error("Dashboard Load Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers
      }
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const TABS = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard, group: "Main" },
    { id: "citizens", label: "Citizens", icon: Users, group: "Manage" },
    { id: "workers", label: "Workers", icon: UserCog, group: "Manage" },
    { id: "complaints", label: "Complaints", icon: ClipboardList, group: "Manage" },
    { id: "areas", label: "Areas", icon: Map, group: "Manage" },
    { id: "approvals", label: "Approvals", icon: Shield, group: "Operations" },
    { id: "analytics", label: "Governance", icon: BarChart3, group: "Analytics" },
    { id: "settings", label: "Settings", icon: Settings, group: "System" },
  ];

  const groupedTabs = useMemo(() => {
    return TABS.reduce((acc, tab) => {
      if (!acc[tab.group]) acc[tab.group] = [];
      acc[tab.group].push(tab);
      return acc;
    }, {});
  }, []);

  if (loading) {
    return (
      <div className="vao-layout" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="nb-spin" style={{ color: "var(--primary)" }}><RefreshCw size={40} /></div>
      </div>
    );
  }

  return (
    <div className="vao-layout">
      {/* Sidebar */}
      <aside className={`vao-sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <Link to="/" className="vao-sidebar-logo">
          <img src={ruralopsLogo} alt="Logo" />
          {!isSidebarCollapsed && <span>RuralOps</span>}
        </Link>

        <nav className="vao-sidebar-nav">
          {Object.entries(groupedTabs).map(([group, tabs]) => (
            <div key={group} className="vao-nav-group">
              {!isSidebarCollapsed && <div className="vao-nav-title">{group}</div>}
              {tabs.map(tab => (
                <div 
                  key={tab.id} 
                  className={`vao-nav-item ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={20} className="nav-icon" />
                  {!isSidebarCollapsed && <span>{tab.label}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="vao-sidebar-footer">
          <div className="vao-status-card">
            <div className="vao-status-header">
              <span>SYSTEM STATUS</span>
              <div className="vao-status-dot" />
            </div>
            {!isSidebarCollapsed && <span style={{ fontSize: "11px", opacity: 0.6 }}>All systems operational</span>}
          </div>
          <div 
            className="vao-nav-item" 
            style={{ marginTop: "12px", color: "#ef4444" }}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="vao-main">
        <header className="vao-header">
          <div className="vao-header-search">
            <Search size={18} className="vao-search-icon" />
            <input type="text" placeholder="Search citizens, complaints, tasks..." className="vao-search-input" />
          </div>

          <div className="vao-header-actions">
            <button className="vao-icon-btn">
              <Bell size={20} />
              <div className="vao-btn-badge">3</div>
            </button>
            
            <div className="vao-user-pill" onClick={() => setProfileModalOpen(true)}>
              <img 
                src={profile?.profilePhotoUrl || "https://i.pravatar.cc/150?u=vao"} 
                alt="User" 
                className="vao-user-avatar" 
              />
              <div className="vao-user-info">
                <span className="vao-user-name">{profile?.fullName || "Officer"}</span>
                <span className="vao-user-role">Village Admin Officer</span>
              </div>
              <ChevronDown size={14} className="nav-icon" />
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && <DashboardOverview stats={stats} profile={profile} />}
            {activeTab === "citizens" && <CitizensTab API={API} token={token} />}
            {activeTab === "workers" && <WorkersTab API={API} token={token} />}
            {activeTab === "complaints" && <ComplaintsTab API={API} token={token} />}
            {activeTab === "areas" && <AreasTab API={API} token={token} />}
            {/* Fallback for other tabs */}
            {!["overview", "citizens", "workers", "complaints", "areas"].includes(activeTab) && (
              <div className="bento-card" style={{ gridColumn: "span 12", padding: "64px", textAlign: "center" }}>
                <Activity size={48} color="var(--primary)" style={{ marginBottom: "16px" }} />
                <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h3>
                <p>This module is currently being optimized for the new design.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <VaoProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
        profileData={profile}
      />
    </div>
  );
}

/* ════════════════════════════════════════════
   DASHBOARD OVERVIEW (BENTO)
   ════════════════════════════════════════════ */

function DashboardOverview({ stats, profile }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="vao-bento-grid">
      {/* Welcome Card */}
      <div className="bento-card bento-welcome">
        <div className="bento-welcome-header">
          <div className="welcome-label">
            <Activity size={12} /> OPERATIONAL
          </div>
          <h1 className="welcome-title">{getGreeting()},<br />{profile?.fullName || "Officer"}</h1>
          <p style={{ fontSize: "14px", color: "var(--text-2)", marginTop: "8px" }}>
            Village Administrative Officer at <strong>{profile?.villageName || "Your Village"}</strong>
          </p>
        </div>
        
        <div className="welcome-profile">
          <div className="profile-img-wrap">
            <img src={profile?.profilePhotoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"} alt="Profile" />
          </div>
          <div className="profile-details">
            <div className="profile-info-row"><Shield size={14} /> <span>VAO ID: {profile?.vaoId || "—"}</span></div>
            <div className="profile-info-row"><MapPin size={14} /> <span>{profile?.villageName || "—"}</span></div>
            <div className="profile-info-row"><CheckCircle2 size={14} color="#22c55e" /> <span>Verified Profile</span></div>
            <button className="nb-btn-cta" style={{ marginTop: "16px", padding: "8px 16px", fontSize: "12px" }}>
              View Profile <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Governance Score */}
      <div className="bento-card bento-score">
        <span className="score-title">Governance Score</span>
        <div className="score-val-wrap">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="var(--bg-card-alt)" strokeWidth="12" />
            <circle cx="80" cy="80" r="70" fill="none" stroke="var(--primary)" strokeWidth="12" 
              strokeDasharray="440" strokeDashoffset="80" strokeLinecap="round" 
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
          </svg>
          <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span className="score-number">82%</span>
            <span className="score-label">Excellent</span>
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "700" }}>
          <TrendingUp size={14} inline /> 12% vs last 30 days
        </div>
      </div>

      {/* Stats Grid */}
      <div className="bento-stats-grid">
        <div className="mini-stat-card">
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            <Users size={18} />
          </div>
          <div>
            <div className="stat-val">{stats.citizens.total}</div>
            <div className="stat-label">Citizens</div>
          </div>
          <div style={{ fontSize: "10px", color: "#22c55e", fontWeight: "700" }}>100% Approved</div>
        </div>
        <div className="mini-stat-card">
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            <UserCog size={18} />
          </div>
          <div>
            <div className="stat-val">{stats.workers.total}</div>
            <div className="stat-label">Workers</div>
          </div>
          <div style={{ fontSize: "10px", color: "#22c55e", fontWeight: "700" }}>100% Active</div>
        </div>
        <div className="mini-stat-card">
          <div className="stat-icon" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
            <ClipboardList size={18} />
          </div>
          <div>
            <div className="stat-val">{stats.complaints.unassigned}</div>
            <div className="stat-label">Complaints</div>
          </div>
          <div style={{ fontSize: "10px", color: "#f59e0b", fontWeight: "700" }}>Pending Action</div>
        </div>
        <div className="mini-stat-card">
          <div className="stat-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
            <Map size={18} />
          </div>
          <div>
            <div className="stat-val">{stats.areas.total}</div>
            <div className="stat-label">Areas</div>
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-3)", fontWeight: "700" }}>Jurisdictions</div>
        </div>
      </div>

      {/* Main Graph (Placeholder) */}
      <div className="bento-card bento-overview">
        <div className="card-header">
          <div>
            <h3 className="card-title">Governance Overview</h3>
            <span className="card-subtitle">Last 30 days active metrics</span>
          </div>
          <select className="vao-search-input" style={{ width: "auto", padding: "4px 12px" }}>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "12px", padding: "20px 0" }}>
          {/* Simple CSS bar chart as placeholder */}
          {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
              <div style={{ 
                width: "100%", 
                height: `${h}%`, 
                background: i === 5 ? "var(--primary)" : "var(--bg-card-alt)", 
                borderRadius: "8px",
                transition: "0.5s",
                position: "relative"
              }}>
                {i === 5 && <div style={{ 
                  position: "absolute", top: "-30px", left: "50%", transform: "translateX(-50%)",
                  background: "var(--text-1)", color: "var(--bg-card)", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700"
                }}>82%</div>}
              </div>
              <span style={{ fontSize: "10px", color: "var(--text-3)", fontWeight: "600" }}>
                {["Apr 7", "Apr 14", "Apr 21", "Apr 28", "May 5", "May 6", "May 7"][i]}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "24px", marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "var(--primary)" }} />
            <span style={{ fontSize: "12px", fontWeight: "600" }}>Approval Rate</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#3b82f6" }} />
            <span style={{ fontSize: "12px", fontWeight: "600" }}>Resolution</span>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bento-card bento-activity">
        <div className="card-header">
          <h3 className="card-title">Activity Feed</h3>
          <Link to="#" style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "700", textDecoration: "none" }}>View all</Link>
        </div>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon" style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}><CheckCircle2 size={16} /></div>
            <div className="activity-content">
              <div className="activity-title">Workers verified</div>
              <div className="activity-desc">5 workers verified successfully</div>
              <div className="activity-time">Just now</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}><ClipboardList size={16} /></div>
            <div className="activity-content">
              <div className="activity-title">3 Complaints closed</div>
              <div className="activity-desc">Road maintenance, Water supply issues...</div>
              <div className="activity-time">10 min ago</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}><RefreshCw size={16} /></div>
            <div className="activity-content">
              <div className="activity-title">Report generated</div>
              <div className="activity-desc">Monthly governance report ready</div>
              <div className="activity-time">1 hr ago</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bento-quick-actions">
        <div className="action-card">
          <div className="action-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}><Plus size={20} /></div>
          <div className="action-info">
            <div className="action-name">New Worker</div>
            <div className="action-sub">Add new worker to system</div>
          </div>
          <ArrowRight size={18} className="action-arrow" />
        </div>
        <div className="action-card">
          <div className="action-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}><Map size={20} /></div>
          <div className="action-info">
            <div className="action-name">Update Areas</div>
            <div className="action-sub">Manage village jurisdictions</div>
          </div>
          <ArrowRight size={18} className="action-arrow" />
        </div>
        <div className="action-card">
          <div className="action-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}><Shield size={20} /></div>
          <div className="action-info">
            <div className="action-name">Approvals</div>
            <div className="action-sub">Review pending citizen signups</div>
          </div>
          <ArrowRight size={18} className="action-arrow" />
        </div>
        <div className="action-card">
          <div className="action-icon" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}><Smartphone size={20} /></div>
          <div className="action-info">
            <div className="action-name">Mobile App</div>
            <div className="action-sub">Download field worker app</div>
          </div>
          <ArrowRight size={18} className="action-arrow" />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   TAB MODULES (Simplified for now)
   ════════════════════════════════════════════ */

function CitizensTab({ API, token }) {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/vao/citizens/all`, {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      setCitizens(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="bento-card" style={{ gridColumn: "span 12" }}>
      <div className="card-header">
        <h3 className="card-title">Citizen Management</h3>
        <button className="nb-btn-cta" style={{ padding: "8px 16px", fontSize: "12px" }}>+ Register Citizen</button>
      </div>
      <div className="vd-table-wrap" style={{ marginTop: "24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)", color: "var(--text-3)", fontSize: "12px" }}>
              <th style={{ padding: "12px" }}>CITIZEN NAME</th>
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>STATUS</th>
              <th style={{ padding: "12px" }}>VILLAGE</th>
              <th style={{ padding: "12px" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {citizens.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border)", fontSize: "14px" }}>
                <td style={{ padding: "16px 12px", fontWeight: "700" }}>{c.fullName}</td>
                <td style={{ padding: "16px 12px", color: "var(--text-2)" }}>{c.citizenId}</td>
                <td style={{ padding: "16px 12px" }}><Badge type={c.status === "APPROVED" ? "success" : "warning"}>{c.status}</Badge></td>
                <td style={{ padding: "16px 12px", color: "var(--text-3)" }}>{c.villageName}</td>
                <td style={{ padding: "16px 12px" }}><button style={{ color: "var(--primary)", fontWeight: "700" }}>View Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkersTab({ API, token }) {
  return <div className="bento-card" style={{ gridColumn: "span 12" }}>Worker Management Module</div>;
}

function ComplaintsTab({ API, token }) {
  return <div className="bento-card" style={{ gridColumn: "span 12" }}>Complaints Module</div>;
}

function AreasTab({ API, token }) {
  return <div className="bento-card" style={{ gridColumn: "span 12" }}>Area Management Module</div>;
}