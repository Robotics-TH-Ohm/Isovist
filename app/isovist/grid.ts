import type { MapConfig, Obstacle, Point } from './types'
import { distPointToLine, distPointToPoint, isPointInCircle, isPointInPolygon } from './utils'

interface Config {
  map: MapConfig
  obstacles: Obstacle[]
  nums: number
}

export function orthogonalGrid(c: Config) {
  const { map, obstacles } = c
  const lines = obstacles.flatMap(o => o.type === 'line' ? o.line : o.lines)
  const filled = obstacles.filter(o => 'fill' in o && o.fill)

  const grid: Point[] = []

  for (let x = 0; x <= map.width; x += map.cell) {
    for (let y = 0; y <= map.height; y += map.cell) {
      const point = { x, y }
      const dist = distPointToPoint(point, { x: map.cx, y: map.cy })
      if (dist > map.r) {
        continue
      }

      let inside = false
      for (const o of filled) {
        if (o.type === 'circle' && isPointInCircle(point, o.cx, o.cy, o.r)) {
          inside = true
          break
        }

        if (o.type === 'polygon' && isPointInPolygon(point, o.lines)) {
          inside = true
          break
        }
      }
      if (inside)
        continue

      const isNear = lines.some(line => distPointToLine(point, line) <= map.lineWidth)
      if (isNear)
        continue

      grid.push({ x, y })
    }
  }
  return grid
}

export function randomGrid(c: Config) {
  const { map, obstacles } = c
  const lines = obstacles.flatMap(o => o.type === 'line' ? o.line : o.lines)
  const filled = obstacles.filter(o => 'fill' in o && o.fill)

  const randomPoint = () => {
    for (let i = 0; i < 1000; i++) {
      const angle = Math.random() * 2 * Math.PI
      const r = Math.sqrt(Math.random()) * map.r
      const x = map.cx + r * Math.cos(angle)
      const y = map.cy + r * Math.sin(angle)

      const point = { x, y }
      const dist = distPointToPoint(point, { x: map.cx, y: map.cy })
      if (dist > map.r) {
        continue
      }

      let inside = false
      for (const o of filled) {
        if (o.type === 'circle' && isPointInCircle(point, o.cx, o.cy, o.r)) {
          inside = true
          break
        }

        if (o.type === 'polygon' && isPointInPolygon(point, o.lines)) {
          inside = true
          break
        }
      }
      if (inside)
        continue

      const isNear = lines.some(line => distPointToLine(point, line) <= map.lineWidth)
      if (isNear)
        continue

      return point
    }
  }

  const grid: Point[] = []
  const length = c.nums
  const initalLength = Math.floor(length / 2)

  while (grid.length < initalLength) {
    const p = randomPoint()
    if (p)
      grid.push(p)
  }

  const candidateLength = 10
  while (grid.length < length) {
    const candidates: Point[] = []

    while (candidates.length < candidateLength) {
      const p = randomPoint()
      if (p)
        candidates.push(p)
    }

    let best: Point | undefined
    let max = Number.NEGATIVE_INFINITY

    for (const candidate of candidates) {
      let min = Number.POSITIVE_INFINITY
      for (const g of grid) {
        const d = distPointToPoint(g, candidate)
        if (min > d) {
          min = d
        }
      }
      if (max < min) {
        max = min
        best = candidate
      }
    }

    if (best) {
      grid.push(best)
    }
  }

  return grid
}
