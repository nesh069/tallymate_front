import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [error, setError] = useState('')
  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname || "/profile"} replace />
  async function submit(values) { try { setError(''); await login({ email: values.email, password: values.password }); navigate(location.state?.from?.pathname || '/profile', { replace: true }) } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || 'Login failed. Please try again.') } }
  return <AuthPage title="Welcome back" intro="Log in to keep your shared expenses in sync." error={error}><AuthForm mode="login" onSubmit={submit} isLoading={isLoading} /><p className="auth-switch">New to TallyMate? <Link to="/signup">Create an account</Link></p></AuthPage>
}
export function AuthPage({ title, intro, error, children }) { return <main className="auth-page"><section className="auth-card"><div className="brand auth-brand"><span className="brand-mark">T</span>TallyMate</div><p className="eyebrow">Accounts &amp; friends</p><h1>{title}</h1><p className="intro">{intro}</p>{error && <p role="alert" className="form-error">{error}</p>}{children}</section></main> }
