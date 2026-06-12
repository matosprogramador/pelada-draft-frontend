import axios, { AxiosError, isAxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const AUTH_ROUTES = ["/auth/login", "/auth/refresh", "/auth/register"];

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: () => void;
  reject: (reason?: unknown) => void;
}> = [];

function flushQueue(error?: unknown) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingQueue = [];
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const { pathname } = window.location;
  if (pathname === "/login" || pathname === "/register") return;
  window.location.href = "/login";
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthRoute = AUTH_ROUTES.some((route) => original?.url?.includes(route));

    if (status !== 401 || !original || original._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      await new Promise<void>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      });
      return api(original);
    }

    isRefreshing = true;
    try {
      await axios.post(`${BASE_URL}/auth/refresh`, undefined, { withCredentials: true });
      flushQueue();
      return api(original);
    } catch (refreshError) {
      flushQueue(refreshError);
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

interface ApiErrorBody {
  message?: string;
  error?: { message?: string } | string;
}

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as ApiErrorBody | undefined;
    const apiMessage =
      (typeof data?.error === "object" ? data.error?.message : undefined) ??
      (typeof data?.error === "string" ? data.error : undefined) ??
      data?.message;
    const message =
      apiMessage ??
      (error.code === "ERR_NETWORK"
        ? "Não foi possível conectar ao servidor. Verifique sua conexão."
        : error.message);
    return status ? `${message} (HTTP ${status})` : message;
  }
  if (error instanceof Error) return error.message;
  return "Algo deu errado. Tente novamente.";
}
