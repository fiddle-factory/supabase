import React, { KeyboardEvent, useEffect, useReducer, useRef, useState } from 'react'
import { Button, cn } from 'ui'

import {
  createSnakeState,
  getDirectionFromKey,
  SNAKE_GRID_SIZE,
  SNAKE_TICK_MS,
  snakeReducer,
} from './SnakeGame.utils'

const CELLS = Array.from({ length: SNAKE_GRID_SIZE * SNAKE_GRID_SIZE }, (_, index) => ({
  x: index % SNAKE_GRID_SIZE,
  y: Math.floor(index / SNAKE_GRID_SIZE),
}))

const DEFAULT_SNAKE_COLOR = '#3ecf8e'
const DEFAULT_FOOD_COLOR = '#e54d2e'
const DEFAULT_BOARD_COLOR = '#1c1c1c'

export const SnakeGame = () => {
  const boardRef = useRef<HTMLDivElement>(null)
  const [snakeColor, setSnakeColor] = useState(DEFAULT_SNAKE_COLOR)
  const [foodColor, setFoodColor] = useState(DEFAULT_FOOD_COLOR)
  const [boardColor, setBoardColor] = useState(DEFAULT_BOARD_COLOR)
  const [cellSize, setCellSize] = useState(16)
  const [tickMs, setTickMs] = useState(SNAKE_TICK_MS)
  const [cornerRadius, setCornerRadius] = useState(2)
  const [showGrid, setShowGrid] = useState(true)

  // geneditor-listener-start
  React.useEffect(() => {
    const el = document.querySelector('[data-config-id="InternalServerError.stories-div-0"]')
    if (!el) return
    const handler = (e: Event) => {
      const p = (e as CustomEvent).detail as Record<string, unknown>
      if (typeof p.snakeColor === 'string') setSnakeColor(p.snakeColor)
      if (typeof p.foodColor === 'string') setFoodColor(p.foodColor)
      if (typeof p.boardColor === 'string') setBoardColor(p.boardColor)
      if (typeof p.cellSize === 'number') setCellSize(p.cellSize)
      if (typeof p.tickMs === 'number') setTickMs(p.tickMs)
      if (typeof p.cornerRadius === 'number') setCornerRadius(p.cornerRadius)
      if (typeof p.showGrid === 'boolean') setShowGrid(p.showGrid)
    }
    el.addEventListener('animation:update', handler)
    return () => el.removeEventListener('animation:update', handler)
  }, [])
  // geneditor-listener-end

  // Colors fall back to the theme tokens until they're changed from their defaults
  const isSnakeColorCustom = snakeColor.toLowerCase() !== DEFAULT_SNAKE_COLOR
  const isFoodColorCustom = foodColor.toLowerCase() !== DEFAULT_FOOD_COLOR
  const isBoardColorCustom = boardColor.toLowerCase() !== DEFAULT_BOARD_COLOR
  const [state, dispatch] = useReducer(snakeReducer, undefined, () => createSnakeState())
  const { status, snake, food, score, highScore } = state

  const isPlaying = status === 'playing'
  const isGameOver = status === 'over'

  useEffect(() => {
    if (!isPlaying) return
    const interval = window.setInterval(
      () => dispatch({ type: 'tick', random: Math.random() }),
      tickMs
    )
    return () => window.clearInterval(interval)
  }, [isPlaying, tickMs])

  const handleRestart = () => {
    dispatch({ type: 'start', random: Math.random() })
    boardRef.current?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isGameOver && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      handleRestart()
      return
    }
    const direction = getDirectionFromKey(event.key)
    if (!direction) return
    event.preventDefault()
    dispatch({ type: 'turn', direction })
  }

  const snakeKeys = new Set(snake.map((segment) => `${segment.x}:${segment.y}`))
  const head = snake[0]

  return (
    <div className="flex flex-col items-center gap-y-3">
      <div className="flex w-full items-center justify-between text-sm">
        <p className="text-foreground-light">
          Score <span className="font-mono text-foreground">{score}</span>
        </p>
        <p className="text-foreground-light">
          Best <span className="font-mono text-foreground">{highScore}</span>
        </p>
      </div>

      <div
        ref={boardRef}
        role="application"
        aria-label="Snake game. Use the arrow keys or W, A, S, D to move."
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative grid gap-px rounded-md border border-default bg-surface-200 p-1',
          'outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
        )}
        style={{
          gridTemplateColumns: `repeat(${SNAKE_GRID_SIZE}, ${cellSize}px)`,
          gap: showGrid ? 1 : 0,
        }}
      >
        {CELLS.map((cell) => {
          const key = `${cell.x}:${cell.y}`
          const isHead = cell.x === head.x && cell.y === head.y
          const isSnake = snakeKeys.has(key)
          const isFood = cell.x === food.x && cell.y === food.y
          const isFoodCell = isFood && !isSnake
          const isEmpty = !isSnake && !isFood

          let backgroundColor: string | undefined
          if (isEmpty && isBoardColorCustom) backgroundColor = boardColor
          if (isSnake && isSnakeColorCustom) {
            backgroundColor = isHead
              ? snakeColor
              : `color-mix(in srgb, ${snakeColor} 55%, black)`
          }
          if (isFoodCell && isFoodColorCustom) backgroundColor = foodColor

          return (
            <div
              key={key}
              className={cn(
                isEmpty && 'bg-surface-100',
                isSnake && 'bg-brand-500',
                isHead && 'bg-brand',
                isFoodCell && 'bg-destructive'
              )}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: isFoodCell ? '9999px' : cornerRadius,
                backgroundColor,
              }}
            />
          )
        })}

        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-1 rounded-md bg-background/80 text-center">
            <p className="text-sm text-foreground">Pass the time while we fix things</p>
            <p className="text-xs text-foreground-light">
              Click here, then press an arrow key or W, A, S, D to start
            </p>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-3 rounded-md bg-background/80 text-center">
            <div className="flex flex-col gap-y-1">
              <p className="text-sm text-foreground">Game over</p>
              <p className="text-xs text-foreground-light">You scored {score}</p>
            </div>
            <Button variant="primary" onClick={handleRestart}>
              Play again
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-foreground-lighter">
        Arrow keys or W, A, S, D to move. Enter to restart.
      </p>
    </div>
  )
}
