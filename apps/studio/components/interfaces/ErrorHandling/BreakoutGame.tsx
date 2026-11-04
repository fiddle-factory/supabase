import React, { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Button, cn } from 'ui'

import {
  BALL_RADIUS,
  BALL_SPEED,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  BRICK_COLUMNS,
  BRICK_GAP,
  BRICK_ROWS,
  circleIntersectsRect,
  clampPaddleX,
  createBall,
  createBricks,
  getPaddleBounce,
  PADDLE_HEIGHT,
  PADDLE_OFFSET_BOTTOM,
  PADDLE_SPEED,
  PADDLE_WIDTH,
  POINTS_PER_BRICK,
  STARTING_LIVES,
  type Ball,
  type Brick,
} from './BreakoutGame.utils'

type GameStatus = 'ready' | 'playing' | 'won' | 'lost'

const PADDLE_Y = BOARD_HEIGHT - PADDLE_OFFSET_BOTTOM - PADDLE_HEIGHT

// Tailwind token classes used to resolve design-system colors for the canvas
const BRICK_COLOR_CLASSES = [
  'text-destructive',
  'text-warning',
  'text-brand',
  'text-foreground-light',
  'text-foreground-lighter',
]
const FOREGROUND_INDEX = BRICK_COLOR_CLASSES.length
const BRAND_INDEX = 2

// Hex approximations of the design tokens above. While a color still equals its default,
// the theme token is used instead so the game keeps following light/dark mode.
const DEFAULT_BRICK_ROW_COLORS = ['#e54d2e', '#db8e00', '#3ecf8e', '#b4b4b4', '#898989']
const DEFAULT_PADDLE_COLOR = '#ededed'
const DEFAULT_BALL_COLOR = '#3ecf8e'
const DEFAULT_BOARD_BACKGROUND = '#1f1f1f'
const DEFAULT_BRICK_RADIUS = 3

const isDefaultColor = (value: string, defaultValue: string) =>
  value.toLowerCase() === defaultValue.toLowerCase()

