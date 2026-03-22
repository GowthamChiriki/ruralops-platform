import { useMemo } from "react";
import "../../styles//WorkerOverview.css";

/* =========================================================
   TIME CALCULATION
========================================================= */

function hoursBetween(start, end) {
  if (!start || !end) return null;

  const diff = new Date(end) - new Date(start);

  if (!diff || diff < 0) return null;

  return diff / 3600000;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function WorkerOverview({ worker, tasks }) {

  const stats = useMemo(() => {

    if (!tasks || tasks.length === 0) {
      return {
        total: 0,
        completed: 0,
        active: 0,
        avgRating: 0,
        avgTime: 0
      };
    }

    const completedTasks =
      tasks.filter(t => ["RESOLVED","VERIFIED","CLOSED"].includes(t.status));

    const activeTasks =
      tasks.filter(t => ["ASSIGNED","IN_PROGRESS"].includes(t.status));

    /* ==============================
       Average Worker Rating
    ============================== */

    const ratings =
      tasks.filter(t => t.workerRating != null)
           .map(t => t.workerRating);

    const avgRating =
      ratings.length === 0
        ? 0
        : (ratings.reduce((s,r)=>s+r,0) / ratings.length).toFixed(1);

    /* ==============================
       Average Resolution Time
    ============================== */

    const times =
      completedTasks
        .map(t => hoursBetween(t.startedAt, t.resolvedAt))
        .filter(v => v != null);

    const avgTime =
      times.length === 0
        ? 0
        : (times.reduce((s,t)=>s+t,0) / times.length).toFixed(1);

    return {
      total: tasks.length,
      completed: completedTasks.length,
      active: activeTasks.length,
      avgRating,
      avgTime
    };

  }, [tasks]);

  if (!worker) return null;

  return (
    <div className="worker-overview">

      <div className="worker-header">

        <h2>{worker.name}</h2>

        <p>{worker.areaName}</p>

      </div>

      <div className="worker-stats">

        <div className="worker-card">
          <h3>{stats.total}</h3>
          <p>Total Tasks</p>
        </div>

        <div className="worker-card">
          <h3>{stats.completed}</h3>
          <p>Completed</p>
        </div>

        <div className="worker-card">
          <h3>{stats.active}</h3>
          <p>Active</p>
        </div>

        <div className="worker-card">
          <h3>{stats.avgRating}</h3>
          <p>Avg Rating</p>
        </div>

        <div className="worker-card">
          <h3>{stats.avgTime}h</h3>
          <p>Avg Resolution</p>
        </div>

      </div>

    </div>
  );
}