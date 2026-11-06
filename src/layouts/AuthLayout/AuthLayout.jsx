import './AuthLayout.css'

/**
 * Split screen shared by auth screens 01–09: #795548 brand panel with the
 * centered wordmark + tagline, and a #F7F3EE side centering the 420px white
 * card (radius 12, padding 40, 16px stack gap) the page renders as children.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__brand">
          <h1 className="auth__logo">WOOD WORKS</h1>
          <p className="auth__tagline">Furniture &amp; Custom Woodworks</p>
        </div>
      </div>
      <div className="auth__side">
        <main className="auth__card">{children}</main>
      </div>
    </div>
  )
}
