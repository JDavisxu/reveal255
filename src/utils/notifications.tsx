// utils/notifications.ts
import useNotificationStore from "../stores/useNotificationStore";

export function notify(newNotification: {
  type?: "info" | "success" | "error";
  message: string;
  description?: string;
  txid?: string;
}) {
  useNotificationStore.getState().set((state) => ({
    notifications: [
      ...state.notifications,
      {
        type: newNotification.type || "info",
        message: newNotification.message,
        description: newNotification.description,
        txid: newNotification.txid,
      },
    ],
  }));
}
