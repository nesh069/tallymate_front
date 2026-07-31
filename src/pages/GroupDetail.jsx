import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/AppShell";

export function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  const isOwner = group && user && group.created_by === user.id;

  async function addMember(e) {
    e.preventDefault();
    const id = parseInt(memberId, 10);
    if (!id || id < 1) return setError("Enter a valid user ID.");
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post(`/groups/${groupId}/members`, {
        user_id: id,
      });
      setGroup(data.group);
      setMemberId("");
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

  if (loading) {
    return (
      <AppShell>
        <section className="page-heading">
          <p className="eyebrow">Group</p>
          <h1>Loading…</h1>
        </section>
        <p className="muted">Loading group details…</p>
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell>
        <section className="page-heading">
          <p className="eyebrow">Group</p>
          <h1>Not Found</h1>
        </section>
        <div className="empty-state">
          Group not found or you don&apos;t have access.
        </div>
        <Link
          to="/groups"
          className="button button-secondary"
          style={{ display: "inline-block", marginTop: 16 }}
        >
          Back to Groups
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="page-heading">
        <p className="eyebrow">Group</p>
        <h1>{group.name}</h1>
        <p>
          {group.members.length} member{group.members.length !== 1 ? "s" : ""}{" "}
          &middot; Created {new Date(group.created_at).toLocaleDateString()}
        </p>
      </section>

      {isOwner && (
        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Add a member</h2>
          <p style={{ color: "#A1A1AA", margin: "7px 0 20px", fontSize: 14 }}>
            Enter the user ID of the person you want to add.
          </p>
          <form className="inline-form" onSubmit={addMember}>
            <div className="field" style={{ flex: 1 }}>
              <input
                type="number"
                placeholder="User ID"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                disabled={working}
              />
            </div>
            <button
              className="button button-primary"
              type="submit"
              disabled={working}
            >
              {working ? "Adding…" : "Add Member"}
            </button>
          </form>
          {message && <p className="notice">{message}</p>}
          {error && (
            <p className="field-error" style={{ marginTop: 14 }}>
              {error}
            </p>
          )}
        </section>
      )}

      <section className="friend-section">
        <h2>
          Members <span>{group.members.length}</span>
        </h2>
        <ul className="friend-list">
          {group.members.map((member) => (
            <li key={member.id} className="friend-item">
              <div className="friend-avatar">
                {member.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <strong>{member.name}</strong>
                <p>{member.email}</p>
              </div>
              <div className="friend-actions">
                {member.id === group.created_by && (
                  <span className="status status-pending">Owner</span>
                )}
                {isOwner && member.id !== group.created_by && (
                  <button
                    className="text-button destructive"
                    onClick={() => removeMember(member.id)}
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

      <Link
        to="/groups"
        className="button button-secondary"
        style={{ display: "inline-block", marginTop: 24 }}
      >
        &larr; Back to Groups
      </Link>
    </AppShell>
  );
}
