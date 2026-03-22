import React from "react";

function CitizenQuickActions({ data }) {

  return (

    <div className="dashboard-card">

      <h3>Quick Actions</h3>

      <div className="quick-actions">

        {data.complaintsEnabled && (
          <button className="dashboard-btn">
            Register Complaint
          </button>
        )}

        {data.grievancesEnabled && (
          <button className="dashboard-btn">
            Submit Grievance
          </button>
        )}

        {data.schemesEnabled && (
          <button className="dashboard-btn">
            View Government Schemes
          </button>
        )}

      </div>

    </div>

  );
}

export default CitizenQuickActions;