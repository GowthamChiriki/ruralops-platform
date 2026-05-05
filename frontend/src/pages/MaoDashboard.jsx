import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../Styles/MaoDashboard.css";

function MaoDashboard() {

  const maoId = localStorage.getItem("accountId") || "RLOM-XXXX";
  const officerName = localStorage.getItem("officerName") || "Sr. Officer";
  const mandalName = localStorage.getItem("mandalName") || "Warangal Mandal";

  /* ===============================
     STATE
  =============================== */

  const [villages, setVillages] = useState([]);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("overview");

  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showVillageDetailModal, setShowVillageDetailModal] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState(null);

  const [vaoEmail, setVaoEmail] = useState("");
  const [vaoPhone, setVaoPhone] = useState("");
  const [vaoName, setVaoName] = useState("");

  const [notification, setNotification] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [weatherData] = useState({
    temp: "31°C",
    condition: "Partly Cloudy",
    humidity: "72%",
    wind: "14 km/h",
    forecast: [
      { day: "Mon", icon: "🌤", high: 33, low: 24 },
      { day: "Tue", icon: "🌧", high: 28, low: 22 },
      { day: "Wed", icon: "⛅", high: 30, low: 23 },
      { day: "Thu", icon: "☀️", high: 35, low: 25 },
    ]
  });

  const [announcements] = useState([
    { id: 1, title: "Kharif Crop Survey Due", date: "Mar 15", priority: "high", dept: "Agriculture" },
    { id: 2, title: "Pensions Disbursement — April", date: "Mar 20", priority: "medium", dept: "Social Welfare" },
    { id: 3, title: "Water Board Inspection", date: "Mar 22", priority: "low", dept: "Infrastructure" },
    { id: 4, title: "Digital Literacy Drive", date: "Apr 01", priority: "medium", dept: "Education" },
    { id: 5, title: "Land Records Audit", date: "Apr 05", priority: "high", dept: "Revenue" },
  ]);

  const [newsItems] = useState([
    { id: 1, headline: "State Govt Announces ₹500 Cr Irrigation Package for Telangana", source: "The Hindu", time: "2h ago", category: "Policy" },
    { id: 2, headline: "Mandal Officers to Receive Digital Tablet Kits Under e-Governance Push", source: "Deccan Chronicle", time: "4h ago", category: "Technology" },
    { id: 3, headline: "Kharif Season Outlook: IMD Predicts Normal Monsoon", source: "TOI", time: "6h ago", category: "Agriculture" },
    { id: 4, headline: "PM KISAN 16th Installment Released to Eligible Farmers", source: "NDTV", time: "8h ago", category: "Agriculture" },
    { id: 5, headline: "New Revenue Tribunal Guidelines Issued by State", source: "Eenadu", time: "10h ago", category: "Revenue" },
    { id: 6, headline: "Aadhaar Seeding Deadline Extended for MGNREGS Workers", source: "PIB", time: "12h ago", category: "Social Welfare" },
  ]);

  const [schemes] = useState([
    { name: "PM KISAN", enrolled: 1240, eligible: 1500, disbursed: "₹7.2L", status: "active" },
    { name: "MGNREGS", enrolled: 890, eligible: 1100, disbursed: "₹12.4L", status: "active" },
    { name: "Rythu Bandhu", enrolled: 620, eligible: 700, disbursed: "₹18.6L", status: "active" },
    { name: "Aasara Pension", enrolled: 310, eligible: 340, disbursed: "₹3.1L", status: "active" },
    { name: "PMAY-G", enrolled: 145, eligible: 200, disbursed: "₹29.0L", status: "partial" },
  ]);

  const [grievances] = useState([
    { id: "GRV-1041", citizen: "Ramaiah K.", village: "Alkapuram", type: "Water Supply", days: 3, status: "open" },
    { id: "GRV-1038", citizen: "Lakshmi D.", village: "Ramapur", type: "Road Damage", days: 7, status: "escalated" },
    { id: "GRV-1035", citizen: "Venkat R.", village: "Kothur", type: "Pension Delay", days: 2, status: "open" },
    { id: "GRV-1029", citizen: "Sridevi M.", village: "Lingapur", type: "Land Encroachment", days: 12, status: "escalated" },
    { id: "GRV-1027", citizen: "Naresh P.", village: "Alkapuram", type: "Ration Card", days: 1, status: "resolved" },
  ]);

  const [fieldInspections] = useState([
    { officer: "VAO Ravi", village: "Alkapuram", type: "Crop Survey", date: "Mar 07", status: "completed" },
    { officer: "VAO Priya", village: "Kothur", type: "Housing Inspection", date: "Mar 08", status: "in-progress" },
    { officer: "MAO Team", village: "Ramapur", type: "Water Audit", date: "Mar 10", status: "scheduled" },
    { officer: "VAO Kumar", village: "Lingapur", type: "Land Records", date: "Mar 12", status: "scheduled" },
  ]);

  const [budgetData] = useState([
    { head: "Agriculture Development", allocated: 8500000, spent: 5200000 },
    { head: "Infrastructure", allocated: 12000000, spent: 9800000 },
    { head: "Social Welfare", allocated: 6200000, spent: 4100000 },
    { head: "Health & Sanitation", allocated: 4500000, spent: 2700000 },
    { head: "Education", allocated: 3200000, spent: 2900000 },
  ]);


  /* ===============================
     LIVE CLOCK
  =============================== */

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


  /* ===============================
     MOCK DATA LOAD
  =============================== */

  useEffect(() => {
    const mock = [
      { villageId: "VLG001", villageName: "Alkapuram", vaoId: "RLOV-1221", vaoStatus: "ACTIVE", workers: 12, requests: 8, population: 3240, households: 810, area: "12.4 km²", lastInspection: "Mar 07" },
      { villageId: "VLG002", villageName: "Ramapur", vaoId: null, vaoStatus: null, workers: 7, requests: 31, population: 2180, households: 545, area: "9.1 km²", lastInspection: "Feb 22" },
      { villageId: "VLG003", villageName: "Kothur", vaoId: "RLOV-2221", vaoStatus: "PENDING_ACTIVATION", workers: 10, requests: 15, population: 4100, households: 1025, area: "15.7 km²", lastInspection: "Mar 05" },
      { villageId: "VLG004", villageName: "Lingapur", vaoId: null, vaoStatus: null, workers: 5, requests: 44, population: 1760, households: 440, area: "7.3 km²", lastInspection: "Feb 18" },
      { villageId: "VLG005", villageName: "Chandupatla", vaoId: "RLOV-3310", vaoStatus: "ACTIVE", workers: 9, requests: 11, population: 2950, households: 738, area: "11.2 km²", lastInspection: "Mar 06" },
      { villageId: "VLG006", villageName: "Boinpally", vaoId: "RLOV-4412", vaoStatus: "ACTIVE", workers: 14, requests: 6, population: 5600, households: 1400, area: "18.9 km²", lastInspection: "Mar 08" },
    ];
    setVillages(mock);
  }, []);


  /* ===============================
     EVENT STREAM
  =============================== */

  useEffect(() => {
    const samples = [
      { msg: "Citizen grievance registered — Alkapuram", type: "success" },
      { msg: "Water complaint escalated — Ramapur", type: "danger" },
      { msg: "Village inspection completed — Boinpally", type: "success" },
      { msg: "Crop disease warning issued — Lingapur", type: "warning" },
      { msg: "Agriculture subsidy approved — Chandupatla", type: "success" },
      { msg: "VAO field report submitted — Kothur", type: "info" },
      { msg: "MGNREGS muster roll updated — Ramapur", type: "info" },
      { msg: "Pension case escalated — Lingapur", type: "danger" },
      { msg: "Land mutation request received — Alkapuram", type: "warning" },
    ];

    const interval = setInterval(() => {
      const random = samples[Math.floor(Math.random() * samples.length)];
      const event = {
        message: random.msg,
        type: random.type,
        time: new Date().toLocaleTimeString()
      };
      setEvents(prev => [event, ...prev.slice(0, 9)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);


  /* ===============================
     METRICS
  =============================== */

  const totalVillages = villages.length;
  const totalWorkers = villages.reduce((a, b) => a + b.workers, 0);
  const totalRequests = villages.reduce((a, b) => a + b.requests, 0);
  const totalPopulation = villages.reduce((a, b) => a + (b.population || 0), 0);
  const villagesWithoutVAO = villages.filter(v => !v.vaoId).length;
  const healthyVillages = villages.filter(v => v.requests < 15).length;
  const warningVillages = villages.filter(v => v.requests >= 15 && v.requests < 35).length;
  const crisisVillages = villages.filter(v => v.requests >= 35).length;
  const avgRequests = villages.length > 0 ? Math.round(totalRequests / villages.length) : 0;
  const requestTrend = avgRequests > 20 ? "↑ Rising" : "→ Stable";
  const openGrievances = grievances.filter(g => g.status === "open").length;
  const escalatedGrievances = grievances.filter(g => g.status === "escalated").length;


  /* ===============================
     HELPERS
  =============================== */

  const healthStatus = (requests) => {
    if (requests < 15) return "normal";
    if (requests < 35) return "warning";
    return "critical";
  };

  const formatCurrency = (val) => {
    if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  const getBudgetPct = (spent, allocated) => Math.round((spent / allocated) * 100);

  const filteredVillages = villages.filter(v =>
    v.villageName.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status) => {
    if (!status) return <span className="badge missing">Unassigned</span>;
    if (status === "ACTIVE") return <span className="badge active">Active</span>;
    if (status === "PENDING_ACTIVATION") return <span className="badge pending">Pending</span>;
  };

  const priorityBadge = (p) => {
    const map = { high: "badge-priority-high", medium: "badge-priority-medium", low: "badge-priority-low" };
    return <span className={`badge-priority ${map[p]}`}>{p}</span>;
  };

  const grievanceStatusBadge = (s) => {
    const map = { open: "grv-open", escalated: "grv-escalated", resolved: "grv-resolved" };
    return <span className={`grv-badge ${map[s]}`}>{s}</span>;
  };

  const inspectionStatusBadge = (s) => {
    const map = { completed: "ins-completed", "in-progress": "ins-progress", scheduled: "ins-scheduled" };
    return <span className={`ins-badge ${map[s]}`}>{s}</span>;
  };


  /* ===============================
     MODAL ACTIONS
  =============================== */

  const openProvisionModal = (village) => {
    setSelectedVillage(village);
    setShowProvisionModal(true);
  };

  const openVillageDetail = (village) => {
    setSelectedVillage(village);
    setShowVillageDetailModal(true);
  };

  const provisionVAO = () => {
    if (!vaoName || !vaoEmail || !vaoPhone) {
      showToast("Please fill all VAO details", "danger");
      return;
    }
    showToast(`VAO "${vaoName}" provisioned for ${selectedVillage?.villageName}`, "success");
    setShowProvisionModal(false);
    setVaoName(""); setVaoEmail(""); setVaoPhone("");
  };

  const showToast = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };


  /* ===============================
     NAV ITEMS
  =============================== */

  const navItems = [
    { id: "overview",    label: "Overview",         icon: "⊞" },
    { id: "villages",    label: "Villages",          icon: "🏘" },
    { id: "workers",     label: "Field Workers",     icon: "👷" },
    { id: "grievances",  label: "Grievances",        icon: "📋" },
    { id: "schemes",     label: "Govt. Schemes",     icon: "📜" },
    { id: "budget",      label: "Budget & Finance",  icon: "💰" },
    { id: "inspections", label: "Inspections",       icon: "🔍" },
    { id: "news",        label: "News & Circulars",  icon: "📰" },
    { id: "weather",     label: "Weather & Agri",    icon: "🌤" },
    { id: "analytics",   label: "Analytics",         icon: "📊" },
    { id: "documents",   label: "Documents",         icon: "🗂" },
    { id: "calendar",    label: "Calendar",          icon: "📅" },
    { id: "settings",    label: "Settings",          icon: "⚙" },
  ];


  /* ===============================
     PANEL RENDERERS
  =============================== */

  const NewsPanel = () => (
    <div className="full-panel">
      <div className="panel-header">
        <h3>News & Government Circulars</h3>
        <span className="panel-tag">Live Feed</span>
      </div>
      <div className="news-grid">
        {newsItems.map(n => (
          <div key={n.id} className="news-card">
            <div className="news-top">
              <span className="news-category">{n.category}</span>
              <span className="news-time">{n.time}</span>
            </div>
            <p className="news-headline">{n.headline}</p>
            <div className="news-bottom">
              <span className="news-source">— {n.source}</span>
              <button className="news-read" onClick={() => showToast("Opening article...")}>Read →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SchemesPanel = () => (
    <div className="full-panel">
      <div className="panel-header">
        <h3>Government Scheme Tracking</h3>
      </div>
      <div className="table-scroll">
        <table className="schemes-table">
          <thead>
            <tr>
              <th>Scheme</th>
              <th>Enrolled</th>
              <th>Eligible</th>
              <th>Coverage</th>
              <th>Disbursed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {schemes.map(s => (
              <tr key={s.name}>
                <td className="scheme-name">{s.name}</td>
                <td>{s.enrolled.toLocaleString()}</td>
                <td>{s.eligible.toLocaleString()}</td>
                <td>
                  <div className="scheme-bar-wrap">
                    <div className="scheme-bar-bg">
                      <div className="scheme-fill" style={{ width: `${Math.round((s.enrolled / s.eligible) * 100)}%` }} />
                    </div>
                    <span>{Math.round((s.enrolled / s.eligible) * 100)}%</span>
                  </div>
                </td>
                <td className="disbursed">{s.disbursed}</td>
                <td><span className={`badge ${s.status === "active" ? "active" : "pending"}`}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const BudgetPanel = () => (
    <div className="full-panel">
      <div className="panel-header">
        <h3>Budget & Finance Overview</h3>
        <span className="panel-tag">FY 2024–25</span>
      </div>
      <div className="budget-list">
        {budgetData.map(b => (
          <div key={b.head} className="budget-item">
            <div className="budget-meta">
              <span className="budget-head">{b.head}</span>
              <span className="budget-numbers">
                {formatCurrency(b.spent)} <span className="budget-of">of</span> {formatCurrency(b.allocated)}
              </span>
            </div>
            <div className="budget-bar-bg">
              <div
                className={`budget-fill ${getBudgetPct(b.spent, b.allocated) > 85 ? "over" : "ok"}`}
                style={{ width: `${getBudgetPct(b.spent, b.allocated)}%` }}
              />
            </div>
            <span className="budget-pct">{getBudgetPct(b.spent, b.allocated)}% utilized</span>
          </div>
        ))}
      </div>
    </div>
  );

  const InspectionsPanel = () => (
    <div className="full-panel">
      <div className="panel-header">
        <h3>Field Inspections Schedule</h3>
        <button className="primary-btn sm" onClick={() => showToast("New inspection scheduled")}>+ Schedule</button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Officer</th><th>Village</th><th>Type</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            {fieldInspections.map((ins, i) => (
              <tr key={i}>
                <td>{ins.officer}</td>
                <td>{ins.village}</td>
                <td>{ins.type}</td>
                <td>{ins.date}</td>
                <td>{inspectionStatusBadge(ins.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const GrievancesPanel = () => (
    <div className="full-panel">
      <div className="panel-header">
        <h3>Citizen Grievance Management</h3>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>ID</th><th>Citizen</th><th>Village</th><th>Type</th><th>Days Open</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {grievances.map(g => (
              <tr key={g.id}>
                <td className="mono">{g.id}</td>
                <td>{g.citizen}</td>
                <td>{g.village}</td>
                <td>{g.type}</td>
                <td className={g.days > 7 ? "days-overdue" : ""}>{g.days}d</td>
                <td>{grievanceStatusBadge(g.status)}</td>
                <td>
                  <button className="action-btn view-btn" onClick={() => showToast(`Viewing ${g.id}`)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const WeatherPanel = () => (
    <div className="full-panel">
      <div className="panel-header">
        <h3>Weather & Agriculture Advisory</h3>
        <span className="panel-tag">{mandalName}</span>
      </div>
      <div className="weather-main">
        <div className="weather-now">
          <div className="weather-temp">{weatherData.temp}</div>
          <div className="weather-condition">{weatherData.condition}</div>
          <div className="weather-details">
            <span>💧 Humidity: {weatherData.humidity}</span>
            <span>💨 Wind: {weatherData.wind}</span>
          </div>
        </div>
        <div className="weather-forecast">
          {weatherData.forecast.map(f => (
            <div key={f.day} className="forecast-day">
              <span className="forecast-label">{f.day}</span>
              <span className="forecast-icon">{f.icon}</span>
              <span className="forecast-hi">{f.high}°</span>
              <span className="forecast-lo">{f.low}°</span>
            </div>
          ))}
        </div>
      </div>
      <div className="agri-advisory">
        <h4>🌾 Agriculture Advisory</h4>
        <ul>
          <li>Rabi harvest expected to begin in 3rd week of March — arrange transport coordination.</li>
          <li>IMD has flagged moderate rainfall for the coming week; delay fertilizer application.</li>
          <li>Yellow mosaic virus alert for soybean crops — distribute advisory to VAOs immediately.</li>
          <li>Soil moisture levels adequate; irrigation board maintenance scheduled Mar 14.</li>
        </ul>
      </div>
    </div>
  );

  const OverviewContent = () => (
    <>
      {/* STATS ROW */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">🏘</div>
          <div className="stat-body">
            <h4>Total Villages</h4>
            <p>{totalVillages}</p>
            <span className="stat-sub">{mandalName}</span>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">👷</div>
          <div className="stat-body">
            <h4>Field Workers</h4>
            <p>{totalWorkers}</p>
            <span className="stat-sub">Across {totalVillages} villages</span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">📋</div>
          <div className="stat-body">
            <h4>Citizen Requests</h4>
            <p>{totalRequests}</p>
            <span className="stat-sub">{requestTrend}</span>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">⚠</div>
          <div className="stat-body">
            <h4>Unassigned VAO</h4>
            <p>{villagesWithoutVAO}</p>
            <span className="stat-sub">Needs attention</span>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">👥</div>
          <div className="stat-body">
            <h4>Population</h4>
            <p>{totalPopulation.toLocaleString()}</p>
            <span className="stat-sub">Registered citizens</span>
          </div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon">🚨</div>
          <div className="stat-body">
            <h4>Escalated Cases</h4>
            <p>{escalatedGrievances}</p>
            <span className="stat-sub">{openGrievances} open grievances</span>
          </div>
        </div>
      </div>

      {/* TWO-COL: COMMAND PANEL + ACTIVITY STREAM */}
      <div className="two-col-row">

        <div className="command-panel">
          <div className="panel-header">
            <h3>Village Health Command</h3>
            <span className="panel-tag live">Live</span>
          </div>
          <div className="command-grid">
            <div className="command-card healthy">
              <span className="cmd-icon">🟢</span>
              <div>
                <p>Healthy</p>
                <h2>{healthyVillages}</h2>
                <small>Requests &lt; 15</small>
              </div>
            </div>
            <div className="command-card warning">
              <span className="cmd-icon">🟡</span>
              <div>
                <p>Warning</p>
                <h2>{warningVillages}</h2>
                <small>Requests 15–34</small>
              </div>
            </div>
            <div className="command-card crisis">
              <span className="cmd-icon">🔴</span>
              <div>
                <p>Crisis</p>
                <h2>{crisisVillages}</h2>
                <small>Requests 35+</small>
              </div>
            </div>
            <div className="command-card trend">
              <span className="cmd-icon">📈</span>
              <div>
                <p>Trend</p>
                <h2 className="trend-text">{requestTrend}</h2>
                <small>Avg {avgRequests}/village</small>
              </div>
            </div>
          </div>

          <div className="health-card">
            <h4>Village Health Map</h4>
            <div className="health-grid">
              {villages.map(v => (
                <div
                  key={v.villageId}
                  className={`health-node ${healthStatus(v.requests)}`}
                  onClick={() => openVillageDetail(v)}
                  title={`${v.villageName}: ${v.requests} requests`}
                >
                  <span className="node-name">{v.villageName}</span>
                  <span className="node-count">{v.requests}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="timeline-card">
          <div className="panel-header">
            <h3>Live Activity Stream</h3>
            <span className="pulse-dot"></span>
          </div>
          <div className="activity-list">
            {events.length === 0 && (
              <div className="activity-empty">Awaiting events...</div>
            )}
            {events.map((e, i) => (
              <div key={i} className={`activity-item activity-${e.type}`}>
                <span className="activity-time">{e.time}</span>
                <span className="activity-msg">{e.message}</span>
                <span className={`activity-tag tag-${e.type}`}>{e.type}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ANNOUNCEMENTS */}
      <div className="announce-card">
        <div className="panel-header">
          <h3>Upcoming Deadlines & Announcements</h3>
          <button className="panel-link" onClick={() => showToast("All announcements viewed")}>View All</button>
        </div>
        <div className="announce-list">
          {announcements.map(a => (
            <div key={a.id} className="announce-item">
              <div className="announce-left">
                {priorityBadge(a.priority)}
                <span className="announce-title">{a.title}</span>
              </div>
              <div className="announce-right">
                <span className="announce-dept">{a.dept}</span>
                <span className="announce-date">📅 {a.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VILLAGE TABLE */}
      <div className="table-card">
        <div className="panel-header">
          <h3>Village Registry</h3>
          <input
            className="village-search"
            placeholder="🔍  Search village..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Village</th>
                <th>Population</th>
                <th>Households</th>
                <th>Workers</th>
                <th>Requests</th>
                <th>VAO ID</th>
                <th>VAO Status</th>
                <th>Health</th>
                <th>Last Inspection</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVillages.map(v => (
                <tr key={v.villageId} className="table-row">
                  <td>
                    <button className="village-link" onClick={() => openVillageDetail(v)}>
                      {v.villageName}
                    </button>
                  </td>
                  <td>{v.population?.toLocaleString() || "—"}</td>
                  <td>{v.households?.toLocaleString() || "—"}</td>
                  <td>{v.workers}</td>
                  <td>{v.requests}</td>
                  <td className="mono">{v.vaoId || "—"}</td>
                  <td>{statusBadge(v.vaoStatus)}</td>
                  <td>
                    <span className={`health-badge ${healthStatus(v.requests)}`}>
                      {healthStatus(v.requests)}
                    </span>
                  </td>
                  <td>{v.lastInspection || "—"}</td>
                  <td className="action-cell">
                    <button className="action-btn view-btn" onClick={() => openVillageDetail(v)}>View</button>
                    {!v.vaoId && (
                      <button className="action-btn assign-btn" onClick={() => openProvisionModal(v)}>
                        Assign VAO
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTTOM ROW — GRIEVANCES + SCHEMES QUICK VIEW */}
      <div className="two-col-row">

        <div className="mini-panel">
          <div className="panel-header">
            <h3>Recent Grievances</h3>
            <button className="panel-link" onClick={() => setActiveNav("grievances")}>All →</button>
          </div>
          <div className="mini-list">
            {grievances.slice(0, 4).map(g => (
              <div key={g.id} className="mini-item">
                <div className="mini-left">
                  <span className="mini-id">{g.id}</span>
                  <span className="mini-label">{g.type}</span>
                </div>
                <div className="mini-right">
                  <span className="mini-village">{g.village}</span>
                  {grievanceStatusBadge(g.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mini-panel">
          <div className="panel-header">
            <h3>Scheme Enrollment</h3>
            <button className="panel-link" onClick={() => setActiveNav("schemes")}>All →</button>
          </div>
          <div className="mini-list">
            {schemes.slice(0, 4).map(s => (
              <div key={s.name} className="mini-item">
                <div className="mini-left">
                  <span className="mini-label">{s.name}</span>
                </div>
                <div className="mini-right">
                  <span className="mini-enrolled">{s.enrolled}/{s.eligible}</span>
                  <div className="scheme-bar">
                    <div
                      className="scheme-fill"
                      style={{ width: `${Math.round((s.enrolled / s.eligible) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );

  const renderMainContent = () => {
    switch (activeNav) {
      case "news":        return <NewsPanel />;
      case "schemes":     return <SchemesPanel />;
      case "budget":      return <BudgetPanel />;
      case "inspections": return <InspectionsPanel />;
      case "weather":     return <WeatherPanel />;
      case "grievances":  return <GrievancesPanel />;
      default:            return <OverviewContent />;
    }
  };


  /* ===============================
     RENDER
  =============================== */

  return (
    <>
      <Navbar />

      {notification && (
        <div className={`notification ${notification.type}`}>
          <span className="notif-icon">
            {notification.type === "success" ? "✓" : notification.type === "danger" ? "✕" : "!"}
          </span>
          {notification.msg}
        </div>
      )}

      <div className={`mao-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>

        {/* ============================
            SIDEBAR
        ============================ */}

        <aside className="mao-sidebar">

          <div className="sidebar-header">
            <div className="sidebar-logo">
              <span className="logo-icon">🏛</span>
              {!sidebarCollapsed && (
                <div className="logo-text">
                  <span className="logo-title">MAO Console</span>
                  <span className="logo-sub">{mandalName}</span>
                </div>
              )}
            </div>
            <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? "›" : "‹"}
            </button>
          </div>

          <div className="sidebar-officer">
            <div className="officer-avatar">{officerName.charAt(0)}</div>
            {!sidebarCollapsed && (
              <div className="officer-info">
                <span className="officer-name">{officerName}</span>
                <span className="officer-id">{maoId}</span>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <div className="sidebar-clock">
              <span className="clock-time">
                {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="clock-date">
                {currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </div>
          )}

          {!sidebarCollapsed && <div className="sidebar-section-label">NAVIGATION</div>}

          <nav className="sidebar-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`sidebar-btn ${activeNav === item.id ? "active" : ""}`}
                onClick={() => setActiveNav(item.id)}
                title={sidebarCollapsed ? item.label : ""}
              >
                <span className="nav-icon">{item.icon}</span>
                {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                {!sidebarCollapsed && item.id === "grievances" && escalatedGrievances > 0 && (
                  <span className="nav-badge">{escalatedGrievances}</span>
                )}
                {!sidebarCollapsed && item.id === "villages" && villagesWithoutVAO > 0 && (
                  <span className="nav-badge warn">{villagesWithoutVAO}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <button className="sidebar-btn logout" onClick={logout}>
              <span className="nav-icon">⏻</span>
              {!sidebarCollapsed && <span className="nav-label">Logout</span>}
            </button>
          </div>

        </aside>


        {/* ============================
            MAIN CONTENT
        ============================ */}

        <main className="mao-main">

          <div className="dashboard-topbar">
            <div className="topbar-left">
              <h1 className="topbar-title">
                {navItems.find(n => n.id === activeNav)?.icon}{" "}
                {navItems.find(n => n.id === activeNav)?.label || "Dashboard"}
              </h1>
              <p className="topbar-sub">
                {activeNav === "overview"
                  ? "Monitoring and coordination overview"
                  : `${navItems.find(n => n.id === activeNav)?.label} management`}
              </p>
            </div>
            <div className="topbar-right">
              <button className="topbar-btn" onClick={() => showToast("Data refreshed")}>⟳ Refresh</button>
              <button className="topbar-btn" onClick={() => showToast("Report exported")}>⬇ Export</button>
              <div className="profile-chip">
                <span>{officerName}</span>
                <span className="chip-id">{maoId}</span>
              </div>
            </div>
          </div>

          {renderMainContent()}

        </main>
      </div>


      {/* ============================
          PROVISION VAO MODAL
      ============================ */}

      {showProvisionModal && (
        <div className="modal-overlay" onClick={() => setShowProvisionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Provision VAO Officer</h3>
              <button className="modal-close" onClick={() => setShowProvisionModal(false)}>✕</button>
            </div>
            <p className="modal-sub">
              Assign a new Village Administrative Officer to
              <strong> {selectedVillage?.villageName}</strong>
            </p>
            <div className="modal-field">
              <label>Full Name</label>
              <input placeholder="e.g. Ravi Kumar" value={vaoName} onChange={e => setVaoName(e.target.value)} />
            </div>
            <div className="modal-field">
              <label>Email Address</label>
              <input placeholder="vao@gov.in" value={vaoEmail} onChange={e => setVaoEmail(e.target.value)} />
            </div>
            <div className="modal-field">
              <label>Mobile Number</label>
              <input placeholder="+91 XXXXX XXXXX" value={vaoPhone} onChange={e => setVaoPhone(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowProvisionModal(false)}>Cancel</button>
              <button className="primary-btn" onClick={provisionVAO}>Provision VAO</button>
            </div>
          </div>
        </div>
      )}


      {/* ============================
          VILLAGE DETAIL MODAL
      ============================ */}

      {showVillageDetailModal && selectedVillage && (
        <div className="modal-overlay" onClick={() => setShowVillageDetailModal(false)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Village Profile — {selectedVillage.villageName}</h3>
              <button className="modal-close" onClick={() => setShowVillageDetailModal(false)}>✕</button>
            </div>
            <div className="village-detail-grid">
              <div className="vd-item"><label>Village ID</label><span className="mono">{selectedVillage.villageId}</span></div>
              <div className="vd-item"><label>Area</label><span>{selectedVillage.area}</span></div>
              <div className="vd-item"><label>Population</label><span>{selectedVillage.population?.toLocaleString()}</span></div>
              <div className="vd-item"><label>Households</label><span>{selectedVillage.households?.toLocaleString()}</span></div>
              <div className="vd-item"><label>Field Workers</label><span>{selectedVillage.workers}</span></div>
              <div className="vd-item"><label>Open Requests</label><span>{selectedVillage.requests}</span></div>
              <div className="vd-item"><label>VAO ID</label><span className="mono">{selectedVillage.vaoId || "Unassigned"}</span></div>
              <div className="vd-item"><label>VAO Status</label><span>{statusBadge(selectedVillage.vaoStatus)}</span></div>
              <div className="vd-item"><label>Health</label><span className={`health-badge ${healthStatus(selectedVillage.requests)}`}>{healthStatus(selectedVillage.requests)}</span></div>
              <div className="vd-item"><label>Last Inspection</label><span>{selectedVillage.lastInspection}</span></div>
            </div>
            <div className="modal-actions">
              {!selectedVillage.vaoId && (
                <button className="primary-btn" onClick={() => { setShowVillageDetailModal(false); openProvisionModal(selectedVillage); }}>
                  Assign VAO
                </button>
              )}
              <button className="cancel-btn" onClick={() => setShowVillageDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default MaoDashboard;