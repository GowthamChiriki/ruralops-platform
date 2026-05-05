import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

/* ── PUBLIC ── */
import LandingPage   from "./pages/LandingPage";
import MobileAppPage from "./pages/MobileAppPage";

/* ── CITIZEN PRE-LOGIN ── */
import CitizenRegistrationPage from "./pages/CitizenRegistrationPage";
import CitizenStatusPage       from "./pages/CitizenStatusPage";

/* ── ACTIVATION ── */
import AccountActivatePage      from "./pages/ActivateAccountPage";
import ActivationKeyRequestPage from "./pages/ActivationKeyRequestPage";

/* ── AUTH ── */
import LoginPage from "./pages/LoginPage";

/* ── DASHBOARDS ── */
import MaoDashboard     from "./pages/MaoDashboard";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import VaoDashboard     from "./pages/vao/VaoDashboard";
import WorkerDashboard  from "./pages/worker/WorkerDashboard";

/* ── PROFILES ── */
import CitizenProfileForm   from "./pages/citizen/CitizenProfileForm";
import VaoProfileCompletion from "./pages/vao/VaoProfileCompletion";

/* ── VAO OPS ── */
import WorkerProvision  from "./pages/vao/WorkerProvision";
import CitizenApprovals from "./pages/vao/CitizenApproval.jsx";

/* ── CITIZEN COMPLAINTS ── */
import ComplaintSubmissionPage from "./pages/citizen/ComplaintSubmissionPage";
import CitizenComplaintsPage   from "./pages/citizen/CitizenComplaintsPage";
import ComplaintDetailPage     from "./pages/citizen/ComplaintDetailPage";

/* ── VAO COMPLAINTS ── */
import VaoComplaintsDashboard  from "./pages/vao/complaints/VaoComplaintsDashboard";
import VaoUnassignedComplaints from "./pages/vao/complaints/VaoUnassignedComplaints";
import VaoComplaintsByStatus   from "./pages/vao/complaints/VaoComplaintsByStatus";
import VaoAreaComplaints       from "./pages/vao/complaints/VaoAreaComplaints";
import VaoWorkerComplaints     from "./pages/vao/complaints/VaoWorkerComplaints";
import VaoComplaintDetails     from "./pages/vao/complaints/VaoComplaintDetails";
import VaoAnalyticsDashboard   from "./pages/vao/complaints/VaoAnalyticsDashboard";

/* ── WORKER ── */
import WorkerProfileForm       from "./pages/worker/WorkerProfileForm";
import ComplaintDetail         from "./pages/worker/ComplaintDetail";
import WorkerTasksPage         from "./pages/worker/WorkerTasks";
import WorkerAnalyticsPage     from "./pages/worker/WorkerAnalytics";
import WorkerActivityPage      from "./pages/worker/WorkerActivity";
import WorkerRatingsPage       from "./pages/worker/WorkerRatings";
import WorkerNotificationsPage from "./pages/worker/WorkerNotifications";

/* ================================================================
   AUTH HELPERS  (read fresh on every render — never stale)
   Keys must match exactly what LoginPage.jsx writes via saveSession():
     "accessToken" | "accountType" | "accountId" | "villageId"
================================================================ */
function getToken()  { return localStorage.getItem("accessToken"); }
function getType()   { return localStorage.getItem("accountType"); } // matches saveSession()
function getId()     { return localStorage.getItem("accountId");   } // matches saveSession()

/* ================================================================
   GUARDS
================================================================ */

/**
 * Redirects authenticated users away from public pages (login, register).
 * Citizen/VAO/Worker identity is carried in the JWT — no ID in the URL.
 */
function PublicRoute({ children }) {
  const token = getToken();
  const type  = getType();
  if (!token) return children;
  const destinations = {
    CITIZEN: "/citizen/dashboard",
    MAO:     "/mao/dashboard",
    VAO:     `/vao/dashboard/${getId()}`,
    WORKER:  "/worker/dashboard",
  };
  return <Navigate to={destinations[type] ?? "/"} replace />;
}

/**
 * Role-specific guard — requires a token AND matching role.
 */
function RoleRoute({ role, children }) {
  const token = getToken();
  const type  = getType();
  if (!token) return <Navigate to="/login" replace />;
  if (type !== role) return <Unauthorized />;
  return children;
}

/**
 * Generic protection — requires a valid token AND a role (guards half-broken sessions).
 */
