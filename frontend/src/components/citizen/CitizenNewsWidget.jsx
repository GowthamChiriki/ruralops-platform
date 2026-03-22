import React from "react";

function CitizenNewsWidget({ data }) {

  return (

    <div className="dashboard-card">

      <h3>Village News</h3>

      <p>{data.latestNews}</p>

    </div>

  );
}

export default CitizenNewsWidget;