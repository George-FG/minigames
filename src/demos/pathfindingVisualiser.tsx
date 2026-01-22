import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useTrafficSimulation } from './trafficSimulation'
import { useUser } from '../hooks/useUser'

// ============================================
// DEVELOPER SETTINGS - Easy to tweak
// ============================================
const SETTINGS = {
  defaultAlgo: 'dijkstra' as AlgorithmKey,
  defaultSpeedMs: 35, // 0 = instant-ish, lower = faster
  animationDurationMs: 140,

  // Grid generation settings
  gridGeneration: {
    numNodes: 40, // Number of nodes to generate
    minEdgesPerNode: 1, // Minimum edges connected to each node (road network style)
    maxEdgesPerNode: 5, // Maximum edges connected to each node
    maxEdgeDistance: 20, // Maximum distance for edge connections
    minNodeSpacing: 10, // Minimum distance between nodes
  },

  // Large grid settings (desktop only)
  largeGridGeneration: {
    numNodes: 200, // Many more nodes for large grid
    minEdgesPerNode: 1,
    maxEdgesPerNode: 5,
    maxEdgeDistance: 12,
    minNodeSpacing: 3, // Reduced to allow denser packing at 500 nodes
  },

  // A larger city-like network with many nodes and paths
  // Coordinates are 0..100 (we scale to SVG size)
  // Random, non-uniform layout to resemble a real road network
  network: {
    nodes: [
      // North area
      { id: 'N1', x: 3, y: 2 },
      { id: 'N2', x: 11, y: 5 },
      { id: 'N3', x: 23, y: 3 },
      { id: 'N4', x: 36, y: 7 },
      { id: 'N5', x: 41, y: 4 },
      { id: 'N6', x: 52, y: 6 },
      { id: 'N7', x: 64, y: 2 },
      { id: 'N8', x: 73, y: 8 },
      { id: 'N9', x: 81, y: 5 },
      { id: 'N10', x: 89, y: 3 },
      { id: 'N11', x: 96, y: 7 },
      // Upper area
      { id: 'U1', x: 6, y: 12 },
      { id: 'U2', x: 15, y: 16 },
      { id: 'U3', x: 19, y: 11 },
      { id: 'U4', x: 28, y: 14 },
      { id: 'U5', x: 37, y: 17 },
      { id: 'U6', x: 46, y: 13 },
      { id: 'U7', x: 55, y: 19 },
      { id: 'U8', x: 61, y: 15 },
      { id: 'U9', x: 72, y: 18 },
      { id: 'U10', x: 78, y: 12 },
      { id: 'U11', x: 87, y: 16 },
      { id: 'U12', x: 94, y: 14 },
      // Central area (denser)
      { id: 'C1', x: 4, y: 24 },
      { id: 'C2', x: 12, y: 28 },
      { id: 'C3', x: 18, y: 23 },
      { id: 'C4', x: 26, y: 26 },
      { id: 'C5', x: 31, y: 22 },
      { id: 'C6', x: 39, y: 29 },
      { id: 'C7', x: 44, y: 25 },
      { id: 'C8', x: 51, y: 27 },
      { id: 'C9', x: 58, y: 24 },
      { id: 'C10', x: 66, y: 28 },
      { id: 'C11', x: 73, y: 26 },
      { id: 'C12', x: 81, y: 23 },
      { id: 'C13', x: 89, y: 27 },
      { id: 'C14', x: 95, y: 25 },
      // Middle area
      { id: 'M1', x: 7, y: 35 },
      { id: 'M2', x: 14, y: 39 },
      { id: 'M3', x: 21, y: 33 },
      { id: 'M4', x: 29, y: 37 },
      { id: 'M5', x: 36, y: 35 },
      { id: 'M6', x: 43, y: 40 },
      { id: 'M7', x: 50, y: 36 },
      { id: 'M8', x: 59, y: 38 },
      { id: 'M9', x: 67, y: 34 },
      { id: 'M10', x: 75, y: 39 },
      { id: 'M11', x: 83, y: 37 },
      { id: 'M12', x: 91, y: 35 },
      // Lower area
      { id: 'L1', x: 5, y: 46 },
      { id: 'L2', x: 13, y: 49 },
      { id: 'L3', x: 22, y: 44 },
      { id: 'L4', x: 30, y: 48 },
      { id: 'L5', x: 38, y: 46 },
      { id: 'L6', x: 47, y: 50 },
      { id: 'L7', x: 54, y: 47 },
      { id: 'L8', x: 63, y: 49 },
      { id: 'L9', x: 71, y: 45 },
      { id: 'L10', x: 79, y: 48 },
      { id: 'L11', x: 88, y: 46 },
      { id: 'L12', x: 96, y: 50 },
      // South area
      { id: 'S1', x: 8, y: 55 },
      { id: 'S2', x: 16, y: 58 },
      { id: 'S3', x: 25, y: 54 },
      { id: 'S4', x: 34, y: 57 },
      { id: 'S5', x: 42, y: 56 },
      { id: 'S6', x: 51, y: 59 },
      { id: 'S7', x: 60, y: 55 },
      { id: 'S8', x: 69, y: 58 },
      { id: 'S9', x: 77, y: 54 },
      { id: 'S10', x: 86, y: 57 },
      { id: 'S11', x: 94, y: 56 },
    ],
    edges: [
      // Main arteries - sparse long connections
      { id: 'N1-U1', from: 'N1', to: 'U1' },
      { id: 'N3-U3', from: 'N3', to: 'U3' },
      { id: 'N6-U7', from: 'N6', to: 'U7' },
      { id: 'N8-U9', from: 'N8', to: 'U9' },
      { id: 'N11-U12', from: 'N11', to: 'U12' },

      { id: 'U1-C1', from: 'U1', to: 'C1' },
      { id: 'U3-C3', from: 'U3', to: 'C3' },
      { id: 'U6-C7', from: 'U6', to: 'C7' },
      { id: 'U9-C11', from: 'U9', to: 'C11' },
      { id: 'U12-C14', from: 'U12', to: 'C14' },

      { id: 'C1-M1', from: 'C1', to: 'M1' },
      { id: 'C4-M4', from: 'C4', to: 'M4' },
      { id: 'C7-M7', from: 'C7', to: 'M7' },
      { id: 'C10-M9', from: 'C10', to: 'M9' },
      { id: 'C13-M12', from: 'C13', to: 'M12' },

      { id: 'M2-L2', from: 'M2', to: 'L2' },
      { id: 'M5-L5', from: 'M5', to: 'L5' },
      { id: 'M7-L7', from: 'M7', to: 'L7' },
      { id: 'M10-L10', from: 'M10', to: 'L10' },
      { id: 'M12-L12', from: 'M12', to: 'L12' },

      { id: 'L1-S1', from: 'L1', to: 'S1' },
      { id: 'L3-S3', from: 'L3', to: 'S3' },
      { id: 'L6-S6', from: 'L6', to: 'S6' },
      { id: 'L9-S9', from: 'L9', to: 'S9' },
      { id: 'L11-S10', from: 'L11', to: 'S10' },

      // North local roads
      { id: 'N1-N2', from: 'N1', to: 'N2' },
      { id: 'N2-N3', from: 'N2', to: 'N3' },
      { id: 'N4-N5', from: 'N4', to: 'N5' },
      { id: 'N5-N6', from: 'N5', to: 'N6' },
      { id: 'N7-N8', from: 'N7', to: 'N8' },
      { id: 'N9-N10', from: 'N9', to: 'N10' },
      { id: 'N10-N11', from: 'N10', to: 'N11' },

      // Upper local roads
      { id: 'U1-U2', from: 'U1', to: 'U2' },
      { id: 'U2-U3', from: 'U2', to: 'U3' },
      { id: 'U4-U5', from: 'U4', to: 'U5' },
      { id: 'U5-U6', from: 'U5', to: 'U6' },
      { id: 'U7-U8', from: 'U7', to: 'U8' },
      { id: 'U9-U10', from: 'U9', to: 'U10' },
      { id: 'U11-U12', from: 'U11', to: 'U12' },

      // Central local roads (denser)
      { id: 'C1-C2', from: 'C1', to: 'C2' },
      { id: 'C2-C3', from: 'C2', to: 'C3' },
      { id: 'C3-C4', from: 'C3', to: 'C4' },
      { id: 'C4-C5', from: 'C4', to: 'C5' },
      { id: 'C6-C7', from: 'C6', to: 'C7' },
      { id: 'C7-C8', from: 'C7', to: 'C8' },
      { id: 'C8-C9', from: 'C8', to: 'C9' },
      { id: 'C10-C11', from: 'C10', to: 'C11' },
      { id: 'C11-C12', from: 'C11', to: 'C12' },
      { id: 'C13-C14', from: 'C13', to: 'C14' },

      // Middle local roads
      { id: 'M1-M2', from: 'M1', to: 'M2' },
      { id: 'M3-M4', from: 'M3', to: 'M4' },
      { id: 'M4-M5', from: 'M4', to: 'M5' },
      { id: 'M6-M7', from: 'M6', to: 'M7' },
      { id: 'M7-M8', from: 'M7', to: 'M8' },
      { id: 'M9-M10', from: 'M9', to: 'M10' },
      { id: 'M11-M12', from: 'M11', to: 'M12' },

      // Lower local roads
      { id: 'L1-L2', from: 'L1', to: 'L2' },
      { id: 'L3-L4', from: 'L3', to: 'L4' },
      { id: 'L4-L5', from: 'L4', to: 'L5' },
      { id: 'L6-L7', from: 'L6', to: 'L7' },
      { id: 'L8-L9', from: 'L8', to: 'L9' },
      { id: 'L10-L11', from: 'L10', to: 'L11' },

      // South local roads
      { id: 'S1-S2', from: 'S1', to: 'S2' },
      { id: 'S3-S4', from: 'S3', to: 'S4' },
      { id: 'S5-S6', from: 'S5', to: 'S6' },
      { id: 'S7-S8', from: 'S7', to: 'S8' },
      { id: 'S9-S10', from: 'S9', to: 'S10' },
      { id: 'S10-S11', from: 'S10', to: 'S11' },

      // Cross connections (sparse)
      { id: 'N4-U4', from: 'N4', to: 'U4' },
      { id: 'N7-U8', from: 'N7', to: 'U8' },
      { id: 'U4-C5', from: 'U4', to: 'C5' },
      { id: 'U8-C9', from: 'U8', to: 'C9' },
      { id: 'C5-M5', from: 'C5', to: 'M5' },
      { id: 'C9-M8', from: 'C9', to: 'M8' },
      { id: 'M3-L3', from: 'M3', to: 'L3' },
      { id: 'M8-L8', from: 'M8', to: 'L8' },
      { id: 'L4-S4', from: 'L4', to: 'S4' },
      { id: 'L8-S8', from: 'L8', to: 'S8' },

      // Diagonal shortcuts (very sparse)
      { id: 'N2-U4', from: 'N2', to: 'U4' },
      { id: 'U2-C4', from: 'U2', to: 'C4' },
      { id: 'C6-M6', from: 'C6', to: 'M6' },
      { id: 'M6-L6', from: 'M6', to: 'L6' },
      { id: 'U7-C10', from: 'U7', to: 'C10' },
      { id: 'C12-M11', from: 'C12', to: 'M11' },
      { id: 'L7-S7', from: 'L7', to: 'S7' },
      { id: 'N9-U11', from: 'N9', to: 'U11' },
    ],
  },

  // styling
  colors: {
    panel: 'rgba(255,255,255,0.08)',
    panelBorder: 'rgba(255,255,255,0.18)',
    bg: 'rgba(0,0,0,0.35)',

    road: 'rgba(255,255,255,0.35)',
    roadActive: '#ffd166',
    roadExploring: '#56caffff',
    roadPath: '#06d6a0',

    node: 'rgba(255, 255, 255, 0)',
    nodeExploring: '#8ecae6',
    nodeVisited: 'rgba(255,255,255,0.35)',
    nodeStart: '#06d6a0',
    nodeGoal: '#ef476f',

    text: 'rgba(255,255,255,0.9)',
    subtle: 'rgba(255,255,255,0.7)',
  },
}
// ============================================

