import type { OpenNotificationParams } from "@refinedev/core";

type ModalNotification = OpenNotificationParams & { key: string };

const subscribers = new Set<() => void>();
let current: ModalNotification | null = null;
let queue: ModalNotification[] = [];

const emit = () => {
  subscribers.forEach((subscriber) => {
    subscriber();
  });
};

const createKey = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getCurrentModalNotification = () => current;

export const subscribeToModalNotifications = (listener: () => void) => {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
};

export const openModalNotification = (params: OpenNotificationParams) => {
  const key = params.key ? String(params.key) : createKey();
  const notification: ModalNotification = {
    ...params,
    key,
  };

  if (!current) {
    current = notification;
    emit();
    return;
  }

  queue = [...queue, notification];
  emit();
};

export const closeModalNotification = (key?: string) => {
  if (!current && !queue.length) {
    return;
  }

  if (key && current && current.key !== key) {
    queue = queue.filter((item) => item.key !== key);
    emit();
    return;
  }

  current = null;
  current = queue.shift() ?? null;
  emit();
};
