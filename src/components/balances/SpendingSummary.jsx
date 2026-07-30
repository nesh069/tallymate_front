import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getGroupSummary } from "../../api/summary";

const COLORS = ["#6366F1", "#22C55E", "#EF4444", "#F59E0B", "#3B82F6"];

export default function SpendingSummary({ groupId }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getGroupSummary(groupId)
      .then((res) => setSummary(res.data))
      .catch(() => setError("Couldn't load spending summary."));
  }, [groupId]);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (!summary) return <p className="text-zinc-400 text-sm">Loading summary…</p>;
  if (summary.expense_count === 0) return <p className="text-zinc-400 text-sm">No expenses yet.</p>;

  const chartData = Object.entries(summary.spend_by_payer).map(([userId, amount]) => ({
    name: `User #${userId}`,
    value: amount,
  }));

  return (
    <div className="bg-zinc-900 p-4 rounded-lg mt-6">
      <h2 className="text-xl mb-3">Spending Summary</h2>
      <p className="text-sm text-zinc-400 mb-1">Total spent: <span className="text-zinc-100">{summary.total_spent}</span></p>
      <p className="text-sm text-zinc-400 mb-4">Average per person: <span className="text-zinc-100">{summary.average_per_person}</span></p>

      <div className="w-full h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} label>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
