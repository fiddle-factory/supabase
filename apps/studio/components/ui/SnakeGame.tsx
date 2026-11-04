import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Button, cn } from 'ui'

type Point = { x: number; y: number }
type Status = 'idle' | 'playing' | 'over'

const DEFAULT_COLS = 20
const DEFAULT_CELL = 14
const DEFAULT_TICK_MS = 120

const getRowsForCols = (cols: number) => Math.max(8, Math.round(cols * 0.7))

const UP: Point = { x: 0, y: -1 }
const DOWN: Point = { x: 0, y: 1 }
const LEFT: Point = { x: -1, y: 0 }
const RIGHT: Point = { x: 1, y: 0 }

const KEY_TO_DIRECTION: Record<string, Point> = {
  ArrowUp: UP,
  ArrowDown: DOWN,
  ArrowLeft: LEFT,
  ArrowRight: RIGHT,
  w: UP,
  s: DOWN,
  a: LEFT,
  d: RIGHT,
}

const isSamePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y

const createInitialSnake = (rows: number): Point[] => {
  const y = Math.floor(rows / 2)
  return [
    { x: 6, y },
    { x: 5, y },
    { x: 4, y },
  ]
}

const getRandomFood = (snake: Point[], cols: number, rows: number): Point => {
  const free: Point[] = []
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) free.push({ x, y })
    }
  }
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

const createInitialGame = (cols: number, rows: number) => ({
  snake: createInitialSnake(rows),
  food: { x: Math.max(8, cols - 6), y: Math.floor(rows / 2) } as Point,
  direction: RIGHT,
  queue: [] as Point[],
  score: 0,
  pendingGrowth: 0,
})

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.getAttribute('role') === 'textbox'
  )
}

interface SnakeGameProps {
  className?: string
}

