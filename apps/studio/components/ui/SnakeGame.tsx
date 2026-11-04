import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Button, cn, KeyboardShortcut } from 'ui'

type Point = { x: number; y: number }
type Status = 'idle' | 'playing' | 'over'

const COLS = 20
const ROWS = 14
const CELL = 14
const TICK_MS = 120

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

const createInitialSnake = (): Point[] => [
  { x: 6, y: 7 },
  { x: 5, y: 7 },
  { x: 4, y: 7 },
]

const getRandomFood = (snake: Point[]): Point => {
  const free: Point[] = []
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) free.push({ x, y })
    }
  }
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

const createInitialGame = () => ({
  snake: createInitialSnake(),
  food: { x: 14, y: 7 } as Point,
  direction: RIGHT,
  queue: [] as Point[],
  score: 0,
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
  const gameRef = useRef(createInitialGame())
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
      gameRef.current = createInitialGame()
      if (direction) queueDirection(direction)
      setStatus('playing')
      forceRender()
    },
    [queueDirection]
  )

  const step = useCallback(() => {
    const game = gameRef.current
    const nextDirection = game.queue.shift()
    if (nextDirection) game.direction = nextDirection

    const head = game.snake[0]
    const newHead = { x: head.x + game.direction.x, y: head.y + game.direction.y }
    const willEat = isSamePoint(newHead, game.food)
    const body = willEat ? game.snake : game.snake.slice(0, -1)

    const hitWall = newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS
    const hitSelf = body.some((segment) => isSamePoint(segment, newHead))

    if (hitWall || hitSelf) {
      setBest((previous) => Math.max(previous, game.score))
      setStatus('over')
      return
    }

    game.snake = [newHead, ...body]
    if (willEat) {
      game.score += 1
      game.food = getRandomFood(game.snake)
    }
    forceRender()
  }, [])

  useEffect(() => {
    if (status !== 'playing') return
    const id = window.setInterval(step, TICK_MS)
    return () => window.clearInterval(id)
  }, [status, step])

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
        style={{ width: COLS * CELL + 2, height: ROWS * CELL + 2 }}
      >
        <div
          className="absolute rounded-full bg-destructive"
          style={{
            left: food.x * CELL + 2,
            top: food.y * CELL + 2,
            width: CELL - 4,
            height: CELL - 4,
          }}
        />
        {snake.map((segment, index) => (
          <div
            key={index}
            className={cn('absolute rounded-sm', index === 0 ? 'bg-brand' : 'bg-brand-500')}
            style={{
              left: segment.x * CELL + 1,
              top: segment.y * CELL + 1,
              width: CELL - 2,
              height: CELL - 2,
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
        <div aria-hidden="true" className="flex flex-col items-center gap-y-0.5">
          <KeyboardShortcut keys={['ArrowUp']} className="w-5 justify-center" />
          <div className="flex gap-x-0.5">
            <KeyboardShortcut keys={['ArrowLeft']} className="w-5 justify-center" />
            <KeyboardShortcut keys={['ArrowDown']} className="w-5 justify-center" />
            <KeyboardShortcut keys={['ArrowRight']} className="w-5 justify-center" />
          </div>
        </div>
        <p className="text-xs text-foreground-lighter">Use arrow keys or WASD to move</p>
      </div>
    </div>
  )
}
