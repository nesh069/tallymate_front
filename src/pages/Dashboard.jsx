import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [groupId, setGroupId] = useState("");
  const navigate = useNavigate();

  const goToGroup = (e) => {
    e.preventDefault();
    if (groupId.trim()) {
      navigate(`/groups/${groupId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary p-8">
      <h1 className="text-2xl font-semibold mb-2">TallyMate</h1>
      <p className="text-text-secondary text-sm mb-6">
        Groups list — coming soon (Member 2). Meanwhile, jump to a group by ID:
      </p>
      <form onSubmit={goToGroup} className="flex gap-2">
        <input
          type="text"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          placeholder="Group ID"
          className="bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          className="bg-accent text-text-primary rounded px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Go
        </button>
      </form>
    </div>
  );
}

export default Dashboard;