export const SnakeGame = ({ className }: SnakeGameProps) => {
  const [tickMs, setTickMs] = useState(DEFAULT_TICK_MS)
  const [gridCols, setGridCols] = useState(DEFAULT_COLS)
  const [cellSize, setCellSize] = useState(DEFAULT_CELL)
  const [snakeColor, setSnakeColor] = useState('#3ecf8e')
  const [foodColor, setFoodColor] = useState('#e5484d')
  const [wrapWalls, setWrapWalls] = useState(false)
  const [growthPerFood, setGrowthPerFood] = useState(1)

  // geneditor-listener-start
  React.useEffect(() => {
    const el = document.querySelector('[data-config-id="InternalServerError.stories-div-0"]')
    if (!el) return
    const handler = (e: Event) => {
      const p = (e as CustomEvent).detail as Record<string, unknown>
      if (typeof p.tickMs === 'number') setTickMs(p.tickMs)
      if (typeof p.gridCols === 'number') setGridCols(p.gridCols)
      if (typeof p.cellSize === 'number') setCellSize(p.cellSize)
      if (typeof p.snakeColor === 'string') setSnakeColor(p.snakeColor)
      if (typeof p.foodColor === 'string') setFoodColor(p.foodColor)
      if (typeof p.wrapWalls === 'boolean') setWrapWalls(p.wrapWalls)
      if (typeof p.growthPerFood === 'number') setGrowthPerFood(p.growthPerFood)
    }
    el.addEventListener('animation:update', handler)
    return () => el.removeEventListener('animation:update', handler)
  }, [])
  // geneditor-listener-end

  const cols = Math.round(gridCols)
  const rows = getRowsForCols(cols)
  const cell = Math.round(cellSize)

  const settingsRef = useRef({ cols, rows, wrapWalls, growthPerFood })
  settingsRef.current = { cols, rows, wrapWalls, growthPerFood }

  const gameRef = useRef(createInitialGame(cols, rows))
  const [status, setStatus] = useState<Status>('idle')
  const [best, setBest] = useState(0)
  const [, forceRender] = useReducer((count: number) => count + 1, 0)

  const queueDirection = useCallback((direction: Point) => {
    const game = gameRef.current
    const last = game.queue[game.queue.length - 1] ?? game.direction
    const isReverse = last.x + direction.x === 0 && last.y + direction.y === 0
    if (isSamePoint(last, direction) || isReverse || game.queue.length >= 3) return
    game.queue.push(direction)
  }, [])

  const start = useCallback(
    (direction?: Point) => {
      const { cols, rows } = settingsRef.current
      gameRef.current = createInitialGame(cols, rows)
      if (direction) queueDirection(direction)
      setStatus('playing')
      forceRender()
    },
    [queueDirection]
  )

  const step = useCallback(() => {
    const game = gameRef.current
    const { cols, rows, wrapWalls, growthPerFood } = settingsRef.current
    const nextDirection = game.queue.shift()
    if (nextDirection) game.direction = nextDirection

    const head = game.snake[0]
    let newHead = { x: head.x + game.direction.x, y: head.y + game.direction.y }
    if (wrapWalls) {
      newHead = { x: (newHead.x + cols) % cols, y: (newHead.y + rows) % rows }
    }
    const willEat = isSamePoint(newHead, game.food)
    if (willEat) game.pendingGrowth += Math.max(0, Math.round(growthPerFood))
    const grow = game.pendingGrowth > 0
    if (grow) game.pendingGrowth -= 1
    const body = grow ? game.snake : game.snake.slice(0, -1)

    const hitWall = newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows
    const hitSelf = body.some((segment) => isSamePoint(segment, newHead))

    if (hitWall || hitSelf) {
      setBest((previous) => Math.max(previous, game.score))
      setStatus('over')
      return
    }

    game.snake = [newHead, ...body]
    if (willEat) {
      game.score += 1
      game.food = getRandomFood(game.snake, cols, rows)
    }
    forceRender()
  }, [])

  useEffect(() => {
    if (status !== 'playing') return
    const id = window.setInterval(step, tickMs)
    return () => window.clearInterval(id)
  }, [status, step, tickMs])

  // Changing the grid size invalidates positions, so reset to a fresh board
  const isFirstGridRender = useRef(true)
  useEffect(() => {
    if (isFirstGridRender.current) {
      isFirstGridRender.current = false
      return
    }
    gameRef.current = createInitialGame(cols, rows)
    setStatus('idle')
    forceRender()
  }, [cols, rows])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isEditableTarget(event.target)) return

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      const direction = KEY_TO_DIRECTION[key]

      if (direction) {
        if (status === 'over') return
        event.preventDefault()
        if (status === 'idle') start(direction)
        else queueDirection(direction)
        return
      }

      if (status === 'over' && (key === 'Enter' || key === ' ')) {
        event.preventDefault()
        start()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [status, start, queueDirection])

  const { snake, food, score } = gameRef.current

  return (
    <div className={cn('flex flex-col items-center gap-y-2', className)}>
      <div className="flex w-full items-center justify-between font-mono text-xs text-foreground-light">
        <span>
          Score <span className="text-foreground">{score}</span>
        </span>
        <span>
          Best <span className="text-foreground">{Math.max(best, status === 'over' ? score : 0)}</span>
        </span>
      </div>

      <div
        role="application"
        aria-label={`Snake game, score ${score}`}
        className="relative overflow-hidden rounded-md border bg-surface-100"
        style={{ width: cols * cell + 2, height: rows * cell + 2 }}
      >
        <div
          className="absolute rounded-full"
          style={{
            left: food.x * cell + 2,
            top: food.y * cell + 2,
            width: cell - 4,
            height: cell - 4,
            backgroundColor: foodColor,
          }}
        />
        {snake.map((segment, index) => (
          <div
            key={index}
            className="absolute rounded-sm"
            style={{
              left: segment.x * cell + 1,
              top: segment.y * cell + 1,
              width: cell - 2,
              height: cell - 2,
              backgroundColor: snakeColor,
              opacity: index === 0 ? 1 : 0.7,
            }}
          />
        ))}

        {status !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-3 bg-background/80 px-4 text-center">
            {status === 'idle' ? (
              <>
                <p className="text-sm text-foreground">Pass the time with a quick game</p>
                <Button variant="default" size="tiny" onClick={() => start()}>
                  Start game
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-y-1">
                  <p className="text-sm text-foreground">Game over</p>
                  <p className="text-xs text-foreground-light">
                    You scored {score} {score === 1 ? 'point' : 'points'}
                  </p>
                </div>
                <Button variant="default" size="tiny" onClick={() => start()}>
                  Play again
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-x-3">
        <p className="text-xs text-foreground-lighter">Use arrow keys or WASD to move</p>
      </div>
    </div>
  )
}
