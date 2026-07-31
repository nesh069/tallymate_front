import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";
import { listExpenses } from "../api/expenses";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/AppShell";
import AddExpenseForm from "../components/expenses/AddExpenseForm";
import ExpenseList from "../components/expenses/ExpenseList";

export function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Add member by email
  const [emailQuery, setEmailQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get(`/groups/${groupId}`)
      .then(({ data }) => {
        if (active) setGroup(data.group);
      })
      .catch(() => {
        if (active) setError("Could not load group.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [groupId]);

  useEffect(() => {
    let active = true;
    listExpenses(groupId)
      .then((data) => {
        if (active)
          setExpenses(Array.isArray(data) ? data : data.expenses || []);
      })
      .catch(() => {
        if (active) setError("Could not load expenses.");
      });
    return () => {
      active = false;
    };
  }, [groupId]);

  const isOwner = group && user && group.created_by === user.id;

  // Search users by email as you type
  useEffect(() => {
    if (emailQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(
          `/friends/search?q=${encodeURIComponent(emailQuery.trim())}`,
        );
        setSearchResults(data.users || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [emailQuery]);

  async function addMember(userId) {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post(`/groups/${groupId}/members`, {
        user_id: userId,
      });
      setGroup(data.group);
      setEmailQuery("");
      setSearchResults([]);
      setMessage("Member added.");
    } catch (err) {
      setError(err.response?.data?.error || "Could not add member.");
    } finally {
      setWorking(false);
    }
  }

  async function removeMember(userId) {
    setWorking(true);
    setError("");
    setMessage("");
    setConfirmAction(null);
    try {
      const { data } = await api.delete(`/groups/${groupId}/members/${userId}`);
      setGroup(data.group);
      setMessage("Member removed.");
    } catch (err) {
      setError(err.response?.data?.error || "Could not remove member.");
    } finally {
      setWorking(false);
    }
  }

  async function deleteGroup() {
    setWorking(true);
    setError("");
    setConfirmAction(null);
    try {
      await api.delete(`/groups/${groupId}`);
      navigate("/groups", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete group.");
      setWorking(false);
    }
  }

  async function leaveGroup() {
    setWorking(true);
    setError("");
    setConfirmAction(null);
    try {
      await api.delete(`/groups/${groupId}/leave`);
      navigate("/groups", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Could not leave group.");
      setWorking(false);
    }
  }

  function refreshExpenses() {
    listExpenses(groupId).then((data) =>
      setExpenses(Array.isArray(data) ? data : data.expenses || []),
    );
  }

  // Confirmation Modal
  function ConfirmDialog() {
    if (!confirmAction) return null;
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000000b3",
          display: "grid",
          placeItems: "center",
          zIndex: 100,
          padding: 24,
        }}
      >
        <div
          style={{
            background: "#1A1D23",
            border: "1px solid #27272A",
            borderRadius: 16,
            padding: 28,
            maxWidth: 400,
            width: "100%",
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 18 }}>Confirm</h3>
          <p
            style={{
              color: "#A1A1AA",
              fontSize: 14,
              margin: "0 0 24px",
              lineHeight: 1.6,
            }}
          >
            {confirmAction.label}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              className='button button-secondary'
              onClick={() => setConfirmAction(null)}
              disabled={working}
            >
              Cancel
            </button>
            <button
              className='button button-primary'
              style={{ background: "#EF4444", borderColor: "#EF4444" }}
              onClick={() => {
                if (confirmAction.type === "remove")
                  removeMember(confirmAction.userId);
                else if (confirmAction.type === "delete") deleteGroup();
                else if (confirmAction.type === "leave") leaveGroup();
              }}
              disabled={working}
            >
              {working ? "Please wait…" : "Yes, confirm"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <AppShell>
        <section className='page-heading'>
          <p className='eyebrow'>Group</p>
          <h1>Loading…</h1>
        </section>
        <p className='muted'>Loading group details…</p>
      </AppShell>
    );
  }

  // Not found / no access
  if (!group) {
    return (
      <AppShell>
        <section className='page-heading'>
          <p className='eyebrow'>Group</p>
          <h1>Not Found</h1>
        </section>
        <div className='empty-state'>
          Group not found or you don&apos;t have access.
        </div>
        <Link
          to='/groups'
          className='button button-secondary'
          style={{ display: "inline-block", marginTop: 16 }}
        >
          Back to Groups
        </Link>
      </AppShell>
    );
  }

  // Main view
  return (
    <AppShell>
      <ConfirmDialog />

      <section className='page-heading'>
        <p className='eyebrow'>Group</p>
        <h1>{group.name}</h1>
        <p>
          {group.members.length} member{group.members.length !== 1 ? "s" : ""}{" "}
          &middot; Created {new Date(group.created_at).toLocaleDateString()}
        </p>
        <Link
          to={`/groups/${groupId}/balances`}
          className='button button-primary'
          style={{ display: "inline-block", marginTop: 16 }}
        >
          View Balances
        </Link>
      </section>

      {/* Feedback messages */}
      {message && (
        <p className='notice' style={{ marginBottom: 16 }}>
          {message}
        </p>
      )}
      {error && (
        <p className='field-error' style={{ marginBottom: 16 }}>
          {error}
        </p>
      )}

      {/* Add member — owner only */}
      {isOwner && (
        <section className='card' style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Add a member</h2>
          <p style={{ color: "#A1A1AA", margin: "7px 0 20px", fontSize: 14 }}>
            Search by email to add an existing user.
          </p>
          <div className='field' style={{ position: "relative" }}>
            <input
              type='text'
              placeholder='Search by email…'
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              disabled={working}
            />
            {searching && (
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: 11,
                  fontSize: 12,
                  color: "#A1A1AA",
                }}
              >
                Searching…
              </span>
            )}
          </div>
          {searchResults.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "8px 0 0",
                border: "1px solid #27272A",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {searchResults.map((u) => {
                const alreadyInGroup = group.members.some((m) => m.id === u.id);
                return (
                  <li
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "#0F1115",
                      borderBottom: "1px solid #27272A",
                      fontSize: 14,
                    }}
                  >
                    <span>
                      <strong>{u.name}</strong>
                      <span style={{ color: "#A1A1AA", marginLeft: 8 }}>
                        {u.email}
                      </span>
                    </span>
                    {alreadyInGroup ? (
                      <span style={{ color: "#A1A1AA", fontSize: 12 }}>
                        In group
                      </span>
                    ) : (
                      <button
                        className='button button-primary'
                        style={{ fontSize: 12, padding: "6px 12px" }}
                        onClick={() => addMember(u.id)}
                        disabled={working}
                      >
                        Add
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Expenses section */}
      <section className='friend-section' style={{ marginTop: 24 }}>
        <h2>
          Expenses <span>{expenses.length}</span>
        </h2>
        <AddExpenseForm
          groupId={Number(groupId)}
          members={group.members}
          currentUserId={user?.id}
          onCreated={refreshExpenses}
        />
        <div style={{ marginTop: 16 }}>
          <ExpenseList
            expenses={expenses}
            members={group.members}
            currentUserId={user?.id}
            onDeleted={refreshExpenses}
          />
        </div>
      </section>

      {/* Members section */}
      <section className='friend-section'>
        <h2>
          Members <span>{group.members.length}</span>
        </h2>
        <ul className='friend-list'>
          {group.members.map((member) => (
            <li key={member.id} className='friend-item'>
              <div className='friend-avatar'>
                {member.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <strong>{member.name}</strong>
                <p>{member.email}</p>
              </div>
              <div className='friend-actions'>
                {member.id === group.created_by && (
                  <span className='status status-pending'>Owner</span>
                )}
                {isOwner && member.id !== group.created_by && (
                  <button
                    className='text-button destructive'
                    onClick={() =>
                      setConfirmAction({
                        type: "remove",
                        userId: member.id,
                        label: `Remove ${member.name} from this group? They can be added back later.`,
                      })
                    }
                    disabled={working}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Actions */}
      <div
        style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}
      >
        <Link to='/groups' className='button button-secondary'>
          &larr; Back to Groups
        </Link>

        {!isOwner && (
          <button
            className='button button-secondary'
            style={{ color: "#EF4444", borderColor: "#EF4444" }}
            onClick={() =>
              setConfirmAction({
                type: "leave",
                label: "Leave this group? You can be added back by the owner.",
              })
            }
            disabled={working}
          >
            Leave Group
          </button>
        )}

        {isOwner && (
          <button
            className='button button-secondary'
            style={{
              color: "#EF4444",
              borderColor: "#EF4444",
              marginLeft: "auto",
            }}
            onClick={() =>
              setConfirmAction({
                type: "delete",
                label:
                  "Permanently delete this group and all its data? This cannot be undone.",
              })
            }
            disabled={working}
          >
            Delete Group
          </button>
        )}
      </div>
    </AppShell>
  );
}
