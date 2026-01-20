import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'

type Cell = number | null
type Board = Cell[][]
type Difficulty = 'easy' | 'medium' | 'hard'

interface SudokuState {
  puzzle: Board
  solution: Board
  current: Board
  selectedCell: { row: number; col: number } | null
  strikes: number
  completed: boolean
  incorrectCells: Set<string>
}

// Sudoku generation and solving utilities
const EMPTY = null

function createEmptyBoard(): Board {
  return Array(9)
    .fill(null)
    .map(() => Array(9).fill(EMPTY))
}

function isValid(board: Board, row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false
  }

  // Check 3x3 box
  const startRow = row - (row % 3)
  const startCol = col - (col % 3)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false
    }
  }

  return true
}

function fillBoard(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === EMPTY) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)
        for (const num of numbers) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num
            if (fillBoard(board)) {
              return true
            }
            board[row][col] = EMPTY
          }
        }
        return false
      }
    }
  }
  return true
}

function copyBoard(board: Board): Board {
  return board.map((row) => [...row])
}

function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  // Create a complete filled board
  const solution = createEmptyBoard()
  fillBoard(solution)

  // Create puzzle by removing numbers
  const puzzle = copyBoard(solution)
  const cellsToRemove = difficulty === 'easy' ? 35 : difficulty === 'medium' ? 45 : 55

  let removed = 0
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * 9)
    const col = Math.floor(Math.random() * 9)
    if (puzzle[row][col] !== EMPTY) {
      puzzle[row][col] = EMPTY
      removed++
    }
  }

  return { puzzle, solution }
}

const COLORS = {
  bg: '#0a0e1a',
  panel: 'rgba(10, 14, 26, 0.8)',
  border: 'rgba(255, 255, 255, 0.1)',
  cellBg: 'rgba(255, 255, 255, 0.05)',
  selectedCell: 'rgba(59, 130, 246, 0.3)',
  sameNumber: 'rgba(59, 130, 246, 0.15)',
  relatedCell: 'rgba(255, 255, 255, 0.08)',
  givenNumber: 'rgba(255, 255, 255, 0.9)',
  userNumber: 'rgba(59, 130, 246, 0.9)',
  incorrect: 'rgba(239, 68, 68, 0.9)',
  correct: 'rgba(34, 197, 94, 0.9)',
  strike: '#ef4444',
}

interface SudokuProps {
  size?: 'small' | 'large'
}

