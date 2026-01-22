import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '../hooks/useUser'

const SETTINGS = {
  minBars: 10,
  maxBars: 120,
  maxBarsExtended: 500,
  defaultBars: 40,

  minValue: 2,
  maxValue: 200,

  defaultAlgo: 'bubble' as AlgorithmKey,
  defaultSpeedMs: 25,
  animationDurationMs: 120,

  colors: {
    bar: 'rgba(255,255,255,0.75)',
    active: '#ffd166',
    comparing: '#8ecae6',
    sorted: '#06d6a0',
    panel: 'rgba(255,255,255,0.08)',
    panelBorder: 'rgba(255,255,255,0.18)',
    bg: 'rgba(0,0,0,0.35)',
  },
}

type AlgorithmKey = 'bubble' | 'insertion' | 'selection' | 'quick' | 'merge'

type Step = {
  values: number[]
  active?: number[]
  comparing?: number[]
  sortedUpto?: number
  sortedFromEnd?: number
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

function makeRandomArray(count: number) {
  return Array.from({ length: count }, () => randInt(SETTINGS.minValue, SETTINGS.maxValue))
}

function useIsMobile(breakpointPx = 900) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth < breakpointPx
  })

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpointPx)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpointPx])

  return isMobile
}

function bubbleSteps(input: number[]): Step[] {
  const a = [...input]
  const steps: Step[] = [{ values: [...a] }]
  const n = a.length
  for (let end = n - 1; end > 0; end--) {
    let swapped = false
    for (let i = 0; i < end; i++) {
      steps.push({ values: [...a], comparing: [i, i + 1], sortedFromEnd: n - 1 - end })
      if (a[i] > a[i + 1]) {
        ;[a[i], a[i + 1]] = [a[i + 1], a[i]]
        swapped = true
        steps.push({ values: [...a], active: [i, i + 1], sortedFromEnd: n - 1 - end })
      }
    }
    steps.push({ values: [...a], sortedFromEnd: n - end })
    if (!swapped) break
  }
  steps.push({ values: [...a], sortedFromEnd: a.length })
  return steps
}

function selectionSteps(input: number[]): Step[] {
  const a = [...input]
  const steps: Step[] = [{ values: [...a] }]
  const n = a.length
  for (let end = n - 1; end > 0; end--) {
    let maxIdx = 0
    for (let i = 1; i <= end; i++) {
      steps.push({ values: [...a], comparing: [maxIdx, i], sortedFromEnd: n - 1 - end })
      if (a[i] > a[maxIdx]) maxIdx = i
    }
    if (maxIdx !== end) {
      steps.push({ values: [...a], active: [maxIdx, end], sortedFromEnd: n - 1 - end })
      ;[a[maxIdx], a[end]] = [a[end], a[maxIdx]]
      steps.push({ values: [...a], active: [maxIdx, end], sortedFromEnd: n - 1 - end })
    }
    steps.push({ values: [...a], sortedFromEnd: n - end })
  }
  steps.push({ values: [...a], sortedFromEnd: a.length })
  return steps
}

function insertionSteps(input: number[]): Step[] {
  const a = [...input]
  const steps: Step[] = [{ values: [...a], sortedUpto: 1 }]
  const n = a.length
  for (let i = 1; i < n; i++) {
    const key = a[i]
    let j = i - 1
    steps.push({ values: [...a], active: [i], sortedUpto: i })
    while (j >= 0 && a[j] > key) {
      steps.push({ values: [...a], comparing: [j, j + 1], sortedUpto: i })
      a[j + 1] = a[j]
      steps.push({ values: [...a], active: [j, j + 1], sortedUpto: i })
      j--
    }
    a[j + 1] = key
    steps.push({ values: [...a], active: [j + 1], sortedUpto: i + 1 })
  }
  steps.push({ values: [...a], sortedUpto: a.length })
  return steps
}

function quickSteps(input: number[]): Step[] {
  const a = [...input]
  const steps: Step[] = [{ values: [...a] }]

  const swap = (i: number, j: number) => {
    if (i === j) return
    ;[a[i], a[j]] = [a[j], a[i]]
    steps.push({ values: [...a], active: [i, j] })
  }

  const partition = (lo: number, hi: number) => {
    const pivot = a[hi]
    let i = lo
    for (let j = lo; j < hi; j++) {
      steps.push({ values: [...a], comparing: [j, hi], active: [i] })
      if (a[j] < pivot) {
        swap(i, j)
        i++
      }
    }
    swap(i, hi)
    return i
  }

  const qs = (lo: number, hi: number) => {
    if (lo >= hi) return
    const p = partition(lo, hi)
    qs(lo, p - 1)
    qs(p + 1, hi)
  }

  qs(0, a.length - 1)
  steps.push({ values: [...a], sortedUpto: a.length })
  return steps
}

