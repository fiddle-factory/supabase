import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from 'ui'

type GameStatus = 'idle' | 'running' | 'over'

interface Obstacle {
  x: number
  width: number
  height: number
}

interface GameState {
  dinoY: number
  velocityY: number
  obstacles: Obstacle[]
  speed: number
  speedBoost: number
  jumpsUsed: number
  distance: number
  spawnIn: number
  legFrame: number
}

const CANVAS_HEIGHT = 160
const GROUND_OFFSET = 24
const DINO_X = 32
const DINO_WIDTH = 22
const DINO_HEIGHT = 24
const GRAVITY = 2200
const JUMP_VELOCITY = 680
const START_SPEED = 300
const MAX_SPEED = 720
const SPEED_GAIN = 8
const OBSTACLE_GAP = 1
const DEFAULT_DINO_COLOR = '#3ecf8e'

const createInitialState = (): GameState => ({
  dinoY: 0,
  velocityY: 0,
  obstacles: [],
  speed: START_SPEED,
  speedBoost: 0,
  jumpsUsed: 0,
  distance: 0,
  spawnIn: 0.9,
  legFrame: 0,
})

const formatScore = (value: number) => String(Math.floor(value)).padStart(5, '0')

/**
 * A small Chrome-style endless runner rendered on a canvas. Colors are read from the
 * design-system tokens applied to the surrounding elements so the game follows the theme.
 */
