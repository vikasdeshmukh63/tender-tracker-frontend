import axios from "axios";
import { toast } from "sonner";

// Requests that exceed this timeout will be treated as failures immediately,
// so the UI never stays stuck in a "pending" state when the user is offline.
const REQUEST_TIMEOUT_MS = 12_000;

const api = axios.create({
  baseURL:
    (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
    "http://localhost:4000/api",
  timeout: REQUEST_TIMEOUT_MS,
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("esds_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: global error handling ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const token = localStorage.getItem("esds_token");
    const url = error?.config?.url || "";

    // Auth / signup / OTP endpoints manage their own inline error messages.
    // Skip the global toast to avoid showing duplicate feedback.
    const isAuthEndpoint =
      url.startsWith("/auth/") ||
      url.startsWith("/user-profiles");

    // 401 / 403 on protected routes → clear session and redirect to login.
    if ((status === 401 || status === 403) && token && !isAuthEndpoint) {
      try {
        localStorage.removeItem("esds_token");
        localStorage.removeItem("esds_user");
      } catch {
        // ignore storage errors
      }
      window.location.href = "/Home";
      return Promise.reject(error);
    }

    // Show a user-friendly toast for every other failure.
    if (!isAuthEndpoint) {
      const { title, description } = buildErrorMessage(error);
      toast.error(title, { description });
    }

    return Promise.reject(error);
  }
);

/**
 * Maps an Axios error to a human-readable { title, description } pair.
 */
function buildErrorMessage(error) {
  // ── No response: offline, DNS failure, server not running, or timeout ───────
  if (!error.response) {
    if (
      error.code === "ECONNABORTED" ||
      error.message?.toLowerCase().includes("timeout")
    ) {
      return {
        title: "Request Timed Out",
        description:
          "The server took too long to respond. Please check your internet connection and try again.",
      };
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return {
        title: "No Internet Connection",
        description:
          "You appear to be offline. Please reconnect and try again.",
      };
    }

    return {
      title: "Connection Error",
      description:
        "Could not reach the server. Please check your internet connection and try again.",
    };
  }

  // ── HTTP error responses ────────────────────────────────────────────────────
  const status = error.response.status;
  // Prefer the backend's own message when available
  const serverMsg =
    error.response?.data?.message ||
    error.response?.data?.error ||
    null;

  if (status === 400)
    return {
      title: "Invalid Request",
      description: serverMsg || "Please check your input and try again.",
    };

  if (status === 404)
    return {
      title: "Not Found",
      description: serverMsg || "The requested resource could not be found.",
    };

  if (status === 409)
    return {
      title: "Conflict",
      description:
        serverMsg || "A conflict occurred. The record may already exist.",
    };

  if (status === 422)
    return {
      title: "Validation Error",
      description: serverMsg || "Please check your input and try again.",
    };

  if (status === 429)
    return {
      title: "Too Many Requests",
      description:
        "You are making requests too quickly. Please wait a moment and try again.",
    };

  if (status >= 500)
    return {
      title: "Server Error",
      description:
        "Something went wrong on our end. Please try again in a moment.",
    };

  return {
    title: "Something Went Wrong",
    description:
      serverMsg || "An unexpected error occurred. Please try again.",
  };
}

export default api;
