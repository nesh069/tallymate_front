import client from "./client";

export const getGroupSummary = (groupId) => client.get(`/api/groups/${groupId}/summary`);