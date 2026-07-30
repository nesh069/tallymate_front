import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getGroupMembers, listExpenses } from "../api/expenses";
import { useAuth } from "../context/authContext";
import AddExpenseForm from "../components/expenses/AddExpenseForm";
import ExpenseList from "../components/expenses/ExpenseList";

function GroupDetail() {
  const { groupId } = useParams();
  const { userId, isAuthenticated } = useAuth();
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = userId ? Number(userId) : null;

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const [membersData, expensesData] = await Promise.all([
          getGroupMembers(groupId),
          listExpenses(groupId),
        ]);
        if (cancelled) return;
        setMembers(membersData);
        setExpenses(expensesData);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || "Failed to load group.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, groupId]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-text-primary p-8">
        <p className="text-text-secondary text-sm">
          You need to be logged in to view this group. (No login flow yet — see backend
          README's <code>flask seed-demo</code> for a test token.)
        </p>
        <Link to="/" className="text-accent text-sm underline">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary p-8 flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <Link to="/" className="text-text-secondary text-xs underline">
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Group #{groupId}</h1>
        <p className="text-text-secondary text-sm">
          {/* Members/group info panel — Member 2 owns this section */}
          {members.length} member{members.length === 1 ? "" : "s"}:{" "}
          {members.map((m) => m.name).join(", ")}
        </p>
      </div>

      {error && <p className="text-owe text-sm">{error}</p>}

      {!loading && members.length > 0 && (
        <AddExpenseForm
          groupId={groupId}
          members={members}
          currentUserId={currentUserId}
          onCreated={(expense) => setExpenses((prev) => [expense, ...prev])}
        />
      )}

      <div>
        <h2 className="text-xl font-semibold mb-3">Expenses</h2>
        {loading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : (
          <ExpenseList
            expenses={expenses}
            members={members}
            currentUserId={currentUserId}
            onDeleted={(id) => setExpenses((prev) => prev.filter((e) => e.id !== id))}
          />
        )}
      </div>
    </div>
  );
}

export default GroupDetail;
