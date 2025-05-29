import type { FeatureKey, Features } from './types'
import { dtw } from './features'

export function euclidean(f1: Partial<Features>, f2: Partial<Features>, percent = 100) {
  let sum = 0
  const keys = Object.keys(f1) as FeatureKey[]

  for (const key of keys) {
    if (key === 'radialLengthSequence') {
      if (f1[key] && f2[key] && percent) {
        const length = Math.round((f1[key].length * percent) / 100)
        const diff = dtw(f1[key].slice(0, length), f2[key].slice(0, length))
        sum += diff * diff
      }
      continue
    }

    const v1 = f1[key]
    const v2 = f2[key]

    if (v1 && v2) {
      const diff = v1 - v2
      sum += diff * diff
    }
    else if (v1 && !v2) {
      sum += v1 * v1
    }
    else if (!v1 && v2) {
      sum += v2 * v2
    }
  }

  return Math.sqrt(sum)
}

export function manhattan(f1: Partial<Features>, f2: Partial<Features>, percent = 100) {
  let sum = 0
  const keys = Object.keys(f1) as FeatureKey[]

  for (const key of keys) {
    if (key === 'radialLengthSequence') {
      if (f1[key] && f2[key] && percent) {
        const length = Math.round((f1[key].length * percent) / 100)
        const diff = dtw(f1[key].slice(0, length), f2[key].slice(0, length))
        sum += Math.abs(diff)
      }
      continue
    }

    const v1 = f1[key]
    const v2 = f2[key]

    if (v1 && v2) {
      sum += Math.abs(v1 - v2)
    }
    else if (v1 && !v2) {
      sum += Math.abs(v1)
    }
    else if (!v1 && v2) {
      sum += Math.abs(v2)
    }
  }

  return sum
}

export function cosine(f1: Partial<Features>, f2: Partial<Features>, percent = 100) {
  let product = 0
  let magnitude1 = 0
  let magnitude2 = 0

  const keys = Object.keys(f1) as FeatureKey[]
  for (const key of keys) {
    if (key === 'radialLengthSequence') {
      if (f1[key] && f2[key] && percent) {
        const length = Math.round((f1[key].length * percent) / 100)
        const diff = dtw(f1[key].slice(0, length), f2[key].slice(0, length))
        const v = diff * diff
        product += v
        magnitude1 += v
        magnitude2 += v
      }
      continue
    }

    const v1 = f1[key]
    const v2 = f2[key]

    if (v1 && v2) {
      product += v1 * v2
      magnitude1 += v1 * v1
      magnitude2 += v2 * v2
    }
  }

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0
  }

  return 1 - product / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2))
}
