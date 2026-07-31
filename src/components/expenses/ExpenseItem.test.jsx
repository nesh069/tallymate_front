import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExpenseItem from "./ExpenseItem";

const members = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

const baseExpense = {
  id: 1,
  description: "Dinner",
  amount: "90.00",
  split_type: "equal",
  paid_by: 1,
  date: "2026-01-01T00:00:00Z",
  shares: [
    { user_id: 1, amount: "30.00", percentage: null },
    { user_id: 2, amount: "60.00", percentage: null },
  ],
};

describe("ExpenseItem", () => {
  it("shows what the current user owes when someone else paid", () => {
    render(<ExpenseItem expense={baseExpense} members={members} currentUserId={2} />);

    expect(screen.getByText("You owe $60.00")).toBeInTheDocument();
  });

  it("shows what the current user is owed when they paid", () => {
    render(<ExpenseItem expense={baseExpense} members={members} currentUserId={1} />);

    expect(screen.getByText(/you're owed \$60.00/i)).toBeInTheDocument();
  });

  it("only lets the payer delete the expense", () => {
    const onDelete = vi.fn();
    const { rerender } = render(
      <ExpenseItem
        expense={baseExpense}
        members={members}
        currentUserId={2}
        onDelete={onDelete}
      />,
    );
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();

    rerender(
      <ExpenseItem
        expense={baseExpense}
        members={members}
        currentUserId={1}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });
});
