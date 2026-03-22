/**
 * workerComplaintApi.js
 * ─────────────────────────────────────────────────────────────
 * Centralised API client for all worker ↔ complaint operations.
 *
 * Every function returns a Promise that resolves to parsed JSON
 * (or throws on HTTP errors).
 *
 * Usage:
 *   import { getWorkerComplaints, startWork, completeWork }
 *     from "../../services/workerComplaintApi";
 * ─────────────────────────────────────────────────────────────
 */

const BASE = "http://localhost:8080";

/* ─── shared helper ─── */
async function request(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `Request failed: ${res.status}`);
  }
  /* 204 No Content — return null */
  if (res.status === 204) return null;
  return res.json();
}

function authHeaders(token, extra = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

/* ══════════════════════════════════════════════════════════════
   READ
══════════════════════════════════════════════════════════════ */

/**
 * GET /workers/{workerId}/complaints
 * All complaints assigned to this worker.
 */
export const getWorkerComplaints = (workerId, token) =>
  request(`${BASE}/workers/${workerId}/complaints`, {
    headers: authHeaders(token),
  });

/**
 * GET /workers/{workerId}/complaints/status/{status}
 * Complaints filtered by backend status enum value.
 *
 * @param {string} status  - e.g. "ASSIGNED" | "IN_PROGRESS" | "RESOLVED"
 */
export const getWorkerComplaintsByStatus = (workerId, status, token) =>
  request(`${BASE}/workers/${workerId}/complaints/status/${status}`, {
    headers: authHeaders(token),
  });

/**
 * GET /workers/{workerId}/complaints/{complaintId}
 * Single complaint detail.
 */
export const getComplaintDetail = (workerId, complaintId, token) =>
  request(`${BASE}/workers/${workerId}/complaints/${complaintId}`, {
    headers: authHeaders(token),
  });

/* ══════════════════════════════════════════════════════════════
   LIFECYCLE
══════════════════════════════════════════════════════════════ */

/**
 * POST /workers/{workerId}/complaints/{complaintId}/start
 * Transition: ASSIGNED → IN_PROGRESS
 */
export const startWork = (workerId, complaintId, token) =>
  request(
    `${BASE}/workers/${workerId}/complaints/${complaintId}/start`,
    { method: "POST", headers: authHeaders(token) }
  );

/**
 * POST /workers/{workerId}/complaints/complete
 * Transition: IN_PROGRESS → RESOLVED (then AI runs)
 *
 * @param {object} payload
 *   { complaintId, afterImageUrl, workerNotes? }
 */
export const completeWork = (workerId, payload, token) =>
  request(`${BASE}/workers/${workerId}/complaints/complete`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

/* ══════════════════════════════════════════════════════════════
   FILE UPLOADS
══════════════════════════════════════════════════════════════ */

/**
 * POST /complaints/files/after/{workerId}
 * Upload the AFTER resolution image.
 * Returns { url: "http://..." }
 */
export const uploadAfterImage = async (workerId, file, token) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(
    `${BASE}/complaints/files/after/${workerId}`,
    { method: "POST", headers: authHeaders(token), body: fd }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || "Image upload failed");
  }
  return res.json(); /* { url: "..." } */
};