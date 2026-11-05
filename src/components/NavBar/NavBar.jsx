import './NavBar.css'
import { Link } from 'react-router-dom'
import ProfileIcon from '../ProfileIcon/ProfileIcon'

const NAV_LINKS = [
  { label: 'Home', to: '/home' },
  { label: 'Furniture', to: '/catalog' },
  { label: 'Custom Order', to: '/custom-order' },
  { label: 'My Orders', to: '/my-orders' },
]

/**
 * Wood Works navbar — Figma "Navbar" component: 80px bar, 80px gutters,
 * 700/24 wordmark left, links 500/16 with a 32px gap, profile dot right.
 */
export default function NavBar() {
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
        <ProfileIcon />
      </div>
    </nav>
  )
}
