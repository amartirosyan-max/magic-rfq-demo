import axios from "axios";
import { ELocalStorageKey } from "~/constants/localstorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_BE_URL,
});

api.interceptors.request.use((config) => {
  if (config.url === "/signin") {
    return config;
  }

  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorStatus = error?.response?.status;

    if (errorStatus === 401) {
      window.localStorage.setItem(ELocalStorageKey.IsUserLoggedIn, "false");
      window.localStorage.removeItem("auth_token");

      // Избегаем бесконечной перезагрузки, если уже на странице логина
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    throw error;
  },
);

export default api;
