import { createContext, ReactNode } from 'react'

export interface ScoreEntry {
  game: string
  username: string
  score: number
  timestamp: string
}

interface LeaderboardContextType {
  getScores: (game: string, page: number, limit: number) => Promise<ScoreEntry[]>
}

export const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined)

export const LeaderboardProvider = ({ children }: { children: ReactNode }) => {
  const getScores = async (game: string, page: number, limit: number): Promise<ScoreEntry[]> => {
    try {
      const response = await fetch(
        `https://api.george.richmond.gg/api/scores-by-game?game=${game}&page=${page - 1}&size=${limit}`,
        { credentials: 'include', method: 'GET' }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch scores')
      }

      const data = await response.json()
      console.log('Fetched scores data:', data)

      return data.content
      //setHasMore(data.number === limit)
    } catch (err) {
      console.error('Error fetching scores:', err)
      return []
    }
  }

  return <LeaderboardContext.Provider value={{ getScores }}>{children}</LeaderboardContext.Provider>
}
