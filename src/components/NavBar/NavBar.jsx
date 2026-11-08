import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import ProfileIcon from '../ProfileIcon/ProfileIcon'
import './NavBar.css'

const NAV_LINKS = [
  { label: 'Home', to: '/home' },
  { label: 'Furniture', to: '/catalog' },
  { label: 'Custom Order', to: '/custom-order' },
  { label: 'My Orders', to: '/my-orders' },
]

/**
 * Wood Works navbar — Figma "Navbar" component: 80px bar, 80px gutters,
 * 700/24 wordmark left, links 500/16 with a 32px gap, profile dot right.
 * Signed-in, the dot becomes a button opening a small account popover
 * (email + Log out) over the page (real-auth spec §4).
 */
export default function NavBar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    setOpen(false)
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/home" className="navbar__logo">
        WOOD WORKS
      </Link>
      <ul className="navbar__links">
        {NAV_LINKS.map(({ label, to }) => (
          <li key={to}>
            <Link to={to} className="navbar__link">
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="navbar__profile">
        {user ? (
          <>
            <button
              type="button"
              className="navbar__profile-btn"
              aria-label="Account options"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <ProfileIcon />
            </button>
            {open && (
              <div className="navbar__popover">
                <p className="navbar__popover-email">{user.email}</p>
                <button
                  type="button"
                  className="navbar__popover-logout"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            )}
          </>
        ) : (
          <ProfileIcon />
        )}
      </div>
    </nav>
  )
}
