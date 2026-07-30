import { useState } from 'react'

export function AuthForm({ mode, onSubmit, isLoading }) {
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})

  function validate() {
    const next = {}
    if (mode === 'signup' && !values.name.trim()) next.name = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = 'Enter a valid email address.'
    if (values.password.length < 6) next.password = 'Password must be at least 6 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (validate()) onSubmit(values)
  }

  function update(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
      setErrors((current) => ({ ...current, [field]: '' }))
    }
  }

  return <form className="auth-form" noValidate onSubmit={handleSubmit}>
    {mode === 'signup' && <Field label="Name" error={errors.name}><input value={values.name} onChange={update('name')} placeholder="Ada Lovelace" autoComplete="name" /></Field>}
    <Field label="Email" error={errors.email}><input value={values.email} onChange={update('email')} placeholder="you@example.com" type="email" autoComplete="email" /></Field>
    <Field label="Password" error={errors.password}><input value={values.password} onChange={update('password')} placeholder="At least 6 characters" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></Field>
    <button className="button button-primary" disabled={isLoading}>{isLoading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}</button>
  </form>
}

function Field({ label, error, children }) {
  return <label className="field"><span>{label}</span>{children}{error && <small role="alert" className="field-error">{error}</small>}</label>
}
