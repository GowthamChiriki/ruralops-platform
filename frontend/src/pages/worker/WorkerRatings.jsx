import "../../styles//WorkerRatings.css";

export default function WorkerRatings(){

  return (
    <div className="worker-ratings">

      <h2>Citizen Ratings</h2>

      <div className="ratings-placeholder">

        <div className="ratings-icon">⭐</div>

        <h3>Feedback System Coming Soon</h3>

        <p>
          Citizen rating and feedback features are currently under development.
        </p>

        <ul>
          <li>Citizens will rate completed complaints</li>
          <li>Workers will receive service feedback</li>
          <li>Governance dashboards will analyze performance</li>
          <li>Ratings will influence worker analytics scores</li>
        </ul>

        <p className="ratings-note">
          Ratings will appear here once the feedback API is implemented.
        </p>

      </div>

    </div>
  );
}