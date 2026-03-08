import axios from "axios";

export function isMissingApiError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 405 || status === 501;
}

export function getApiErrorMessage(error: unknown, fallback = "Request failed") {
  if (!axios.isAxiosError(error)) return fallback;
  const message = error.response?.data?.detail;
  if (typeof message === "string") return message;
  return fallback;
}
