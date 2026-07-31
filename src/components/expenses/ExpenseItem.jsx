function memberName(members, userId) {
  return members.find((m) => m.id === userId)?.name ?? `User ${userId}`;
}

function ExpenseItem({ expense, members, currentUserId, onDelete }) {
  const payerName = memberName(members, expense.paid_by);
  const myShare = expense.shares.find((s) => s.user_id === currentUserId);
  const isPayer = expense.paid_by === currentUserId;

  let balanceLabel = null;
  if (myShare && !isPayer) {
    balanceLabel = (
      <span className="text-owe text-sm font-semibold">You owe ${myShare.amount}</span>
    );
  } else if (isPayer) {
    const othersOwe = expense.shares
      .filter((s) => s.user_id !== currentUserId)
      .reduce((acc, s) => acc + Number(s.amount), 0);
    if (othersOwe > 0) {
      balanceLabel = (
        <span className="text-owed text-sm font-semibold">
          You&apos;re owed ${othersOwe.toFixed(2)}
        </span>
      );
    }
  }

  return (
    <li className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-base text-text-primary">{expense.description || "Expense"}</p>
          <p className="text-xs text-text-secondary">
            Paid by {payerName} · {new Date(expense.date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-lg font-semibold text-text-primary">${expense.amount}</span>
          {onDelete && isPayer && (
            <button
              type="button"
              onClick={() => onDelete(expense.id)}
              className="text-xs text-text-secondary hover:text-owe"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {balanceLabel}

      <details className="text-xs text-text-secondary">
        <summary className="cursor-pointer">Split ({expense.split_type})</summary>
        <ul className="mt-2 flex flex-col gap-1">
          {expense.shares.map((share) => (
            <li key={share.user_id} className="flex justify-between">
              <span>{memberName(members, share.user_id)}</span>
              <span>
                ${share.amount}
                {share.percentage ? ` (${share.percentage}%)` : ""}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

export default ExpenseItem;
