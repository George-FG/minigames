import React from 'react'
import { useUser } from '../hooks/useUser'

export function Home() {
  const { user, logOut } = useUser()

  return (
    <section
      id="home"
      className="stack"
      style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}
    >
      <div className="hero">
        <h1 className="hero-title">Welcome!</h1>
        {user ? (
          <>
            <p
              className="hero-subtitle"
              style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: 1200 }}
            >
              Logged in as {user.username}
            </p>
            <div className="hero-actions">
              <button className="button button-secondary" onClick={logOut} id="logout-button">
                Log out
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              className="hero-subtitle"
              style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: 1200 }}
            >
              {'Login or create an account to access leaderboards!'}
            </p>
            <div className="hero-actions">
              <a
                id="login-button"
                className="button button-secondary"
                href="https://auth.george.richmond.gg/?redirectTo=https%3A%2F%2Fminigames.george.richmond.gg"
                rel="noopener noreferrer"
              >
                Login/Signup
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
