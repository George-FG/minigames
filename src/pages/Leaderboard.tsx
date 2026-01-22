import { useEffect, useState } from 'react'
import { ScoreEntry } from '../contexts/LeaderboardContext'
import { useUser } from '../hooks/useUser'
import { useLeaderboard } from '../hooks/useLeaderboard'

export function Leaderboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [game, setGame] = useState('2048')
  const { getScores } = useLeaderboard()
  const { authenticateUser } = useUser()

  const limit = 10

  const handleGameChange = (newGame: string) => {
    setGame(newGame)
    setPage(1) // Reset to page 1 when game changes
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        let res = await getScores(game, page, limit)

        if (!res || res.length === 0) {
          await authenticateUser()
          res = await getScores(game, page, limit)
        }

        if (!cancelled) setScores(res)
        if (!cancelled) setHasMore(res.length === limit)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load scores')
      } finally {
        setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [game, page, limit, getScores, authenticateUser])

  const handleNextPage = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (page > 1 && !loading) {
      setPage((prev) => prev - 1)
    }
  }

  return (
    <section id="leaderboard" className="section">
      <div className="container">
        <h1 className="section-title">Leaderboard</h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <h2 className="section-subtitle">Top scores for</h2>
          <select
            value={game}
            onChange={(e) => handleGameChange(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#333',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="2048">2048</option>
            <option value="snake">Snake</option>
          </select>
        </div>

        {error && (
          <div style={{ color: '#ff6b6b', padding: '1rem', textAlign: 'center' }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
        ) : (
          <>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Rank</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Player</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Score</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>
                        {' '}
                      </td>
                    </tr>
                  ) : (
                    scores.map((entry, index) => (
                      <tr
                        key={`${entry.username}-${entry.score}-${entry.timestamp}`}
                        style={{ borderBottom: '1px solid #444' }}
                      >
                        <td style={{ padding: '1rem' }}>{(page - 1) * limit + index + 1}</td>
                        <td style={{ padding: '1rem' }}>{entry.username}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                          {entry.score.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: '1rem',
                            textAlign: 'right',
                            fontSize: '0.9em',
                            opacity: 0.7,
                          }}
                        >
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1rem',
                  marginTop: '2rem',
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1 || loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: page === 1 ? '#333' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.5 : 1,
                  }}
                >
                  Previous
                </button>

                <span style={{ padding: '0.75rem' }}>Page {page}</span>

                <button
                  onClick={handleNextPage}
                  disabled={!hasMore || loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: !hasMore ? '#333' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !hasMore ? 'not-allowed' : 'pointer',
                    opacity: !hasMore ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
