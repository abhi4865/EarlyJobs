// src/api/client.js
import axios from "axios";
import { TOKEN_KEY } from "@/lib/constants";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  // The mock is code-split so it never ships in a production build that uses the real backend
  ...(useMock ? { adapter: (config) => import("./mock/adapter").then((m) => m.default(config)) } : {}),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLogin = error.config?.url?.includes("auth/login");
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (err, fallback = "Something went wrong. Please try again.") =>
  err?.response?.data?.message || (err?.code === "ECONNABORTED" ? "The request timed out." : err?.message === "Network Error" ? "Can't reach the server. Check your connection." : fallback);

export const isMockMode = useMock;
export default api;