type AlgorithmKey = 'dijkstra' | 'astar' | 'bfs'
type NodeId = string

type Node = { id: NodeId; x: number; y: number }
type Edge = { id: string; from: NodeId; to: NodeId }

type Step = {
  // algorithm “state” visualisation
  current?: NodeId
  frontier?: NodeId[]
  visited?: NodeId[]
  // best-known distances (for display)
  dist?: Record<NodeId, number>
  // highlighted edges:
  activeEdgeIds?: string[]
  // final path (when solved)
  pathNodeIds?: NodeId[]
  pathEdgeIds?: string[]
  done?: boolean
  message?: string
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
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

function dist2(a: Node, b: Node) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function edgeKey(a: NodeId, b: NodeId) {
  // undirected
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

function buildAdj(nodes: Node[], edges: Edge[]) {
  const mapNode = new Map<NodeId, Node>()
  nodes.forEach((n) => mapNode.set(n.id, n))

  const adj = new Map<NodeId, Array<{ to: NodeId; w: number; edgeId: string }>>()
  nodes.forEach((n) => adj.set(n.id, []))

  for (const e of edges) {
    const a = mapNode.get(e.from)!
    const b = mapNode.get(e.to)!
    const w = dist2(a, b)
    adj.get(e.from)!.push({ to: e.to, w, edgeId: e.id })
    adj.get(e.to)!.push({ to: e.from, w, edgeId: e.id })
  }

  return { adj, mapNode }
}

function reconstructPath(prev: Record<NodeId, NodeId | null>, start: NodeId, goal: NodeId) {
  const path: NodeId[] = []
  let cur: NodeId | null = goal
  while (cur) {
    path.push(cur)
    if (cur === start) break
    cur = prev[cur] ?? null
  }
  path.reverse()
  if (path[0] !== start) return [] // unreachable
  return path
}

function edgesForPath(path: NodeId[], edges: Edge[]) {
  if (path.length < 2) return []
  const set = new Set<string>()
  for (let i = 0; i < path.length - 1; i++) set.add(edgeKey(path[i], path[i + 1]))

  return edges.filter((e) => set.has(edgeKey(e.from, e.to))).map((e) => e.id)
}

// Check if two line segments intersect
function doSegmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const ccw = (
    A: { x: number; y: number },
    B: { x: number; y: number },
    C: { x: number; y: number }
  ) => {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
  }

  // Check if segments share an endpoint
  const sharesEndpoint =
    (p1.x === p3.x && p1.y === p3.y) ||
    (p1.x === p4.x && p1.y === p4.y) ||
    (p2.x === p3.x && p2.y === p3.y) ||
    (p2.x === p4.x && p2.y === p4.y)

  if (sharesEndpoint) return false

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
}

// Generate a random network of nodes and edges
function generateRandomNetwork(
  customNodeCount?: number,
  connectionDistribution?: { sparse: number; medium: number }
): { nodes: Node[]; edges: Edge[] } {
  // Use large grid settings for 100+ nodes, otherwise use standard settings
  const config =
    customNodeCount && customNodeCount >= 100
      ? SETTINGS.largeGridGeneration
      : SETTINGS.gridGeneration
  const numNodes = customNodeCount || config.numNodes
  const { maxEdgeDistance } = config
  // Scale minNodeSpacing based on density to ensure we can actually place all requested nodes
  const minNodeSpacing =
    numNodes >= 1000 ? 0.8 : numNodes >= 200 ? 2 : numNodes >= 100 ? 3 : config.minNodeSpacing
  const nodes: Node[] = []
  const edges: Edge[] = []
  const edgeSet = new Set<string>()

  // Use a grid-based approach with significant random jitter for variety
  // For very high node counts, increase grid multiplier to ensure enough cells
  const gridMultiplier = numNodes >= 1000 ? 2.5 : 1.8
  const gridCols = Math.ceil(Math.sqrt(numNodes * gridMultiplier))
  const gridRows = Math.ceil(numNodes / gridCols)
  const cellWidth = 95 / gridCols
  const cellHeight = 55 / gridRows

  // Create nodes with randomized positions in grid cells
  const usedCells = new Set<string>()
  let nodeCount = 0

  // Shuffle the grid cells for more randomness
  const allCells: Array<{ row: number; col: number }> = []
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      allCells.push({ row, col })
    }
  }

  // Fisher-Yates shuffle for true randomness
  for (let i = allCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[allCells[i], allCells[j]] = [allCells[j], allCells[i]]
  }

  for (const { row, col } of allCells) {
    if (nodeCount >= numNodes) break

    const cellKey = `${row},${col}`
    if (usedCells.has(cellKey)) continue

    // Add significant jitter within the cell (50-80% of cell size)
    const jitterAmount = 0.5 + Math.random() * 0.3
    const baseX = col * cellWidth + 2.5
    const baseY = row * cellHeight + 2.5
    const jitterX = (Math.random() - 0.5) * cellWidth * jitterAmount
    const jitterY = (Math.random() - 0.5) * cellHeight * jitterAmount

    const x = Math.max(2.5, Math.min(97.5, baseX + cellWidth / 2 + jitterX))
    const y = Math.max(2.5, Math.min(57.5, baseY + cellHeight / 2 + jitterY))

    // Check minimum distance from existing nodes
    let tooClose = false
    for (const existing of nodes) {
      const dx = existing.x - x
      const dy = existing.y - y
      if (Math.sqrt(dx * dx + dy * dy) < minNodeSpacing) {
        tooClose = true
        break
      }
    }

    if (!tooClose) {
      nodes.push({
        id: `N${nodeCount}`,
        x,
        y,
      })
      usedCells.add(cellKey)
      nodeCount++
    }
  }

  // Generate edges: connect each node to its nearest neighbors, avoiding crossings
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  nodes.forEach((node, idx) => {
    // Calculate distances to all other nodes
    const distances = nodes
      .map((other, otherIdx) => ({
        node: other,
        distance: dist2(node, other),
        idx: otherIdx,
      }))
      .filter((d) => d.idx !== idx) // Exclude self
      .sort((a, b) => a.distance - b.distance)

    // Determine how many edges this node should have (with weighted randomness)
    // Use provided distribution or defaults: 85% get 1-2, 10% get 3-4, 5% get 5
    const sparseThreshold = connectionDistribution?.sparse ?? 85
    const mediumThreshold = connectionDistribution?.medium ?? 10
    const sparseCutoff = sparseThreshold / 100
    const mediumCutoff = sparseCutoff + mediumThreshold / 100

    let targetEdges: number
    const rand = Math.random()
    if (rand < sparseCutoff) {
      // Sparse: 1-2 connections (sparse road network)
      targetEdges = Math.random() < 0.6 ? 1 : 2
    } else if (rand < mediumCutoff) {
      // Medium: 3-4 connections (small intersections)
      targetEdges = Math.random() < 0.5 ? 3 : 4
    } else {
      // Dense: 5 connections (major hubs)
      targetEdges = 5
    }

    // Connect to nearest neighbors within max distance, checking for intersections
    let edgesAdded = 0
    for (const { node: other, distance } of distances) {
      if (edgesAdded >= targetEdges) break
      if (distance > maxEdgeDistance) continue

      const key = edgeKey(node.id, other.id)
      if (edgeSet.has(key)) continue

      // Check if this edge would intersect with existing edges
      let intersects = false
      for (const existingEdge of edges) {
        const e1 = nodeMap.get(existingEdge.from)!
        const e2 = nodeMap.get(existingEdge.to)!

        if (doSegmentsIntersect(node, other, e1, e2)) {
          intersects = true
          break
        }
      }

      if (!intersects) {
        edgeSet.add(key)
        edges.push({
          id: `${node.id}-${other.id}`,
          from: node.id,
          to: other.id,
        })
        edgesAdded++
      }
    }
  })

  // Ensure the graph is connected using Union-Find
  const parent = new Map<string, string>()
  const find = (id: string): string => {
    if (!parent.has(id)) parent.set(id, id)
    if (parent.get(id) !== id) parent.set(id, find(parent.get(id)!))
    return parent.get(id)!
  }

  const union = (a: string, b: string) => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parent.set(rootA, rootB)
  }

  // Build connected components
  edges.forEach((e) => union(e.from, e.to))

  // Find all components
  const components = new Map<string, string[]>()
  nodes.forEach((n) => {
    const root = find(n.id)
    if (!components.has(root)) components.set(root, [])
    components.get(root)!.push(n.id)
  })

  // Connect components by adding edges between closest nodes in different components
  const componentRoots = Array.from(components.keys())
  for (let i = 1; i < componentRoots.length; i++) {
    const comp1 = components.get(componentRoots[i - 1])!
    const comp2 = components.get(componentRoots[i])!

    let minDist = Infinity
    let bestPair: [string, string] | null = null
    let bestIntersects = true

    // Find the closest pair that doesn't cause intersections
    for (const id1 of comp1) {
      for (const id2 of comp2) {
        const n1 = nodes.find((n) => n.id === id1)!
        const n2 = nodes.find((n) => n.id === id2)!
        const d = dist2(n1, n2)

        // Check if this edge would intersect
        let intersects = false
        for (const existingEdge of edges) {
          const e1 = nodeMap.get(existingEdge.from)!
          const e2 = nodeMap.get(existingEdge.to)!

          if (doSegmentsIntersect(n1, n2, e1, e2)) {
            intersects = true
            break
          }
        }

        // Prefer non-intersecting edges, but allow intersecting if necessary
        if ((!intersects && d < minDist) || (bestIntersects && !intersects)) {
          minDist = d
          bestPair = [id1, id2]
          bestIntersects = intersects
        } else if (bestIntersects && intersects && d < minDist) {
          minDist = d
          bestPair = [id1, id2]
        }
      }
    }

    if (bestPair) {
      const key = edgeKey(bestPair[0], bestPair[1])
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push({
          id: `${bestPair[0]}-${bestPair[1]}`,
          from: bestPair[0],
          to: bestPair[1],
        })
        union(bestPair[0], bestPair[1])
      }
    }
  }

  return { nodes, edges }
}

