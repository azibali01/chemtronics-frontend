// src/api_configuration/api.ts
import axios from "axios";

const productionApiBaseURL = "https://chemtronics-backend-xufv.onrender.com";

const configuredApiBaseURL = import.meta.env.VITE_API_BASE_URL?.trim().replace(
  /\/+$/,
  "",
);

// In production, always use the backend URL if VITE_API_BASE_URL is not explicitly set
export const apiBaseURL =
  import.meta.env.DEV
    ? configuredApiBaseURL || ""
    : configuredApiBaseURL || productionApiBaseURL;

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true, // ✅ Important for CORS + cookies
});

api.interceptors.request.use((config) => {
  const brand = (localStorage.getItem("brand") || "chemtronics").toLowerCase();
  config.headers["x-brand"] = brand;

  // Add JWT token if available
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

// Ensure errors are always forwarded to catch blocks
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default api;
