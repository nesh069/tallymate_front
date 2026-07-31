import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddExpenseForm from "./AddExpenseForm";
import { createExpense } from "../../api/expenses";

vi.mock("../../api/expenses", () => ({
  createExpense: vi.fn(),
}));

const members = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Carol" },
];

function fillBaseFields(amount, description = "Dinner") {
  fireEvent.change(screen.getByLabelText(/description/i), {
    target: { value: description },
  });
  fireEvent.change(screen.getByLabelText(/amount/i), {
    target: { value: amount },
  });
}

describe("AddExpenseForm", () => {
  beforeEach(() => {
    createExpense.mockReset();
  });

  it("rejects an unequal split whose amounts don't add up to the total", () => {
    render(
      <AddExpenseForm groupId="1" members={members} currentUserId={1} onCreated={vi.fn()} />,
    );

    fillBaseFields("100");
    fireEvent.click(screen.getByRole("button", { name: "Unequal" }));
    const [firstAmountInput] = screen.getAllByPlaceholderText("Amount");
    fireEvent.change(firstAmountInput, { target: { value: "50" } });

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }));

    expect(
      screen.getByText(/split amounts must add up to 100.00/i),
    ).toBeInTheDocument();
    expect(createExpense).not.toHaveBeenCalled();
  });

  it("rejects a percentage split that doesn't sum to 100", () => {
    render(
      <AddExpenseForm groupId="1" members={members} currentUserId={1} onCreated={vi.fn()} />,
    );

    fillBaseFields("200");
    fireEvent.click(screen.getByRole("button", { name: "Percentage" }));
    const [firstPercentageInput] = screen.getAllByPlaceholderText("%");
    fireEvent.change(firstPercentageInput, { target: { value: "50" } });

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }));

    expect(screen.getByText(/percentages must add up to 100/i)).toBeInTheDocument();
    expect(createExpense).not.toHaveBeenCalled();
  });

  it("submits an equal split across all included participants", async () => {
    const onCreated = vi.fn();
    const created = { id: 99, description: "Dinner" };
    createExpense.mockResolvedValueOnce(created);

    render(
      <AddExpenseForm
        groupId="1"
        members={members}
        currentUserId={1}
        onCreated={onCreated}
      />,
    );

    fillBaseFields("90");
    fireEvent.click(screen.getByRole("button", { name: /add expense/i }));

    await screen.findByText(/add expense/i);

    expect(createExpense).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        description: "Dinner",
        amount: "90.00",
        split_type: "equal",
        paid_by: 1,
        participants: [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }],
      }),
    );
    expect(onCreated).toHaveBeenCalledWith(created);
  });

  it("requires at least one participant to be selected", () => {
    render(
      <AddExpenseForm groupId="1" members={members} currentUserId={1} onCreated={vi.fn()} />,
    );

    fillBaseFields("50");
    screen.getAllByRole("checkbox").forEach((checkbox) => fireEvent.click(checkbox));

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }));

    expect(screen.getByText(/select at least one participant/i)).toBeInTheDocument();
    expect(createExpense).not.toHaveBeenCalled();
  });
});
