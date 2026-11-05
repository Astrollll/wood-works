import './PageLayout.css'
import NavBar from '../../components/NavBar/NavBar'

/**
 * Store shell (screens 10–14): cream background page with the navbar on top.
 */
export default function PageLayout({ children }) {
  return (
    <div className="page">
      <header>
        <NavBar />
      </header>
      <main className="page__body app-width">{children}</main>
    </div>
  )
}
