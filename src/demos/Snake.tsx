import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '../hooks/useUser'

// ============================================
// DEVELOPER SETTINGS - Easy to tweak
// ============================================
const SETTINGS = {
  cols: 18,
  rows: 24,

  // speed curve
  tickMsStart: 140,
  tickMsMin: 70,
  speedUpEvery: 5, // every N foods, speed up

  swipeThreshold: 40,
  animationMs: 90,

  // Small preview settings
  previewCols: 12,
  previewRows: 16,

  colors: {
    board: 'rgba(255, 255, 255, 0.08)',
    boardBorder: 'rgba(255, 255, 255, 0.18)',
    cell: 'rgba(255,255,255,0.06)',
    snake: 'rgba(255, 255, 255, 0.85)',
    snakeHead: 'rgba(255, 255, 255, 0.95)',
    food: 'rgba(255, 255, 255, 0.75)',
    overlay: 'rgba(0,0,0,0.5)',
    panel: 'rgba(0,0,0,0.55)',
  },
}
// ============================================

type Direction = 'up' | 'down' | 'left' | 'right'
type Point = { x: number; y: number }

interface SnakeProps {
  size: 'small' | 'large'
  score: number
  setScore: (score: number) => void
  gameOver: boolean
  setGameOver: (v: boolean) => void
  // Optional: allow parent to reset any outer state
  onReset?: () => void
}

const keyToDir: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

const isOpposite = (a: Direction, b: Direction) =>
  (a === 'up' && b === 'down') ||
  (a === 'down' && b === 'up') ||
  (a === 'left' && b === 'right') ||
  (a === 'right' && b === 'left')

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function pointsEqual(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y
}

function randInt(max: number) {
  return Math.floor(Math.random() * max)
}

function inBounds(p: Point, cols: number, rows: number) {
  return p.x >= 0 && p.x < cols && p.y >= 0 && p.y < rows
}

function nextPoint(head: Point, dir: Direction): Point {
  if (dir === 'up') return { x: head.x, y: head.y - 1 }
  if (dir === 'down') return { x: head.x, y: head.y + 1 }
  if (dir === 'left') return { x: head.x - 1, y: head.y }
  return { x: head.x + 1, y: head.y }
}

function makeInitialSnake(cols: number, rows: number): Point[] {
  const cx = Math.floor(cols / 2)
  const cy = Math.floor(rows / 2)
  // Head at cy, body below at cy+1, cy+2 so snake can move up
  return [
    { x: cx, y: cy },
    { x: cx, y: cy + 1 },
    { x: cx, y: cy + 2 },
  ]
}

