import {
  applyAuthResponse,
  clearStoredAuthSession,
  normalizeAuthResponse,
  readStoredAuthSession,
  isStoredAuthSessionExpired,
} from "./authStorage";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const DEFAULT_BACKEND_BASE_URL = "https://prevent-monolith-production.up.railway.app";

const parseBooleanEnv = (value?: string) => {
  if (!value) {
    return false;
  }

  return TRUE_VALUES.has(value.trim().toLowerCase());
};

const normalizeBackendBaseUrl = (value?: string) => {
  const rawBaseUrl = value?.trim() || DEFAULT_BACKEND_BASE_URL;

  return rawBaseUrl
    .replace(/\/+$/, "")
    .replace(/\/auth$/i, "");
};

const getBackendBaseUrl = () => normalizeBackendBaseUrl(import.meta.env.VITE_BACKEND_API_URL);

export const isBackendApiEnabled = () =>
  parseBooleanEnv(import.meta.env.VITE_USE_BACKEND) && Boolean(getBackendBaseUrl());

const joinUrl = (baseUrl: string, path: string) => {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

const getErrorMessage = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message.trim();
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error.trim();
  }

  if (Array.isArray(record.errors) && record.errors.length > 0) {
    const first = record.errors[0];
    if (typeof first === "string" && first.trim()) {
      return first.trim();
    }

    if (
      typeof first === "object" &&
      first !== null &&
      typeof (first as Record<string, unknown>).message === "string"
    ) {
      const message = ((first as Record<string, unknown>).message as string).trim();
      return message || null;
    }
  }

  return null;
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const buildError = (response: Response, parsedBody: unknown) => {
  const message =
    getErrorMessage(parsedBody) ?? `Erro na API (${response.status} ${response.statusText})`;
  const error = new Error(message) as Error & {
    status?: number;
    responseBody?: unknown;
  };
  error.status = response.status;
  error.responseBody = parsedBody;
  return error;
};

const getStoredAccessToken = () => {
  const session = readStoredAuthSession();
  if (session?.accessToken) {
    return session.accessToken;
  }

  return import.meta.env.VITE_BACKEND_AUTH_TOKEN?.trim() ?? "";
};

const normalizeAuthorizationValue = (tokenType: string, token: string) => {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return "";
  }

  if (/^[A-Za-z][A-Za-z0-9+.-]*\s+\S+/.test(trimmedToken)) {
    return trimmedToken;
  }

  const trimmedType = tokenType.trim() || "Bearer";
  return `${trimmedType} ${trimmedToken}`;
};

const getAuthorizationHeaderValue = () => {
  const session = readStoredAuthSession();
  if (session?.accessToken) {
    return normalizeAuthorizationValue(session.tokenType || "Bearer", session.accessToken);
  }

  const envToken = import.meta.env.VITE_BACKEND_AUTH_TOKEN?.trim() ?? "";
  if (!envToken) {
    return "";
  }

  return normalizeAuthorizationValue("Bearer", envToken);
};

let refreshInFlight: Promise<string | null> | null = null;
let lastRefreshFailureAt = 0;
const REFRESH_FAILURE_BACKOFF_MS = 10_000;

const refreshStoredAuthSession = async (): Promise<string | null> => {
  const current = readStoredAuthSession();
  if (!current?.refreshToken || !isBackendApiEnabled()) {
    return null;
  }

  try {
    const response = await fetch(joinUrl(getBackendBaseUrl(), "/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: current.refreshToken,
      }),
    });

    const parsedBody = await parseResponseBody(response);

    if (!response.ok) {
      clearStoredAuthSession();
      lastRefreshFailureAt = Date.now();
      return null;
    }

    const authResponse = normalizeAuthResponse(parsedBody);
    if (!authResponse) {
      clearStoredAuthSession();
      lastRefreshFailureAt = Date.now();
      return null;
    }

    const next = applyAuthResponse(authResponse);
    return next.accessToken;
  } catch {
    clearStoredAuthSession();
    lastRefreshFailureAt = Date.now();
    return null;
  }
};

