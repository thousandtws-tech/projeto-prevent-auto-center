import { mergeAppSettings, readAppSettings } from "./appSettings";

export const AUTH_SESSION_STORAGE_KEY = "prevent-auto-auth-session-v1";

export type AuthWorkshop = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  sidebarImageUrl: string;
};

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  profilePhotoUrl: string;
};

export type SessionResponse = {
  workshop: AuthWorkshop;
  user: AuthUser;
};

export type AuthResponse = SessionResponse & {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type StoredAuthSession = AuthResponse & {
  expiresAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const getNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const normalizeWorkshop = (value: unknown): AuthWorkshop | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getNumber(value.id);
  const name = getString(value.name);
  const slug = getString(value.slug);

  if (!id || !name || !slug) {
    return null;
  }

  return {
    id,
    name,
    slug,
    logoUrl: getString(value.logoUrl),
    sidebarImageUrl: getString(value.sidebarImageUrl),
  };
};

const normalizeUser = (value: unknown): AuthUser | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getNumber(value.id);
  const fullName = getString(value.fullName);
  const email = getString(value.email);
  const role = getString(value.role);

  if (!id || !fullName || !email || !role) {
    return null;
  }

  return {
    id,
    fullName,
    email,
    role,
    profilePhotoUrl: getString(value.profilePhotoUrl),
  };
};

const normalizeSession = (value: unknown): SessionResponse | null => {
  if (!isRecord(value)) {
    return null;
  }

  const workshop = normalizeWorkshop(value.workshop);
  const user = normalizeUser(value.user);

  if (!workshop || !user) {
    return null;
  }

  return {
    workshop,
    user,
  };
};

export const normalizeAuthResponse = (value: unknown): AuthResponse | null => {
  if (!isRecord(value)) {
    return null;
  }

  const session = normalizeSession(value);
  const accessToken = getString(value.accessToken);
  const refreshToken = getString(value.refreshToken);
  const tokenType = getString(value.tokenType) || "Bearer";
  const expiresIn = Math.max(1, getNumber(value.expiresIn));

  if (!session || !accessToken || !refreshToken) {
    return null;
  }

  return {
    ...session,
    accessToken,
    refreshToken,
    tokenType,
    expiresIn,
  };
};

export const normalizeStoredAuthSession = (
  value: unknown,
): StoredAuthSession | null => {
  if (!isRecord(value)) {
    return null;
  }

  const authResponse = normalizeAuthResponse(value);
  const expiresAt = getString(value.expiresAt);

  if (!authResponse || !expiresAt || Number.isNaN(new Date(expiresAt).getTime())) {
    return null;
  }

  return {
    ...authResponse,
    expiresAt,
  };
};

export const createStoredAuthSession = (response: AuthResponse): StoredAuthSession => {
  const expiresAt = new Date(Date.now() + response.expiresIn * 1000).toISOString();

  return {
    ...response,
    expiresAt,
  };
};

const syncAppSettingsWithSession = (session: SessionResponse | null) => {
  const current = readAppSettings();

  if (!session) {
    mergeAppSettings({
      profile: {
        ...current.profile,
        name: "",
        email: "",
        role: "",
        avatarUrl: "",
      },
      branding: {
        ...current.branding,
        sidebarLogoUrl: "",
        workshopLogoUrl: "",
      },
    });
    return;
  }

  mergeAppSettings({
    profile: {
      ...current.profile,
      name: session.user.fullName,
      email: session.user.email,
      role: session.user.role,
      avatarUrl: session.user.profilePhotoUrl,
    },
    branding: {
      ...current.branding,
      sidebarLogoUrl: session.workshop.sidebarImageUrl,
      workshopLogoUrl: session.workshop.logoUrl,
    },
  });
};

export const readStoredAuthSession = (): StoredAuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeStoredAuthSession(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const writeStoredAuthSession = (session: StoredAuthSession): StoredAuthSession => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  syncAppSettingsWithSession(session);
  return session;
};

export const applyAuthResponse = (response: AuthResponse): StoredAuthSession =>
  writeStoredAuthSession(createStoredAuthSession(response));

export const applySessionResponse = (
  response: SessionResponse,
): StoredAuthSession | null => {
  const current = readStoredAuthSession();

  if (!current) {
    syncAppSettingsWithSession(response);
    return null;
  }

  const next: StoredAuthSession = {
    ...current,
    workshop: response.workshop,
    user: response.user,
  };

  return writeStoredAuthSession(next);
};

export const clearStoredAuthSession = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  }

  syncAppSettingsWithSession(null);
};

export const isStoredAuthSessionExpired = (
  session: StoredAuthSession,
  leewayMs = 30_000,
) => {
  return new Date(session.expiresAt).getTime() <= Date.now() + leewayMs;
};
