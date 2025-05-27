<script setup lang="ts">
import type { FeatureKey, FeaturesDb, Point } from '~/isovist/types'
import { cosine, euclidean, manhattan } from '~/isovist/diff'
import { computeFeatures, features, normalize } from '~/isovist/features'
import { orthogonalGrid, randomGrid } from '~/isovist/grid'
import { map } from '~/isovist/map'
import { useRobot } from '~/isovist/robot'
import { cast, distPointToLine } from '~/isovist/utils'

interface GlobalConfig {
  features: FeatureKey[]
  distance: {
    type: 'euclidean' | 'manhattan' | 'cosine'
    lengthPercent: number
  }
  grid: {
    show: boolean
    type: 'orthogonal' | 'random'
    nums: number
  }
  robot: {
    rays: boolean
    collision: boolean
  }

}

const obstacles = map.obstacles
const lines = obstacles.flatMap(o => o.type === 'line' ? o.line : o.lines)

const config = useSessionStorage<GlobalConfig>(
  'isovist_config',
  () => ({
    features: [],
    distance: {
      type: 'euclidean',
      lengthPercent: 50,
    },
    grid: {
      show: true,
      type: 'orthogonal',
      nums: 250,
    },
    robot: {
      rays: true,
      collision: true,
    },
  }),
)

function checkAllFeatureKeys() {
  config.value.features = []
  const keys = features.checkboxes.flatMap(
    c => ('disabled' in c && c.disabled) || c.value === 'radialLengthSequence'
      ? []
      : [c.value],
  )
  for (const k of keys) {
    config.value.features.push(k)
  }
}

function clearAllFeatureKeys() {
  config.value.features = []
}

const grid = computed(() => {
  const fn = config.value.grid.type === 'orthogonal' ? orthogonalGrid : randomGrid
  return fn({ map: map.config, obstacles, nums: config.value.grid.nums })
})

const db = computed<FeaturesDb>(() => {
  const entries = grid.value.map((viewpoint) => {
    const points = cast(viewpoint, lines)
    const features = computeFeatures(viewpoint, points, config.value.features)
    return { viewpoint, features }
  })

  const keys = Array.from(config.value.features)

  const lim = {} as FeaturesDb['lim']
  for (const k of keys) {
    if (k === 'radialLengthSequence') {
      continue
    }

    for (const entry of entries) {
      const features = entry.features
      if (!lim[k]) {
        lim[k] = {
          min: Number.POSITIVE_INFINITY,
          max: Number.NEGATIVE_INFINITY,
        }
      }

      if (!features[k])
        continue

      if (features[k] < lim[k].min) {
        lim[k].min = features[k]
      }

      if (features[k] > lim[k].max) {
        lim[k].max = features[k]
      }
    }
  }

  for (const k of keys) {
    if (k === 'radialLengthSequence') {
      continue
    }

    const { min, max } = lim[k]

    for (const entry of entries) {
      const features = entry.features
      if (!features[k])
        continue

      features[k] = normalize(features[k], min, max)
    }
  }

  return { lim, entries }
})

const robot = useRobot({ x: 300, y: 90, speed: 1 })
const topkPoints = shallowRef<Point[]>()
const hoverPoint = shallowRef<Point>()
const finding = shallowRef(false)

function predict(viewpoint: Point, k = 3, step = map.config.cell / 5) {
  const viewpoints = []

  if (step) {
    for (let dx = -step; dx <= step; dx += step) {
      for (let dy = -step; dy <= step; dy += step) {
        viewpoints.push({
          x: viewpoint.x + dx,
          y: viewpoint.y + dy,
        })
      }
    }
  }
  else {
    viewpoints.push({ x: viewpoint.x, y: viewpoint.y })
  }

  const distFn = (() => {
    switch (config.value.distance.type) {
      case 'euclidean': return euclidean
      case 'manhattan': return manhattan
      case 'cosine': return cosine
    }
  })()

  const all: { viewpoint: Point, d: number }[] = []
  for (const viewpoint of viewpoints) {
    const points = cast(viewpoint, lines)
    const features = computeFeatures(viewpoint, points, config.value.features)
    if (!features)
      continue

    for (const k of config.value.features) {
      if (!features[k])
        continue

      if (k === 'radialLengthSequence') {
        continue
      }

      const { min, max } = db.value.lim[k]
      features[k] = normalize(features[k], min, max)
    }

    const matches: typeof all = []
    for (const entry of db.value.entries) {
      if (!entry.features)
        continue

      const d = distFn(features, entry.features, config.value.distance.lengthPercent)
      matches.push({ viewpoint: entry.viewpoint, d })
    }

    matches.sort((a, b) => a.d - b.d)
    all.push(...matches.slice(0, k))
  }

  all.sort((a, b) => a.d - b.d)

  const res: Point[] = []
  while (res.length < k) {
    const point = all.splice(0, 1)[0].viewpoint
    const existed = res.find(p => p.x === point.x && p.y === point.y)

    if (!existed)
      res.push(point)
  }

  return res
}

