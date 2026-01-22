import { createContext, useState, ReactNode } from 'react'

interface User {
  username: string
}

interface UserContextType {
  user: User | null
  authenticateUser: () => void
  logOut: () => void
  submitScore: (game: string, score: number) => void
  shouldRefresh: boolean
  setShouldRefresh: (value: boolean) => void
}

export const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [shouldRefresh, _setShouldRefresh] = useState(false)
  const authenticateUser = async () => {
    const userData = await authenticate()
    setUser(userData)
  }

  const logOut = async () => {
    await fetch('https://api.george.richmond.gg/api/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
  }

  const submitScore = async (game: string, score: number) => {
    _setShouldRefresh(!shouldRefresh)
    let res = await fetch(`https://api.george.richmond.gg/api/submit-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ game, score }),
    })

    if (!res.ok) {
      console.error('Failed to submit score...')
      await authenticateUser()
      res = await fetch(`https://api.george.richmond.gg/api/submit-score`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, score }),
      })
    }

    console.log('Score submission response:', res)
  }

  const setShouldRefresh = (value: boolean) => {
    _setShouldRefresh(value)
  }

  return (
    <UserContext.Provider
      value={{ user, authenticateUser, logOut, submitScore, shouldRefresh, setShouldRefresh }}
    >
      {children}
    </UserContext.Provider>
  )
}

async function authenticate() {
  let res = await fetch('https://api.george.richmond.gg/api/me', { credentials: 'include' })

  if (res.status === 401) {
    const r = await fetch('https://api.george.richmond.gg/api/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    if (!r.ok) return null

    res = await fetch('https://api.george.richmond.gg/api/me', { credentials: 'include' })
  }

  if (!res.ok) return null
  return res.json()
}
