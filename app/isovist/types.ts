export interface Point {
  x: number
  y: number
}

export interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

export type Obstacle
  = {
    type: 'circle'
    lines: Line[]
    cx: number
    cy: number
    r: number
    fill?: boolean
    border?: boolean
  }
  | {
    type: 'polygon'
    lines: Line[]
    fill?: boolean
  }
  | {
    type: 'line'
    line: Line
  }

export interface MapConfig {
  width: number
  height: number
  cx: number
  cy: number
  r: number
  cell: number
  lineWidth: number
}

export interface Features {
  area: number
  perimeter: number
  compactness: number
  drift: number
  radialLengthMin: number
  radialLengthMean: number
  radialLengthMax: number
  radialLengthSequence: number[]
  radialMomentMean: number
  radialMomentVariance: number
  radialMomentSkewness: number
}

export type FeatureKey = keyof Features

export interface FeaturesDb {
  lim: Record<keyof Features, { min: number, max: number }>
  entries: {
    viewpoint: Point
    features: Partial<Features>
  }[]
}

export interface FeatureDbEntry {
  viewpoint: Point
  features: Partial<Features>
}

export interface GlobalConfig {
  features: FeatureKey[]
  distance: {
    type: 'euclidean' | 'manhattan' | 'cosine'
    percent: number
  }
  grid: {
    show: boolean
    type: 'orthogonal' | 'random'
    nums: number
  }
  robot: {
    collision: boolean
  }
  lidar: {
    rays: boolean
    points: boolean
  }
  prediction: {
    show: boolean
  }
}

export type TopK = {
  d: number
  point: Point
}[]
