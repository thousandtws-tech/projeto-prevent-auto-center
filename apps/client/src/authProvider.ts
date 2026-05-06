import type { AuthProvider } from "@refinedev/core";
import { disableAutoLogin, enableAutoLogin } from "./hooks/autoLoginStorage";
import {
  getStoredIdentity,
  loginWithPassword,
  logoutFromBackend,
  registerWorkshop,
} from "./services/auth";
import { isBackendApiEnabled } from "./services/httpClient";
import { readStoredAuthSession } from "./services/authStorage";
import { readAppSettings } from "./services/appSettings";

export const TOKEN_KEY = "refine-auth";

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const backendAuthProvider: AuthProvider = {
  login: async (params) => {
    try {
      const workshopSlug =
        typeof params?.workshopSlug === "string" ? params.workshopSlug.trim() : "";
      const email = typeof params?.email === "string" ? params.email.trim() : "";
      const password = typeof params?.password === "string" ? params.password : "";

      await loginWithPassword({
        workshopSlug: workshopSlug || undefined,
        email,
        password,
      });

      disableAutoLogin();

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: resolveErrorMessage(error, "Falha ao autenticar."),
          name: "LoginError",
        },
      };
    }
  },
  register: async (params) => {
    try {
      const workshopName =
        typeof params?.workshopName === "string" ? params.workshopName.trim() : "";
      const workshopSlug =
        typeof params?.workshopSlug === "string" ? params.workshopSlug.trim() : "";
      const ownerName =
        typeof params?.ownerName === "string" ? params.ownerName.trim() : "";
      const ownerEmail =
        typeof params?.email === "string" ? params.email.trim() : "";
      const ownerPassword =
        typeof params?.password === "string" ? params.password : "";

      const signup = await registerWorkshop({
        workshopName: workshopName || undefined,
        workshopSlug: workshopSlug || undefined,
        ownerName,
        ownerEmail,
        ownerPassword,
      });

      disableAutoLogin();

      return {
        success: true,
        redirectTo: `/login?email=${encodeURIComponent(signup.user.email)}&workshopSlug=${encodeURIComponent(signup.workshop.slug)}&message=${encodeURIComponent(
          "Cadastro realizado com sucesso. Agora voce ja pode entrar."
        )}`,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: resolveErrorMessage(error, "Falha ao cadastrar oficina."),
          name: "RegisterError",
        },
      };
    }
  },
  updatePassword: async () => {
    return {
      success: false,
      error: {
        message: "Alteração de senha ainda não está disponível no backend.",
        name: "NotImplemented",
      },
    };
  },
  forgotPassword: async () => {
    return {
      success: false,
      error: {
        message: "Recuperação de senha ainda não está disponível no backend.",
        name: "NotImplemented",
      },
    };
  },
  logout: async () => {
    await logoutFromBackend();

    return {
      success: true,
      redirectTo: "/login",
    };
  },
  onError: async (error) => {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number((error as { status?: unknown }).status)
        : undefined;

    if (status === 401) {
      await logoutFromBackend();
      return {
        logout: true,
        redirectTo: "/login",
      };
    }

    return { error };
  },
  check: async () => {
    const session = readStoredAuthSession();

    if (session?.accessToken) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      error: {
        message: "Sessão não encontrada.",
        name: "AuthSessionMissing",
      },
      logout: true,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => {
    const session = readStoredAuthSession();
    return session?.user.role ?? null;
  },
  getIdentity: async () => {
    const session = await getStoredIdentity();

    if (!session) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.fullName,
      avatar: session.user.profilePhotoUrl,
      email: session.user.email,
      role: session.user.role,
      workshopId: session.workshop.id,
      workshopName: session.workshop.name,
      workshopSlug: session.workshop.slug,
      workshopLogoUrl: session.workshop.logoUrl,
      workshopSidebarImageUrl: session.workshop.sidebarImageUrl,
    };
  },
};

const demoAuthProvider: AuthProvider = {
  login: async ({ email, password }) => {
    enableAutoLogin();
    localStorage.setItem(TOKEN_KEY, `${email}-${password}`);
    return {
      success: true,
      redirectTo: "/",
    };
  },
  register: async ({ email, password }) => {
    try {
      await demoAuthProvider.login({ email, password });
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: "Register failed",
          name: "Invalid email or password",
        },
      };
    }
  },
  updatePassword: async () => {
    return {
      success: true,
    };
  },
  forgotPassword: async () => {
    return {
      success: true,
    };
  },
  logout: async () => {
    disableAutoLogin();
    localStorage.removeItem(TOKEN_KEY);
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  onError: async (error) => {
    if ((error as { response?: { status?: number } })?.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      error: {
        message: "Check failed",
        name: "Token not found",
      },
      logout: true,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => null,
  getIdentity: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return null;
    }

    const settings = readAppSettings();

    return {
      id: 1,
      name: settings.profile.name || "James Sullivan",
      avatar: settings.profile.avatarUrl || "https://i.pravatar.cc/150",
    };
  },
};

export const authProvider: AuthProvider = isBackendApiEnabled()
  ? backendAuthProvider
  : demoAuthProvider;
