import React from 'react'
import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="stack">
      <header className="page-header">
        <h1 className="page-title">Page not found</h1>
        <p className="page-subtitle">That route doesn’t exist.</p>
      </header>

      <div className="card">
        <p className="card-text">Try heading back home.</p>
        <Link className="button" to="/">
          Go to Home
        </Link>
      </div>
    </section>
  )
}
