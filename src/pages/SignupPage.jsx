import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../context/AuthContext'
import { AuthPage } from './LoginPage'

export function SignupPage() {
  const { signup, isAuthenticated, isLoading } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState('')
  if (isAuthenticated) return <Navigate to="/profile" replace />
  async function submit(values) { try { setError(''); await signup(values); navigate('/profile', { replace: true }) } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || 'Could not create your account.') } }
  return <AuthPage title="Create your account" intro="Start organizing expenses with the people you trust." error={error}><AuthForm mode="signup" onSubmit={submit} isLoading={isLoading} /><p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p></AuthPage>
}
