import React from "react";

function CitizenComplaintMetrics({ data }) {

  return (

    <div className="dashboard-card">

      <h3>Complaints Overview</h3>

      <div className="metrics">

        <div className="metric">

          <span>Total</span>
          <strong>{data.totalComplaints}</strong>

        </div>

        <div className="metric">

          <span>Pending</span>
          <strong>{data.pendingComplaints}</strong>

        </div>

      </div>

    </div>

  );
}

export default CitizenComplaintMetrics;