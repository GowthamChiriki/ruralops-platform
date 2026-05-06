/**
 * ImageService.js
 * Handles URL normalization for images, especially correcting hardcoded localhost URLs
 * returned by the backend in production environments.
 */

const BASE = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

/**
 * Normalizes an image URL by:
 * 1. Replacing http://localhost:8080 with the actual production base URL
 * 2. Ensuring relative paths are prefixed with the base URL
 * 3. Handling null/undefined inputs
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return null;
  
  let t = url.trim();
  if (!t || t.startsWith("blob:")) return null;

  // 1. Detect and fix hardcoded localhost URLs from backend response
  if (t.includes("localhost:8080")) {
    // Replace the entire protocol and host part with empty string to make it relative
    // This handles both http and https (if accidentally used) for localhost
    t = t.replace(/^https?:\/\/localhost:8080/, "");
  }

  // 2. If it's already an absolute URL (but not localhost anymore), return it
  if (t.startsWith("http://") || t.startsWith("https://")) {
    return t;
  }

  // 3. Handle relative paths
  // Ensure we don't end up with double slashes
  const baseUrl = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;
  const path = t.startsWith("/") ? t : `/${t}`;
  
  return `${baseUrl}${path}`;
}
