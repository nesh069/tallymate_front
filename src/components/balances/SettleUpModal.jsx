import { useEffect, useState } from "react";
import { recordSettlement } from "../../api/balances";
import client from "../../api/client";

export default function SettleUpModal({ groupId, onClose, onSettled }) {
  const [members, setMembers] = useState([]);
  const [payerId, setPayerId] = useState("");
  const [payeeId, setPayeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client
      .get(`/api/groups/${groupId}`)
      .then((res) => setMembers(res.data.members || []))
      .catch(() => setError("Couldn't load group members."));
  }, [groupId]);

  const handleSubmit = async () => {
    setError(null);
    if (!payerId || !payeeId || !amount || Number(amount) <= 0) {
      setError("Fill in all fields with a valid amount.");
      return;
    }
    if (payerId === payeeId) {
      setError("Payer and payee must be different.");
      return;
    }
    setSubmitting(true);
    try {
      await recordSettlement(groupId, payerId, payeeId, Number(amount));
      onSettled();
    } catch (err) {
      const msg =
        err.response?.data?.error || "Couldn't record settlement. Try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-sm mx-4 sm:mx-0">
        <h2 className="text-lg font-semibold mb-4">Settle Up</h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <select
          value={payerId}
          onChange={(e) => setPayerId(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-zinc-800 text-zinc-100"
        >
          <option value="">Who paid?</option>
          {members.map((uid) => (
            <option key={uid} value={uid}>
              User #{uid}
            </option>
          ))}
        </select>

        <select
          value={payeeId}
          onChange={(e) => setPayeeId(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-zinc-800 text-zinc-100"
        >
          <option value="">Who was paid?</option>
          {members
            .filter((uid) => uid !== Number(payerId))
            .map((uid) => (
              <option key={uid} value={uid}>
                User #{uid}
              </option>
            ))}
        </select>

        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full mb-4 p-2 rounded bg-zinc-800 text-zinc-100"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-zinc-400">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {submitting ? "Settling\u2026" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