export const DinoRunnerGame = ({ className }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const accentRef = useRef<HTMLSpanElement>(null)
  const mutedRef = useRef<HTMLSpanElement>(null)

  const stateRef = useRef<GameState>(createInitialState())
  const statusRef = useRef<GameStatus>('idle')
  const widthRef = useRef(480)
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  const [status, setStatus] = useState<GameStatus>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  // Tunable movement parameters (live-tunable via AI controls)
  const [jumpVelocity, setJumpVelocity] = useState(JUMP_VELOCITY)
  const [gravity, setGravity] = useState(GRAVITY)
  const [runSpeed, setRunSpeed] = useState(START_SPEED)
  const [speedGain, setSpeedGain] = useState(SPEED_GAIN)
  const [obstacleGap, setObstacleGap] = useState(OBSTACLE_GAP)
  const [doubleJump, setDoubleJump] = useState(false)
  const [dinoColor, setDinoColor] = useState(DEFAULT_DINO_COLOR)

  const paramsRef = useRef({
    jumpVelocity,
    gravity,
    runSpeed,
    speedGain,
    obstacleGap,
    doubleJump,
    dinoColor,
  })
  paramsRef.current = { jumpVelocity, gravity, runSpeed, speedGain, obstacleGap, doubleJump, dinoColor }

  // geneditor-listener-start
  useEffect(() => {
    const el = document.querySelector('[data-config-id="InternalServerError.stories-div-0"]')
    if (!el) return
    const handler = (e: Event) => {
      const p = (e as CustomEvent).detail as Record<string, unknown>
      if (typeof p.jumpVelocity === 'number') setJumpVelocity(p.jumpVelocity)
      if (typeof p.gravity === 'number') setGravity(p.gravity)
      if (typeof p.runSpeed === 'number') setRunSpeed(p.runSpeed)
      if (typeof p.speedGain === 'number') setSpeedGain(p.speedGain)
      if (typeof p.obstacleGap === 'number') setObstacleGap(p.obstacleGap)
      if (typeof p.doubleJump === 'boolean') setDoubleJump(p.doubleJump)
      if (typeof p.dinoColor === 'string') setDinoColor(p.dinoColor)
    }
    el.addEventListener('animation:update', handler)
    return () => el.removeEventListener('animation:update', handler)
  }, [])
  // geneditor-listener-end

  const updateStatus = (next: GameStatus) => {
    statusRef.current = next
    setStatus(next)
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const width = widthRef.current
    const groundY = CANVAS_HEIGHT - GROUND_OFFSET
    const state = stateRef.current
    const foreground = getComputedStyle(canvas).color
    const customColor = paramsRef.current.dinoColor
    const accent =
      customColor && customColor.toLowerCase() !== DEFAULT_DINO_COLOR
        ? customColor
        : accentRef.current
          ? getComputedStyle(accentRef.current).color
          : foreground
    const muted = mutedRef.current ? getComputedStyle(mutedRef.current).color : foreground

    ctx.clearRect(0, 0, width, CANVAS_HEIGHT)

    // Ground line with scrolling pebbles
    ctx.fillStyle = muted
    ctx.fillRect(0, groundY, width, 1)
    const pebbleOffset = state.distance % 40
    for (let x = -pebbleOffset; x < width; x += 40) {
      ctx.fillRect(x + 8, groundY + 6, 3, 1)
      ctx.fillRect(x + 26, groundY + 11, 2, 1)
    }

    // Obstacles (server racks / cacti)
    ctx.fillStyle = foreground
    state.obstacles.forEach((obstacle) => {
      const top = groundY - obstacle.height
      ctx.fillRect(obstacle.x, top, obstacle.width, obstacle.height)
      ctx.fillStyle = muted
      for (let y = top + 4; y < groundY - 3; y += 6) {
        ctx.fillRect(obstacle.x + 2, y, obstacle.width - 4, 1)
      }
      ctx.fillStyle = foreground
    })

    // Dino
    const isOver = statusRef.current === 'over'
    const dinoTop = groundY - DINO_HEIGHT + state.dinoY
    ctx.fillStyle = accent
    // body + head
    ctx.fillRect(DINO_X, dinoTop + 8, 16, 12)
    ctx.fillRect(DINO_X + 8, dinoTop, 14, 9)
    // tail
    ctx.fillRect(DINO_X - 4, dinoTop + 10, 4, 4)
    // arm
    ctx.fillRect(DINO_X + 16, dinoTop + 13, 3, 2)
    // legs
    const isAirborne = state.dinoY < 0
    const legUp = !isAirborne && !isOver && statusRef.current === 'running' && state.legFrame % 2 === 0
    ctx.fillRect(DINO_X + 3, dinoTop + 20, 3, legUp ? 2 : 4)
    ctx.fillRect(DINO_X + 10, dinoTop + 20, 3, legUp ? 4 : 2)
    // eye
    ctx.clearRect(DINO_X + 16, dinoTop + 2, 2, 2)
    if (isOver) {
      ctx.clearRect(DINO_X + 15, dinoTop + 1, 4, 4)
      ctx.fillRect(DINO_X + 15, dinoTop + 1, 1, 1)
      ctx.fillRect(DINO_X + 18, dinoTop + 1, 1, 1)
      ctx.fillRect(DINO_X + 16, dinoTop + 2, 2, 2)
      ctx.fillRect(DINO_X + 15, dinoTop + 4, 1, 1)
      ctx.fillRect(DINO_X + 18, dinoTop + 4, 1, 1)
    }
  }, [])

  const stopLoop = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    lastTimeRef.current = null
  }

  const tick = useCallback(
    (time: number) => {
      const state = stateRef.current
      const last = lastTimeRef.current ?? time
      const dt = Math.min((time - last) / 1000, 0.05)
      lastTimeRef.current = time

      const width = widthRef.current
      const params = paramsRef.current

      // Physics
      state.velocityY += params.gravity * dt
      state.dinoY = Math.min(0, state.dinoY + state.velocityY * dt)
      if (state.dinoY === 0) {
        state.velocityY = 0
        state.jumpsUsed = 0
      }

      state.speedBoost += params.speedGain * dt
      state.speed = Math.min(Math.max(MAX_SPEED, params.runSpeed), params.runSpeed + state.speedBoost)
      state.distance += state.speed * dt
      state.legFrame = Math.floor(state.distance / 18)

      // Obstacles
      state.obstacles.forEach((obstacle) => {
        obstacle.x -= state.speed * dt
      })
      state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -10)

      state.spawnIn -= dt
      if (state.spawnIn <= 0) {
        const isCluster = Math.random() < 0.25
        state.obstacles.push({
          x: width + 10,
          width: isCluster ? 22 : 10 + Math.round(Math.random() * 6),
          height: 22 + Math.round(Math.random() * 18),
        })
        const minGap = 0.75 * (params.runSpeed / state.speed) + 0.45
        state.spawnIn = (minGap + Math.random() * 0.9) * params.obstacleGap
      }

      // Collision (slightly forgiving hitbox)
      const groundY = CANVAS_HEIGHT - GROUND_OFFSET
      const dinoLeft = DINO_X + 2
      const dinoRight = DINO_X + DINO_WIDTH - 4
      const dinoBottom = groundY + state.dinoY - 2
      const hasCollided = state.obstacles.some((obstacle) => {
        const top = groundY - obstacle.height
        return dinoRight > obstacle.x + 2 && dinoLeft < obstacle.x + obstacle.width - 2 && dinoBottom > top + 2
      })

      const nextScore = Math.floor(state.distance / 40)
      setScore(nextScore)

      if (hasCollided) {
        updateStatus('over')
        setHighScore((prev) => Math.max(prev, nextScore))
        stopLoop()
        draw()
        return
      }

      draw()
      frameRef.current = requestAnimationFrame(tick)
    },
    [draw]
  )

  const startGame = useCallback(() => {
    stopLoop()
    stateRef.current = { ...createInitialState(), speed: paramsRef.current.runSpeed }
    setScore(0)
    updateStatus('running')
    frameRef.current = requestAnimationFrame(tick)
  }, [tick])

  const jump = useCallback(() => {
    if (statusRef.current !== 'running') {
      startGame()
      return
    }
    const state = stateRef.current
    const { jumpVelocity, doubleJump } = paramsRef.current
    if (state.dinoY === 0) {
      state.velocityY = -jumpVelocity
      state.jumpsUsed = 1
    } else if (doubleJump && state.jumpsUsed < 2) {
      state.velocityY = -jumpVelocity
      state.jumpsUsed = 2
    }
  }, [startGame])

  // Redraw when the dino color changes while the game is paused
  useEffect(() => {
    if (statusRef.current !== 'running') draw()
  }, [dinoColor, draw])

  // Resize the canvas to its container (with device pixel ratio for crisp pixels)
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const resize = () => {
      const width = Math.max(240, Math.floor(container.clientWidth))
      const ratio = window.devicePixelRatio || 1
      widthRef.current = width
      canvas.width = width * ratio
      canvas.height = CANVAS_HEIGHT * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${CANVAS_HEIGHT}px`
      canvas.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0)
      draw()
    }

    resize()
    container.focus({ preventScroll: true })
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => {
      observer.disconnect()
      stopLoop()
    }
  }, [draw])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code === 'Space' || event.code === 'ArrowUp' || event.key === ' ') {
      event.preventDefault()
      jump()
    }
  }

  const hint =
    status === 'over' ? 'Game over · press space or tap to restart' : 'Press space or tap to jump'

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between text-xs font-mono text-foreground-lighter">
        <span>{hint}</span>
        <span className="tabular-nums">
          {highScore > 0 && <span className="mr-3">HI {formatScore(highScore)}</span>}
          <span className="text-foreground">{formatScore(score)}</span>
        </span>
      </div>
      <div
        ref={containerRef}
        role="button"
        tabIndex={0}
        aria-label="Runner mini-game. Press space or tap to jump."
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.focus()
          jump()
        }}
        className={cn(
          'relative w-full overflow-hidden rounded-md border bg-surface-100 cursor-pointer select-none touch-none',
          'outline-none focus-visible:ring-1 focus-visible:ring-foreground-muted'
        )}
      >
        <canvas ref={canvasRef} className="block text-foreground-light" />
        <span ref={accentRef} className="hidden text-brand" aria-hidden />
        <span ref={mutedRef} className="hidden text-foreground-muted" aria-hidden />
        {status !== 'running' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
            <p className="text-sm text-foreground">
              {status === 'over' ? 'Game over' : 'Waiting on the server?'}
            </p>
            <p className="text-xs text-foreground-light">
              {status === 'over' ? `Score ${Math.floor(score)}` : 'Click or press space to play'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