const canvasEl = useTemplateRef('canvas')

function draw() {
  const canvas = canvasEl.value
  const ctx = canvas?.getContext('2d')
  if (!ctx || !canvas)
    return

  const style = getComputedStyle(document.documentElement)
  const bgClr = style.getPropertyValue('--background-color-default')
  const warningClr = style.getPropertyValue('--ui-warning')
  const errorClr = style.getPropertyValue('--ui-error')
  const successClr = style.getPropertyValue('--ui-success')
  const infoClr = style.getPropertyValue('--ui-info')
  const textClr = style.getPropertyValue('--ui-text')
  const textMutedClr = style.getPropertyValue('--ui-text-muted')

  // Draw background
  ctx.fillStyle = bgClr
  ctx.fillRect(0, 0, map.config.width, map.config.height)

  // Draw dots
  if (config.value.grid.show) {
    for (const g of grid.value) {
      ctx.fillStyle = textMutedClr
      ctx.beginPath()
      ctx.arc(g.x, g.y, 3, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  // Draw obstacles
  ctx.strokeStyle = textClr
  ctx.lineWidth = map.config.lineWidth
  obstacles.forEach((o) => {
    if ('border' in o && o.border) {
      ctx.lineWidth = map.config.lineWidth * 1.5
      o.lines.forEach((l) => {
        ctx.beginPath()
        ctx.moveTo(l.x1, l.y1)
        ctx.lineTo(l.x2, l.y2)
        ctx.stroke()
      })
      ctx.lineWidth = map.config.lineWidth
      return
    }

    if (o.type === 'line') {
      ctx.beginPath()
      ctx.moveTo(o.line.x1, o.line.y1)
      ctx.lineTo(o.line.x2, o.line.y2)
      ctx.stroke()
      return
    }

    if (o.fill) {
      ctx.beginPath()
      ctx.moveTo(o.lines[0].x1, o.lines[0].y1)
      o.lines.forEach((l) => {
        ctx.lineTo(l.x2, l.y2)
      })
      ctx.closePath()
      ctx.fillStyle = textClr
      // ctx.fill()
      ctx.stroke()
      return
    }

    o.lines.forEach((l) => {
      ctx.beginPath()
      ctx.moveTo(l.x1, l.y1)
      ctx.lineTo(l.x2, l.y2)
      ctx.stroke()
    })
  })

  // Draw rays
  if (config.value.robot.rays) {
    const points = cast({ x: robot.x.value, y: robot.y.value }, lines)
    ctx.lineWidth = 1
    ctx.strokeStyle = successClr
    ctx.globalAlpha = 0.4
    points.forEach((p) => {
      ctx.beginPath()
      ctx.moveTo(robot.x.value, robot.y.value)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    })
    ctx.globalAlpha = 1.0
  }

  // Draw robot
  ctx.fillStyle = errorClr
  ctx.beginPath()
  ctx.arc(robot.x.value, robot.y.value, robot.radius, 0, 2 * Math.PI)
  ctx.fill()

  // Draw topk
  if (topkPoints.value) {
    ctx.fillStyle = warningClr
    let i = 0
    for (const k of topkPoints.value) {
      ctx.beginPath()
      ctx.arc(k.x, k.y, 8 - i++, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  // Draw hover node
  if (hoverPoint.value) {
    const points = cast({ x: hoverPoint.value.x, y: hoverPoint.value.y }, lines)
    ctx.lineWidth = 1
    ctx.strokeStyle = successClr
    ctx.globalAlpha = 0.4
    points.forEach((p) => {
      ctx.beginPath()
      ctx.moveTo(hoverPoint.value!.x, hoverPoint.value!.y)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    })
    ctx.globalAlpha = 1.0

    ctx.fillStyle = infoClr
    ctx.beginPath()
    ctx.arc(hoverPoint.value.x, hoverPoint.value.y, 6, 0, 2 * Math.PI)
    ctx.fill()
  }
}

useEventListener(canvasEl, 'mousemove', useThrottleFn((event: MouseEvent) => {
  const canvas = canvasEl.value!
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const threshold = map.config.lineWidth * 2

  const entry = db.value.entries.find((e) => {
    const nearX = (x - threshold) <= e.viewpoint.x && e.viewpoint.x <= (x + threshold)
    const nearY = (y - threshold) <= e.viewpoint.y && e.viewpoint.y <= (y + threshold)
    return nearX && nearY
  })

  if (!entry)
    return

  hoverPoint.value = entry.viewpoint
}))

useEventListener(canvasEl, 'mouseout', () => {
  hoverPoint.value = undefined
})

const keys = new Set<string>()

useEventListener('keydown', (e) => {
  if (finding.value)
    return
  keys.add(e.key.toLowerCase())
})

useEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase())
})

useEventListener('keydown', (e) => {
  if (finding.value)
    return

  if (e.key.toLowerCase() === 'f') {
    if (config.value.features.includes('radialLengthSequence')) {
      finding.value = true
    }

    setTimeout(() => {
      const viewpoint = { x: robot.x.value, y: robot.y.value }
      topkPoints.value = predict(viewpoint).map(p => ({
        x: Math.round(p.x),
        y: Math.round(p.y),
      }))
      finding.value = false
    }, 100)
  }
})

function input() {
  const target = { x: robot.x.value, y: robot.y.value }

  if (keys.has('w')) {
    target.y -= robot.speed
  }
  if (keys.has('s')) {
    target.y += robot.speed
  }
  if (keys.has('a')) {
    target.x -= robot.speed
  }
  if (keys.has('d')) {
    target.x += robot.speed
  }

  target.x = Math.max(robot.radius, Math.min(target.x, map.config.width - robot.radius))
  target.y = Math.max(robot.radius, Math.min(target.y, map.config.height - robot.radius))

  if (config.value.robot.collision) {
    for (const line of lines) {
      if (distPointToLine(target, line) < robot.radius) {
        return
      }
    }
  }

  robot.x.value = target.x
  robot.y.value = target.y
}

function animate() {
  draw()
  input()
  requestAnimationFrame(animate)
}
onMounted(animate)

useEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 't') {
    test()
  }
})

