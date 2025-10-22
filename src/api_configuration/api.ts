// src/api_configuration/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/",
  withCredentials: true, // ✅ Important for CORS + cookies
});

api.interceptors.request.use((config) => {
  const brand =
    (localStorage.getItem("brand") as "chemtronics" | "hydroworx") ||
    "chemtronics";
  config.headers["x-brand"] = brand;
  return config;
});

export default api;