export default function Sudoku({ size = 'large' }: SudokuProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [state, setState] = useState<SudokuState>(() => {
    const { puzzle, solution } = generatePuzzle('medium')
    return {
      puzzle,
      solution,
      current: copyBoard(puzzle),
      selectedCell: null,
      strikes: 0,
      completed: false,
      incorrectCells: new Set<string>(),
    }
  })

  const isMobile = window.innerWidth <= 768

  const newGame = useCallback((diff: Difficulty) => {
    const { puzzle, solution } = generatePuzzle(diff)
    setState({
      puzzle,
      solution,
      current: copyBoard(puzzle),
      selectedCell: null,
      strikes: 0,
      completed: false,
      incorrectCells: new Set<string>(),
    })
    setDifficulty(diff)
  }, [])

  const isGiven = useCallback(
    (row: number, col: number): boolean => {
      return state.puzzle[row][col] !== EMPTY
    },
    [state.puzzle]
  )

  const isComplete = useCallback((board: Board): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === EMPTY) return false
      }
    }
    return true
  }, [])

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (state.completed || state.strikes >= 3) return
      if (isGiven(row, col)) return
      setState((prev) => ({
        ...prev,
        selectedCell: { row, col },
      }))
    },
    [state.completed, state.strikes, isGiven]
  )

  const handleNumberInput = useCallback(
    (num: number) => {
      if (!state.selectedCell || state.completed || state.strikes >= 3) return
      const { row, col } = state.selectedCell

      if (isGiven(row, col)) return

      const newCurrent = copyBoard(state.current)
      newCurrent[row][col] = num

      const cellKey = `${row},${col}`
      const newIncorrectCells = new Set(state.incorrectCells)

      // Check if the number is correct
      if (num !== state.solution[row][col]) {
        // Incorrect number
        newIncorrectCells.add(cellKey)
        const newStrikes = state.strikes + 1

        setState((prev) => ({
          ...prev,
          current: newCurrent,
          strikes: newStrikes,
          incorrectCells: newIncorrectCells,
        }))
      } else {
        // Correct number
        newIncorrectCells.delete(cellKey)

        // Check if puzzle is complete
        const completed = isComplete(newCurrent)

        setState((prev) => ({
          ...prev,
          current: newCurrent,
          incorrectCells: newIncorrectCells,
          completed,
        }))
      }
    },
    [
      state.selectedCell,
      state.completed,
      state.strikes,
      state.current,
      state.solution,
      state.incorrectCells,
      isGiven,
      isComplete,
    ]
  )

  const handleClear = useCallback(() => {
    if (!state.selectedCell || state.completed || state.strikes >= 3) return
    const { row, col } = state.selectedCell

    if (isGiven(row, col)) return

    const newCurrent = copyBoard(state.current)
    newCurrent[row][col] = EMPTY

    const cellKey = `${row},${col}`
    const newIncorrectCells = new Set(state.incorrectCells)
    newIncorrectCells.delete(cellKey)

    setState((prev) => ({
      ...prev,
      current: newCurrent,
      incorrectCells: newIncorrectCells,
    }))
  }, [
    state.selectedCell,
    state.completed,
    state.strikes,
    state.current,
    state.incorrectCells,
    isGiven,
  ])

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (state.completed || state.strikes >= 3) return

      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key))
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleClear()
      } else if (state.selectedCell) {
        const { row, col } = state.selectedCell
        let newRow = row
        let newCol = col

        if (e.key === 'ArrowUp') {
          newRow = Math.max(0, row - 1)
        } else if (e.key === 'ArrowDown') {
          newRow = Math.min(8, row + 1)
        } else if (e.key === 'ArrowLeft') {
          newCol = Math.max(0, col - 1)
        } else if (e.key === 'ArrowRight') {
          newCol = Math.min(8, col + 1)
        } else {
          return
        }

        e.preventDefault()
        setState((prev) => ({
          ...prev,
          selectedCell: { row: newRow, col: newCol },
        }))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [state.selectedCell, state.completed, state.strikes, handleNumberInput, handleClear])

  const getCellHighlight = (row: number, col: number): string => {
    if (!state.selectedCell) return COLORS.cellBg

    const { row: selRow, col: selCol } = state.selectedCell

    // Selected cell
    if (row === selRow && col === selCol) return COLORS.selectedCell

    // Same number as selected
    const selectedValue = state.current[selRow][selCol]
    if (selectedValue !== EMPTY && state.current[row][col] === selectedValue) {
      return COLORS.sameNumber
    }

    // Same row, column, or 3x3 box
    const sameRow = row === selRow
    const sameCol = col === selCol
    const sameBox =
      Math.floor(row / 3) === Math.floor(selRow / 3) &&
      Math.floor(col / 3) === Math.floor(selCol / 3)

    if (sameRow || sameCol || sameBox) return COLORS.relatedCell

    return COLORS.cellBg
  }

  return (
    <div
      style={{
        width: '100%',
        height: size === 'small' ? '100%' : '100vh',
        maxHeight: size === 'large' ? '100vh' : undefined,
        background: size === 'small' ? 'transparent' : COLORS.bg,
        color: 'white',
        padding: size === 'small' ? 0 : isMobile ? 16 : 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: size === 'large' ? 'auto' : 'hidden',
      }}
    >
      {size === 'small' ? (
        // Small preview for demo card
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(9, 1fr)',
              gridTemplateRows: 'repeat(9, 1fr)',
              gap: 1,
              width: '100%',
              aspectRatio: '1',
              background: COLORS.panel,
              border: `2px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: 4,
            }}
          >
            {state.current.map((row, rowIdx) =>
              row.map((cell, colIdx) => {
                const borderTop = rowIdx % 3 === 0 ? `1px solid ${COLORS.border}` : undefined
                const borderLeft = colIdx % 3 === 0 ? `1px solid ${COLORS.border}` : undefined
                const borderBottom = rowIdx === 8 ? `1px solid ${COLORS.border}` : undefined
                const borderRight = colIdx === 8 ? `1px solid ${COLORS.border}` : undefined

                return (
                  <div
                    key={`${rowIdx},${colIdx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 700,
                      background: COLORS.cellBg,
                      color: isGiven(rowIdx, colIdx) ? COLORS.givenNumber : COLORS.userNumber,
                      borderTop,
                      borderLeft,
                      borderBottom,
                      borderRight,
                    }}
                  >
                    {cell !== EMPTY ? cell : ''}
                  </div>
                )
              })
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', textAlign: 'center' }}>Sudoku</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.8, textAlign: 'center' }}>
            Logic puzzle
          </p>
        </div>
      ) : (
        // Full game view
        <>
          <div
            style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : 600,
              marginBottom: 24,
            }}
          >
            <h1 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, marginBottom: 8 }}>
              Sudoku
            </h1>
            <p style={{ fontSize: isMobile ? 13 : 14, opacity: 0.7, margin: 0 }}>
              Fill the grid so each row, column, and 3×3 box contains 1-9
            </p>
          </div>

          {/* Controls */}
          <div
            style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : 600,
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: isMobile ? 16 : 20,
              marginBottom: 20,
            }}
          >
            {/* Difficulty Selection */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8, fontWeight: 700 }}>
                Difficulty
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => newGame(diff)}
                    disabled={state.strikes >= 3 && difficulty === diff}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 8,
                      background:
                        difficulty === diff
                          ? 'rgba(59, 130, 246, 0.3)'
                          : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${
                        difficulty === diff ? 'rgba(59, 130, 246, 0.5)' : COLORS.border
                      }`,
                      color: 'white',
                      fontWeight: 700,
                      fontSize: isMobile ? 13 : 14,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {/* Strikes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, opacity: 0.85, fontWeight: 700 }}>Strikes:</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: isMobile ? 20 : 24,
                        height: isMobile ? 20 : 24,
                        borderRadius: '50%',
                        background: i < state.strikes ? COLORS.strike : 'rgba(255, 255, 255, 0.1)',
                        border: `2px solid ${i < state.strikes ? COLORS.strike : COLORS.border}`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Status Message */}
              {state.completed && (
                <div
                  style={{
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: 700,
                    color: COLORS.correct,
                  }}
                >
                  ✓ Completed!
                </div>
              )}
              {state.strikes >= 3 && !state.completed && (
                <div
                  style={{
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: 700,
                    color: COLORS.strike,
                  }}
                >
                  Game Over
                </div>
              )}
            </div>
          </div>

          {/* Sudoku Grid */}
          <div
            style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : 540,
              aspectRatio: '1',
              background: COLORS.panel,
              border: `3px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: isMobile ? 6 : 10,
              marginBottom: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(9, 1fr)',
              gridTemplateRows: 'repeat(9, 1fr)',
              gap: 1,
            }}
          >
            {state.current.map((row, rowIdx) =>
              row.map((cell, colIdx) => {
                const cellKey = `${rowIdx},${colIdx}`
                const isIncorrect = state.incorrectCells.has(cellKey)
                const isGivenCell = isGiven(rowIdx, colIdx)
                const highlight = getCellHighlight(rowIdx, colIdx)

                // Thick borders for 3x3 boxes
                const borderTop = rowIdx % 3 === 0 ? `2px solid ${COLORS.border}` : undefined
                const borderLeft = colIdx % 3 === 0 ? `2px solid ${COLORS.border}` : undefined
                const borderBottom = rowIdx === 8 ? `2px solid ${COLORS.border}` : undefined
                const borderRight = colIdx === 8 ? `2px solid ${COLORS.border}` : undefined

                return (
                  <motion.div
                    key={cellKey}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                    initial={false}
                    animate={{
                      background: highlight,
                    }}
                    transition={{ duration: 0.15 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? 18 : 24,
                      fontWeight: 700,
                      cursor:
                        state.completed || state.strikes >= 3 || isGivenCell
                          ? 'default'
                          : 'pointer',
                      color: isIncorrect
                        ? COLORS.incorrect
                        : isGivenCell
                          ? COLORS.givenNumber
                          : COLORS.userNumber,
                      borderTop,
                      borderLeft,
                      borderBottom,
                      borderRight,
                      userSelect: 'none',
                    }}
                  >
                    {cell !== EMPTY ? cell : ''}
                  </motion.div>
                )
              })
            )}
          </div>

          {/* Number Input Pad */}
          <div
            style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : 540,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: isMobile ? 6 : 8,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                disabled={!state.selectedCell || state.completed || state.strikes >= 3}
                style={{
                  padding: isMobile ? '14px' : '18px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${COLORS.border}`,
                  color: 'white',
                  fontWeight: 800,
                  fontSize: isMobile ? 18 : 22,
                  cursor:
                    state.selectedCell && !state.completed && state.strikes < 3
                      ? 'pointer'
                      : 'not-allowed',
                  opacity: state.selectedCell && !state.completed && state.strikes < 3 ? 1 : 0.5,
                }}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Instructions */}
          {!isMobile && (
            <div
              style={{
                width: '100%',
                maxWidth: 600,
                marginTop: 20,
                fontSize: 12,
                opacity: 0.6,
                textAlign: 'center',
              }}
            >
              Click a cell and use number keys 1-9, or click the number pad below. Arrow keys to
              navigate.
            </div>
          )}
        </>
      )}
    </div>
  )
}
