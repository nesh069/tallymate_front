import { api } from "./api";

export const getGrossBalances = (groupId) =>
  api.get(`/api/groups/${groupId}/balances`);

export const getNetBalances = (groupId) =>
  api.get(`/api/groups/${groupId}/balances/net`);

export const recordSettlement = (groupId, payerId, payeeId, amount) =>
  api.post(`/api/groups/${groupId}/settlements`, {
    payer_id: payerId,
    payee_id: payeeId,
    amount,
  });

export const getActivity = (groupId) =>
  api.get(`/api/groups/${groupId}/activity`);
