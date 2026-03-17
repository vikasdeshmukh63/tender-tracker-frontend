import axios from "axios";

const api = axios.create({
  baseURL: (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("esds_token");
  if (token) {
    // Backend expects standard Bearer <jwt> format
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global auth error handling: if the backend says the token/user is invalid on
// a protected request (where a token was sent), clear local auth state and
// send the user back to the public entry point. Login/Signup should handle
// their own errors and stay on the same page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const token = localStorage.getItem("esds_token");
    const url = error?.config?.url || "";

    const isAuthEndpoint =
      url.startsWith("/auth/login") ||
      url.startsWith("/auth/signup") ||
      url.startsWith("/user-profiles");

    if ((status === 401 || status === 403) && token && !isAuthEndpoint) {
      try {
        localStorage.removeItem("esds_token");
        localStorage.removeItem("esds_user");
      } catch {
        // ignore storage errors
      }
      // Redirect to Home so RequireAuth and guards can re-evaluate from a clean state
      window.location.href = "/Home";
    }
    return Promise.reject(error);
  }
);

export default api;


