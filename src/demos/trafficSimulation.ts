import { useEffect, useRef, useState } from 'react'

export type NodeId = string

export interface Node {
  id: NodeId
  x: number
  y: number
}

export interface Edge {
  id: string
  from: NodeId
  to: NodeId
}

export interface TrafficVehicle {
  id: number
  currentNode: NodeId
  goalNode: NodeId
  path: NodeId[]
  pathIndex: number
  priority: number // Lower number = higher priority
  waiting: boolean // Whether vehicle is waiting for another
  progress: number // 0-1 progress along current edge to next node
}

interface AdjacencyList {
  adj: Map<NodeId, Array<{ to: NodeId; w: number; edgeId: string }>>
  mapNode: Map<NodeId, Node>
}

/**
 * Calculate path between two nodes using BFS
 */
function calculatePath(
  startNodeId: NodeId,
  goalNodeId: NodeId,
  adj: Map<NodeId, Array<{ to: NodeId; w: number; edgeId: string }>>
): NodeId[] {
  const queue: Array<{ node: NodeId; path: NodeId[] }> = [
    { node: startNodeId, path: [startNodeId] },
  ]
  const visited = new Set<NodeId>([startNodeId])
  let foundPath: NodeId[] = [startNodeId]

  while (queue.length > 0) {
    const { node, path } = queue.shift()!
    if (node === goalNodeId) {
      foundPath = path
      break
    }
    const neighbors = adj.get(node) || []
    for (const { to: neighbor } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push({ node: neighbor, path: [...path, neighbor] })
      }
    }
  }

  return foundPath
}

/**
 * Get nodes near the edges of the grid (boundary nodes)
 */
function getEdgeNodes(nodes: Node[]): Node[] {
  return nodes.filter((n) => n.x < 15 || n.x > 85 || n.y < 10 || n.y > 47)
}

/**
 * Create a new vehicle at a random edge location
 */
function createNewVehicle(
  id: number,
  nodes: Node[],
  adj: Map<NodeId, Array<{ to: NodeId; w: number; edgeId: string }>>
): TrafficVehicle {
  const edgeNodes = getEdgeNodes(nodes)
  const startNode = edgeNodes[Math.floor(Math.random() * edgeNodes.length)]
  const goalNode = edgeNodes[Math.floor(Math.random() * edgeNodes.length)]
  const path = calculatePath(startNode.id, goalNode.id, adj)

  return {
    id,
    currentNode: startNode.id,
    goalNode: goalNode.id,
    path,
    pathIndex: 0,
    priority: id,
    waiting: false,
    progress: 0,
  }
}

/**
 * Create initial vehicles with random start/goal positions
 */
function createVehicles(
  count: number,
  nodes: Node[],
  adj: Map<NodeId, Array<{ to: NodeId; w: number; edgeId: string }>>
): TrafficVehicle[] {
  const edgeNodes = getEdgeNodes(nodes)
  if (edgeNodes.length === 0 || nodes.length === 0) return []

  return Array.from({ length: count }, (_, i) => createNewVehicle(i, nodes, adj))
}

/**
 * Check if a vehicle can move to the next node without collision
 */
function canMoveToNode(
  vehicle: TrafficVehicle,
  targetNode: NodeId,
  allVehicles: TrafficVehicle[]
): boolean {
  // Check if any other vehicle is already at the target node or moving to it
  for (const other of allVehicles) {
    if (other.id === vehicle.id) continue

    // Check if other vehicle is at the target node
    if (other.currentNode === targetNode) {
      // Lower priority vehicles must wait
      return other.priority > vehicle.priority
    }

    // Check if other vehicle is about to move to the same target
    const otherNextNode = other.path[other.pathIndex + 1]
    if (otherNextNode === targetNode && !other.waiting) {
      // Both want to move to same node - priority decides
      return other.priority > vehicle.priority
    }
  }

  return true
}

/**
 * Move a vehicle to its next position or assign a new goal
 */
function moveVehicle(
  vehicle: TrafficVehicle,
  nodes: Node[],
  adj: Map<NodeId, Array<{ to: NodeId; w: number; edgeId: string }>>,
  allVehicles: TrafficVehicle[]
): TrafficVehicle {
  // If reached goal, spawn new vehicle at random edge location
  if (vehicle.pathIndex >= vehicle.path.length - 1) {
    return createNewVehicle(vehicle.id, nodes, adj)
  }

  // Get next node in path
  const nextNode = vehicle.path[vehicle.pathIndex + 1]
  if (!nextNode) {
    return { ...vehicle, waiting: false, progress: 0 }
  }

  // Increment progress smoothly
  const newProgress = Math.min(1, vehicle.progress + 0.1) // Move 10% per tick

  // When reaching the node, check if we can proceed
  if (newProgress >= 1) {
    // Check if another vehicle is blocking
    if (canMoveToNode(vehicle, nextNode, allVehicles)) {
      // Move through node smoothly without stopping
      return {
        ...vehicle,
        pathIndex: vehicle.pathIndex + 1,
        currentNode: nextNode,
        waiting: false,
        progress: 0,
      }
    } else {
      // Stop and give way - hold at 90% of edge to avoid node overlap
      return {
        ...vehicle,
        waiting: true,
        progress: 0.9,
      }
    }
  }

  // Continue moving along edge
  return {
    ...vehicle,
    waiting: false,
    progress: newProgress,
  }
}

/**
 * Custom hook for traffic simulation
 */
export function useTrafficSimulation(
  enabled: boolean,
  density: number,
  nodes: Node[],
  edges: Edge[],
  buildAdj: (nodes: Node[], edges: Edge[]) => AdjacencyList
) {
  const [vehicles, setVehicles] = useState<TrafficVehicle[]>(() => [])
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    // Always cleanup timer on dependency changes
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    // If disabled or no nodes, clear vehicles and return
    if (!enabled || nodes.length === 0) {
      setVehicles([])
      return
    }

    // Initialize vehicles
    const { adj } = buildAdj(nodes, edges)
    const initialVehicles = createVehicles(density, nodes, adj)
    setVehicles(initialVehicles)

    // Start movement interval - faster for smooth interpolation
    timerRef.current = window.setInterval(() => {
      const { adj: currentAdj } = buildAdj(nodes, edges)
      setVehicles((prev) => {
        // Move all vehicles, passing the full list for collision detection
        return prev.map((vehicle) => moveVehicle(vehicle, nodes, currentAdj, prev))
      })
    }, 50) // Update every 50ms for smooth movement

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, density, nodes, edges])

  return vehicles
}
