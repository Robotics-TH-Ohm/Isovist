interface Config {
  x?: number
  y?: number
  speed?: number
  radius?: number
}

export function useRobot(config: Config = {}) {
  const x = shallowRef(config.x ?? 0)
  const y = shallowRef(config.y ?? 0)
  const viewpoint = computed(() => ({ x: x.value, y: y.value }))
  const speed = config.speed ?? 2
  const radius = config.radius ?? 10

  return { x, y, viewpoint, radius, speed }
}
