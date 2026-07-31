export function FriendListItem({ friend, onAccept, onRemove, isWorking }) {
  const pending = friend.status === 'pending'
  return (
    <li className="friend-item">
      <div className="friend-avatar">
        {friend.name?.slice(0, 1).toUpperCase() || friend.email.slice(0, 1).toUpperCase()}
      </div>
      <div>
        <strong>{friend.name || friend.email.split('@')[0]}</strong>
        <p>{friend.email}</p>
      </div>
      <div className="friend-actions">
        {pending && (
          <button
            className="text-button accept"
            onClick={() => onAccept(friend.id)}
            disabled={isWorking}
          >
            Accept
          </button>
        )}
        <button
          className="text-button destructive"
          onClick={() => onRemove(friend.id, friend.status)}
          disabled={isWorking}
        >
          Remove
        </button>
      </div>
    </li>
  )
}