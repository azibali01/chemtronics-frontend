import axios from "axios";

const api = axios.create({
  baseURL: "https://chemtronics-backend.onrender.com",
});

api.interceptors.request.use((config) => {
  const brand =
    (localStorage.getItem("brand") as "chemtronics" | "hydroworx") ||
    "chemtronics";
  config.headers["x-brand"] = brand;
  return config;
});

export default api;
