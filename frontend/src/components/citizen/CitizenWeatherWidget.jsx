import React from "react";

function CitizenWeatherWidget({ data }) {

  return (

    <div className="dashboard-card">

      <h3>Weather</h3>

      <p>{data.weatherSummary}</p>

    </div>

  );
}

export default CitizenWeatherWidget;