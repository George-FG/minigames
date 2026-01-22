import { NavBar } from './NavBar'
import { Home } from '../pages/Home'
import { Leaderboard } from '../pages/Leaderboard'
import { Demo } from '../pages/Demo'
import { useUser } from '../hooks/useUser'
import { useEffect } from 'react'

export function Layout() {
  const { user, authenticateUser, submitScore } = useUser()

  useEffect(() => {
    console.log('Current user:', user)

    if (!user) {
      console.log('Authenticating user...')
      authenticateUser()
    }
  }, [user, authenticateUser, submitScore])

  const websiteTitle = 'Minigames'
  const websiteTagline = 'Play now!'
  return (
    <div className="app">
      <header className="header" style={{ position: 'fixed', top: 0, left: 0, right: 0 }}>
        <div className="container header-inner">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true"></div>
            <div className="brand-text">
              <div className="brand-name">{websiteTitle}</div>
              <div className="brand-tagline">{websiteTagline}</div>
            </div>
          </div>
          <NavBar />
        </div>
      </header>

      <main className="main" style={{ paddingTop: '90px' }}>
        <Home />
        <Leaderboard />
        <Demo />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>
            © {new Date().getFullYear()} {websiteTitle}
          </span>
          <span className="muted">Created by George Terry</span>
        </div>
      </footer>
    </div>
  )
}
