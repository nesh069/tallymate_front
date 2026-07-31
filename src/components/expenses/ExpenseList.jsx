import { deleteExpense as deleteExpenseRequest } from "../../api/expenses";
import ExpenseItem from "./ExpenseItem";

function ExpenseList({ expenses, members, currentUserId, onDeleted }) {
  const handleDelete = async (expenseId) => {
    await deleteExpenseRequest(expenseId);
    onDeleted?.(expenseId);
  };

  if (expenses.length === 0) {
    return <p className="text-text-secondary text-sm">No expenses yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          members={members}
          currentUserId={currentUserId}
          onDelete={handleDelete}
        />
      ))}
    </ul>
  );
}

export default ExpenseList;
