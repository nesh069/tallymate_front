export function ProfileCard({ user, onLogout }) {
  const initial = user?.name?.slice(0, 1).toUpperCase() || '?'
  return <section className="card profile-card">
    <div className="avatar">{initial}</div>
    <div className="profile-copy"><p className="eyebrow">Your account</p><h2>{user?.name || 'TallyMate member'}</h2><p>{user?.email}</p></div>
    <button className="button button-secondary" onClick={onLogout}>Log out</button>
  </section>
}