function ProtectedRoute({ children }) {
  const token = getToken();
  const role  = getType();
  return token && role
    ? children
    : <Navigate to="/login" replace />;
}

/* ================================================================
   FALLBACK PAGES
================================================================ */
function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      background: "#f2f5f0", color: "#172117", textAlign: "center", padding: 40,
      fontFamily: "system-ui,sans-serif",
    }}>
      <div style={{ fontSize: 80, fontWeight: 800, color: "#25593f", lineHeight: 1 }}>404</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Page Not Found</div>
      <div style={{ fontSize: 14, color: "#6b7e6f", maxWidth: 360, lineHeight: 1.7 }}>
        The page you're looking for doesn't exist or has been moved.
      </div>
      <a href="/" style={{ marginTop: 8, padding: "10px 28px", borderRadius: 8, background: "#25593f", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
        ← Back to Home
      </a>
    </div>
  );
}

function Unauthorized() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      background: "#f2f5f0", color: "#172117", textAlign: "center", padding: 40,
      fontFamily: "system-ui,sans-serif",
    }}>
      <div style={{ fontSize: 80, fontWeight: 800, color: "#b84040", lineHeight: 1 }}>401</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Unauthorised Access</div>
      <div style={{ fontSize: 14, color: "#6b7e6f", maxWidth: 380, lineHeight: 1.75 }}>
        This page requires a valid account. Please log in to continue.
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <a href="/login" style={{ padding: "10px 28px", borderRadius: 8, background: "#25593f", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>→ Login</a>
        <a href="/"      style={{ padding: "10px 28px", borderRadius: 8, border: "1.5px solid #25593f", color: "#25593f", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>← Home</a>
      </div>
    </div>
  );
}

/* ================================================================
   APP
================================================================ */
export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem("ruralops-theme") || 
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        {/* ════════════════════════════════
            PUBLIC
        ════════════════════════════════ */}
        <Route path="/"           element={<LandingPage />} />
        <Route path="/mobile-app" element={<MobileAppPage />} />

        {/* ════════════════════════════════
            CITIZEN ONBOARDING — permitAll
        ════════════════════════════════ */}
        <Route path="/citizen/register"        element={<CitizenRegistrationPage />} />
        <Route path="/citizen/status"          element={<CitizenStatusPage />} />
        <Route path="/citizen/activate"        element={<AccountActivatePage />} />
        <Route path="/citizen/activate/:token" element={<AccountActivatePage />} />

        {/* ════════════════════════════════
            WORKER ONBOARDING — permitAll
        ════════════════════════════════ */}
        <Route path="/workers/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/workers/activate"        element={<AccountActivatePage />} />
        <Route path="/workers/activate/:token" element={<AccountActivatePage />} />

        {/* ════════════════════════════════
            ACTIVATION (generic) — permitAll
        ════════════════════════════════ */}
        <Route path="/activate-account"   element={<AccountActivatePage />} />
        <Route path="/activation/request" element={<ActivationKeyRequestPage />} />

        {/* ════════════════════════════════
            AUTH — /auth/** → permitAll
        ════════════════════════════════ */}
        <Route path="/login"      element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/auth/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* ════════════════════════════════
            CITIZEN PORTAL
            Identity comes from JWT — no :citizenId in any URL.
            ORDER: literal paths before dynamic :params
        ════════════════════════════════ */}

        {/* dashboard — single static route */}
        <Route
          path="/citizen/dashboard"
          element={<RoleRoute role="CITIZEN"><CitizenDashboard /></RoleRoute>}
        />

        {/* profile */}
        <Route
          path="/citizen/profile"
          element={<RoleRoute role="CITIZEN"><CitizenProfileForm /></RoleRoute>}
        />

        {/* complaint detail */}
        <Route
          path="/citizen/complaints/:complaintId"
          element={<RoleRoute role="CITIZEN"><ComplaintDetailPage /></RoleRoute>}
        />

        {/* complaint list */}
        <Route
          path="/citizen/complaints"
          element={<RoleRoute role="CITIZEN"><CitizenComplaintsPage /></RoleRoute>}
        />

        {/* new complaint submission — literal "new" segment, no param */}
        <Route
          path="/citizen/complaint/new"
          element={<RoleRoute role="CITIZEN"><ComplaintSubmissionPage /></RoleRoute>}
        />

        {/* ════════════════════════════════
            MAO PORTAL
        ════════════════════════════════ */}
        <Route
          path="/mao/dashboard"
          element={<RoleRoute role="MAO"><MaoDashboard /></RoleRoute>}
        />

        {/* ════════════════════════════════
            VAO CORE — ID stays in URL (VAO manages multiple villages)
        ════════════════════════════════ */}
        <Route
          path="/vao/dashboard/:vaoId"
          element={<RoleRoute role="VAO"><VaoDashboard /></RoleRoute>}
        />
        <Route path="/vao/dashboard" element={<Unauthorized />} />

        <Route
          path="/vao/profile/:vaoId"
          element={<RoleRoute role="VAO"><VaoProfileCompletion /></RoleRoute>}
        />

        <Route
          path="/vao/:vaoId/workers/add"
          element={<RoleRoute role="VAO"><WorkerProvision /></RoleRoute>}
        />
        <Route
          path="/vao/:vaoId/citizens/approvals"
          element={<RoleRoute role="VAO"><CitizenApprovals /></RoleRoute>}
        />
        <Route
          path="/vao/:vaoId/citizens/pending"
          element={<RoleRoute role="VAO"><CitizenApprovals /></RoleRoute>}
        />

        {/* ════════════════════════════════
            VAO COMPLAINTS
            ORDER: literal segments before :params
        ════════════════════════════════ */}
        <Route
          path="/vao/:vaoId/complaints"
          element={<RoleRoute role="VAO"><VaoComplaintsDashboard /></RoleRoute>}
        />
        <Route
          path="/vao/:vaoId/complaints/unassigned"
          element={<RoleRoute role="VAO"><VaoUnassignedComplaints /></RoleRoute>}
        />
        <Route
          path="/vao/:vaoId/complaints/analytics"
          element={<RoleRoute role="VAO"><VaoAnalyticsDashboard /></RoleRoute>}
        />
        <Route
          path="/vao/:vaoId/complaints/by-area"
          element={<RoleRoute role="VAO"><VaoAreaComplaints /></RoleRoute>}
        />
        <Route
          path="/vao/:vaoId/complaints/status/:status"
          element={<RoleRoute role="VAO"><VaoComplaintsByStatus /></RoleRoute>}
        />
        <Route
          path="/vao/:vaoId/complaints/area/:areaId"
          element={<RoleRoute role="VAO"><VaoAreaComplaints /></RoleRoute>}
        />
        <Route
          path="/vao/:vaoId/complaints/worker/:workerId"
          element={<RoleRoute role="VAO"><VaoWorkerComplaints /></RoleRoute>}
        />
        <Route
          path="/vao/:vaoId/complaints/view/:complaintId"
          element={<RoleRoute role="VAO"><VaoComplaintDetails /></RoleRoute>}
        />

        {/* ════════════════════════════════
            WORKER PORTAL
            Identity comes from JWT — no workerId in any URL.
            Backend: JWT → userId → WorkerAccount → worker data.
        ════════════════════════════════ */}
        <Route
          path="/worker/dashboard"
          element={<RoleRoute role="WORKER"><WorkerDashboard /></RoleRoute>}
        />
        <Route
          path="/worker/tasks"
          element={<RoleRoute role="WORKER"><WorkerTasksPage /></RoleRoute>}
        />
        <Route
          path="/worker/analytics"
          element={<RoleRoute role="WORKER"><WorkerAnalyticsPage /></RoleRoute>}
        />
        <Route
          path="/worker/activity"
          element={<RoleRoute role="WORKER"><WorkerActivityPage /></RoleRoute>}
        />
        <Route
          path="/worker/ratings"
          element={<RoleRoute role="WORKER"><WorkerRatingsPage /></RoleRoute>}
        />
        <Route
          path="/worker/notifications"
          element={<RoleRoute role="WORKER"><WorkerNotificationsPage /></RoleRoute>}
        />
        <Route
          path="/worker/profile"
          element={<RoleRoute role="WORKER"><WorkerProfileForm /></RoleRoute>}
        />
        <Route
          path="/worker/complaint/:complaintId"
          element={<RoleRoute role="WORKER"><ComplaintDetail /></RoleRoute>}
        />

        <Route
          path="/worker"
          element={<Navigate to="/worker/dashboard" replace />}
        />

        {/* ════════════════════════════════
            CATCH-ALL
        ════════════════════════════════ */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}