export const BreakoutGame = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)

  // Tunable appearance and gameplay settings
  const [brickRow1Color, setBrickRow1Color] = useState(DEFAULT_BRICK_ROW_COLORS[0])
  const [brickRow2Color, setBrickRow2Color] = useState(DEFAULT_BRICK_ROW_COLORS[1])
  const [brickRow3Color, setBrickRow3Color] = useState(DEFAULT_BRICK_ROW_COLORS[2])
  const [brickRow4Color, setBrickRow4Color] = useState(DEFAULT_BRICK_ROW_COLORS[3])
  const [brickRow5Color, setBrickRow5Color] = useState(DEFAULT_BRICK_ROW_COLORS[4])
  const [brickGap, setBrickGap] = useState(BRICK_GAP)
  const [brickRadius, setBrickRadius] = useState(DEFAULT_BRICK_RADIUS)

  const [paddleColor, setPaddleColor] = useState(DEFAULT_PADDLE_COLOR)
  const [paddleWidth, setPaddleWidth] = useState(PADDLE_WIDTH)
  const [ballColor, setBallColor] = useState(DEFAULT_BALL_COLOR)
  const [ballRadius, setBallRadius] = useState(BALL_RADIUS)
  const [ballSpeed, setBallSpeed] = useState(BALL_SPEED)

  const [brickRows, setBrickRows] = useState(BRICK_ROWS)
  const [brickColumns, setBrickColumns] = useState(BRICK_COLUMNS)
  const [boardBackground, setBoardBackground] = useState(DEFAULT_BOARD_BACKGROUND)
  const [showScore, setShowScore] = useState(true)
  const [showLives, setShowLives] = useState(true)

  const settings = {
    brickRowColors: [brickRow1Color, brickRow2Color, brickRow3Color, brickRow4Color, brickRow5Color],
    brickGap,
    brickRadius,
    brickRows,
    brickColumns,
    paddleColor,
    paddleWidth,
    ballColor,
    ballRadius,
    ballSpeed,
  }
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  })

  // geneditor-listener-start
  React.useEffect(() => {
    const el = document.querySelector('[data-config-id="BreakoutGame-bricks"]')
    if (!el) return
    const handler = (e: Event) => {
      const p = (e as CustomEvent).detail as Record<string, unknown>
      if (typeof p.brickRow1Color === 'string') setBrickRow1Color(p.brickRow1Color)
      if (typeof p.brickRow2Color === 'string') setBrickRow2Color(p.brickRow2Color)
      if (typeof p.brickRow3Color === 'string') setBrickRow3Color(p.brickRow3Color)
      if (typeof p.brickRow4Color === 'string') setBrickRow4Color(p.brickRow4Color)
      if (typeof p.brickRow5Color === 'string') setBrickRow5Color(p.brickRow5Color)
      if (typeof p.brickGap === 'number') setBrickGap(p.brickGap)
      if (typeof p.brickRadius === 'number') setBrickRadius(p.brickRadius)
    }
    el.addEventListener('animation:update', handler)
    return () => el.removeEventListener('animation:update', handler)
  }, [])
  // geneditor-listener-end

  // geneditor-listener-start
  React.useEffect(() => {
    const el = document.querySelector('[data-config-id="BreakoutGame-paddle-ball"]')
    if (!el) return
    const handler = (e: Event) => {
      const p = (e as CustomEvent).detail as Record<string, unknown>
      if (typeof p.paddleColor === 'string') setPaddleColor(p.paddleColor)
      if (typeof p.paddleWidth === 'number') setPaddleWidth(p.paddleWidth)
      if (typeof p.ballColor === 'string') setBallColor(p.ballColor)
      if (typeof p.ballRadius === 'number') setBallRadius(p.ballRadius)
      if (typeof p.ballSpeed === 'number') setBallSpeed(p.ballSpeed)
    }
    el.addEventListener('animation:update', handler)
    return () => el.removeEventListener('animation:update', handler)
  }, [])
  // geneditor-listener-end

  // geneditor-listener-start
  React.useEffect(() => {
    const el = document.querySelector('[data-config-id="BreakoutGame-board"]')
    if (!el) return
    const handler = (e: Event) => {
      const p = (e as CustomEvent).detail as Record<string, unknown>
      if (typeof p.brickRows === 'number') setBrickRows(p.brickRows)
      if (typeof p.brickColumns === 'number') setBrickColumns(p.brickColumns)
      if (typeof p.boardBackground === 'string') setBoardBackground(p.boardBackground)
      if (typeof p.showScore === 'boolean') setShowScore(p.showScore)
      if (typeof p.showLives === 'boolean') setShowLives(p.showLives)
    }
    el.addEventListener('animation:update', handler)
    return () => el.removeEventListener('animation:update', handler)
  }, [])
  // geneditor-listener-end

  const paddleXRef = useRef((BOARD_WIDTH - PADDLE_WIDTH) / 2)
  const ballRef = useRef<Ball>(createBall(paddleXRef.current))
  const bricksRef = useRef<Brick[]>(createBricks())
  const keysRef = useRef({ left: false, right: false })
  const statusRef = useRef<GameStatus>('ready')
  const scoreRef = useRef(0)
  const livesRef = useRef(STARTING_LIVES)

  const [status, setStatus] = useState<GameStatus>('ready')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(STARTING_LIVES)

  const isGameOver = status === 'won' || status === 'lost'

  const updateStatus = (next: GameStatus) => {
    statusRef.current = next
    setStatus(next)
  }

  const getBallOptions = () => {
    const s = settingsRef.current
    return { paddleWidth: s.paddleWidth, radius: s.ballRadius, speed: s.ballSpeed }
  }

  const getBrickOptions = () => {
    const s = settingsRef.current
    return { rows: s.brickRows, columns: s.brickColumns, gap: s.brickGap }
  }

  // Rebuild the wall when its layout changes
  useEffect(() => {
    bricksRef.current = createBricks({ rows: brickRows, columns: brickColumns, gap: brickGap })
  }, [brickRows, brickColumns, brickGap])

  // Keep the paddle on the board when its width changes
  useEffect(() => {
    paddleXRef.current = clampPaddleX(paddleXRef.current, paddleWidth)
  }, [paddleWidth])

  // Rescale the ball velocity when its speed changes
  useEffect(() => {
    const ball = ballRef.current
    const current = Math.hypot(ball.dx, ball.dy)
    if (current === 0) return
    ball.dx = (ball.dx / current) * ballSpeed
    ball.dy = (ball.dy / current) * ballSpeed
  }, [ballSpeed])

  const handleRestart = () => {
    const { paddleWidth } = settingsRef.current
    paddleXRef.current = (BOARD_WIDTH - paddleWidth) / 2
    ballRef.current = createBall(paddleXRef.current, getBallOptions())
    bricksRef.current = createBricks(getBrickOptions())
    scoreRef.current = 0
    livesRef.current = STARTING_LIVES
    setScore(0)
    setLives(STARTING_LIVES)
    updateStatus('ready')
    canvasRef.current?.focus()
  }

  const handleLaunch = () => {
    if (statusRef.current === 'ready') updateStatus('playing')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === 'ArrowLeft') keysRef.current.left = true
    else if (event.key === 'ArrowRight') keysRef.current.right = true
    else if (event.key === ' ' || event.key === 'Enter') {
      if (statusRef.current === 'won' || statusRef.current === 'lost') handleRestart()
      else handleLaunch()
    } else return
    event.preventDefault()
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === 'ArrowLeft') keysRef.current.left = false
    if (event.key === 'ArrowRight') keysRef.current.right = false
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * BOARD_WIDTH
    const { paddleWidth } = settingsRef.current
    paddleXRef.current = clampPaddleX(x - paddleWidth / 2, paddleWidth)
  }

  const handlePointerDown = () => {
    canvasRef.current?.focus()
    handleLaunch()
  }

  // Game loop: synchronizes the canvas with the game state on every animation frame
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = BOARD_WIDTH * dpr
    canvas.height = BOARD_HEIGHT * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const readColor = (index: number) => {
      const el = paletteRef.current?.children[index]
      return el ? getComputedStyle(el).color : 'currentColor'
    }

    const resolveColor = (value: string, defaultValue: string, tokenIndex: number) =>
      isDefaultColor(value, defaultValue) ? readColor(tokenIndex) : value

    let frameId = 0
    let lastTime = performance.now()

    const step = (dt: number) => {
      const s = settingsRef.current
      const radius = s.ballRadius
      const keys = keysRef.current
      if (keys.left)
        paddleXRef.current = clampPaddleX(paddleXRef.current - PADDLE_SPEED * dt, s.paddleWidth)
      if (keys.right)
        paddleXRef.current = clampPaddleX(paddleXRef.current + PADDLE_SPEED * dt, s.paddleWidth)

      const ball = ballRef.current

      if (statusRef.current === 'ready') {
        ball.x = paddleXRef.current + s.paddleWidth / 2
        ball.y = PADDLE_Y - radius - 1
        return
      }
      if (statusRef.current !== 'playing') return

      ball.x += ball.dx * dt
      ball.y += ball.dy * dt

      // Walls
      if (ball.x - radius < 0) {
        ball.x = radius
        ball.dx = Math.abs(ball.dx)
      } else if (ball.x + radius > BOARD_WIDTH) {
        ball.x = BOARD_WIDTH - radius
        ball.dx = -Math.abs(ball.dx)
      }
      if (ball.y - radius < 0) {
        ball.y = radius
        ball.dy = Math.abs(ball.dy)
      }

      // Paddle
      const paddle = {
        x: paddleXRef.current,
        y: PADDLE_Y,
        width: s.paddleWidth,
        height: PADDLE_HEIGHT,
      }
      if (ball.dy > 0 && circleIntersectsRect(ball, paddle, radius)) {
        const bounce = getPaddleBounce(ball.x, paddleXRef.current, {
          paddleWidth: s.paddleWidth,
          speed: s.ballSpeed,
        })
        ball.dx = bounce.dx
        ball.dy = bounce.dy
        ball.y = PADDLE_Y - radius - 1
      }

      // Bricks (at most one hit per frame)
      const hitBrick = bricksRef.current.find(
        (brick) => !brick.isBroken && circleIntersectsRect(ball, brick, radius)
      )
      if (hitBrick) {
        hitBrick.isBroken = true
        const overlapX = Math.min(
          ball.x + radius - hitBrick.x,
          hitBrick.x + hitBrick.width - (ball.x - radius)
        )
        const overlapY = Math.min(
          ball.y + radius - hitBrick.y,
          hitBrick.y + hitBrick.height - (ball.y - radius)
        )
        if (overlapX < overlapY) ball.dx = -ball.dx
        else ball.dy = -ball.dy

        scoreRef.current += POINTS_PER_BRICK * Math.max(1, s.brickRows - hitBrick.row)
        setScore(scoreRef.current)
        if (bricksRef.current.every((brick) => brick.isBroken)) updateStatus('won')
      }

      // Missed the ball
      if (ball.y - radius > BOARD_HEIGHT) {
        livesRef.current -= 1
        setLives(livesRef.current)
        ballRef.current = createBall(paddleXRef.current, {
          paddleWidth: s.paddleWidth,
          radius: s.ballRadius,
          speed: s.ballSpeed,
        })
        updateStatus(livesRef.current <= 0 ? 'lost' : 'ready')
      }
    }

    const draw = () => {
      const s = settingsRef.current
      ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)

      bricksRef.current.forEach((brick) => {
        if (brick.isBroken) return
        const colorIndex = brick.row % BRICK_COLOR_CLASSES.length
        ctx.fillStyle = resolveColor(
          s.brickRowColors[colorIndex],
          DEFAULT_BRICK_ROW_COLORS[colorIndex],
          colorIndex
        )
        ctx.beginPath()
        ctx.roundRect(
          brick.x,
          brick.y,
          brick.width,
          brick.height,
          Math.min(s.brickRadius, brick.height / 2, brick.width / 2)
        )
        ctx.fill()
      })

      ctx.fillStyle = resolveColor(s.paddleColor, DEFAULT_PADDLE_COLOR, FOREGROUND_INDEX)
      ctx.beginPath()
      ctx.roundRect(paddleXRef.current, PADDLE_Y, s.paddleWidth, PADDLE_HEIGHT, 4)
      ctx.fill()

      if (statusRef.current !== 'lost') {
        ctx.fillStyle = resolveColor(s.ballColor, DEFAULT_BALL_COLOR, BRAND_INDEX)
        ctx.beginPath()
        ctx.arc(ballRef.current.x, ballRef.current.y, s.ballRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = (time: number) => {
      // Cap the delta so the ball doesn't tunnel after a tab switch
      const dt = Math.min((time - lastTime) / 1000, 1 / 30)
      lastTime = time
      step(dt)
      draw()
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <div
      data-config-id="BreakoutGame-board"
      className={cn('flex w-full max-w-[480px] flex-col gap-2', className)}
    >
      <div aria-hidden className="hidden" ref={paletteRef}>
        {BRICK_COLOR_CLASSES.map((colorClass) => (
          <span key={colorClass} className={colorClass} />
        ))}
        <span className="text-foreground" />
      </div>

      {(showScore || showLives) && (
        <div className="flex items-center justify-between text-sm">
          {showScore && (
            <p className="text-foreground-light">
              Score <span className="font-mono text-foreground">{score}</span>
            </p>
          )}
          {showLives && (
            <p className="ml-auto text-foreground-light">
              Lives <span className="font-mono text-foreground">{lives}</span>
            </p>
          )}
        </div>
      )}

      <div
        data-config-id="BreakoutGame-bricks"
        className="relative overflow-hidden rounded-md border bg-surface-100"
        style={{
          backgroundColor: isDefaultColor(boardBackground, DEFAULT_BOARD_BACKGROUND)
            ? undefined
            : boardBackground,
        }}
      >
        <canvas
          ref={canvasRef}
          data-config-id="BreakoutGame-paddle-ball"
          tabIndex={0}
          aria-label="Breakout game. Use the left and right arrow keys or your mouse to move the paddle. Press space to launch the ball."
          className="block w-full cursor-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
          style={{ aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}` }}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onBlur={() => (keysRef.current = { left: false, right: false })}
        />

        {status === 'ready' && (
          <p className="pointer-events-none absolute inset-x-0 bottom-10 text-center text-xs text-foreground-lighter">
            Click or press space to launch
          </p>
        )}

        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-100/90">
            <p className="text-lg text-foreground">
              {status === 'won' ? 'You cleared every brick' : 'Game over'}
            </p>
            <p className="text-sm text-foreground-light">
              Final score <span className="font-mono text-foreground">{score}</span>
            </p>
            <Button variant="default" onClick={handleRestart}>
              Play again
            </Button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-foreground-lighter">
        Move the paddle with ← → or your mouse while we sort things out
      </p>
    </div>
  )
}
