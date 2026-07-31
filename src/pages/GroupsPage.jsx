import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";

export function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/groups")
      .then(({ data }) => {
        if (active) setGroups(data.groups || []);
      })
      .catch(() => {
        if (active) setError("Could not load groups. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function createGroup(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Group name is required.");
    setWorking(true);
    setError("");
    try {
      const { data } = await api.post("/groups", { name: trimmed });
      setGroups((prev) => [data.group, ...prev]);
      setName("");
      setMessage("Group created.");
    } catch (err) {
      setError(err.response?.data?.error || "Could not create group.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <AppShell>
      <section className='page-heading'>
        <p className='eyebrow'>Groups</p>
        <h1>Your Groups</h1>
        <p>
          Create a group for a trip, house, or anything you split costs for.
        </p>
      </section>

      <section className='card' style={{ padding: 24 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>Create a group</h2>
        <p style={{ color: "#A1A1AA", margin: "7px 0 20px", fontSize: 14 }}>
          Give it a name and add members from the group page.
        </p>
        <form className='inline-form' onSubmit={createGroup}>
          <div className='field' style={{ flex: 1 }}>
            <input
              type='text'
              placeholder='e.g. Bali Trip 2026'
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={working}
            />
          </div>
          <button
            className='button button-primary'
            type='submit'
            disabled={working}
          >
            {working ? "Creating…" : "Create Group"}
          </button>
        </form>
        {message && <p className='notice'>{message}</p>}
        {error && (
          <p className='field-error' style={{ marginTop: 14 }}>
            {error}
          </p>
        )}
      </section>

      <section className='friend-section'>
        <h2>
          Groups <span>{groups.length}</span>
        </h2>
        {loading ? (
          <p className='muted'>Loading groups…</p>
        ) : groups.length === 0 ? (
          <div className='empty-state'>No groups yet. Create one above.</div>
        ) : (
          <ul className='friend-list'>
            {groups.map((group) => (
              <li key={group.id} className='friend-item'>
                <div className='friend-avatar'>
                  {group.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong>{group.name}</strong>
                  <p>
                    {group.members.length} member
                    {group.members.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className='friend-actions'>
                  <Link
                    to={`/groups/${group.id}`}
                    className='button button-secondary'
                    style={{ fontSize: 12 }}
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
