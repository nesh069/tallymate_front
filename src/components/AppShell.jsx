import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AppShell({ children }) {
  const { user } = useAuth();
  return (
    <main className='app-shell'>
      <header className='topbar'>
        <NavLink to='/profile' className='brand'>
          <span className='brand-mark'>T</span>TallyMate
        </NavLink>
        <nav aria-label='Main navigation'>
          <NavLink to='/profile'>Profile</NavLink>
          <NavLink to='/friends'>Friends</NavLink>
          <NavLink to='/groups'>Groups</NavLink>
        </nav>
        <span className='user-chip'>
          {user?.name?.slice(0, 1).toUpperCase() || "?"}
        </span>
      </header>
      {children}
    </main>
  );
}
