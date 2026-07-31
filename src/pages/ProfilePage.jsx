import { useNavigate } from 'react-router-dom'
import { ProfileCard } from '../components/ProfileCard'
import { useAuth } from '../context/AuthContext'

export function ProfilePage() { const { user, logout } = useAuth(); const navigate = useNavigate(); function exit() { logout(); navigate('/login', { replace: true }) }
  return <><section className="page-heading"><p className="eyebrow">Account</p><h1>Profile</h1><p>Manage the details linked to your TallyMate account.</p></section><ProfileCard user={user} onLogout={exit} /></>
}
