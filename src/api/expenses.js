import apiClient from "./client";

export function listExpenses(groupId) {
  return apiClient.get(`/api/groups/${groupId}/expenses`).then((res) => res.data);
}

export function getExpense(expenseId) {
  return apiClient.get(`/api/expenses/${expenseId}`).then((res) => res.data);
}

export function createExpense(groupId, payload) {
  return apiClient.post(`/api/groups/${groupId}/expenses`, payload).then((res) => res.data);
}

export function updateExpense(expenseId, payload) {
  return apiClient.put(`/api/expenses/${expenseId}`, payload).then((res) => res.data);
}

export function deleteExpense(expenseId) {
  return apiClient.delete(`/api/expenses/${expenseId}`).then((res) => res.data);
}

export function getGroupMembers(groupId) {
  return apiClient.get(`/api/groups/${groupId}/members`).then((res) => res.data);
}
