import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles.css'
import { UserProvider } from './contexts/UserContext'
import { LeaderboardProvider } from './contexts/LeaderboardContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <LeaderboardProvider>
        <RouterProvider router={router} />
      </LeaderboardProvider>
    </UserProvider>
  </React.StrictMode>
)