function mergeSteps(input: number[]): Step[] {
  const a = [...input]
  const steps: Step[] = [{ values: [...a] }]

  const aux = [...a]

  const merge = (lo: number, mid: number, hi: number) => {
    // copy range
    for (let k = lo; k <= hi; k++) aux[k] = a[k]

    let i = lo
    let j = mid + 1

    for (let k = lo; k <= hi; k++) {
      if (i > mid) {
        a[k] = aux[j++]
        steps.push({ values: [...a], active: [k], comparing: [k] })
      } else if (j > hi) {
        a[k] = aux[i++]
        steps.push({ values: [...a], active: [k], comparing: [k] })
      } else {
        steps.push({ values: [...a], comparing: [i, j] })
        if (aux[j] < aux[i]) {
          a[k] = aux[j++]
        } else {
          a[k] = aux[i++]
        }
        steps.push({ values: [...a], active: [k] })
      }
    }
  }

  const ms = (lo: number, hi: number) => {
    if (lo >= hi) return
    const mid = Math.floor((lo + hi) / 2)
    ms(lo, mid)
    ms(mid + 1, hi)
    merge(lo, mid, hi)
  }

  ms(0, a.length - 1)
  steps.push({ values: [...a], sortedUpto: a.length })
  return steps
}

function buildSteps(algo: AlgorithmKey, values: number[]): Step[] {
  switch (algo) {
    case 'bubble':
      return bubbleSteps(values)
    case 'insertion':
      return insertionSteps(values)
    case 'selection':
      return selectionSteps(values)
    case 'quick':
      return quickSteps(values)
    case 'merge':
      return mergeSteps(values)
    default:
      return bubbleSteps(values)
  }
}

interface SortingVisualizerProps {
  size?: 'small' | 'large'
}

