import {
  type AuthResponse,
  type AuthUser,
  type AuthWorkshop,
  type SessionResponse,
  applyAuthResponse,
  applySessionResponse,
  clearStoredAuthSession,
  readStoredAuthSession,
} from "./authStorage";
import { isBackendApiEnabled, requestJson, uploadMultipart } from "./httpClient";

export type LoginPayload = {
  workshopSlug?: string;
  email: string;
  password: string;
};

export type RegisterPayload = {
  workshopName?: string;
  workshopSlug?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
};

export type SignupResponse = {
  message: string;
  emailVerificationRequired: boolean;
  workshop: AuthWorkshop;
  user: AuthUser;
};

export type VerifyEmailCodePayload = {
  userId: number;
  code: string;
};

const getStoredSessionOrThrow = () => {
  const session = readStoredAuthSession();

  if (!session) {
    throw new Error("Sessão não encontrada.");
  }

  return session;
};

export const loginWithPassword = async (payload: LoginPayload) => {
  const response = await requestJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });

  return applyAuthResponse(response);
};

export const registerWorkshop = async (payload: RegisterPayload) => {
  return requestJson<SignupResponse>("/auth/signup", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
};

export const verifyEmailCode = async (payload: VerifyEmailCodePayload) => {
  return requestJson<void>("/auth/verify-email-code", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
};

export const logoutFromBackend = async () => {
  if (!isBackendApiEnabled()) {
    clearStoredAuthSession();
    return;
  }

  const session = readStoredAuthSession();

  try {
    if (session?.refreshToken) {
      await requestJson<void>("/auth/logout", {
        method: "POST",
        body: {
          refreshToken: session.refreshToken,
        },
        skipAuth: true,
      });
    }
  } finally {
    clearStoredAuthSession();
  }
};

export const getCurrentSession = async () => {
  const response = await requestJson<SessionResponse>("/auth/me");
  applySessionResponse(response);
  return response;
};

export const getStoredIdentity = async () => {
  const current = readStoredAuthSession();

  if (current?.user && current?.workshop) {
    return current;
  }

  if (!isBackendApiEnabled()) {
    return null;
  }

  await getCurrentSession();
  return readStoredAuthSession();
};

export const uploadProfilePhoto = async (file: File) => {
  const response = await uploadMultipart<SessionResponse>("/auth/me/profile-photo", {
    file,
  });
  applySessionResponse(response);
  return response;
};

export const uploadSidebarImage = async (file: File) => {
  const response = await uploadMultipart<SessionResponse>("/auth/me/sidebar-image", {
    file,
  });
  applySessionResponse(response);
  return response;
};

export const uploadWorkshopLogo = async (file: File) => {
  const response = await uploadMultipart<SessionResponse>("/auth/me/workshop-logo", {
    file,
  });
  applySessionResponse(response);
  return response;
};

export const ensureAuthenticatedSession = async () => {
  const session = getStoredSessionOrThrow();

  if (!session.accessToken) {
    throw new Error("Token de acesso não encontrado.");
  }

  return session;
};
