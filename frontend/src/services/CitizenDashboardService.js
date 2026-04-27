import axios from "axios";

const API_BASE = "https://ruralops-platform-production.up.railway.app";

/**
 * Loads the citizen dashboard from backend
 */
export const loadCitizenDashboard = async (citizenId) => {

  try {

    const token = localStorage.getItem("accessToken");

    const response = await axios.get(
      `${API_BASE}/citizen/dashboard/${citizenId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;

  } catch (error) {

    console.error("Failed to load citizen dashboard:", error);

    if (error.response?.status === 401) {
      console.warn("Unauthorized — redirecting to login");
      window.location.href = "/login";
    }

    throw error;

  }

};