function dijkstraSteps(nodes: Node[], edges: Edge[], start: NodeId, goal: NodeId): Step[] {
  const { adj } = buildAdj(nodes, edges)

  const dist: Record<NodeId, number> = Object.fromEntries(nodes.map((n) => [n.id, Infinity]))
  const prev: Record<NodeId, NodeId | null> = Object.fromEntries(nodes.map((n) => [n.id, null]))

  dist[start] = 0

  const visited = new Set<NodeId>()
  const frontier = new Set<NodeId>([start])

  const steps: Step[] = [
    {
      current: start,
      frontier: [...frontier],
      visited: [],
      dist: { ...dist },
      message: 'Start',
    },
  ]

  while (frontier.size > 0) {
    // pick node in frontier with smallest dist
    let u: NodeId | null = null
    let best = Infinity
    for (const id of frontier) {
      if (dist[id] < best) {
        best = dist[id]
        u = id
      }
    }
    if (!u) break

    frontier.delete(u)

    // if already visited, continue
    if (visited.has(u)) continue

    visited.add(u)

    steps.push({
      current: u,
      frontier: [...frontier],
      visited: [...visited],
      dist: { ...dist },
      message: u === goal ? 'Reached goal' : 'Visit node',
    })

    if (u === goal) break

    for (const { to, w, edgeId } of adj.get(u) ?? []) {
      if (visited.has(to)) continue

      const alt = dist[u] + w
      steps.push({
        current: u,
        frontier: [...frontier, to],
        visited: [...visited],
        dist: { ...dist },
        activeEdgeIds: [edgeId],
        message: `Relax ${u} → ${to}`,
      })

      if (alt < dist[to]) {
        dist[to] = alt
        prev[to] = u
        frontier.add(to)
        steps.push({
          current: u,
          frontier: [...frontier],
          visited: [...visited],
          dist: { ...dist },
          activeEdgeIds: [edgeId],
          message: `Update best path to ${to}`,
        })
      } else {
        frontier.add(to) // still frontier-ish so user sees it
      }
    }
  }

  const path = reconstructPath(prev, start, goal)
  const pathEdges = edgesForPath(path, edges)

  steps.push({
    current: goal,
    frontier: [],
    visited: [...visited],
    dist: { ...dist },
    pathNodeIds: path.length ? path : undefined,
    pathEdgeIds: pathEdges.length ? pathEdges : undefined,
    done: true,
    message: path.length ? 'Done: shortest path found' : 'Done: no path',
  })

  return steps
}

