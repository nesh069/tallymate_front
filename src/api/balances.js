import client from "./client";

export const getGrossBalances = (groupId) =>
  client.get(`/api/groups/${groupId}/balances`);

export const getNetBalances = (groupId) =>
  client.get(`/api/groups/${groupId}/balances/net`);

export const recordSettlement = (groupId, payerId, payeeId, amount) =>
  client.post(`/api/groups/${groupId}/settlements`, {
    payer_id: payerId,
    payee_id: payeeId,
    amount,
  });

export const getActivity = (groupId) =>
  client.get(`/api/groups/${groupId}/activity`);
