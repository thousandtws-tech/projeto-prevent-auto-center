import type { OpenNotificationParams } from "@refinedev/core";

export const NOTIFICATION_CENTER_STORAGE_KEY = "prevent-auto-notification-center-v1";
export const NOTIFICATION_CENTER_UPDATED_EVENT = "prevent-auto-notification-center-updated";
const MAX_NOTIFICATIONS = 80;

export type NotificationCenterItem = {
  id: string;
  key: string | null;
  type: OpenNotificationParams["type"];
  message: string;
  description: string;
  createdAt: string;
  readAt: string | null;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (value: unknown) => (typeof value === "string" ? value : "");

const normalizeType = (value: unknown): NotificationCenterItem["type"] => {
  if (value === "error" || value === "progress") {
    return value;
  }

  return "success";
};

const isValidDateString = (value: string) =>
  !Number.isNaN(new Date(value).getTime());

const normalizeNotificationItem = (value: unknown): NotificationCenterItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  const message = getString(value.message).trim();
  const createdAt = getString(value.createdAt);
  const readAtRaw = getString(value.readAt);

  if (!id || !message) {
    return null;
  }

  return {
    id,
    key: getString(value.key).trim() || null,
    type: normalizeType(value.type),
    message,
    description: getString(value.description).trim(),
    createdAt: isValidDateString(createdAt) ? createdAt : new Date().toISOString(),
    readAt:
      readAtRaw && isValidDateString(readAtRaw)
        ? readAtRaw
        : null,
  };
};

const normalizeNotificationItems = (
  value: unknown,
): NotificationCenterItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeNotificationItem(item))
    .filter((item): item is NotificationCenterItem => Boolean(item))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, MAX_NOTIFICATIONS);
};

const dispatchNotificationsUpdated = (items: NotificationCenterItem[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_CENTER_UPDATED_EVENT, { detail: items }),
  );
};

export const readNotificationCenterItems = (): NotificationCenterItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(NOTIFICATION_CENTER_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return normalizeNotificationItems(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const writeNotificationCenterItems = (
  items: NotificationCenterItem[],
): NotificationCenterItem[] => {
  const normalized = normalizeNotificationItems(items);

  if (typeof window === "undefined") {
    return normalized;
  }

  window.localStorage.setItem(
    NOTIFICATION_CENTER_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  dispatchNotificationsUpdated(normalized);

  return normalized;
};

export const pushNotificationCenterItem = (
  params: OpenNotificationParams,
): NotificationCenterItem => {
  const message = params.message?.trim();
  if (!message) {
    throw new Error("Notificação sem mensagem não pode ser registrada.");
  }

  const item: NotificationCenterItem = {
    id: createId(),
    key: typeof params.key === "string" ? params.key : null,
    type: normalizeType(params.type),
    message,
    description: params.description?.trim() ?? "",
    createdAt: new Date().toISOString(),
    readAt: null,
  };

  writeNotificationCenterItems([item, ...readNotificationCenterItems()]);
  return item;
};

export const markNotificationCenterItemAsRead = (
  id: string,
): NotificationCenterItem | null => {
  if (!id) {
    return null;
  }

  let updatedItem: NotificationCenterItem | null = null;
  const now = new Date().toISOString();
  const next = readNotificationCenterItems().map((item) => {
    if (item.id !== id || item.readAt) {
      return item;
    }

    updatedItem = {
      ...item,
      readAt: now,
    };
    return updatedItem;
  });

  writeNotificationCenterItems(next);
  return updatedItem;
};

export const markAllNotificationCenterItemsAsRead = (): NotificationCenterItem[] => {
  const now = new Date().toISOString();
  const next = readNotificationCenterItems().map((item) => {
    if (item.readAt) {
      return item;
    }

    return {
      ...item,
      readAt: now,
    };
  });

  return writeNotificationCenterItems(next);
};

export const clearNotificationCenterItems = () => writeNotificationCenterItems([]);

export const getUnreadNotificationCenterCount = (items: NotificationCenterItem[]) =>
  items.reduce((total, item) => (item.readAt ? total : total + 1), 0);
