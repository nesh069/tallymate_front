import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api";
import { getGrossBalances, getNetBalances, getActivity } from "../api/balances";
import { useAuth } from "../context/AuthContext";
import { formatAmount } from "../utils/format";
import SettleUpModal from "../components/balances/SettleUpModal";
import SpendingSummary from "../components/balances/SpendingSummary";

function memberName(members, userId) {
  return members.find((m) => m.id === userId)?.name ?? `User ${userId}`;
}

export default function Balances() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const currency = user?.currency || "USD";
  const [members, setMembers] = useState([]);
  const [balances, setBalances] = useState(null);
  const [simplified, setSimplified] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettle, setShowSettle] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const netRes = await getNetBalances(groupId);
      const activityRes = await getActivity(groupId);
      const groupRes = await api.get(`/groups/${groupId}`);
      setMembers(groupRes.data.group?.members || []);
      setBalances(netRes.data.balances);
      setSimplified(netRes.data.simplified_transactions);
      setActivity(activityRes.data);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError("Couldn't load balances. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [groupId]);

  if (loading) return <div className="text-zinc-400 p-6">Loading balances…</div>;
  if (error) return <div className="text-red-500 p-6">{error}</div>;

  const hasBalances = balances && Object.keys(balances).length > 0;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto bg-zinc-950 min-h-screen text-zinc-100">
      <h1 className="text-2xl font-semibold mb-4">Balances</h1>

      {!hasBalances && (
        <p className="text-zinc-400">No expenses yet — balances will show up here once someone adds one.</p>
      )}

      {hasBalances && (
        <>
          <div className="space-y-2 mb-6">
            {Object.entries(balances).map(([userId, amount]) => (
              <div key={userId} className="flex justify-between gap-3 bg-zinc-900 p-3 rounded-lg">
                <span className="truncate min-w-0">{memberName(members, Number(userId))}</span>
                <span className={`shrink-0 text-right whitespace-nowrap ${amount >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {amount >= 0 ? `is owed ${formatAmount(amount, currency)}` : `owes ${formatAmount(Math.abs(amount), currency)}`}
                </span>
              </div>
            ))}
          </div>

          {simplified.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl mb-2">Suggested settlements</h2>
              {simplified.map((t, i) => (
                <div key={i} className="flex justify-between gap-3 bg-zinc-900 p-3 rounded-lg mb-2">
                  <span className="truncate min-w-0">{memberName(members, t.from)} → {memberName(members, t.to)}</span>
                  <span className="shrink-0 font-semibold whitespace-nowrap">{formatAmount(t.amount, currency)}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowSettle(true)}
            className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg"
          >
            Settle Up
          </button>
        </>
      )}

      <h2 className="text-xl mt-8 mb-2">Activity</h2>
      {activity.length === 0 ? (
        <p className="text-zinc-400">No activity yet.</p>
      ) : (
        activity.map((item, i) => (
          <div key={i} className="text-sm text-zinc-400 border-b border-zinc-800 py-2">
            {item.type === "expense"
              ? `${memberName(members, item.paid_by)} paid ${formatAmount(item.amount, currency)} for ${item.description}`
              : `${memberName(members, item.payer_id)} settled ${formatAmount(item.amount, currency)} with ${memberName(members, item.payee_id)}`}
          </div>
        ))
      )}

      <SpendingSummary groupId={groupId} members={members} refreshKey={refreshKey} />

      {showSettle && (
        <SettleUpModal
          groupId={groupId}
          onClose={() => setShowSettle(false)}
          onSettled={() => {
            setShowSettle(false);
            load();
          }}
        />
      )}
    </div>
  );
}
