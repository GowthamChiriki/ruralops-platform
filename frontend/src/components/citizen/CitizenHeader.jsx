import React from "react";

function CitizenHeader({ data }) {

  return (

    <div className="dashboard-header">

      <div className="dashboard-greeting">

        <h2>Welcome, {data.citizenName}</h2>

        <p>{data.villageName}</p>

      </div>

      <div className="dashboard-profile">

        <img
          src={`http://localhost:8080${data.profilePhoto}`}
          alt="profile"
          className="dashboard-avatar"
        />

      </div>

    </div>

  );
}

export default CitizenHeader;