import React, { useState } from 'react'
import { Snake } from '../demos/Snake'

export function SnakeDemo({ size }: { size: 'small' | 'large' }) {
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  return (
    <Snake
      size={size}
      score={score}
      setScore={setScore}
      gameOver={gameOver}
      setGameOver={setGameOver}
    />
  )
}
