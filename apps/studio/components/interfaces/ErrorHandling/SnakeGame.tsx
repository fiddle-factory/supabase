import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button, cn } from 'ui'

const GRID_SIZE = 16
const CELL_SIZE = 14
const TICK_MS = 120

type Point = { x: number; y: number }
type Direction = 'up' | 'down' | 'left' | 'right'
type Status = 'idle' | 'playing' | 'over'

const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITES: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

const INITIAL_SNAKE: Point[] = [
  { x: 6, y: 8 },
  { x: 5, y: 8 },
  { x: 4, y: 8 },
]

const randomFood = (snake: Point[]): Point => {
  const free: Point[] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y })
    }
  }
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

export const SnakeGame = () => {
  const boardRef = useRef<HTMLDivElement>(null)
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Point>({ x: 11, y: 8 })
  const [status, setStatus] = useState<Status>('idle')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)

  const snakeRef = useRef<Point[]>(INITIAL_SNAKE)
  const directionRef = useRef<Direction>('right')
  const queuedDirectionRef = useRef<Direction>('right')

  const startGame = useCallback(() => {
    const initial = INITIAL_SNAKE.map((p) => ({ ...p }))
    directionRef.current = 'right'
    queuedDirectionRef.current = 'right'
    snakeRef.current = initial
    setSnake(initial)
    setFood(randomFood(initial))
    setScore(0)
    setStatus('playing')
    boardRef.current?.focus()
  }, [])

  useEffect(() => {
    if (status !== 'playing') return

    const interval = window.setInterval(() => {
      const prev = snakeRef.current
      directionRef.current = queuedDirectionRef.current
      const vector = DIRECTION_VECTORS[directionRef.current]
      const head = { x: prev[0].x + vector.x, y: prev[0].y + vector.y }

      const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID_SIZE || head.y >= GRID_SIZE
      const ateFood = head.x === food.x && head.y === food.y
      const body = ateFood ? prev : prev.slice(0, -1)
      const hitSelf = body.some((s) => s.x === head.x && s.y === head.y)

      if (hitWall || hitSelf) {
        setStatus('over')
        return
      }

      const next = [head, ...body]
      snakeRef.current = next
      setSnake(next)
      if (ateFood) {
        const updated = next.length - INITIAL_SNAKE.length
        setScore(updated)
        setBestScore((b) => Math.max(b, updated))
        setFood(randomFood(next))
      }
    }, TICK_MS)

    return () => window.clearInterval(interval)
  }, [status, food])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = KEY_TO_DIRECTION[event.key]
    if (direction) {
      event.preventDefault()
      if (status !== 'playing') {
        if (status === 'idle') startGame()
        return
      }
      if (direction !== OPPOSITES[directionRef.current]) {
        queuedDirectionRef.current = direction
      }
      return
    }
    if ((event.key === ' ' || event.key === 'Enter') && status !== 'playing') {
      event.preventDefault()
      startGame()
    }
  }

  const boardSize = GRID_SIZE * CELL_SIZE

  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-default bg-surface-100 p-3">
      <div className="flex w-full items-center justify-between text-xs" style={{ width: boardSize }}>
        <span className="text-foreground-light">
          Score <span className="font-mono text-foreground">{score}</span>
        </span>
        <span className="text-foreground-lighter">
          Best <span className="font-mono text-foreground-light">{bestScore}</span>
        </span>
      </div>
      <div
        ref={boardRef}
        role="application"
        aria-label="Snake game. Use the arrow keys to move."
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative rounded-sm border border-muted bg-background outline-none focus-visible:ring-1 focus-visible:ring-brand"
        style={{ width: boardSize + 2, height: boardSize + 2 }}
      >
        {snake.map((segment, index) => (
          <div
            key={index}
            className={cn('absolute rounded-[2px]', index === 0 ? 'bg-brand' : 'bg-brand-500')}
            style={{
              left: segment.x * CELL_SIZE + 1,
              top: segment.y * CELL_SIZE + 1,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />
        ))}
        <div
          className="absolute rounded-full bg-destructive"
          style={{
            left: food.x * CELL_SIZE + 3,
            top: food.y * CELL_SIZE + 3,
            width: CELL_SIZE - 6,
            height: CELL_SIZE - 6,
          }}
        />
        {status !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-center">
            {status === 'over' ? (
              <>
                <p className="text-sm text-foreground">Game over</p>
                <p className="text-xs text-foreground-light">You scored {score}</p>
              </>
            ) : (
              <p className="px-4 text-xs text-foreground-light">
                While you wait, play a round of snake
              </p>
            )}
            <Button variant="default" size="tiny" onClick={startGame}>
              {status === 'over' ? 'Play again' : 'Start game'}
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-foreground-lighter">Use the arrow keys to move</p>
    </div>
  )
}
