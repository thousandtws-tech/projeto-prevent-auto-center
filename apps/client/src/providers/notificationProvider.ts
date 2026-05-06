import type { NotificationProvider } from "@refinedev/core";
import { pushNotificationCenterItem } from "../services/notificationCenter";
import {
  closeModalNotification,
  openModalNotification,
} from "./notificationModalStore";

export const useAppNotificationProvider = (): NotificationProvider => {
  return {
    open: (params) => {
      try {
        pushNotificationCenterItem(params);
      } catch {
        // Ignora falha de persistência para não interromper o toast visual.
      }

      openModalNotification(params);
    },
    close: (key) => {
      closeModalNotification(key ? String(key) : undefined);
    },
  };
};
