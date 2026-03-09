"use client";

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const { refreshToken, clearAuth, setTokens } = useAuthStore.getState();
  if (!refreshToken) {
    clearAuth();
    return null;
  }

  try {
    const response = await axios.post<{ access: string; refresh?: string }>(`${API_BASE_URL}/auth/refresh/`, {
      refresh: refreshToken,
    });

    const nextAccess = response.data.access;
    const nextRefresh = response.data.refresh ?? refreshToken;
    setTokens({ accessToken: nextAccess, refreshToken: nextRefresh });
    return nextAccess;
  } catch {
    clearAuth();
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const nextAccessToken = await refreshPromise;
    if (!nextAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
    return api(originalRequest);
  }
);

export default api;
