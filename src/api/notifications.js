import { api } from "./api";

export const getNotifications = () => api.get("/api/notifications");
export const markNotificationRead = (id) =>
  api.patch(`/api/notifications/${id}/read`);