function pickFood(snake: Point[], cols: number, rows: number): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`))
  const free: Point[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  // should never happen unless board is full
  return free.length ? free[randInt(free.length)] : { x: 0, y: 0 }
}

export function Snake({ size, score, setScore, gameOver, setGameOver, onReset }: SnakeProps) {
  const { submitScore } = useUser()

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const submittedRef = useRef(false)

  // Use smaller grid for preview
  const cols = size === 'small' ? SETTINGS.previewCols : SETTINGS.cols
  const rows = size === 'small' ? SETTINGS.previewRows : SETTINGS.rows

  const [snake, setSnake] = useState<Point[]>(() => makeInitialSnake(cols, rows))
  const [food, setFood] = useState<Point>(() => pickFood(makeInitialSnake(cols, rows), cols, rows))
  const [pendingDir, setPendingDir] = useState<Direction>('up')
  const [foodsEaten, setFoodsEaten] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    // When switching size, always reset the outer game state too
    const init = makeInitialSnake(cols, rows)
    setSnake(init)
    setFood(pickFood(init, cols, rows))
    setPendingDir('up')
    setFoodsEaten(0)

    setGameOver(false)
    setScore(0)
    setGameStarted(size === 'large') // start automatically in large, preview stays paused
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  // Submit score once on game over
  useEffect(() => {
    if (!gameOver) {
      submittedRef.current = false
      return
    }
    if (submittedRef.current) return
    submitScore('snake', score)
    submittedRef.current = true
  }, [gameOver, submitScore, score])

  const tickMs = useMemo(() => {
    const steps = Math.floor(foodsEaten / SETTINGS.speedUpEvery)
    return clamp(SETTINGS.tickMsStart - steps * 10, SETTINGS.tickMsMin, SETTINGS.tickMsStart)
  }, [foodsEaten])

  const resetGame = useCallback(() => {
    const init = makeInitialSnake(cols, rows)
    setSnake(init)
    setFood(pickFood(init, cols, rows))
    setPendingDir('up')
    setFoodsEaten(0)

    setScore(0)
    setGameOver(false)

    // restart loop cleanly
    setGameStarted(true)
    requestAnimationFrame(() => setGameStarted(true))

    onReset?.()
  }, [cols, rows, onReset, setGameOver, setScore])

  const requestDir = useCallback(
    (next: Direction) => {
      // prevent instant reversal (also prevents self-collide "turn back" bugs)
      if (isOpposite(pendingDir, next)) return
      setPendingDir(next)
    },
    [pendingDir]
  )

  // Keyboard controls (large only)
  useEffect(() => {
    if (size !== 'large') return

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key
      const d = keyToDir[k]
      if (!d) return
      e.preventDefault()
      requestDir(d)
    }

    window.addEventListener('keydown', onKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [requestDir, size])

  // Game loop
  useEffect(() => {
    // Only run game loop in large mode and after game started
    if (size !== 'large' || gameOver || !gameStarted) return

    const id = window.setInterval(() => {
      setSnake((prev) => {
        // apply pending direction once per tick
        const d = pendingDir

        const head = prev[0]
        const np = nextPoint(head, d)

        // wall collision
        if (!inBounds(np, cols, rows)) {
          setGameOver(true)
          return prev
        }

        // self collision (allow moving into the tail ONLY if we're not growing this tick)
        const willEat = pointsEqual(np, food)
        const bodyToCheck = willEat ? prev : prev.slice(0, -1)
        if (bodyToCheck.some((p) => pointsEqual(p, np))) {
          setGameOver(true)
          return prev
        }

        const nextSnake = [np, ...prev]
        if (!willEat) nextSnake.pop()

        if (willEat) {
          // scoring
          setFoodsEaten((n) => n + 1)
          setScore(score + 1)

          // new food
          const newFood = pickFood(nextSnake, cols, rows)
          setFood(newFood)
        }

        return nextSnake
      })
    }, tickMs)

    return () => window.clearInterval(id)
  }, [
    cols,
    rows,
    food,
    gameOver,
    gameStarted,
    pendingDir,
    score,
    setGameOver,
    setScore,
    size,
    tickMs,
  ])

  // Touch controls (swipe)
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

    if (Math.abs(dx) > Math.abs(dy)) requestDir(dx > 0 ? 'right' : 'left')
    else requestDir(dy > 0 ? 'down' : 'up')
  }

  // Visual sizing (match your 2048 pattern)
  const cellPx = size === 'small' ? 12 : 22
  const gap = size === 'small' ? 2 : 4

  const boardW = cols * cellPx + (cols + 1) * gap
  const boardH = rows * cellPx + (rows + 1) * gap

  const head = snake[0]

  const snakeKeySet = useMemo(() => {
    const set = new Set<string>()
    for (const p of snake) set.add(`${p.x},${p.y}`)
    return set
  }, [snake])

  return (
    <div
      style={{
        position: 'relative',
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
        <h3 style={{ margin: 0, marginBottom: '0.25rem', fontSize: '2rem' }}>Snake</h3>
        <div style={{ fontSize: '0.95rem', opacity: 0.7 }}>
          Swipe on mobile, or use arrow keys / WASD
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
          width: boardW,
          height: boardH,
          minWidth: boardW,
          minHeight: boardH,
          maxWidth: boardW,
          maxHeight: boardH,
          position: 'relative',
          borderRadius: size === 'small' ? 8 : 14,
          background: SETTINGS.colors.board,
          border: `1px solid ${SETTINGS.colors.boardBorder}`,
          padding: gap,
          touchAction: 'none',
          boxSizing: 'border-box',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: 'absolute',
            inset: gap,
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellPx}px)`,
            gap,
            opacity: 0.9,
          }}
        >
          {Array.from({ length: cols * rows }).map((_, i) => (
            <div
              key={i}
              style={{
                width: cellPx,
                height: cellPx,
                borderRadius: size === 'small' ? 3 : 6,
                background: SETTINGS.colors.cell,
              }}
            />
          ))}
        </div>

        {/* Food */}
        <motion.div
          key={`food-${food.x}-${food.y}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: SETTINGS.animationMs / 1000 }}
          style={{
            position: 'absolute',
            left: gap + food.x * (cellPx + gap),
            top: gap + food.y * (cellPx + gap),
            width: cellPx,
            height: cellPx,
            borderRadius: size === 'small' ? 3 : 6,
            background: SETTINGS.colors.food,
          }}
        />

        {/* Snake segments */}
        {snake.map((p, idx) => {
          const isHead = idx === 0
          return (
            <motion.div
              key={`${p.x},${p.y},${idx}`}
              initial={false}
              animate={{
                x: p.x * (cellPx + gap),
                y: p.y * (cellPx + gap),
                scale: isHead ? 1.02 : 1,
              }}
              transition={{
                duration: SETTINGS.animationMs / 1000,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                left: gap,
                top: gap,
                width: cellPx,
                height: cellPx,
                borderRadius: size === 'small' ? 3 : 6,
                background: isHead ? SETTINGS.colors.snakeHead : SETTINGS.colors.snake,
                boxShadow: isHead ? '0 6px 16px rgba(0,0,0,0.25)' : undefined,
                willChange: 'transform',
              }}
            />
          )
        })}

        {/* Game over overlay (large only) */}
        {size === 'large' && gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: SETTINGS.colors.overlay,
              borderRadius: 14,
              textAlign: 'center',
              padding: '2rem',
            }}
          >
            <div style={{ background: SETTINGS.colors.panel, padding: '2rem', borderRadius: 12 }}>
              <h2 style={{ margin: 0, marginBottom: '0.75rem' }}>Game Over!</h2>
              <p style={{ margin: 0, marginBottom: '1rem', opacity: 0.9 }}>Final Score: {score}</p>
              <button
                onClick={resetGame}
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
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Small mode footer */}
      <div
        style={{
          display: size === 'small' ? 'block' : 'none',
          marginTop: '0.5rem',
          textAlign: 'center',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '1rem' }}>Snake</h4>
        <div style={{ fontSize: '0.85rem', opacity: 0.75 }}>
          Score: {score} {snakeKeySet.has(`${head?.x},${head?.y}`) ? '' : ''}
        </div>
      </div>
    </div>
  )
}
