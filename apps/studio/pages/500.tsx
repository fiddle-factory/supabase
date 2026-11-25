import { NextPage } from 'next'
import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button, cn } from 'ui'

import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import { useSignOut } from '@/lib/auth'

const GRID_SIZE = 18
const CELL_SIZE = 14
const TICK_MS = 120

type Point = { x: number; y: number }
type Direction = 'up' | 'down' | 'left' | 'right'
type GameStatus = 'idle' | 'playing' | 'over'

const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

const initialSnake = (): Point[] => {
  const mid = Math.floor(GRID_SIZE / 2)
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ]
}

const randomFood = (snake: Point[]): Point => {
  const free: Point[] = []
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!snake.some((p) => p.x === x && p.y === y)) free.push({ x, y })
    }
  }
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

const SnakeGame = () => {
  const [snake, setSnake] = useState<Point[]>(initialSnake)
  const [food, setFood] = useState<Point>(() => ({
    x: GRID_SIZE - 4,
    y: Math.floor(GRID_SIZE / 2),
  }))
  const [status, setStatus] = useState<GameStatus>('idle')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)

  const boardRef = useRef<HTMLDivElement>(null)
  const directionRef = useRef<Direction>('right')
  const queuedDirectionRef = useRef<Direction[]>([])
  const snakeRef = useRef(snake)
  const foodRef = useRef(food)
  snakeRef.current = snake
  foodRef.current = food

  const start = useCallback(() => {
    const fresh = initialSnake()
    directionRef.current = 'right'
    queuedDirectionRef.current = []
    setSnake(fresh)
    setFood(randomFood(fresh))
    setScore(0)
    setStatus('playing')
    boardRef.current?.focus()
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    if ((key === ' ' || key === 'Enter') && status !== 'playing') {
      event.preventDefault()
      start()
      return
    }
    const next = KEY_DIRECTIONS[key]
    if (!next) return
    event.preventDefault()
    if (status !== 'playing') {
      start()
      return
    }
    const queue = queuedDirectionRef.current
    const last = queue[queue.length - 1] ?? directionRef.current
    if (next !== last && next !== OPPOSITE[last] && queue.length < 3) queue.push(next)
  }

  useEffect(() => {
    if (status !== 'playing') return
    const id = window.setInterval(() => {
      const queued = queuedDirectionRef.current.shift()
      if (queued) directionRef.current = queued
      const vector = DIRECTION_VECTORS[directionRef.current]
      const current = snakeRef.current
      const head = { x: current[0].x + vector.x, y: current[0].y + vector.y }
      const eats = head.x === foodRef.current.x && head.y === foodRef.current.y
      const body = eats ? current : current.slice(0, -1)

      const hitsWall = head.x < 0 || head.y < 0 || head.x >= GRID_SIZE || head.y >= GRID_SIZE
      const hitsSelf = body.some((p) => p.x === head.x && p.y === head.y)
      if (hitsWall || hitsSelf) {
        setStatus('over')
        return
      }

      const nextSnake = [head, ...body]
      snakeRef.current = nextSnake
      setSnake(nextSnake)
      if (eats) {
        setScore((s) => {
          const nextScore = s + 1
          setBest((b) => Math.max(b, nextScore))
          return nextScore
        })
        const nextFood = randomFood(nextSnake)
        foodRef.current = nextFood
        setFood(nextFood)
      }
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [status])

  const boardPx = GRID_SIZE * CELL_SIZE

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex w-full items-center justify-between font-mono text-xs text-foreground-light">
        <span>
          Score <span className="text-foreground">{score}</span>
        </span>
        <span>
          Best <span className="text-foreground">{best}</span>
        </span>
      </div>
      <div
        ref={boardRef}
        role="application"
        aria-label="Snake game. Use arrow keys or WASD to move."
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative overflow-hidden rounded-md border border-default bg-surface-100 outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        style={{
          width: boardPx + 2,
          height: boardPx + 2,
          backgroundImage:
            'linear-gradient(var(--border-muted) 1px, transparent 1px), linear-gradient(90deg, var(--border-muted) 1px, transparent 1px)',
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        }}
      >
        <div
          className="absolute rounded-full bg-destructive"
          style={{
            left: food.x * CELL_SIZE + 2,
            top: food.y * CELL_SIZE + 2,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
          }}
        />
        {snake.map((segment, index) => (
          <div
            key={index}
            className={cn('absolute rounded-sm', index === 0 ? 'bg-brand' : 'bg-brand-500')}
            style={{
              left: segment.x * CELL_SIZE + 1,
              top: segment.y * CELL_SIZE + 1,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />
        ))}
        {status !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-[1px]">
            {status === 'over' ? (
              <>
                <p className="text-sm text-foreground">Game over</p>
                <p className="font-mono text-xs text-foreground-light">Score: {score}</p>
              </>
            ) : (
              <p className="px-6 text-center text-sm text-foreground-light">
                While we fix things, how about a quick game?
              </p>
            )}
            <Button variant="default" onClick={start}>
              {status === 'over' ? 'Play again' : 'Play Snake'}
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-foreground-lighter">Use arrow keys or WASD to move</p>
    </div>
  )
}

const Error500: NextPage = () => {
  const router = useRouter()
  const signOut = useSignOut()
  const { resolvedTheme } = useTheme()

  const { lastVisitedOrganization } = useLastVisitedOrganization()

  const onClickLogout = async () => {
    await signOut()
    await router.push('/sign-in')
    router.reload()
  }

  return (
    <div className="relative mx-auto flex flex-1 w-full flex-col items-center justify-center space-y-6">
      <div className="absolute top-0 mx-auto w-full max-w-7xl px-8 pt-6 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between sm:h-10">
          <div className="flex shrink-0 grow items-center lg:grow-0">
            <div className="flex w-full items-center justify-between md:w-auto">
              <Link href="/projects">
                <Image
                  src={
                    resolvedTheme?.includes('dark')
                      ? `${router.basePath}/img/supabase-dark.svg`
                      : `${router.basePath}/img/supabase-light.svg`
                  }
                  alt=""
                  height={24}
                  width={120}
                />
              </Link>
            </div>
          </div>
        </nav>
      </div>
      <div className="flex w-[320px] flex-col items-center justify-center space-y-3">
        <h4 className="text-lg">Something went wrong 🤕</h4>
        <p className="text-center">
          Sorry about that, please try again later or feel free to reach out to us if the problem
          persists.
        </p>
      </div>
      <div className="flex items-center space-x-4">
        {router.pathname !== '/organizations' ? (
          <Button variant="primary" asChild>
            <Link
              href={
                !!lastVisitedOrganization ? `/org/${lastVisitedOrganization}` : '/organizations'
              }
            >
              Head back
            </Link>
          </Button>
        ) : (
          <Button variant="primary" onClick={onClickLogout}>
            Head back
          </Button>
        )}
        <Button variant="secondary" asChild>
          <SupportLink>Submit a support request</SupportLink>
        </Button>
      </div>
      <div className="pt-4">
        <SnakeGame />
      </div>
    </div>
  )
}

export default Error500
