import { useState } from "react";
import { recordSettlement } from "../../api/balances";

export default function SettleUpModal({ groupId, onClose, onSettled }) {
  const [payerId, setPayerId] = useState("");
  const [payeeId, setPayeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!payerId || !payeeId || !amount || Number(amount) <= 0) {
      setError("Fill in all fields with a valid amount.");
      return;
    }
    setSubmitting(true);
    try {
      await recordSettlement(groupId, payerId, payeeId, Number(amount));
      onSettled();
    } catch (err) {
      setError("Couldn't record settlement. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-zinc-900 p-6 rounded-lg w-80">
        <h2 className="text-lg font-semibold mb-4">Settle Up</h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <input
          placeholder="Payer user ID"
          value={payerId}
          onChange={(e) => setPayerId(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-zinc-800 text-zinc-100"
        />
        <input
          placeholder="Payee user ID"
          value={payeeId}
          onChange={(e) => setPayeeId(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-zinc-800 text-zinc-100"
        />
        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full mb-4 p-2 rounded bg-zinc-800 text-zinc-100"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-zinc-400">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {submitting ? "Settling…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}