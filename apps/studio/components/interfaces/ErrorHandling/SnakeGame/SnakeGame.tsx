import React, { KeyboardEvent, useEffect, useReducer, useRef, useState } from 'react'
import { Button, cn } from 'ui'

import {
  createSnakeState,
  getDirectionFromKey,
  getTickMs,
  SNAKE_GRID_SIZE,
  SNAKE_TICK_MS,
  snakeReducer,
} from './SnakeGame.utils'

export const SnakeGame = () => {
  const boardRef = useRef<HTMLDivElement>(null)
  const [tickMs, setTickMs] = useState(SNAKE_TICK_MS)
  const [speedUpMs, setSpeedUpMs] = useState(0)
  const [cellSize, setCellSize] = useState(16)
  const [boardWidth, setBoardWidth] = useState(SNAKE_GRID_SIZE)
  const [boardHeight, setBoardHeight] = useState(SNAKE_GRID_SIZE)
  const [showGrid, setShowGrid] = useState(true)
  const [showScore, setShowScore] = useState(true)

  const [state, dispatch] = useReducer(snakeReducer, undefined, () =>
    createSnakeState(0, 0.5, boardWidth, boardHeight)
  )
  const { status, snake, food, score, highScore, width, height } = state

  // geneditor-listener-start
  React.useEffect(() => {
    const el = document.querySelector('[data-config-id="SnakeGame-controls"]')
    if (!el) return
    const handler = (e: Event) => {
      const p = (e as CustomEvent).detail as Record<string, unknown>
      if (typeof p.tickMs === 'number') setTickMs(p.tickMs)
      if (typeof p.speedUpMs === 'number') setSpeedUpMs(p.speedUpMs)
      if (typeof p.cellSize === 'number') setCellSize(p.cellSize)
      if (typeof p.boardWidth === 'number') setBoardWidth(p.boardWidth)
      if (typeof p.boardHeight === 'number') setBoardHeight(p.boardHeight)
      if (typeof p.showGrid === 'boolean') setShowGrid(p.showGrid)
      if (typeof p.showScore === 'boolean') setShowScore(p.showScore)
    }
    el.addEventListener('animation:update', handler)
    return () => el.removeEventListener('animation:update', handler)
  }, [])
  // geneditor-listener-end

  // Resizing the board starts a fresh game; the reducer ignores unchanged sizes
  useEffect(() => {
    dispatch({ type: 'resize', width: boardWidth, height: boardHeight, random: Math.random() })
  }, [boardWidth, boardHeight])

  const isPlaying = status === 'playing'
  const isGameOver = status === 'over'
  const currentTickMs = getTickMs(tickMs, speedUpMs, score)

  useEffect(() => {
    if (!isPlaying) return
    const interval = window.setInterval(
      () => dispatch({ type: 'tick', random: Math.random() }),
      currentTickMs
    )
    return () => window.clearInterval(interval)
  }, [isPlaying, currentTickMs])

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

  const cells = Array.from({ length: width * height }, (_, index) => ({
    x: index % width,
    y: Math.floor(index / width),
  }))
  const snakeKeys = new Set(snake.map((segment) => `${segment.x}:${segment.y}`))
  const head = snake[0]

  return (
    <div data-config-id="SnakeGame-controls" className="flex flex-col items-center gap-y-3">
      {showScore && (
        <div className="flex w-full items-center justify-between text-sm">
          <p className="text-foreground-light">
            Score <span className="font-mono text-foreground">{score}</span>
          </p>
          <p className="text-foreground-light">
            Best <span className="font-mono text-foreground">{highScore}</span>
          </p>
        </div>
      )}

      <div
        ref={boardRef}
        role="application"
        aria-label="Snake game. Use the arrow keys or W, A, S, D to move."
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative grid rounded-md border border-default bg-surface-200 p-1',
          showGrid && 'gap-px',
          'outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
        )}
        style={{ gridTemplateColumns: `repeat(${width}, ${cellSize}px)` }}
      >
        {cells.map((cell) => {
          const key = `${cell.x}:${cell.y}`
          const isHead = cell.x === head.x && cell.y === head.y
          const isSnake = snakeKeys.has(key)
          const isFood = cell.x === food.x && cell.y === food.y

          return (
            <div
              key={key}
              className={cn(
                'rounded-sm',
                !isSnake && !isFood && 'bg-surface-100',
                isSnake && 'bg-brand-500',
                isHead && 'bg-brand',
                isFood && !isSnake && 'rounded-full bg-destructive'
              )}
              style={{ width: cellSize, height: cellSize }}
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
