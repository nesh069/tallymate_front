import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExpenseList from "./ExpenseList";
import { deleteExpense } from "../../api/expenses";

vi.mock("../../api/expenses", () => ({
  deleteExpense: vi.fn(),
}));

const members = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];

const expense = {
  id: 1,
  description: "Dinner",
  amount: "20.00",
  split_type: "equal",
  paid_by: 1,
  date: "2026-01-01T00:00:00Z",
  shares: [
    { user_id: 1, amount: "10.00", percentage: null },
    { user_id: 2, amount: "10.00", percentage: null },
  ],
};

describe("ExpenseList", () => {
  beforeEach(() => {
    deleteExpense.mockReset();
  });

  it("shows an empty state when there are no expenses", () => {
    render(<ExpenseList expenses={[]} members={members} currentUserId={1} />);
    expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument();
  });

  it("deletes an expense and reports it back via onDeleted", async () => {
    deleteExpense.mockResolvedValueOnce({});
    const onDeleted = vi.fn();

    render(
      <ExpenseList
        expenses={[expense]}
        members={members}
        currentUserId={1}
        onDeleted={onDeleted}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await Promise.resolve();
    expect(deleteExpense).toHaveBeenCalledWith(1);
    expect(onDeleted).toHaveBeenCalledWith(1);
  });
});
