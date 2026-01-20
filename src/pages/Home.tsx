import React from 'react'

export function Home() {
  return (
    <section
      id="home"
      className="stack"
      style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}
    >
      <div className="hero">
        <h1 className="hero-title">Welcome!</h1>
        <p
          className="hero-subtitle"
          style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: 1200 }}
        >
          {'Login or create an account to access leaderboards!'}
        </p>
        <div className="hero-actions">
          <a className="button button-secondary" href="" target="_blank" rel="noopener noreferrer">
            Login/Signup
          </a>
        </div>
      </div>
    </section>
  )
}