function bfsSteps(nodes: Node[], edges: Edge[], start: NodeId, goal: NodeId): Step[] {
  const { adj } = buildAdj(nodes, edges)

  const prev: Record<NodeId, NodeId | null> = Object.fromEntries(nodes.map((n) => [n.id, null]))
  const visited = new Set<NodeId>([start])
  const q: NodeId[] = [start]
  const frontier = new Set<NodeId>([start])

  const steps: Step[] = [
    { current: start, frontier: [start], visited: [start], message: 'Start (BFS)' },
  ]

  while (q.length) {
    const u = q.shift()!
    frontier.delete(u)

    steps.push({
      current: u,
      frontier: [...frontier],
      visited: [...visited],
      message: u === goal ? 'Reached goal' : 'Dequeue node',
    })

    if (u === goal) break

    for (const { to, edgeId } of adj.get(u) ?? []) {
      if (visited.has(to)) continue
      visited.add(to)
      prev[to] = u
      q.push(to)
      frontier.add(to)

      steps.push({
        current: u,
        frontier: [...frontier],
        visited: [...visited],
        activeEdgeIds: [edgeId],
        message: `Discover ${to}`,
      })
    }
  }

  const path = reconstructPath(prev, start, goal)
  const pathEdges = edgesForPath(path, edges)

  steps.push({
    current: goal,
    frontier: [],
    visited: [...visited],
    pathNodeIds: path.length ? path : undefined,
    pathEdgeIds: pathEdges.length ? pathEdges : undefined,
    done: true,
    message: path.length ? 'Done: path found' : 'Done: no path',
  })

  return steps
}

function astarSteps(nodes: Node[], edges: Edge[], start: NodeId, goal: NodeId): Step[] {
  const { adj, mapNode } = buildAdj(nodes, edges)

  const gScore: Record<NodeId, number> = Object.fromEntries(nodes.map((n) => [n.id, Infinity]))
  const fScore: Record<NodeId, number> = Object.fromEntries(nodes.map((n) => [n.id, Infinity]))
  const prev: Record<NodeId, NodeId | null> = Object.fromEntries(nodes.map((n) => [n.id, null]))

  const h = (id: NodeId) => dist2(mapNode.get(id)!, mapNode.get(goal)!)

  gScore[start] = 0
  fScore[start] = h(start)

  const open = new Set<NodeId>([start])
  const visited = new Set<NodeId>()

  const steps: Step[] = [
    {
      current: start,
      frontier: [start],
      visited: [],
      dist: { ...gScore },
      message: 'Start (A*)',
    },
  ]

  while (open.size) {
    // pick lowest fScore
    let u: NodeId | null = null
    let best = Infinity
    for (const id of open) {
      if (fScore[id] < best) {
        best = fScore[id]
        u = id
      }
    }
    if (!u) break

    open.delete(u)
    visited.add(u)

    steps.push({
      current: u,
      frontier: [...open],
      visited: [...visited],
      dist: { ...gScore },
      message: u === goal ? 'Reached goal' : 'Visit node',
    })

    if (u === goal) break

    for (const { to, w, edgeId } of adj.get(u) ?? []) {
      if (visited.has(to)) continue

      const tentative = gScore[u] + w

      steps.push({
        current: u,
        frontier: [...open, to],
        visited: [...visited],
        dist: { ...gScore },
        activeEdgeIds: [edgeId],
        message: `Consider ${u} → ${to}`,
      })

      if (tentative < gScore[to]) {
        prev[to] = u
        gScore[to] = tentative
        fScore[to] = tentative + h(to)
        open.add(to)

        steps.push({
          current: u,
          frontier: [...open],
          visited: [...visited],
          dist: { ...gScore },
          activeEdgeIds: [edgeId],
          message: `Update best path to ${to}`,
        })
      } else {
        open.add(to)
      }
    }
  }

  const path = reconstructPath(prev, start, goal)
  const pathEdges = edgesForPath(path, edges)

  steps.push({
    current: goal,
    frontier: [],
    visited: [...visited],
    dist: { ...gScore },
    pathNodeIds: path.length ? path : undefined,
    pathEdgeIds: pathEdges.length ? pathEdges : undefined,
    done: true,
    message: path.length ? 'Done: path found' : 'Done: no path',
  })

  return steps
}

