import { useEffect, useState } from 'react'
import { api } from '../api/api'
import { FriendListItem } from '../components/FriendListItem'
import { FriendRequestForm } from '../components/FriendRequestForm'

export function FriendsPage() {
  const [friends, setFriends] = useState([]); const [loading, setLoading] = useState(true); const [working, setWorking] = useState(false); const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    api.get('/friends')
      .then(({ data }) => { if (active) setFriends(Array.isArray(data) ? data : data.friends || []) })
      .catch(() => { if (active) setMessage('Could not load friends. Please try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function addFriend(email) { setWorking(true); try { const { data } = await api.post('/friends', { email }); setFriends((current) => [data.friend || data, ...current]); setMessage('Friend request sent.') } finally { setWorking(false) } }
  async function acceptFriend(id) { setWorking(true); try { const { data } = await api.post(`/friends/${id}/accept`); setFriends((current) => current.map((friend) => friend.id === id ? (data.friend || { ...friend, status: 'accepted' }) : friend)) } finally { setWorking(false) } }
  async function removeFriend(id) { setWorking(true); try { await api.delete(`/friends/${id}`); setFriends((current) => current.filter((friend) => friend.id !== id)) } finally { setWorking(false) } }
  const pending = friends.filter((friend) => friend.status === 'pending'); const accepted = friends.filter((friend) => friend.status === 'accepted')
  return <><section className="page-heading"><p className="eyebrow">People</p><h1>Friends</h1><p>Add the people you split expenses with and manage requests.</p></section><section className="card friend-request-card"><h2>Add a friend</h2><p>Send a request using the email tied to their TallyMate account.</p><FriendRequestForm onAdd={addFriend} isLoading={working} />{message && <p className="notice">{message}</p>}</section><FriendSection title="Pending requests" friends={pending} loading={loading} empty="No pending friend requests." onAccept={acceptFriend} onRemove={removeFriend} isWorking={working} /><FriendSection title="Your friends" friends={accepted} loading={loading} empty="Your friends will appear here." onAccept={acceptFriend} onRemove={removeFriend} isWorking={working} /></>
}
function FriendSection({ title, friends, loading, empty, ...actions }) { return <section className="friend-section"><h2>{title}<span>{friends.length}</span></h2>{loading ? <p className="muted">Loading friends…</p> : friends.length ? <ul className="friend-list">{friends.map((friend) => <FriendListItem key={friend.id} friend={friend} {...actions} />)}</ul> : <div className="empty-state">{empty}</div>}</section> }