function test() {
  if (!config.value.features.length)
    return

  console.log('Begin')

  let pass = 0
  const bound = map.config.cell / 5
  const viewpoints = grid.value.flatMap(p => [
    { x: p.x, y: p.y },
    { x: p.x - bound, y: p.y },
    { x: p.x + bound, y: p.y },
    { x: p.x, y: p.y - bound },
    { x: p.x, y: p.y + bound },
    { x: p.x - bound, y: p.y - bound },
    { x: p.x - bound, y: p.y + bound },
    { x: p.x + bound, y: p.y - bound },
    { x: p.x + bound, y: p.y + bound },
  ])

  for (const viewpoint of viewpoints) {
    const points = predict(viewpoint)
    let found = false
    for (const point of points) {
      if (point.x > viewpoint.x - bound
        && point.x < viewpoint.x + bound
        && point.y > viewpoint.y - bound
        && point.y < viewpoint.y + bound
      ) {
        found = true
        break
      }
    }

    if (found)
      pass += 1
  }

  const rate = (pass * 100) / viewpoints.length
  console.log(`
Grid:  ${config.value.grid.type}
Dist:  ${config.value.distance}
Feats: ${config.value.features}
Rate:  ${rate}
  `)
}
</script>

<template>
  <div class="p-6 mx-auto font-mono @container">
    <div class="grid grid-cols-1 gap-3 @min-[1200px]:grid-cols-2 @min-[1200px]:gap-6">
      <div class="relative flex flex-col gap-3 items-center justify-center">
        <Header />

        <div class="relative my-6">
          <canvas
            ref="canvas"
            :width="map.config.width"
            :height="map.config.height"
            :class="{ blur: finding }"
          />

          <div
            v-if="finding"
            class="absolute inset-0 size-full flex items-center justify-center"
          >
            <UIcon name="i-lucide:rotate-cw" class="size-20 animate-spin text-warning" />
          </div>
        </div>
        <UCard>
          <div class="grid gap-1">
            <p>
              <span class="font-extrabold text-success">W/A/S/D</span> to move
            </p>
            <p>
              <span class="font-extrabold text-success">F</span> to predict position
            </p>
            <p>
              Hover on grid node to show rays
            </p>
          </div>
        </UCard>

        <UCard class="w-full @min-[1200px]:max-w-4/5">
          <div class="grid gap-3">
            <div>
              <span class="font-extrabold">Robot: </span>
              <span class="text-success">
                ({{ robot.x.value }},{{ robot.y.value }})
              </span>
            </div>

            <div class="flex flex-wrap gap-3">
              <p class="font-extrabold">
                Top 3 positions:
              </p>
              <span
                v-for="f, i of topkPoints"
                :key="i"
              >
                <span class="text-success">{{ i + 1 }}.</span>({{ f.x }},{{ f.y }})
              </span>
            </div>
          </div>
        </UCard>
      </div>

      <div class="grid gap-3">
        <UCard>
          <div class="grid gap-3">
            <div class="flex items-center justify-between">
              <p class="font-extrabold">
                Features
              </p>
              <div class="flex gap-2">
                <UButton
                  size="xs"
                  color="success"
                  @click="checkAllFeatureKeys"
                >
                  Check all
                </UButton>
                <UButton
                  size="xs"
                  color="warning"
                  @click="clearAllFeatureKeys"
                >
                  Clear all
                </UButton>
              </div>
            </div>
            <UCheckboxGroup
              v-model="config.features"
              :items="features.checkboxes"
            >
              <template #label="{ item }">
                <template v-if="item.value === 'radialLengthSequence'">
                  <div class="flex items-center gap-6">
                    <span class="shrink-0">{{ (item as any).label }} (Slow)</span>
                    <template v-if="config.features.includes('radialLengthSequence')">
                      <div
                        class="flex items-center gap-3"
                        @click.prevent
                      >
                        <USlider
                          v-model="config.distance.lengthPercent"
                          :min="0"
                          :max="100"
                          :step="25"
                          size="xs"
                          class="w-24"
                          color="info"
                        />
                        <span class="text-xs">{{ config.distance.lengthPercent }}%</span>
                      </div>
                    </template>
                  </div>
                </template>

                <template v-else>
                  {{ (item as any).label }}
                </template>
              </template>
            </UCheckboxGroup>
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="mb-2 font-extrabold">
              Distances
            </p>
            <URadioGroup
              v-model="config.distance.type"
              orientation="horizontal"
              :items="[
                { label: 'Euclidean', value: 'euclidean' },
                { label: 'Manhattan', value: 'manhattan' },
                { label: 'Cosine', value: 'cosine' },
              ]"
              :ui="{ fieldset: 'gap-x-10' }"
            />
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="font-extrabold">
              Grid
            </p>

            <URadioGroup
              v-model="config.grid.type"
              orientation="horizontal"
              :items="[
                { label: 'Orthogonal', value: 'orthogonal' },
                { label: 'Restricted random', value: 'random' },
              ]"
              :ui="{ fieldset: 'gap-x-10', item: 'items-center' }"
            >
              <template #label="{ item, modelValue }">
                <div
                  v-if="(item as any).value === 'random' && modelValue === 'random'"
                  class="flex items-center gap-2"
                >
                  <span>{{ (item as any).label }} with </span>
                  <UInputNumber
                    v-model="config.grid.nums"
                    size="sm"
                    orientation="vertical"
                    class="w-20"
                    color="info"
                  />
                  <span>nodes</span>
                </div>
              </template>
            </URadioGroup>
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="font-extrabold">
              Others
            </p>
            <div class="flex gap-10">
              <USwitch
                v-model="config.grid.show"
                label="Grid points"
              />
              <USwitch
                v-model="config.robot.rays"
                label="Robot rays"
              />
              <USwitch
                v-model="config.robot.collision"
                label="Robot collision"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