function buildSteps(algo: AlgorithmKey, nodes: Node[], edges: Edge[], start: NodeId, goal: NodeId) {
  switch (algo) {
    case 'dijkstra':
      return dijkstraSteps(nodes, edges, start, goal)
    case 'astar':
      return astarSteps(nodes, edges, start, goal)
    case 'bfs':
      return bfsSteps(nodes, edges, start, goal)
    default:
      return dijkstraSteps(nodes, edges, start, goal)
  }
}

// ============================================
// Component
// ============================================
interface PathfindingVisualizerProps {
  size?: 'small' | 'large'
}

export function PathfindingVisualizer({ size = 'large' }: PathfindingVisualizerProps) {
  const isMobile = useIsMobile(900)

  const algoLabel: Record<AlgorithmKey, string> = {
    dijkstra: 'Dijkstra',
    astar: 'A* (A-star)',
    bfs: 'BFS (unweighted)',
  }

  // Use state for nodes and edges to allow regeneration
  const [network, setNetwork] = useState(() => ({
    nodes: SETTINGS.network.nodes,
    edges: SETTINGS.network.edges,
  }))

  const nodes = network.nodes
  const edges = network.edges

  const [algo, setAlgo] = useState<AlgorithmKey>(SETTINGS.defaultAlgo)
  const [speedMs, setSpeedMs] = useState(SETTINGS.defaultSpeedMs)
  const [gridSize, setGridSize] = useState(() => (isMobile ? 20 : 100))
  const [gridCity, setGridCity] = useState(false) // Grid city mode with 1000 nodes
  const [sparsePercent, setSparsePercent] = useState(85) // % of nodes with 1-2 connections
  const [mediumPercent, setMediumPercent] = useState(10) // % of nodes with 3-4 connections
  // dense (5 connections) = 100 - sparse - medium

  const [trafficMode, setTrafficMode] = useState(false)
  const [trafficDensity, setTrafficDensity] = useState(10) // Number of vehicles

  const [start, setStart] = useState<NodeId>(nodes[0].id)
  const [goal, setGoal] = useState<NodeId>(nodes[nodes.length - 1].id)

  const [isRunning, setIsRunning] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [showSettings, setShowSettings] = useState(true)

  const timerRef = useRef<number | null>(null)
  const tapModeRef = useRef<'setStart' | 'setGoal'>('setStart')
  const { submitScore } = useUser()
  const submittedRef = useRef(false)

  // Use traffic simulation hook
  const trafficVehicles = useTrafficSimulation(trafficMode, trafficDensity, nodes, edges, buildAdj)

  const regenerateGrid = useCallback(() => {
    const actualSize = gridCity ? 2000 : gridSize
    const newNetwork = generateRandomNetwork(actualSize, {
      sparse: sparsePercent,
      medium: mediumPercent,
    })
    setNetwork(newNetwork)
    setStart(newNetwork.nodes[0].id)
    setGoal(newNetwork.nodes[newNetwork.nodes.length - 1].id)
    setSteps(null)
    setStepIndex(0)
  }, [gridSize, gridCity, sparsePercent, mediumPercent])

  const stop = useCallback(() => {
    setIsRunning(false)
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => stop, [stop])

  const reset = useCallback(() => {
    stop()
    setSteps(null)
    setStepIndex(0)
  }, [stop])

  const run = useCallback(() => {
    if (isRunning) return
    if (isMobile) setShowSettings(false)
    if (start === goal) {
      // still show a trivial “done”
      setSteps([
        { current: start, frontier: [start], visited: [start], message: 'Start = Goal' },
        { pathNodeIds: [start], pathEdgeIds: [], done: true, message: 'Done' },
      ])
      setStepIndex(0)
      return
    }
    const built = buildSteps(algo, nodes, edges, start, goal)
    setSteps(built)
    setStepIndex(0)
    setIsRunning(true)
  }, [algo, edges, isRunning, nodes, start, goal, isMobile])

  // Playback loop
  useEffect(() => {
    if (!isRunning || !steps || steps.length === 0) return

    if (stepIndex >= steps.length - 1) {
      const t = window.setTimeout(() => setIsRunning(false), 0)
      return () => window.clearTimeout(t)
    }

    // small batching for very fast speeds
    let stepIncrement = 1
    let delay = speedMs

    if (speedMs === 0) {
      stepIncrement = Math.max(1, Math.floor(steps.length / 60))
      delay = 1
    } else if (speedMs <= 8) {
      stepIncrement = Math.max(1, Math.floor(steps.length / 250))
      delay = speedMs
    }

    timerRef.current = window.setTimeout(() => {
      setStepIndex((i) => Math.min(i + stepIncrement, steps.length - 1))
    }, delay)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [isRunning, speedMs, stepIndex, steps])

  const current = useMemo<Step>(() => {
    if (!steps || steps.length === 0) return { message: 'Ready' }
    return steps[clamp(stepIndex, 0, steps.length - 1)]
  }, [stepIndex, steps])

  // Submit score when pathfinding reconstruction is finished
  useEffect(() => {
    if (!current.done || !steps || steps.length === 0) {
      submittedRef.current = false
      return
    }

    if (submittedRef.current) return

    // Submit the number of steps as the score
    submitScore('pathfinding', steps.length)
    submittedRef.current = true
  }, [current.done, steps, submitScore])

  const visitedSet = useMemo(() => new Set(current.visited ?? []), [current.visited])
  const frontierSet = useMemo(() => new Set(current.frontier ?? []), [current.frontier])
  const pathNodeSet = useMemo(() => new Set(current.pathNodeIds ?? []), [current.pathNodeIds])

  const activeEdgeSet = useMemo(() => new Set(current.activeEdgeIds ?? []), [current.activeEdgeIds])
  const pathEdgeSet = useMemo(() => new Set(current.pathEdgeIds ?? []), [current.pathEdgeIds])

  // Compute visited edges: edges between visited nodes
  const visitedEdgeSet = useMemo(() => {
    const visited = current.visited ?? []
    if (visited.length < 2) return new Set<string>()
    const vSet = new Set(visited)
    const visitedEdges = new Set<string>()
    edges.forEach((e) => {
      if (vSet.has(e.from) && vSet.has(e.to)) {
        visitedEdges.add(e.id)
      }
    })
    return visitedEdges
  }, [current.visited, edges])

  const nodeById = useMemo(() => {
    const m = new Map<NodeId, Node>()
    nodes.forEach((n) => m.set(n.id, n))
    return m
  }, [nodes])

  const getNodeFill = useCallback(
    (id: NodeId) => {
      if (id === start) return SETTINGS.colors.nodeStart
      if (id === goal) return SETTINGS.colors.nodeGoal
      if (pathNodeSet.has(id)) return SETTINGS.colors.roadPath
      if (frontierSet.has(id)) return SETTINGS.colors.nodeExploring
      if (visitedSet.has(id)) return SETTINGS.colors.nodeVisited
      return SETTINGS.colors.node
    },
    [start, goal, pathNodeSet, frontierSet, visitedSet]
  )

  const getEdgeStroke = useCallback(
    (edgeId: string) => {
      if (pathEdgeSet.has(edgeId)) return SETTINGS.colors.roadPath
      if (activeEdgeSet.has(edgeId)) return SETTINGS.colors.roadActive
      if (visitedEdgeSet.has(edgeId)) return SETTINGS.colors.roadExploring
      return SETTINGS.colors.road
    },
    [pathEdgeSet, activeEdgeSet, visitedEdgeSet]
  )

  if (size === 'small') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <div style={{ width: '100%', maxWidth: 280 }}>
          <svg viewBox="0 0 100 60" width="100%" height="120">
            {/* Sample network preview with proper node positions */}
            <line
              x1="8"
              y1="16"
              x2="22"
              y2="19"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="22"
              y1="19"
              x2="37"
              y2="17"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="37"
              y1="17"
              x2="55"
              y2="19"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="55"
              y1="19"
              x2="72"
              y2="18"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="72"
              y1="18"
              x2="87"
              y2="16"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="8"
              y1="16"
              x2="12"
              y2="28"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="22"
              y1="19"
              x2="19"
              y2="31"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="37"
              y1="17"
              x2="39"
              y2="29"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="55"
              y1="19"
              x2="58"
              y2="24"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="72"
              y1="18"
              x2="73"
              y2="26"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="28"
              x2="19"
              y2="31"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="19"
              y1="31"
              x2="39"
              y2="29"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="39"
              y1="29"
              x2="58"
              y2="24"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="58"
              y1="24"
              x2="73"
              y2="26"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="28"
              x2="14"
              y2="39"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="19"
              y1="31"
              x2="21"
              y2="46"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="39"
              y1="29"
              x2="36"
              y2="35"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="14"
              y1="39"
              x2="21"
              y2="46"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="21"
              y1="46"
              x2="36"
              y2="35"
              stroke={SETTINGS.colors.road}
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            <circle cx="8" cy="16" r="1.8" fill={SETTINGS.colors.nodeStart} />
            <circle cx="22" cy="19" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="37" cy="17" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="55" cy="19" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="72" cy="18" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="87" cy="16" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="12" cy="28" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="19" cy="31" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="39" cy="29" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="58" cy="24" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="73" cy="26" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="14" cy="39" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="21" cy="46" r="1.5" fill={SETTINGS.colors.node} />
            <circle cx="36" cy="35" r="1.8" fill={SETTINGS.colors.nodeGoal} />
          </svg>
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: 8 }}>
          Pathfinding Visualizer
        </div>
      </div>
    )
  }

  const containerDir = isMobile ? 'column' : 'row'
  const controlsWidth = isMobile ? '100%' : 360
  const vizMinHeight = isMobile ? 320 : 460

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
      {/* Mobile Settings Toggle */}
      {isMobile && (
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            padding: '8px 12px',
            borderRadius: 8,
            background: SETTINGS.colors.panel,
            border: `1px solid ${SETTINGS.colors.panelBorder}`,
            color: 'white',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
          }}
        >
          {showSettings ? '✕ Hide' : '⚙ Settings'}
        </button>
      )}

      {/* Controls */}
      {(!isMobile || showSettings) && (
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
            <div style={{ fontSize: 18, fontWeight: 800 }}>Pathfinding Visualizer</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{algoLabel[algo]}</div>
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            {/* Algorithm */}
            <div>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Algorithm</div>
              <select
                value={algo}
                disabled={isRunning}
                onChange={(e) => {
                  setAlgo(e.target.value as AlgorithmKey)
                  reset()
                }}
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
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                BFS ignores weights; Dijkstra/A* use road lengths.
              </div>
            </div>

            {/* Speed */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>Speed</div>
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
                Tip: 0ms = fast-forward
              </div>
            </div>

            {/* Grid City Checkbox (Desktop Only) */}
            {!isMobile && (
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={gridCity}
                    disabled={isRunning}
                    onChange={(e) => {
                      const enabled = e.target.checked
                      setGridCity(enabled)
                      const actualSize = enabled ? 2000 : gridSize
                      const newNetwork = generateRandomNetwork(actualSize, {
                        sparse: sparsePercent,
                        medium: mediumPercent,
                      })
                      setNetwork(newNetwork)
                      setStart(newNetwork.nodes[0].id)
                      setGoal(newNetwork.nodes[newNetwork.nodes.length - 1].id)
                      setSteps(null)
                      setStepIndex(0)
                    }}
                    style={{ cursor: isRunning ? 'not-allowed' : 'pointer', width: 16, height: 16 }}
                  />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    Grid City {gridCity && `(${nodes.length} nodes)`}
                  </div>
                </label>
              </div>
            )}

            {/* Grid Size Slider */}
            {!gridCity && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>Grid Size</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{gridSize} nodes</div>
                </div>
                <input
                  type="range"
                  min={10}
                  max={isMobile ? 50 : 500}
                  step={10}
                  value={gridSize}
                  disabled={isRunning}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value, 10)
                    setGridSize(newSize)
                    const newNetwork = generateRandomNetwork(newSize, {
                      sparse: sparsePercent,
                      medium: mediumPercent,
                    })
                    setNetwork(newNetwork)
                    setStart(newNetwork.nodes[0].id)
                    setGoal(newNetwork.nodes[newNetwork.nodes.length - 1].id)
                    setSteps(null)
                    setStepIndex(0)
                  }}
                  style={{ width: '100%', cursor: isRunning ? 'not-allowed' : 'pointer' }}
                />
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                  {isMobile ? 'Range: 10-50 nodes' : 'Range: 10-500 nodes'}
                </div>
              </div>
            )}

            {/* Connection Distribution Sliders (Desktop Only) */}
            {!isMobile && (
              <>
                <div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                  >
                    <div style={{ fontSize: 13, opacity: 0.85 }}>Sparse (1-2 edges)</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{sparsePercent}%</div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100 - mediumPercent}
                    step={5}
                    value={sparsePercent}
                    disabled={isRunning}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value, 10)
                      setSparsePercent(newValue)
                      const newNetwork = generateRandomNetwork(gridSize, {
                        sparse: newValue,
                        medium: mediumPercent,
                      })
                      setNetwork(newNetwork)
                      setStart(newNetwork.nodes[0].id)
                      setGoal(newNetwork.nodes[newNetwork.nodes.length - 1].id)
                      setSteps(null)
                      setStepIndex(0)
                    }}
                    style={{ width: '100%', cursor: isRunning ? 'not-allowed' : 'pointer' }}
                  />
                </div>

                <div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                  >
                    <div style={{ fontSize: 13, opacity: 0.85 }}>Medium (3-4 edges)</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{mediumPercent}%</div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100 - sparsePercent}
                    step={5}
                    value={mediumPercent}
                    disabled={isRunning}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value, 10)
                      setMediumPercent(newValue)
                      const newNetwork = generateRandomNetwork(gridSize, {
                        sparse: sparsePercent,
                        medium: newValue,
                      })
                      setNetwork(newNetwork)
                      setStart(newNetwork.nodes[0].id)
                      setGoal(newNetwork.nodes[newNetwork.nodes.length - 1].id)
                      setSteps(null)
                      setStepIndex(0)
                    }}
                    style={{ width: '100%', cursor: isRunning ? 'not-allowed' : 'pointer' }}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                    Dense (5 edges): {100 - sparsePercent - mediumPercent}%
                  </div>
                </div>
              </>
            )}

            {/* Traffic Mode (Desktop Only) */}
            {!isMobile && (
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    marginBottom: 10,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={trafficMode}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setTrafficMode(checked)
                      if (!checked) {
                        setIsRunning(false)
                        setSteps(null)
                      }
                    }}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Traffic Simulation</div>
                </label>
                {trafficMode && (
                  <div>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                    >
                      <div style={{ fontSize: 13, opacity: 0.85 }}>Traffic Density</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{trafficDensity} vehicles</div>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={5}
                      value={trafficDensity}
                      onChange={(e) => setTrafficDensity(parseInt(e.target.value, 10))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            {!trafficMode && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr',
                  gap: 10,
                }}
              >
                <button
                  onClick={reset}
                  disabled={isRunning}
                  style={{
                    padding: '12px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.10)',
                    border: `1px solid ${SETTINGS.colors.panelBorder}`,
                    color: 'white',
                    fontWeight: 800,
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                  }}
                >
                  Reset
                </button>

                <button
                  onClick={run}
                  disabled={isRunning}
                  style={{
                    padding: '12px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.16)',
                    border: `1px solid ${SETTINGS.colors.panelBorder}`,
                    color: 'white',
                    fontWeight: 900,
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                  }}
                >
                  Run
                </button>

                <button
                  onClick={stop}
                  disabled={!isRunning}
                  style={{
                    gridColumn: '1 / -1',
                    padding: '12px 12px',
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.25)',
                    border: `1px solid ${SETTINGS.colors.panelBorder}`,
                    color: 'white',
                    fontWeight: 800,
                    cursor: !isRunning ? 'not-allowed' : 'pointer',
                    opacity: !isRunning ? 0.55 : 1,
                  }}
                >
                  Stop
                </button>

                <button
                  onClick={regenerateGrid}
                  disabled={isRunning}
                  style={{
                    gridColumn: '1 / -1',
                    padding: '12px 12px',
                    borderRadius: 10,
                    background: 'rgba(100,200,255,0.15)',
                    border: `1px solid ${SETTINGS.colors.panelBorder}`,
                    color: 'white',
                    fontWeight: 800,
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                  }}
                >
                  🔄 Regenerate Grid
                </button>
              </div>
            )}

            {/* Progress */}
            {!trafficMode && (
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {steps
                  ? `Step ${Math.min(stepIndex + 1, steps.length)} / ${steps.length}`
                  : 'Ready'}{' '}
                • {current.message ?? ''}
              </div>
            )}

            {trafficMode && (
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Traffic: {trafficVehicles.length} vehicles active
              </div>
            )}

            {/* Legend */}
            <div
              style={{
                marginTop: 2,
                padding: 10,
                borderRadius: 10,
                border: `1px solid ${SETTINGS.colors.panelBorder}`,
                background: 'rgba(0,0,0,0.18)',
                fontSize: 12,
                lineHeight: 1.4,
                color: SETTINGS.colors.subtle,
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 99,
                    background: SETTINGS.colors.nodeStart,
                    display: 'inline-block',
                  }}
                />
                Start
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 99,
                    background: SETTINGS.colors.nodeGoal,
                    display: 'inline-block',
                    marginLeft: 10,
                  }}
                />
                Goal
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span
                  style={{
                    width: 18,
                    height: 4,
                    borderRadius: 99,
                    background: SETTINGS.colors.roadActive,
                    display: 'inline-block',
                  }}
                />
                Exploring edge
                <span
                  style={{
                    width: 18,
                    height: 4,
                    borderRadius: 99,
                    background: SETTINGS.colors.roadPath,
                    display: 'inline-block',
                    marginLeft: 10,
                  }}
                />
                Final path
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile tap controls - between settings and visualization */}
      {isMobile && (
        <div
          style={{
            background: SETTINGS.colors.panel,
            border: `1px solid ${SETTINGS.colors.panelBorder}`,
            borderRadius: 12,
            padding: 12,
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.9, whiteSpace: 'nowrap' }}>Tap mode:</div>
            <TapModePicker
              disabled={isRunning}
              tapModeRef={tapModeRef}
              onChange={(mode) => {
                tapModeRef.current = mode
              }}
            />
          </div>

          <div
            style={{
              fontSize: 11,
              opacity: 0.85,
              whiteSpace: 'nowrap',
            }}
          >
            <b>{start}</b> → <b>{goal}</b>
          </div>
        </div>
      )}

      {/* Visualization */}
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
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ fontSize: isMobile ? 11 : 13, opacity: 0.85 }}>
            {isMobile
              ? 'Tap nodes to set start/goal'
              : 'Desktop view • Tap nodes to set start/goal'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{isRunning ? 'Running…' : 'Idle'}</div>
        </div>

        <div
          style={{
            position: 'relative',
            flex: 1,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            padding: isMobile ? 8 : 10,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <svg
            viewBox={isMobile ? '0 0 60 100' : '0 0 100 60'}
            width="100%"
            style={{ display: 'block', touchAction: 'none', height: '100%' }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Nodes - render first so edges appear on top */}
            {nodes.map((n) => {
              const fill = getNodeFill(n.id)
              const isCurrent = current.current === n.id
              // Much smaller visual nodes, but keep hit area large
              // Scale node size based on grid density (more nodes = smaller visuals)
              const isHighDensity = gridSize >= 100
              const baseR = gridCity ? 0.3 : isMobile ? 1.8 : isHighDensity ? 0.7 : 1.2
              const specialR = gridCity ? 0.5 : isMobile ? 2.2 : isHighDensity ? 1.0 : 1.6
              const currentR = gridCity ? 0.7 : isMobile ? 2.6 : isHighDensity ? 1.3 : 2.0
              const r = isCurrent ? currentR : n.id === start || n.id === goal ? specialR : baseR

              // Flip coordinates for mobile portrait mode
              const cx = isMobile ? n.y : n.x
              const cy = isMobile ? n.x : n.y

              // Only show start and goal nodes when running
              const isVisible = !isRunning || n.id === start || n.id === goal

              return (
                <g
                  key={n.id}
                  onClick={() => {
                    if (isRunning || trafficMode) return
                    const mode = tapModeRef.current
                    if (mode === 'setStart') {
                      if (n.id === goal) return
                      setStart(n.id)
                      reset()
                    } else {
                      if (n.id === start) return
                      setGoal(n.id)
                      reset()
                    }
                  }}
                  style={{ cursor: isRunning || trafficMode ? 'default' : 'pointer' }}
                >
                  {/* hit area - larger on mobile for touch, smaller on desktop for accuracy */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={gridCity ? 1.5 : isMobile ? 8 : gridSize >= 100 ? 3 : 4}
                    fill="transparent"
                  />
                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    initial={false}
                    animate={{
                      fill,
                      opacity: isVisible ? 1 : 0,
                      scale: isCurrent ? 1.08 : 1,
                    }}
                    transition={{ duration: SETTINGS.animationDurationMs / 1000, ease: 'easeOut' }}
                  />
                </g>
              )
            })}

            {/* Roads - render after nodes so they appear on top */}
            {edges.map((e) => {
              const a = nodeById.get(e.from)!
              const b = nodeById.get(e.to)!
              const stroke = getEdgeStroke(e.id)
              const isPath = pathEdgeSet.has(e.id)
              const isActive = activeEdgeSet.has(e.id)

              // Flip coordinates for mobile portrait mode
              const x1 = isMobile ? a.y : a.x
              const y1 = isMobile ? a.x : a.y
              const x2 = isMobile ? b.y : b.x
              const y2 = isMobile ? b.x : b.y

              // All paths same width - no special width for final path
              // Use thinner paths for high density grids on desktop
              const isHighDensity = gridSize >= 100
              const baseWidth = gridCity ? 0.15 : isMobile ? 1.5 : isHighDensity ? 0.4 : 0.8
              const activeWidth = gridCity ? 0.3 : isMobile ? 2 : isHighDensity ? 0.7 : 1.2
              const width = isActive ? activeWidth : baseWidth

              return (
                <motion.line
                  key={e.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  initial={false}
                  animate={{
                    stroke,
                    strokeWidth: width,
                    opacity: isPath ? 1 : isActive ? 0.9 : 0.5,
                  }}
                  transition={{ duration: SETTINGS.animationDurationMs / 1000, ease: 'easeOut' }}
                  strokeLinecap="round"
                  style={{ pointerEvents: 'none' }}
                />
              )
            })}

            {/* Traffic vehicles */}
            {trafficMode &&
              trafficVehicles.map((vehicle) => {
                const currentNodeData = nodeById.get(vehicle.currentNode)
                if (!currentNodeData) return null

                // Get next node for interpolation
                const nextNodeId = vehicle.path[vehicle.pathIndex + 1]
                const nextNodeData = nextNodeId ? nodeById.get(nextNodeId) : null

                // Interpolate position between current and next node
                let x = currentNodeData.x
                let y = currentNodeData.y

                if (nextNodeData && vehicle.progress > 0) {
                  x = currentNodeData.x + (nextNodeData.x - currentNodeData.x) * vehicle.progress
                  y = currentNodeData.y + (nextNodeData.y - currentNodeData.y) * vehicle.progress
                }

                const cx = isMobile ? y : x
                const cy = isMobile ? x : y

                // Match vehicle size to road width
                const isHighDensity = gridSize >= 100
                const vehicleWidth = gridCity ? 0.1 : isMobile ? 1.5 : isHighDensity ? 0.4 : 0.8
                const vehicleLength = vehicleWidth * 1.5 // Slightly longer than wide

                return (
                  <rect
                    key={vehicle.id}
                    x={cx - vehicleLength / 2}
                    y={cy - vehicleWidth / 2}
                    width={vehicleLength}
                    height={vehicleWidth}
                    rx={vehicleWidth * 0.3}
                    fill="#FFD700"
                    style={{
                      pointerEvents: 'none',
                      transition: 'x 50ms linear, y 50ms linear',
                    }}
                  />
                )
              })}
          </svg>

          {/* Desktop tap controls overlay */}
          {!trafficMode && !isMobile && (
            <div
              style={{
                position: 'absolute',
                left: 10,
                right: 10,
                bottom: 10,
                display: 'flex',
                gap: 10,
                justifyContent: 'space-between',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  pointerEvents: 'auto',
                  display: 'flex',
                  gap: 8,
                  background: 'rgba(0,0,0,0.35)',
                  border: `1px solid ${SETTINGS.colors.panelBorder}`,
                  borderRadius: 10,
                  padding: '8px 10px',
                  backdropFilter: 'blur(6px)',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.9 }}>Tap mode:</div>
                <TapModePicker
                  disabled={isRunning}
                  tapModeRef={tapModeRef}
                  onChange={(mode) => {
                    tapModeRef.current = mode
                  }}
                />
              </div>

              <div
                style={{
                  pointerEvents: 'auto',
                  fontSize: 12,
                  opacity: 0.85,
                  background: 'rgba(0,0,0,0.35)',
                  border: `1px solid ${SETTINGS.colors.panelBorder}`,
                  borderRadius: 10,
                  padding: '8px 10px',
                  backdropFilter: 'blur(6px)',
                }}
              >
                Start: <b>{start}</b> • Goal: <b>{goal}</b>
              </div>
            </div>
          )}
        </div>

        {!isMobile && !trafficMode && (
          <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.35 }}>
            Use tap mode buttons to select <b>Start</b> and <b>Goal</b> nodes, then press <b>Run</b>
            . Roads are weighted by their length. Final path highlights in green.
          </div>
        )}

        {!isMobile && trafficMode && (
          <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.35 }}>
            <b>Traffic simulation:</b> Vehicles (yellow dots) navigate from edge nodes to random
            destinations using pathfinding. Adjust density to add more vehicles.
          </div>
        )}
      </div>

      {/* A tiny bit of state to make tapping explicit */}
      {!trafficMode && (
        <TapModeController
          isRunning={isRunning}
          start={start}
          goal={goal}
          tapModeRef={tapModeRef}
          setStart={(v) => {
            setStart(v)
            reset()
          }}
          setGoal={(v) => {
            setGoal(v)
            reset()
          }}
        />
      )}
    </div>
  )
}

