import { useState } from 'react'

export function FriendRequestForm({ onAdd, isLoading }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    setError('')
    try { await onAdd(email); setEmail('') } catch (requestError) { setError(requestError.message || 'Unable to send the request.') }
  }
  return <form className="friend-form" noValidate onSubmit={submit}>
    <label className="field"><span>Add by email</span><div className="inline-form"><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="friend@example.com" type="email" /><button className="button button-primary" disabled={isLoading}>{isLoading ? 'Adding…' : 'Add friend'}</button></div>{error && <small role="alert" className="field-error">{error}</small>}</label>
  </form>
}
