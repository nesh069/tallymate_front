import client from "./client";

export const getNotifications = () => client.get("/api/notifications");
export const markNotificationRead = (id) => client.patch(`/api/notifications/${id}/read`);