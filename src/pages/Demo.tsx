import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NoughtsAndCrosses } from '../demos/NoughtsAndCrosses'
import { TwoZeroFourEight, type Grid } from '../demos/TwoZeroFourEight'
import { SortingVisualizer } from '../demos/sortingVisualiser'
import { PathfindingVisualizer } from '../demos/pathfindingVisualiser'
import Sudoku from '../demos/Sudoku'

type Player = 'X' | 'O' | null

export function Demo() {
  const [selectedDemo, setSelectedDemo] = useState<number | null>(null)
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState(true)
  const [playerStarts, setPlayerStarts] = useState(true)
  const [scores, setScores] = useState({ player: 0, ai: 0 })

  // 2048 game state
  const [grid2048, setGrid2048] = useState<Grid>(() => {
    const newGrid: Grid = Array(4)
      .fill(null)
      .map(() => Array(4).fill(null))
    let idCounter = 1
    const addTile = (g: Grid) => {
      const empty: [number, number][] = []
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (g[r][c] === null) empty.push([r, c])
        }
      }
      if (empty.length > 0) {
        const [r, c] = empty[Math.floor(Math.random() * empty.length)]
        g[r][c] = { id: idCounter++, value: Math.random() < 0.1 ? 4 : 2, justSpawned: true }
      }
    }
    addTile(newGrid)
    addTile(newGrid)
    return newGrid
  })
  const [score2048, setScore2048] = useState(0)
  const [gameOver2048, setGameOver2048] = useState(false)
  const [hasWon2048, setHasWon2048] = useState(false)

  const handleClose = () => setSelectedDemo(null)

  useEffect(() => {
    if (selectedDemo === null) return

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedDemo])

  return (
    <section
      id="demo"
      className="demo"
      style={{ padding: '4rem 2rem', maxWidth: 800, margin: '0 auto 2rem auto' }}
    >
      <h2 style={{ textAlign: 'center' }}>Minigames</h2>

      <div
        className="grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem',
        }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key="noughts-and-crosses"
            layoutId="demo-card-0"
            whileHover={selectedDemo !== 0 ? { scale: 1.05, transition: { duration: 0.2 } } : {}}
            onClick={() => selectedDemo !== 0 && setSelectedDemo(0)}
            style={{
              background: '#454545ff',
              borderRadius: 12,
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              cursor: selectedDemo !== 0 ? 'pointer' : 'default',
              minHeight: '240px',
              aspectRatio: '1 / 1',
              opacity: selectedDemo === 0 ? 0 : 1,
              pointerEvents: selectedDemo === 0 ? 'none' : 'auto',
            }}
          >
            <NoughtsAndCrosses
              size="small"
              board={board}
              setBoard={setBoard}
              isXNext={isXNext}
              setIsXNext={setIsXNext}
              playerStarts={playerStarts}
              setPlayerStarts={setPlayerStarts}
              scores={scores}
              setScores={setScores}
            />
          </motion.div>
          <motion.div
            key="2048"
            layoutId="demo-card-1"
            whileHover={selectedDemo !== 1 ? { scale: 1.05, transition: { duration: 0.2 } } : {}}
            onClick={() => selectedDemo !== 1 && setSelectedDemo(1)}
            style={{
              background: '#454545ff',
              borderRadius: 12,
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              cursor: selectedDemo !== 1 ? 'pointer' : 'default',
              minHeight: '240px',
              aspectRatio: '1 / 1',
              opacity: selectedDemo === 1 ? 0 : 1,
              pointerEvents: selectedDemo === 1 ? 'none' : 'auto',
            }}
          >
            <TwoZeroFourEight
              size="small"
              grid={grid2048}
              setGrid={setGrid2048}
              score={score2048}
              setScore={setScore2048}
              gameOver={gameOver2048}
              setGameOver={setGameOver2048}
              hasWon={hasWon2048}
              setHasWon={setHasWon2048}
            />
          </motion.div>
          <motion.div
            key="sorting"
            layoutId="demo-card-2"
            whileHover={selectedDemo !== 2 ? { scale: 1.05, transition: { duration: 0.2 } } : {}}
            onClick={() => selectedDemo !== 2 && setSelectedDemo(2)}
            style={{
              background: '#454545ff',
              borderRadius: 12,
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              cursor: selectedDemo !== 2 ? 'pointer' : 'default',
              minHeight: '240px',
              aspectRatio: '1 / 1',
              opacity: selectedDemo === 2 ? 0 : 1,
              pointerEvents: selectedDemo === 2 ? 'none' : 'auto',
            }}
          >
            <SortingVisualizer size="small" />
          </motion.div>
          <motion.div
            key="pathfinding"
            layoutId="demo-card-3"
            whileHover={selectedDemo !== 3 ? { scale: 1.05, transition: { duration: 0.2 } } : {}}
            onClick={() => selectedDemo !== 3 && setSelectedDemo(3)}
            style={{
              background: '#454545ff',
              borderRadius: 12,
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              cursor: selectedDemo !== 3 ? 'pointer' : 'default',
              minHeight: '240px',
              aspectRatio: '1 / 1',
              opacity: selectedDemo === 3 ? 0 : 1,
              pointerEvents: selectedDemo === 3 ? 'none' : 'auto',
            }}
          >
            <PathfindingVisualizer size="small" />
          </motion.div>
          <motion.div
            key="sudoku"
            layoutId="demo-card-4"
            whileHover={selectedDemo !== 4 ? { scale: 1.05, transition: { duration: 0.2 } } : {}}
            onClick={() => selectedDemo !== 4 && setSelectedDemo(4)}
            style={{
              background: '#454545ff',
              borderRadius: 12,
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              cursor: selectedDemo !== 4 ? 'pointer' : 'default',
              minHeight: '240px',
              aspectRatio: '1 / 1',
              opacity: selectedDemo === 4 ? 0 : 1,
              pointerEvents: selectedDemo === 4 ? 'none' : 'auto',
            }}
          >
            <Sudoku size="small" />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {selectedDemo !== null && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                maxWidth: 'calc(100vw - 4rem)',
                maxHeight: 'calc(100vh - 4rem)',
              }}
            >
              <motion.div
                layoutId={`demo-card-${selectedDemo}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#454545ff',
                  borderRadius: 12,
                  padding: '3rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  cursor: 'default',
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                }}
              >
                <button
                  onClick={handleClose}
                  style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 8,
                    padding: '0.5rem 1rem',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  ✕ Close
                </button>

                {selectedDemo === 0 && (
                  <NoughtsAndCrosses
                    size="large"
                    board={board}
                    setBoard={setBoard}
                    isXNext={isXNext}
                    setIsXNext={setIsXNext}
                    playerStarts={playerStarts}
                    setPlayerStarts={setPlayerStarts}
                    scores={scores}
                    setScores={setScores}
                  />
                )}

                {selectedDemo === 1 && (
                  <TwoZeroFourEight
                    size="large"
                    grid={grid2048}
                    setGrid={setGrid2048}
                    score={score2048}
                    setScore={setScore2048}
                    gameOver={gameOver2048}
                    setGameOver={setGameOver2048}
                    hasWon={hasWon2048}
                    setHasWon={setHasWon2048}
                  />
                )}

                {selectedDemo === 2 && <SortingVisualizer />}

                {selectedDemo === 3 && <PathfindingVisualizer />}

                {selectedDemo === 4 && <Sudoku />}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
