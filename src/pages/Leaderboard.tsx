import { useEffect, useState } from 'react'

interface ScoreEntry {
  game: string
  username: string
  score: number
  date: string
}

export function Leaderboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const game = '2048'
  const limit = 10

  useEffect(() => {
    fetchScores()
  }, [page, game])

  const fetchScores = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://api.george.richmond.gg/api/scores-by-game?game=${game}&page=${page}&size=${limit}`,
        { credentials: 'include', method: 'GET' }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch scores')
      }

      const data = await response.json()
      console.log('Fetched scores data:', data)

      setScores(data.content ?? [])
      //setHasMore(data.scores.length === limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching scores:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNextPage = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (page >= 1 && !loading) {
      setPage((prev) => prev - 1)
    }
  }

  return (
    <section id="leaderboard" className="section">
      <div className="container">
        <h1 className="section-title">Leaderboard</h1>
        <h2 className="section-subtitle">Top scores for {game}</h2>

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
                        No scores yet. Be the first to play!
                      </td>
                    </tr>
                  ) : (
                    scores.map((entry, index) => (
                      <tr
                        key={`${entry.username}-${entry.score}-${entry.date}`}
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
                          {new Date(entry.date).toLocaleDateString()}
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
