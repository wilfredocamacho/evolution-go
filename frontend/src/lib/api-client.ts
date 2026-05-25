import type { ApiResponse, RequestOptions } from "@/types/api";
import { API_BASE, STORAGE_KEY } from "./constants";

const instanceTokenCache: Map<string, string> = new Map();
export function setInstanceTokenCache(
  id: string,
  token: string
): void {
  instanceTokenCache.set(id, token);
}

export function clearInstanceTokenCache(): void {
  instanceTokenCache.clear();
}

async function getAdminKey(): Promise<string | null> {
  return localStorage.getItem(STORAGE_KEY);
}

function getInstanceToken(id: string): string | undefined {
  return instanceTokenCache.get(id);
}

function buildUrl(path: string, params?: Record<string, string>): string {
  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  return url;
}

async function getApiKey(opts: RequestOptions): Promise<string | null> {
  if (opts.apiKey) return opts.apiKey;
  if (opts.isAdmin) return getAdminKey();
  if (opts.instanceId) {
    const token = getInstanceToken(opts.instanceId);
    if (token) return token;
  }
  return null;
}

export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params, isFormData } = opts;

  const apiKey = await getApiKey(opts);
  const headers: Record<string, string> = {};

  if (apiKey) {
    headers["apikey"] = apiKey;
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorBody.message || `HTTP ${response.status}`;
    } catch {
      errorMessage = `HTTP ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(
  path: string,
  opts?: RequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...opts, method: "GET" });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  opts?: RequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...opts, method: "POST", body });
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  opts?: RequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...opts, method: "PUT", body });
}

export async function apiDelete<T>(
  path: string,
  opts?: RequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...opts, method: "DELETE" });
}

/** Extract data from wrapped ApiResponse */
export function extractData<T>(response: ApiResponse<T>): T | undefined {
  return response.data;
}
