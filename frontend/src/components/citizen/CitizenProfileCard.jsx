import React from "react";

function CitizenProfileCard({ data }) {

  return (

    <div className="dashboard-card">

      <h3>Profile Status</h3>

      {data.profileCompleted ? (
        <p className="profile-complete">
          Your profile is complete
        </p>
      ) : (
        <p className="profile-warning">
          Please complete your profile
        </p>
      )}

      <button className="dashboard-btn">
        Edit Profile
      </button>

    </div>

  );
}

export default CitizenProfileCard;