export function SortingVisualizer({ size = 'large' }: SortingVisualizerProps) {
  const isMobile = useIsMobile(900)

  const [barCount, setBarCount] = useState(SETTINGS.defaultBars)
  const [algo, setAlgo] = useState<AlgorithmKey>(SETTINGS.defaultAlgo)
  const [speedMs, setSpeedMs] = useState(SETTINGS.defaultSpeedMs)
  const [moreBarsMode, setMoreBarsMode] = useState(false)

  const [values, setValues] = useState<number[]>(() => makeRandomArray(SETTINGS.defaultBars))
  const [isSorting, setIsSorting] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [steps, setSteps] = useState<Step[] | null>(null)

  const timerRef = useRef<number | null>(null)
  const { submitScore } = useUser()
  const submittedRef = useRef(false)

  const currentStep = useMemo<Step>(() => {
    if (!steps || steps.length === 0) return { values }
    return steps[clamp(stepIndex, 0, steps.length - 1)]
  }, [stepIndex, steps, values])

  const liveValues = currentStep.values

  // Submit score when sorting is finished
  useEffect(() => {
    if (!steps || steps.length === 0 || isSorting) {
      submittedRef.current = false
      return
    }

    // Check if we've reached the end (sorting is complete)
    if (stepIndex >= steps.length - 1) {
      if (submittedRef.current) return

      // Submit the number of steps as the score
      submitScore('sorting', steps.length)
      submittedRef.current = true
    }
  }, [steps, stepIndex, isSorting, submitScore])

  const stop = useCallback(() => {
    setIsSorting(false)
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => stop, [stop])

  const shuffle = useCallback(() => {
    stop()
    const next = makeRandomArray(barCount)
    setSteps(null)
    setStepIndex(0)
    setValues(next)
  }, [barCount, stop])

  useEffect(() => {
    if (isSorting) return

    const timer = window.setTimeout(() => {
      setValues((currentValues) => {
        if (currentValues.length === barCount) return currentValues

        if (barCount > currentValues.length) {
          return [...currentValues, ...makeRandomArray(barCount - currentValues.length)]
        } else {
          return currentValues.slice(0, barCount)
        }
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [barCount, isSorting])

  const sort = useCallback(() => {
    if (isSorting) return

    if (steps && steps.length > 0 && stepIndex < steps.length - 1) {
      setIsSorting(true)
      return
    }

    const built = buildSteps(algo, values)
    setSteps(built)
    setStepIndex(0)
    setIsSorting(true)
  }, [algo, isSorting, values, steps, stepIndex])

  useEffect(() => {
    if (!isSorting || !steps || steps.length === 0) return

    if (stepIndex >= steps.length - 1) {
      const timer = window.setTimeout(() => setIsSorting(false), 0)
      return () => window.clearTimeout(timer)
    }

    let stepIncrement = 1
    let delay = speedMs

    if (speedMs === 0) {
      stepIncrement = Math.max(1, Math.floor(steps.length / 50))
      delay = 1
    } else if (speedMs <= 3) {
      stepIncrement = Math.max(1, Math.floor(steps.length / 200))
      delay = speedMs
    } else if (speedMs <= 10) {
      stepIncrement = Math.max(1, Math.floor(steps.length / 500))
      delay = speedMs
    }

    timerRef.current = window.setTimeout(() => {
      setStepIndex((i) => Math.min(i + stepIncrement, steps.length - 1))
    }, delay)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [isSorting, speedMs, stepIndex, steps])

  const max = useMemo(() => Math.max(...liveValues, 1), [liveValues])

  const activeSet = useMemo(() => new Set(currentStep.active ?? []), [currentStep.active])
  const comparingSet = useMemo(() => new Set(currentStep.comparing ?? []), [currentStep.comparing])

  const algoLabel: Record<AlgorithmKey, string> = {
    bubble: 'Bubble Sort',
    insertion: 'Insertion Sort',
    selection: 'Selection Sort',
    quick: 'Quick Sort',
    merge: 'Merge Sort',
  }

  const maxBarsLimit = moreBarsMode ? SETTINGS.maxBarsExtended : SETTINGS.maxBars

  if (size === 'small') {
    const previewValues = [85, 45, 65, 25, 95, 35, 55, 75]
    const maxPreview = 100

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 6,
            height: 120,
            width: '100%',
            padding: '0 1rem',
          }}
        >
          {previewValues.map((v, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                maxWidth: 20,
                height: `${(v / maxPreview) * 100}%`,
                background: i === 2 || i === 5 ? SETTINGS.colors.comparing : SETTINGS.colors.bar,
                borderRadius: 4,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>Sorting Visualizer</div>
      </div>
    )
  }

  const containerDir = isMobile ? 'column' : 'row'
  const controlsWidth = isMobile ? '100%' : 360
  const vizMinHeight = isMobile ? 200 : 420

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        userSelect: 'none',
        display: 'flex',
        flexDirection: containerDir as 'row' | 'column',
        gap: isMobile ? 12 : 18,
        padding: isMobile ? 12 : 16,
        boxSizing: 'border-box',
        overflow: isMobile ? 'auto' : 'hidden',
      }}
    >
      <div
        style={{
          width: controlsWidth,
          flex: isMobile ? '0 0 auto' : '0 0 auto',
          background: SETTINGS.colors.panel,
          border: `1px solid ${SETTINGS.colors.panelBorder}`,
          borderRadius: 12,
          padding: 14,
          boxSizing: 'border-box',
          backdropFilter: 'blur(6px)',
          maxHeight: isMobile ? 'none' : '100%',
          overflowY: isMobile ? 'visible' : 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Sorting Visualizer</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{algoLabel[algo]}</div>
        </div>

        <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
          <div
            style={{
              background: moreBarsMode ? 'rgba(255, 193, 7, 0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${moreBarsMode ? 'rgba(255, 193, 7, 0.3)' : SETTINGS.colors.panelBorder}`,
              borderRadius: 8,
              padding: 10,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: isSorting ? 'not-allowed' : 'pointer',
                opacity: isSorting ? 0.6 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={moreBarsMode}
                disabled={isSorting}
                onChange={(e) => {
                  const enabled = e.target.checked
                  setMoreBarsMode(enabled)
                  if (!enabled && barCount > SETTINGS.maxBars) {
                    setBarCount(SETTINGS.maxBars)
                  }
                }}
                style={{ cursor: isSorting ? 'not-allowed' : 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>More Bars Mode</div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>
                  Allow up to 500 bars
                </div>
              </div>
            </label>
            {moreBarsMode && (
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  background: 'rgba(255, 193, 7, 0.15)',
                  borderRadius: 6,
                  fontSize: 11,
                  lineHeight: 1.4,
                  color: '#ffc107',
                }}
              >
                ⚠️ Warning: High bar counts may cause performance issues and longer sort times,
                especially on mobile devices.
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 13, opacity: 0.85 }}>Bars</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{barCount}</div>
            </div>
            <input
              type="range"
              min={SETTINGS.minBars}
              max={maxBarsLimit}
              value={barCount}
              disabled={isSorting}
              onChange={(e) => setBarCount(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Algorithm</div>
            <select
              value={algo}
              disabled={isSorting}
              onChange={(e) => setAlgo(e.target.value as AlgorithmKey)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(0,0,0,0.25)',
                color: 'white',
                border: `1px solid ${SETTINGS.colors.panelBorder}`,
                outline: 'none',
              }}
            >
              {Object.keys(algoLabel).map((k) => (
                <option key={k} value={k} style={{ color: 'black' }}>
                  {algoLabel[k as AlgorithmKey]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 13, opacity: 0.85 }}>Animation Time</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {speedMs === 0 ? 'instant' : `${speedMs}ms`}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={120}
              value={speedMs}
              onChange={(e) => setSpeedMs(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
              Tip: 0ms = instant, higher = slower
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr',
              gap: 10,
            }}
          >
            <button
              onClick={shuffle}
              disabled={isSorting}
              style={{
                padding: '12px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.10)',
                border: `1px solid ${SETTINGS.colors.panelBorder}`,
                color: 'white',
                fontWeight: 800,
                cursor: isSorting ? 'not-allowed' : 'pointer',
              }}
            >
              Shuffle
            </button>

            <button
              onClick={sort}
              disabled={isSorting}
              style={{
                padding: '12px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.16)',
                border: `1px solid ${SETTINGS.colors.panelBorder}`,
                color: 'white',
                fontWeight: 900,
                cursor: isSorting ? 'not-allowed' : 'pointer',
              }}
            >
              Sort
            </button>

            <button
              onClick={stop}
              disabled={!isSorting}
              style={{
                gridColumn: '1 / -1',
                padding: '12px 12px',
                borderRadius: 10,
                background: 'rgba(0,0,0,0.25)',
                border: `1px solid ${SETTINGS.colors.panelBorder}`,
                color: 'white',
                fontWeight: 800,
                cursor: !isSorting ? 'not-allowed' : 'pointer',
                opacity: !isSorting ? 0.55 : 1,
              }}
            >
              Stop
            </button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {steps ? `Step ${Math.min(stepIndex + 1, steps.length)} / ${steps.length}` : 'Ready'}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: vizMinHeight,
          maxHeight: isMobile ? 'none' : '100%',
          width: '100%',
          background: SETTINGS.colors.bg,
          border: `1px solid ${SETTINGS.colors.panelBorder}`,
          borderRadius: 12,
          padding: isMobile ? 10 : 12,
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            {isMobile ? 'Mobile view' : 'Desktop view'} • Bars animate with layout
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{isSorting ? 'Sorting…' : 'Idle'}</div>
        </div>

        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: isMobile ? 150 : 200,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            padding: isMobile ? 8 : 10,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'flex-end',
            gap: Math.max(2, Math.floor(12 - barCount / 12)),
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
          {liveValues.map((v, i) => {
            const heightPct = (v / max) * 100

            const isActive = activeSet.has(i)
            const isComparing = comparingSet.has(i)

            const sortedFromEnd =
              currentStep.sortedFromEnd != null
                ? i >= liveValues.length - currentStep.sortedFromEnd
                : false
            const sortedUpto = currentStep.sortedUpto != null ? i < currentStep.sortedUpto : false
            const isSorted = sortedFromEnd || sortedUpto

            const bg = isSorted
              ? SETTINGS.colors.sorted
              : isActive
                ? SETTINGS.colors.active
                : isComparing
                  ? SETTINGS.colors.comparing
                  : SETTINGS.colors.bar

            return (
              <motion.div
                key={i}
                layout
                transition={{
                  duration: SETTINGS.animationDurationMs / 1000,
                  ease: 'easeOut',
                }}
                style={{
                  flex: 1,
                  height: `${heightPct}%`,
                  borderRadius: 8,
                  background: bg,
                  minWidth: 2,
                  maxWidth: 26,
                  alignSelf: 'flex-end',
                  willChange: 'transform,height',
                  boxShadow: isActive ? '0 0 0 2px rgba(255,255,255,0.25) inset' : 'none',
                }}
                title={`Index ${i}: ${v}`}
              />
            )
          })}
        </div>

        <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.35, flexShrink: 0 }}>
          Tap <b>Shuffle</b>, pick an algorithm, then hit <b>Sort</b>. Scroll horizontally if bars
          go off-screen. {isMobile && 'Page scrolls vertically to see all controls.'}
        </div>
      </div>
    </div>
  )
}
