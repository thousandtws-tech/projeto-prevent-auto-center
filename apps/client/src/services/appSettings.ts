export const APP_SETTINGS_STORAGE_KEY = "prevent-auto-settings-v1";
export const APP_SETTINGS_UPDATED_EVENT = "prevent-app-settings-updated";

export type AppSettings = {
  profile: {
    name: string;
    email: string;
    phone: string;
    role: string;
    avatarUrl: string;
  };
  branding: {
    sidebarLogoUrl: string;
    workshopLogoUrl: string;
  };
  backup: {
    autoBackupEnabled: boolean;
    scheduledDays: number[];
    scheduledTime: string;
    lastBackupAt: string;
  };
};

export const defaultAppSettings: AppSettings = {
  profile: {
    name: "",
    email: "",
    phone: "",
    role: "",
    avatarUrl: "",
  },
  branding: {
    sidebarLogoUrl: "",
    workshopLogoUrl: "",
  },
  backup: {
    autoBackupEnabled: false,
    scheduledDays: [1, 2, 3, 4, 5],
    scheduledTime: "02:00",
    lastBackupAt: "",
  },
};

const normalizeAppSettings = (value?: Partial<AppSettings>): AppSettings => {
  const rawScheduledDays = value?.backup?.scheduledDays;
  const scheduledDays = Array.isArray(rawScheduledDays)
    ? [...new Set(rawScheduledDays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort(
        (a, b) => a - b,
      )
    : defaultAppSettings.backup.scheduledDays;

  const rawScheduledTime = value?.backup?.scheduledTime;
  const scheduledTime =
    typeof rawScheduledTime === "string" && /^\d{2}:\d{2}$/.test(rawScheduledTime)
      ? rawScheduledTime
      : defaultAppSettings.backup.scheduledTime;

  return {
    profile: {
      ...defaultAppSettings.profile,
      ...(value?.profile ?? {}),
    },
    branding: {
      ...defaultAppSettings.branding,
      ...(value?.branding ?? {}),
    },
    backup: {
      ...defaultAppSettings.backup,
      ...(value?.backup ?? {}),
      scheduledDays,
      scheduledTime,
    },
  };
};

export const readAppSettings = (): AppSettings => {
  if (typeof window === "undefined") {
    return defaultAppSettings;
  }

  const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return defaultAppSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return normalizeAppSettings(parsed);
  } catch {
    return defaultAppSettings;
  }
};

export const writeAppSettings = (settings: AppSettings): AppSettings => {
  if (typeof window === "undefined") {
    return settings;
  }

  window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(
    new CustomEvent(APP_SETTINGS_UPDATED_EVENT, { detail: settings }),
  );

  return settings;
};

export const mergeAppSettings = (
  partial: Partial<AppSettings>,
): AppSettings => {
  const current = readAppSettings();
  const next = normalizeAppSettings({
    ...current,
    ...partial,
    profile: {
      ...current.profile,
      ...(partial.profile ?? {}),
    },
    branding: {
      ...current.branding,
      ...(partial.branding ?? {}),
    },
    backup: {
      ...current.backup,
      ...(partial.backup ?? {}),
    },
  });

  return writeAppSettings(next);
};

export const getAvatarFallbackText = (name: string): string => {
  if (!name?.trim()) return "PA";

  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const second = words[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
};
