import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

let refreshRequest;

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

api.interceptors.response.use(undefined, async (error) => {
  const originalRequest = error.config;
  if (error.response?.status !== 401 || originalRequest?._retry || originalRequest?.url?.includes("/auth/")) {
    return Promise.reject(error);
  }

  originalRequest._retry = true;
  refreshRequest ||= api.post("/auth/refresh").then(({ data }) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user) {
      user.token = data.token;
      localStorage.setItem("user", JSON.stringify(user));
    }
    return data.token;
  }).finally(() => { refreshRequest = null; });

  try {
    const token = await refreshRequest;
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return api(originalRequest);
  } catch (refreshError) {
    localStorage.removeItem("user");
    return Promise.reject(refreshError);
  }
});

export default api;