const refreshStoredAuthSessionShared = async () => {
  const now = Date.now();
  if (now - lastRefreshFailureAt < REFRESH_FAILURE_BACKOFF_MS) {
    return null;
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshStoredAuthSession().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
};

const ensureFreshAccessToken = async () => {
  const current = readStoredAuthSession();

  if (!current?.accessToken) {
    return;
  }

  if (!current.refreshToken) {
    return;
  }

  if (!isStoredAuthSessionExpired(current)) {
    return;
  }

  await refreshStoredAuthSessionShared();
};

type RequestJsonOptions = Omit<RequestInit, "body" | "method" | "headers"> & {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  retryOnUnauthorized?: boolean;
};

const performRequest = async (
  path: string,
  options: RequestJsonOptions,
): Promise<Response> => {
  const {
    method = "GET",
    body,
    headers,
    skipAuth = false,
    retryOnUnauthorized = true,
    ...rest
  } = options;

  if (!skipAuth) {
    await ensureFreshAccessToken();
  }

  const authorizationValue = skipAuth ? "" : getAuthorizationHeaderValue();

  const response = await fetch(joinUrl(getBackendBaseUrl(), path), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(skipAuth || !authorizationValue ? {} : { Authorization: authorizationValue }),
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...rest,
  });

  if (
    response.status === 401 &&
    retryOnUnauthorized &&
    !skipAuth &&
    readStoredAuthSession()?.refreshToken
  ) {
    const nextToken = await refreshStoredAuthSessionShared();

    if (nextToken) {
      return fetch(joinUrl(getBackendBaseUrl(), path), {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: normalizeAuthorizationValue("Bearer", nextToken),
          ...(headers ?? {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        ...rest,
      });
    }
  }

  return response;
};

export const requestJson = async <T>(
  path: string,
  options: RequestJsonOptions = {},
): Promise<T> => {
  if (!isBackendApiEnabled()) {
    throw new Error("Backend API desabilitada. Configure VITE_USE_BACKEND e VITE_BACKEND_API_URL.");
  }

  const response = await performRequest(path, options);
  const parsedBody = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && !options.skipAuth) {
      clearStoredAuthSession();
    }
    throw buildError(response, parsedBody);
  }

  return parsedBody as T;
};

type MultipartOptions = Omit<RequestInit, "body" | "method" | "headers"> & {
  method?: "POST" | "PUT" | "PATCH";
  fieldName?: string;
  file: File;
  headers?: Record<string, string>;
  retryOnUnauthorized?: boolean;
};

export const uploadMultipart = async <T>(
  path: string,
  options: MultipartOptions,
): Promise<T> => {
  if (!isBackendApiEnabled()) {
    throw new Error("Backend API desabilitada. Configure VITE_USE_BACKEND e VITE_BACKEND_API_URL.");
  }

  const {
    method = "POST",
    fieldName = "file",
    file,
    headers,
    retryOnUnauthorized = true,
    ...rest
  } = options;

  const formData = new FormData();
  formData.append(fieldName, file);

  const attempt = async (tokenOverride?: string) => {
    if (!tokenOverride) {
      await ensureFreshAccessToken();
    }

    const token = tokenOverride ?? getAuthorizationHeaderValue();

    return fetch(joinUrl(getBackendBaseUrl(), path), {
      method,
      headers: {
        ...(token ? { Authorization: token } : {}),
        ...(headers ?? {}),
      },
      body: formData,
      ...rest,
    });
  };

  let response = await attempt();

  if (response.status === 401 && retryOnUnauthorized && readStoredAuthSession()?.refreshToken) {
    const nextToken = await refreshStoredAuthSessionShared();
    if (nextToken) {
      response = await attempt(normalizeAuthorizationValue("Bearer", nextToken));
    }
  }

  const parsedBody = await parseResponseBody(response);

  if (!response.ok) {
    throw buildError(response, parsedBody);
  }

  return parsedBody as T;
};