type TapMode = 'setStart' | 'setGoal'

function TapModePicker({
  disabled,
  onChange,
  tapModeRef,
}: {
  disabled: boolean
  onChange: (m: TapMode) => void
  tapModeRef: React.RefObject<TapMode>
}) {
  const [mode, setMode] = useState<TapMode>('setStart')

  useEffect(() => {
    onChange(mode)
    if (tapModeRef.current !== undefined) {
      ;(tapModeRef as React.MutableRefObject<TapMode>).current = mode
    }
  }, [mode, onChange, tapModeRef])

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setMode('setStart')}
        style={{
          padding: '5px 9px',
          borderRadius: 8,
          background: mode === 'setStart' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${SETTINGS.colors.panelBorder}`,
          color: 'white',
          fontWeight: 800,
          fontSize: 11,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        Start
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setMode('setGoal')}
        style={{
          padding: '5px 9px',
          borderRadius: 8,
          background: mode === 'setGoal' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${SETTINGS.colors.panelBorder}`,
          color: 'white',
          fontWeight: 800,
          fontSize: 11,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        Goal
      </button>
    </div>
  )
}

function TapModeController({
  isRunning,
  start,
  goal,
  setStart,
  setGoal,
  tapModeRef,
}: {
  isRunning: boolean
  start: NodeId
  goal: NodeId
  setStart: (v: NodeId) => void
  setGoal: (v: NodeId) => void
  tapModeRef: React.RefObject<TapMode>
}) {
  // This component monkey-patches node clicks by attaching a global handler the SVG groups can call.
  // To keep code simple: we expose a stable handler via ref on window.
  const setStartStable = useRef(setStart)
  const setGoalStable = useRef(setGoal)
  const startStable = useRef(start)
  const goalStable = useRef(goal)
  const runningStable = useRef(isRunning)

  useEffect(() => {
    setStartStable.current = setStart
    setGoalStable.current = setGoal
    startStable.current = start
    goalStable.current = goal
    runningStable.current = isRunning
  }, [isRunning, setGoal, setStart, start, goal])

  useEffect(() => {
    interface WindowWithPF extends Window {
      __PF_TAP_NODE__?: (id: NodeId) => void
    }
    const win = window as WindowWithPF
    win.__PF_TAP_NODE__ = (id: NodeId) => {
      if (runningStable.current) return
      const mode = tapModeRef.current
      if (mode === 'setStart') {
        if (id === goalStable.current) return
        setStartStable.current(id)
      } else {
        if (id === startStable.current) return
        setGoalStable.current(id)
      }
    }
    return () => {
      if (win.__PF_TAP_NODE__) delete win.__PF_TAP_NODE__
    }
  }, [tapModeRef])

  // We don’t render anything — this just sets up the handler.
  return null
}
