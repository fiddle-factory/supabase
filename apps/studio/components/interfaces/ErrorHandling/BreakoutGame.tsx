import { RotateCcwIcon } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Button, cn } from 'ui'

const BOARD_WIDTH = 360
const BOARD_HEIGHT = 220
const PADDLE_WIDTH = 64
const PADDLE_HEIGHT = 6
const PADDLE_Y = BOARD_HEIGHT - 18
const PADDLE_SPEED = 320
const BALL_SIZE = 8
const BALL_SPEED = 210
const MAX_BALL_SPEED = 360
const BRICK_COLUMNS = 8
const BRICK_GAP = 4
const BRICK_TOP = 24
const BRICK_HEIGHT = 10
const BRICK_WIDTH = (BOARD_WIDTH - BRICK_GAP * (BRICK_COLUMNS + 1)) / BRICK_COLUMNS
const BRICK_ROWS = ['bg-destructive', 'bg-warning', 'bg-brand', 'bg-foreground-lighter']
const STARTING_LIVES = 3

type GameStatus = 'ready' | 'playing' | 'won' | 'lost'

type Ball = { x: number; y: number; vx: number; vy: number }

const createBricks = () => Array.from({ length: BRICK_ROWS.length * BRICK_COLUMNS }, () => true)

const restingBall = (paddleX: number): Ball => ({
  x: paddleX + PADDLE_WIDTH / 2 - BALL_SIZE / 2,
  y: PADDLE_Y - BALL_SIZE - 1,
  vx: 0,
  vy: 0,
})

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`

/**
 * A small Breakout game to pass the time on error screens.
 * Move the paddle with the mouse, touch or arrow keys; click or press Space to launch.
 */
export const BreakoutGame = () => {
  const initialPaddleX = (BOARD_WIDTH - PADDLE_WIDTH) / 2
  const paddleXRef = useRef(initialPaddleX)
  const ballRef = useRef<Ball>(restingBall(initialPaddleX))
  const bricksRef = useRef<boolean[]>(createBricks())
  const pressedKeysRef = useRef<Set<string>>(new Set())

  const [status, setStatus] = useState<GameStatus>('ready')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [lives, setLives] = useState(STARTING_LIVES)
  const [, setFrame] = useState(0)

  const isRunning = status === 'ready' || status === 'playing'

  useEffect(() => {
    if (!isRunning) return

    let animationFrame = 0
    let lastTime = performance.now()

    const step = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 1 / 30)
      lastTime = time

      const keys = pressedKeysRef.current
      const direction =
        (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) -
        (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0)
      if (direction !== 0) {
        paddleXRef.current = clamp(
          paddleXRef.current + direction * PADDLE_SPEED * dt,
          0,
          BOARD_WIDTH - PADDLE_WIDTH
        )
      }

      const paddleX = paddleXRef.current

      if (status === 'ready') {
        ballRef.current = restingBall(paddleX)
      } else {
        const ball = ballRef.current
        ball.x += ball.vx * dt
        ball.y += ball.vy * dt

        // Walls
        if (ball.x <= 0) {
          ball.x = 0
          ball.vx = Math.abs(ball.vx)
        } else if (ball.x + BALL_SIZE >= BOARD_WIDTH) {
          ball.x = BOARD_WIDTH - BALL_SIZE
          ball.vx = -Math.abs(ball.vx)
        }
        if (ball.y <= 0) {
          ball.y = 0
          ball.vy = Math.abs(ball.vy)
        }

        // Paddle
        const isTouchingPaddle =
          ball.vy > 0 &&
          ball.y + BALL_SIZE >= PADDLE_Y &&
          ball.y < PADDLE_Y + PADDLE_HEIGHT &&
          ball.x + BALL_SIZE >= paddleX &&
          ball.x <= paddleX + PADDLE_WIDTH
        if (isTouchingPaddle) {
          const offset = clamp(
            (ball.x + BALL_SIZE / 2 - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2),
            -1,
            1
          )
          const speed = Math.min(Math.hypot(ball.vx, ball.vy) * 1.03, MAX_BALL_SPEED)
          const angle = (offset * Math.PI) / 3
          ball.vx = speed * Math.sin(angle)
          ball.vy = -speed * Math.cos(angle)
          ball.y = PADDLE_Y - BALL_SIZE
        }

        // Bricks
        const bricks = bricksRef.current
        for (let index = 0; index < bricks.length; index++) {
          if (!bricks[index]) continue
          const row = Math.floor(index / BRICK_COLUMNS)
          const column = index % BRICK_COLUMNS
          const brickX = BRICK_GAP + column * (BRICK_WIDTH + BRICK_GAP)
          const brickY = BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP)

          const overlapX =
            Math.min(ball.x + BALL_SIZE, brickX + BRICK_WIDTH) - Math.max(ball.x, brickX)
          const overlapY =
            Math.min(ball.y + BALL_SIZE, brickY + BRICK_HEIGHT) - Math.max(ball.y, brickY)
          if (overlapX <= 0 || overlapY <= 0) continue

          bricks[index] = false
          if (overlapX < overlapY) {
            ball.vx = -ball.vx
          } else {
            ball.vy = -ball.vy
          }
          setScore((current) => current + (BRICK_ROWS.length - row) * 10)
          if (bricks.every((isAlive) => !isAlive)) {
            setStatus('won')
            setFrame((frame) => frame + 1)
            return
          }
          break
        }

        // Missed the ball
        if (ball.y > BOARD_HEIGHT) {
          const remainingLives = lives - 1
          setLives(remainingLives)
          setStatus(remainingLives <= 0 ? 'lost' : 'ready')
          return
        }
      }

      setFrame((frame) => frame + 1)
      animationFrame = requestAnimationFrame(step)
    }

    animationFrame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrame)
  }, [isRunning, status, lives])

  const handleLaunch = () => {
    if (status !== 'ready') return
    const angle = (Math.random() - 0.5) * (Math.PI / 3)
    ballRef.current = {
      ...restingBall(paddleXRef.current),
      vx: BALL_SPEED * Math.sin(angle),
      vy: -BALL_SPEED * Math.cos(angle),
    }
    setStatus('playing')
  }

  const handleRestart = () => {
    setBestScore(Math.max(bestScore, score))
    const paddleX = (BOARD_WIDTH - PADDLE_WIDTH) / 2
    paddleXRef.current = paddleX
    ballRef.current = restingBall(paddleX)
    bricksRef.current = createBricks()
    pressedKeysRef.current.clear()
    setScore(0)
    setLives(STARTING_LIVES)
    setStatus('ready')
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * BOARD_WIDTH
    paddleXRef.current = clamp(x - PADDLE_WIDTH / 2, 0, BOARD_WIDTH - PADDLE_WIDTH)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      if (status === 'ready') handleLaunch()
      if (status === 'won' || status === 'lost') handleRestart()
      return
    }
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) {
      event.preventDefault()
      pressedKeysRef.current.add(event.key)
    }
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    pressedKeysRef.current.delete(event.key)
  }

  const ball = ballRef.current
  const displayedBestScore = Math.max(bestScore, score)
  const isGameOver = status === 'won' || status === 'lost'

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-y-2 rounded-md border bg-surface-100 p-3">
      <div className="flex items-center justify-between gap-x-2">
        <div className="flex flex-col">
          <p className="text-sm text-foreground">Breakout</p>
          <p className="text-xs text-foreground-lighter">Break some bricks while we fix ours</p>
        </div>
        <Button
          variant="default"
          size="tiny"
          icon={<RotateCcwIcon />}
          onClick={handleRestart}
          aria-label="Restart game"
        >
          Restart
        </Button>
      </div>

      <div className="flex items-center justify-between font-mono text-xs text-foreground-light">
        <span>
          Score <span className="text-foreground">{score}</span>
        </span>
        <span>
          Best <span className="text-foreground">{displayedBestScore}</span>
        </span>
        <span aria-label={`${lives} lives remaining`}>
          Lives <span className="text-foreground">{'●'.repeat(Math.max(lives, 0))}</span>
        </span>
      </div>

      <div
        role="application"
        aria-label="Breakout game. Use the arrow keys to move and Space to launch the ball."
        tabIndex={0}
        className={cn(
          'relative w-full touch-none select-none overflow-hidden rounded border bg-studio outline-none',
          'focus-visible:ring-1 focus-visible:ring-foreground-muted',
          status === 'ready' && 'cursor-pointer'
        )}
        style={{ aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}` }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onClick={handleLaunch}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={() => pressedKeysRef.current.clear()}
      >
        {bricksRef.current.map((isAlive, index) => {
          if (!isAlive) return null
          const row = Math.floor(index / BRICK_COLUMNS)
          const column = index % BRICK_COLUMNS
          return (
            <div
              key={index}
              className={cn('absolute rounded-sm', BRICK_ROWS[row])}
              style={{
                left: toPercent(BRICK_GAP + column * (BRICK_WIDTH + BRICK_GAP), BOARD_WIDTH),
                top: toPercent(BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP), BOARD_HEIGHT),
                width: toPercent(BRICK_WIDTH, BOARD_WIDTH),
                height: toPercent(BRICK_HEIGHT, BOARD_HEIGHT),
              }}
            />
          )
        })}

        {!isGameOver && (
          <div
            className="absolute rounded-full bg-foreground"
            style={{
              left: toPercent(ball.x, BOARD_WIDTH),
              top: toPercent(ball.y, BOARD_HEIGHT),
              width: toPercent(BALL_SIZE, BOARD_WIDTH),
              height: toPercent(BALL_SIZE, BOARD_HEIGHT),
            }}
          />
        )}

        <div
          className="absolute rounded-full bg-foreground-light"
          style={{
            left: toPercent(paddleXRef.current, BOARD_WIDTH),
            top: toPercent(PADDLE_Y, BOARD_HEIGHT),
            width: toPercent(PADDLE_WIDTH, BOARD_WIDTH),
            height: toPercent(PADDLE_HEIGHT, BOARD_HEIGHT),
          }}
        />

        {status === 'ready' && (
          <p className="pointer-events-none absolute inset-x-0 top-[62%] text-center text-xs text-foreground-lighter">
            Click or press Space to launch · Move with mouse or ← →
          </p>
        )}

        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-2 bg-studio/80">
            <p className="text-sm text-foreground">
              {status === 'won' ? 'All bricks cleared 🎉' : 'Game over'}
            </p>
            <p className="text-xs text-foreground-light">Final score: {score}</p>
            <Button
              variant="primary"
              size="tiny"
              onClick={(event) => {
                event.stopPropagation()
                handleRestart()
              }}
            >
              Play again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
