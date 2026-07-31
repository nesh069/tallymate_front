import { api } from "./api";

export const getGroupSummary = (groupId) =>
  api.get(`/api/groups/${groupId}/summary`);
