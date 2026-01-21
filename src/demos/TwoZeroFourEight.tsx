import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '../hooks/useUser'

// ============================================
// DEVELOPER SETTINGS - Easy to tweak
// ============================================
const SETTINGS = {
  gridSize: 4,
  winningTile: 2048,
  newTileValue: 2,
  fourTileProbability: 0.1,
  animationDuration: 150, // ms
  swipeThreshold: 50,

  tileColors: {
    2: '#eee4da',
    4: '#ede0c8',
    8: '#f2b179',
    16: '#f59563',
    32: '#f67c5f',
    64: '#f65e3b',
    128: '#edcf72',
    256: '#edcc61',
    512: '#edc850',
    1024: '#edc53f',
    2048: '#edc22e',
    default: '#3c3a32',
  },

  tileTextColors: {
    lowValue: '#776e65',
    highValue: '#f9f6f2',
  },
}
// ============================================

type Direction = 'up' | 'down' | 'left' | 'right'
type Tile = { id: number; value: number; justSpawned?: boolean; justMerged?: boolean }
type Cell = Tile | null
export type Grid = Cell[][]

interface TwoZeroFourEightProps {
  size: 'small' | 'large'
  grid: Grid
  setGrid: (grid: Grid) => void
  score: number
  setScore: (score: number) => void
  gameOver: boolean
  setGameOver: (gameOver: boolean) => void
  hasWon: boolean
  setHasWon: (hasWon: boolean) => void
}

function makeEmptyGrid(): Grid {
  return Array.from({ length: SETTINGS.gridSize }, () =>
    Array.from({ length: SETTINGS.gridSize }, () => null)
  )
}

