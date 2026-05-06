/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_MAP_ID: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_USE_BACKEND?: string;
  readonly VITE_BACKEND_API_URL?: string;
  readonly VITE_BACKEND_AUTH_TOKEN?: string;
  readonly VITE_N8N_SCHEDULING_WEBHOOK_URL?: string;
  readonly VITE_N8N_WEBHOOK_TOKEN?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_GEMINI_PROXY_URL?: string;
}

type GoogleOauth2TokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleOauth2 = {
  initTokenClient: (options: {
    client_id: string;
    scope: string;
    callback: (response: { access_token?: string; error?: string }) => void;
    error_callback?: () => void;
  }) => GoogleOauth2TokenClient;
};

interface Window {
  google?: {
    accounts?: {
      oauth2?: GoogleOauth2;
    };
  };
}
