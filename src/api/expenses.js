import { api } from "./api";

export function listExpenses(groupId) {
  return api.get(`/api/groups/${groupId}/expenses`).then((res) => res.data);
}

export function getExpense(expenseId) {
  return api.get(`/api/expenses/${expenseId}`).then((res) => res.data);
}

export function createExpense(groupId, payload) {
  return api.post(`/api/groups/${groupId}/expenses`, payload).then((res) => res.data);
}

export function updateExpense(expenseId, payload) {
  return api.put(`/api/expenses/${expenseId}`, payload).then((res) => res.data);
}

export function deleteExpense(expenseId) {
  return api.delete(`/api/expenses/${expenseId}`).then((res) => res.data);
}

export function getGroupMembers(groupId) {
  return api.get(`/api/groups/${groupId}/members`).then((res) => res.data);
}