export function TwoZeroFourEight({
  size,
  grid,
  setGrid,
  score,
  setScore,
  gameOver,
  setGameOver,
  hasWon,
  setHasWon,
}: TwoZeroFourEightProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const idRef = useRef(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const { submitScore } = useUser()
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (gameOver) {
      console.log('Game over! Final score:', score)
      if (submitScore && !submitted) {
        submitScore('2048', score)
        setSubmitted(true)
      }
    } else {
      setSubmitted(false)
    }
  }, [gameOver, score, submitScore, submitted])

  const getTileColor = (value: number | null): string => {
    if (value === null) return 'rgba(238, 228, 218, 0.35)'
    return (
      SETTINGS.tileColors[value as keyof typeof SETTINGS.tileColors] || SETTINGS.tileColors.default
    )
  }

  const getTileTextColor = (value: number | null): string => {
    if (value === null) return 'transparent'
    return value <= 4 ? SETTINGS.tileTextColors.lowValue : SETTINGS.tileTextColors.highValue
  }

  const tileSize = size === 'small' ? 40 : 80
  const gap = size === 'small' ? 6 : 12
  const fontSize = size === 'small' ? 16 : 32

  const boardPx = SETTINGS.gridSize * tileSize + (SETTINGS.gridSize + 1) * gap

  const addRandomTile = useCallback((g: Grid): boolean => {
    const empty: Array<[number, number]> = []
    for (let r = 0; r < SETTINGS.gridSize; r++) {
      for (let c = 0; c < SETTINGS.gridSize; c++) {
        if (g[r][c] === null) empty.push([r, c])
      }
    }
    if (empty.length === 0) return false

    const [row, col] = empty[Math.floor(Math.random() * empty.length)]
    const value = Math.random() < SETTINGS.fourTileProbability ? 4 : SETTINGS.newTileValue
    g[row][col] = { id: idRef.current++, value, justSpawned: true }
    return true
  }, [])

  const initializeGrid = useCallback((): Grid => {
    const g = makeEmptyGrid()
    addRandomTile(g)
    addRandomTile(g)
    return g
  }, [addRandomTile])

  const isGameOver = useCallback((g: Grid): boolean => {
    // empty cell?
    for (let r = 0; r < SETTINGS.gridSize; r++) {
      for (let c = 0; c < SETTINGS.gridSize; c++) {
        if (g[r][c] === null) return false
      }
    }
    // possible merges?
    for (let r = 0; r < SETTINGS.gridSize; r++) {
      for (let c = 0; c < SETTINGS.gridSize; c++) {
        const v = g[r][c]!.value
        if (c < SETTINGS.gridSize - 1 && g[r][c + 1]!.value === v) return false
        if (r < SETTINGS.gridSize - 1 && g[r + 1][c]!.value === v) return false
      }
    }
    return true
  }, [])

  // Remove per-move transient flags so they don’t keep re-triggering animations
  const clearTransientFlags = (g: Grid): Grid =>
    g.map((row) => row.map((cell) => (cell ? { id: cell.id, value: cell.value } : null)))

  const compressAndMerge = useCallback(
    (line: Cell[]): { out: Cell[]; scoreGained: number; changed: boolean } => {
      const tiles = line.filter(Boolean) as Tile[]
      const outTiles: Cell[] = []
      let scoreGained = 0

      for (let i = 0; i < tiles.length; i++) {
        const a = tiles[i]
        const b = tiles[i + 1]
        if (b && a.value === b.value) {
          const mergedValue = a.value * 2
          const mergedTile: Tile = {
            id: idRef.current++,
            value: mergedValue,
            justMerged: true,
          }
          outTiles.push(mergedTile)
          scoreGained += mergedValue
          if (mergedValue === SETTINGS.winningTile && !hasWon) setHasWon(true)
          i++ // skip next
        } else {
          outTiles.push({ id: a.id, value: a.value })
        }
      }

      while (outTiles.length < SETTINGS.gridSize) outTiles.push(null as Cell)

      const out = outTiles
      const changed =
        JSON.stringify(line.map((c) => (c ? c.value : null))) !==
        JSON.stringify(out.map((c) => (c ? c.value : null)))

      return { out, scoreGained, changed }
    },
    [hasWon, setHasWon]
  )

  const move = useCallback(
    (direction: Direction) => {
      if (gameOver || isAnimating) return

      // clear transient flags from previous move for clean animations
      const base = clearTransientFlags(grid)
      let moved = false
      let gained = 0
      const next: Grid = makeEmptyGrid()

      const N = SETTINGS.gridSize

      const getLine = (index: number): Cell[] => {
        if (direction === 'left') return base[index]
        if (direction === 'right') return [...base[index]].reverse()
        if (direction === 'up') return base.map((row) => row[index])
        // down
        return base.map((row) => row[index]).reverse()
      }

      const setLine = (index: number, line: Cell[]) => {
        if (direction === 'left') next[index] = line
        else if (direction === 'right') next[index] = [...line].reverse()
        else if (direction === 'up') {
          for (let r = 0; r < N; r++) next[r][index] = line[r]
        } else {
          // down
          const rev = [...line].reverse()
          for (let r = 0; r < N; r++) next[r][index] = rev[r]
        }
      }

      for (let i = 0; i < N; i++) {
        const line = getLine(i)
        const { out, scoreGained, changed } = compressAndMerge(line)
        if (changed) moved = true
        gained += scoreGained
        setLine(i, out)
      }

      if (!moved) return

      // Set grid first without new tile to animate the move
      setGrid(next)
      setScore(score + gained)
      setIsAnimating(true)

      // Add new tile after animation completes
      setTimeout(() => {
        const gridWithNewTile = next.map((row) =>
          row.map((cell) => (cell ? { id: cell.id, value: cell.value } : null))
        )
        addRandomTile(gridWithNewTile)
        setGrid(gridWithNewTile)
        setIsAnimating(false)

        if (isGameOver(gridWithNewTile)) setGameOver(true)
      }, SETTINGS.animationDuration)
    },
    [
      addRandomTile,
      compressAndMerge,
      gameOver,
      grid,
      isAnimating,
      isGameOver,
      score,
      setGameOver,
      setGrid,
      setScore,
    ]
  )

  const dismissOverlay = useCallback(() => {
    setGameOver(false)
    setHasWon(false)
  }, [setGameOver, setHasWon])

  const resetGame = useCallback(() => {
    setIsAnimating(false)
    setGrid(initializeGrid())
    setScore(0)
    setGameOver(false)
    setHasWon(false)
  }, [initializeGrid, setGameOver, setGrid, setHasWon, setScore])

  useEffect(() => {
    if (size !== 'large') return

    const onKeyDown = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      }
      const dir = map[e.key]
      if (!dir) return
      e.preventDefault()
      move(dir)
    }

    window.addEventListener('keydown', onKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [move, size])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (size !== 'large') return
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (size !== 'large' || !touchStartRef.current) return

    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y

    touchStartRef.current = null

    if (Math.abs(dx) < SETTINGS.swipeThreshold && Math.abs(dy) < SETTINGS.swipeThreshold) return

    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left')
    else move(dy > 0 ? 'down' : 'up')
  }

  // collect tile render data
  const tilesToRender = useMemo(() => {
    const out: Array<{ tile: Tile; row: number; col: number }> = []
    for (let r = 0; r < SETTINGS.gridSize; r++) {
      for (let c = 0; c < SETTINGS.gridSize; c++) {
        const t = grid[r][c]
        if (t) out.push({ tile: t, row: r, col: c })
      }
    }
    return out
  }, [grid])

  return (
    <div
      style={{
        position: 'relative', // fixes overlay positioning for win/lose panel
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        width: '100%',
        height: '100%',
        userSelect: 'none',
      }}
    >
      <div style={{ display: size === 'small' ? 'none' : 'block', textAlign: 'center' }}>
        <h3 style={{ margin: 0, marginBottom: '0.25rem', fontSize: '2rem' }}>2048</h3>
        <div style={{ fontSize: '0.95rem', opacity: 0.7 }}>
          Swipe on mobile, or use arrow keys to move
        </div>
      </div>

      <div
        style={{ display: size === 'small' ? 'none' : 'flex', gap: '1.5rem', alignItems: 'center' }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '0.5rem 1rem',
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Score</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{score}</div>
        </div>

        <button
          onClick={resetGame}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 8,
            padding: '0.75rem 1.5rem',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          New Game
        </button>
      </div>

      {/* Board */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          width: boardPx,
          height: boardPx,
          minWidth: boardPx,
          minHeight: boardPx,
          maxWidth: boardPx,
          maxHeight: boardPx,
          position: 'relative',
          background: '#bbada0',
          borderRadius: size === 'small' ? 6 : 12,
          padding: gap,
          touchAction: 'none',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        {/* Background cells */}
        <div
          style={{
            position: 'absolute',
            inset: gap,
            display: 'grid',
            gridTemplateColumns: `repeat(${SETTINGS.gridSize}, ${tileSize}px)`,
            gridTemplateRows: `repeat(${SETTINGS.gridSize}, ${tileSize}px)`,
            gap,
          }}
        >
          {Array.from({ length: SETTINGS.gridSize * SETTINGS.gridSize }).map((_, i) => (
            <div
              key={i}
              style={{
                width: tileSize,
                height: tileSize,
                borderRadius: size === 'small' ? 4 : 8,
                background: getTileColor(null),
              }}
            />
          ))}
        </div>

        {/* Animated tiles */}
        {tilesToRender.map(({ tile, row, col }) => {
          const x = col * (tileSize + gap)
          const y = row * (tileSize + gap)

          const pop = tile.justMerged ? [1, 1.12, 1] : tile.justSpawned ? [0, 1] : 1

          return (
            <motion.div
              key={tile.id}
              initial={{ x, y, scale: tile.justSpawned ? 0 : 1 }}
              animate={{ x, y, scale: pop }}
              transition={{
                duration: SETTINGS.animationDuration / 1000,
                ease: 'easeOut',
                scale: {
                  duration: tile.justMerged
                    ? SETTINGS.animationDuration / 1000
                    : SETTINGS.animationDuration / 2000,
                },
              }}
              style={{
                position: 'absolute',
                left: gap,
                top: gap,
                width: tileSize,
                height: tileSize,
                borderRadius: size === 'small' ? 4 : 8,
                background: getTileColor(tile.value),
                color: getTileTextColor(tile.value),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: tile.value >= 1024 ? fontSize * 0.7 : fontSize,
                fontWeight: 'bold',
                willChange: 'transform',
              }}
            >
              {tile.value}
            </motion.div>
          )
        })}
      </div>

      {/* Win/Lose overlay (large only) */}
      {size === 'large' && (gameOver || hasWon) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 12,
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ background: 'rgba(0,0,0,0.55)', padding: '2rem', borderRadius: 12 }}>
            <h2 style={{ margin: 0, marginBottom: '0.75rem' }}>
              {gameOver ? 'Game Over!' : 'You Win!'}
            </h2>
            <p style={{ margin: 0, marginBottom: '1rem', opacity: 0.9 }}>Final Score: {score}</p>
            <button
              onClick={dismissOverlay}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
                padding: '0.75rem 1.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Okay
            </button>
          </div>
        </motion.div>
      )}

      <div
        style={{
          display: size === 'small' ? 'block' : 'none',
          marginTop: '0.5rem',
          textAlign: 'center',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '1rem' }}>2048</h4>
      </div>
    </div>
  )
}
