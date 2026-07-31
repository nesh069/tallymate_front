import { useState } from "react";
import { createExpense } from "../../api/expenses";

const SPLIT_TYPES = [
  { value: "equal", label: "Equal" },
  { value: "unequal", label: "Unequal" },
  { value: "percentage", label: "Percentage" },
];

function initParticipants(members) {
  return members.map((m) => ({
    id: m.id,
    name: m.name,
    included: true,
    amount: "",
    percentage: "",
  }));
}

function AddExpenseForm({ groupId, members, currentUserId, onCreated }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId ?? members[0]?.id ?? "");
  const [splitType, setSplitType] = useState("equal");
  const [participants, setParticipants] = useState(() => initParticipants(members));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Re-derive participants/paidBy whenever the `members` prop identity changes
  // (e.g. once the group members finish loading), without a useEffect.
  const [prevMembers, setPrevMembers] = useState(members);
  if (prevMembers !== members) {
    setPrevMembers(members);
    setParticipants(initParticipants(members));
    if (!paidBy && members[0]) setPaidBy(members[0].id);
  }

  const toggleParticipant = (id) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, included: !p.included } : p)),
    );
  };

  const updateParticipantValue = (id, field, value) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const includedParticipants = participants.filter((p) => p.included);

  const validate = () => {
    const numericAmount = Number(amount);
    if (!description.trim()) return "Description is required.";
    if (!numericAmount || numericAmount <= 0) return "Amount must be greater than 0.";
    if (includedParticipants.length === 0) return "Select at least one participant.";

    if (splitType === "unequal") {
      const sum = includedParticipants.reduce((acc, p) => acc + Number(p.amount || 0), 0);
      if (Math.round(sum * 100) !== Math.round(numericAmount * 100)) {
        return `Split amounts must add up to ${numericAmount.toFixed(2)} (currently ${sum.toFixed(2)}).`;
      }
    }

    if (splitType === "percentage") {
      const sum = includedParticipants.reduce((acc, p) => acc + Number(p.percentage || 0), 0);
      if (Math.round(sum * 100) !== 10000) {
        return `Percentages must add up to 100 (currently ${sum.toFixed(2)}).`;
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      description: description.trim(),
      amount: Number(amount).toFixed(2),
      split_type: splitType,
      paid_by: Number(paidBy),
      participants: includedParticipants.map((p) => {
        if (splitType === "unequal") {
          return { user_id: p.id, amount: Number(p.amount).toFixed(2) };
        }
        if (splitType === "percentage") {
          return { user_id: p.id, percentage: Number(p.percentage).toFixed(2) };
        }
        return { user_id: p.id };
      }),
    };

    setSubmitting(true);
    setError(null);
    try {
      const expense = await createExpense(groupId, payload);
      setDescription("");
      setAmount("");
      setParticipants(initParticipants(members));
      setSplitType("equal");
      onCreated?.(expense);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-4"
    >
      <h2 className="text-xl font-semibold text-text-primary">Add expense</h2>

      {error && <p className="text-owe text-sm">{error}</p>}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary" htmlFor="description">
          Description
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-background border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Dinner, Uber, groceries..."
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-text-secondary" htmlFor="amount">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-background border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="0.00"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-text-secondary" htmlFor="paidBy">
            Paid by
          </label>
          <select
            id="paidBy"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="bg-background border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-text-secondary">Split method</span>
        <div className="flex gap-2">
          {SPLIT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setSplitType(type.value)}
              className={`px-3 py-1.5 rounded text-sm border ${
                splitType === type.value
                  ? "bg-accent border-accent text-text-primary"
                  : "bg-background border-border text-text-secondary"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-text-secondary">Participants</span>
        {participants.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={p.included}
              onChange={() => toggleParticipant(p.id)}
              className="accent-accent"
            />
            <span className="text-sm text-text-primary w-24 truncate">{p.name}</span>
            {splitType === "unequal" && p.included && (
              <input
                type="number"
                step="0.01"
                min="0"
                value={p.amount}
                onChange={(e) => updateParticipantValue(p.id, "amount", e.target.value)}
                placeholder="Amount"
                className="bg-background border border-border rounded px-2 py-1 text-sm text-text-primary w-24 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            )}
            {splitType === "percentage" && p.included && (
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={p.percentage}
                onChange={(e) => updateParticipantValue(p.id, "percentage", e.target.value)}
                placeholder="%"
                className="bg-background border border-border rounded px-2 py-1 text-sm text-text-primary w-20 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-accent text-text-primary rounded px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 self-start"
      >
        {submitting ? "Adding..." : "Add expense"}
      </button>
    </form>
  );
}

export default AddExpenseForm;
