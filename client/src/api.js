import axios from "axios";

export const TOKEN_STORAGE_KEY = "susu_circle_token";

let memoryToken = "";
const unauthorizedListeners = new Set();

function getStorage() {
  try {
    return typeof globalThis.localStorage !== "undefined"
      ? globalThis.localStorage
      : null;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  if (memoryToken) return memoryToken;
  const storage = getStorage();
  const stored = storage ? storage.getItem(TOKEN_STORAGE_KEY) || "" : "";
  memoryToken = stored;
  return stored;
}

export function setAuthToken(token) {
  memoryToken = typeof token === "string" ? token.trim() : "";
  const storage = getStorage();
  if (storage) {
    if (memoryToken) {
      storage.setItem(TOKEN_STORAGE_KEY, memoryToken);
    } else {
      storage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
  if (memoryToken) {
    api.defaults.headers.common.Authorization = `Bearer ${memoryToken}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function clearAuthToken() {
  setAuthToken("");
}

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export function attachAuthHeader(config) {
  const token = getAuthToken();
  const headers = config.headers ?? {};
  if (token) {
    if (typeof headers.set === "function") {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  config.headers = headers;
  return config;
}

export function handleResponseError(error) {
  const status = error?.response?.status;
  const url = String(error?.config?.url || "");
  const isAuthAttempt =
    url.includes("/auth/login") || url.includes("/auth/register");

  if (status === 401 && !isAuthAttempt) {
    clearAuthToken();
    for (const listener of unauthorizedListeners) {
      listener(error);
    }
  }

  return Promise.reject(error);
}

export const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || "",
});

api.interceptors.request.use(attachAuthHeader);
api.interceptors.response.use((response) => response, handleResponseError);

export function getApiErrorMessage(error, fallback = "Request failed.") {
  return error?.response?.data?.message || error?.message || fallback;
}
