import React, { useEffect, useCallback, useRef } from 'react'

type Player = 'X' | 'O' | null

interface NoughtsAndCrossesProps {
  size: 'small' | 'large'
  board: Player[]
  setBoard: React.Dispatch<React.SetStateAction<Player[]>>
  isXNext: boolean
  setIsXNext: React.Dispatch<React.SetStateAction<boolean>>
  playerStarts: boolean
  setPlayerStarts: React.Dispatch<React.SetStateAction<boolean>>
  scores: { player: number; ai: number }
  setScores: React.Dispatch<React.SetStateAction<{ player: number; ai: number }>>
}

export function NoughtsAndCrosses({
  size,
  board,
  setBoard,
  isXNext,
  setIsXNext,
  playerStarts,
  setPlayerStarts,
  scores,
  setScores,
}: NoughtsAndCrossesProps) {
  const lastWinnerRef = useRef<Player>(null)

  const calculateWinner = (squares: Player[]): Player => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ]
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a]
      }
    }
    return null
  }

  const minimax = (squares: Player[], depth: number, isMaximizing: boolean): number => {
    const winner = calculateWinner(squares)
    if (winner === 'O') return 10 - depth
    if (winner === 'X') return depth - 10
    if (squares.every((cell) => cell !== null)) return 0

    if (isMaximizing) {
      let bestScore = -Infinity
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          const testSquares = squares.slice()
          testSquares[i] = 'O'
          const score = minimax(testSquares, depth + 1, false)
          bestScore = Math.max(score, bestScore)
        }
      }
      return bestScore
    } else {
      let bestScore = Infinity
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          const testSquares = squares.slice()
          testSquares[i] = 'X'
          const score = minimax(testSquares, depth + 1, true)
          bestScore = Math.min(score, bestScore)
        }
      }
      return bestScore
    }
  }

  const getBestMove = useCallback((squares: Player[]): number => {
    let bestScore = -Infinity
    let bestMove = -1

    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        const testSquares = squares.slice()
        testSquares[i] = 'O'
        const score = minimax(testSquares, 0, false)
        if (score > bestScore) {
          bestScore = score
          bestMove = i
        }
      }
    }
    return bestMove
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = (index: number) => {
    if (board[index] || calculateWinner(board) || !isXNext) return
    const newBoard = board.slice()
    newBoard[index] = 'X'
    setBoard(newBoard)
    setIsXNext(false)
  }

  const resetGame = () => {
    lastWinnerRef.current = null
    setBoard(Array(9).fill(null))
    setPlayerStarts(!playerStarts)
    setIsXNext(playerStarts ? false : true)
  }

  useEffect(() => {
    const winner = calculateWinner(board)

    if (winner && winner !== lastWinnerRef.current) {
      lastWinnerRef.current = winner
      if (winner === 'X') {
        setScores((prev) => ({ ...prev, player: prev.player + 1 }))
      } else if (winner === 'O') {
        setScores((prev) => ({ ...prev, ai: prev.ai + 1 }))
      }
    }
  }, [board, setScores])

  useEffect(() => {
    if (!isXNext && !calculateWinner(board) && board.some((cell) => cell === null)) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board)
        if (bestMove !== -1) {
          setBoard((prevBoard: Player[]) => {
            const newBoard = prevBoard.slice()
            newBoard[bestMove] = 'O'
            return newBoard
          })
          setIsXNext(true)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isXNext, board, getBestMove, setBoard, setIsXNext])

  useEffect(() => {
    if (!playerStarts && board.every((cell) => cell === null)) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board)
        if (bestMove !== -1) {
          setBoard((prevBoard: Player[]) => {
            const newBoard = prevBoard.slice()
            newBoard[bestMove] = 'O'
            return newBoard
          })
          setIsXNext(true)
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [playerStarts, board, getBestMove, setBoard, setIsXNext])

  const winner = calculateWinner(board)
  const isDraw = !winner && board.every((cell) => cell !== null)

  const cellSize = size === 'small' ? 40 : 80
  const fontSize = size === 'small' ? '1.2rem' : '2.5rem'
  const gap = size === 'small' ? 4 : 8

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(3, ${cellSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {board.map((cell, index) => (
          <div
            key={index}
            onClick={size === 'large' ? () => handleClick(index) : undefined}
            style={{
              width: cellSize,
              height: cellSize,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize,
              fontWeight: 'bold',
              cursor:
                size === 'small'
                  ? 'pointer'
                  : size === 'large' && !cell && !winner
                    ? 'pointer'
                    : 'default',
              color: cell === 'X' ? '#4ade80' : cell === 'O' ? '#f87171' : 'transparent',
            }}
          >
            {cell}
          </div>
        ))}
      </div>

      <h3 style={{ margin: 0, fontSize: size === 'small' ? '1rem' : '2rem', fontWeight: 600 }}>
        Noughts and Crosses
      </h3>

      <div
        style={{
          display: size === 'large' ? 'flex' : 'none',
          gap: '2rem',
          fontSize: '1rem',
          opacity: 0.9,
          marginTop: '0.5rem',
        }}
      >
        <span style={{ color: '#4ade80' }}>X: {scores.player}</span>
        <span style={{ color: '#f87171' }}>O: {scores.ai}</span>
      </div>

      <div
        style={{
          fontSize: '1.2rem',
          margin: '1rem 0',
          opacity: 0.9,
          display: size === 'large' ? 'block' : 'none',
        }}
      >
        {winner ? (
          <span
            style={{
              color: winner === 'X' ? '#4ade80' : '#f87171',
              fontWeight: 'bold',
            }}
          >
            {winner === 'X' ? 'You win!' : 'AI wins!'}
          </span>
        ) : isDraw ? (
          <span>Draw!</span>
        ) : (
          <span>{isXNext ? 'Your turn' : 'AI thinking...'}</span>
        )}
      </div>

      <button
        onClick={resetGame}
        style={{
          marginTop: '1rem',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 8,
          padding: '0.75rem 1.5rem',
          color: 'white',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 600,
          display: size === 'large' ? 'block' : 'none',
        }}
      >
        Next Game
      </button>
    </>
  )
}
