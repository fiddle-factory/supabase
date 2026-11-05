import React, { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button, cn } from 'ui'

import {
  advanceSnake,
  createInitialState,
  getDirectionFromKey,
  GRID_COLUMNS,
  GRID_ROWS,
  isOppositeDirection,
  type Direction,
} from './SnakeGame.utils'

// Dark-theme values of the default tokens; the token classes stay in effect until a value changes
const DEFAULT_SNAKE_COLOR = '#3ecf8e' // brand-default
const DEFAULT_FOOD_COLOR = '#e54d2e' // destructive
const DEFAULT_BOARD_COLOR = '#181a18' // surface-100

export const SnakeGame = () => {
  const boardRef = useRef<HTMLDivElement>(null)
  const [game, setGame] = useState(() => createInitialState())
  const [bestScore, setBestScore] = useState(0)
  const nextDirectionRef = useRef<Direction>(game.direction)

  const [snakeColor, setSnakeColor] = useState(DEFAULT_SNAKE_COLOR)
  const [foodColor, setFoodColor] = useState(DEFAULT_FOOD_COLOR)
  const [boardColor, setBoardColor] = useState(DEFAULT_BOARD_COLOR)
  const [cellSize, setCellSize] = useState(16)
  const [tickMs, setTickMs] = useState(120)
  const [showGridLines, setShowGridLines] = useState(false)
  const [segmentRadius, setSegmentRadius] = useState(2)

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
      if (typeof p.showGridLines === 'boolean') setShowGridLines(p.showGridLines)
      if (typeof p.segmentRadius === 'number') setSegmentRadius(p.segmentRadius)
    }
    el.addEventListener('animation:update', handler)
    return () => el.removeEventListener('animation:update', handler)
  }, [])
  // geneditor-listener-end

  const isCustomSnakeColor = snakeColor.toLowerCase() !== DEFAULT_SNAKE_COLOR
  const isCustomFoodColor = foodColor.toLowerCase() !== DEFAULT_FOOD_COLOR
  const isCustomBoardColor = boardColor.toLowerCase() !== DEFAULT_BOARD_COLOR

  const isIdle = game.status === 'idle'
  const isPlaying = game.status === 'playing'
  const isOver = game.status === 'over'

  useEffect(() => {
    if (!isPlaying) return
    const interval = window.setInterval(() => {
      setGame((current) => advanceSnake(current, nextDirectionRef.current))
    }, tickMs)
    return () => window.clearInterval(interval)
  }, [isPlaying, tickMs])

  useEffect(() => {
    if (isOver) setBestScore((best) => Math.max(best, game.score))
  }, [isOver, game.score])

  const startGame = () => {
    const initialState = createInitialState()
    nextDirectionRef.current = initialState.direction
    setGame({ ...initialState, status: 'playing' })
    boardRef.current?.focus({ preventScroll: true })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = getDirectionFromKey(event.key)

    if (direction) {
      event.preventDefault()
      if (isOver) return
      if (isIdle) {
        nextDirectionRef.current = isOppositeDirection(direction, game.direction)
          ? game.direction
          : direction
        setGame((current) => ({ ...current, status: 'playing' }))
        return
      }
      if (!isOppositeDirection(direction, game.direction)) nextDirectionRef.current = direction
      return
    }

    if ((event.key === ' ' || event.key === 'Enter') && !isPlaying) {
      event.preventDefault()
      startGame()
    }
  }

  return (
    <div className="flex flex-col items-center gap-y-3">
      <div className="flex w-full items-center justify-between text-xs text-foreground-light">
        <span>
          Score <span className="font-mono text-foreground">{game.score}</span>
        </span>
        <span>
          Best <span className="font-mono text-foreground">{Math.max(bestScore, game.score)}</span>
        </span>
      </div>

      <div
        ref={boardRef}
        role="application"
        aria-label="Snake game. Use the arrow keys or WASD to move."
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={cn(
          'relative overflow-hidden rounded-md border border-default bg-surface-100',
          'outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
        style={{
          width: GRID_COLUMNS * cellSize + 2,
          height: GRID_ROWS * cellSize + 2,
          backgroundColor: isCustomBoardColor ? boardColor : undefined,
          backgroundImage: showGridLines
            ? 'linear-gradient(to right, var(--border-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--border-muted) 1px, transparent 1px)'
            : undefined,
          backgroundSize: showGridLines ? `${cellSize}px ${cellSize}px` : undefined,
        }}
      >
        <div
          aria-hidden
          className="absolute rounded-full bg-destructive"
          style={{
            width: cellSize - 6,
            height: cellSize - 6,
            left: game.food.x * cellSize + 3,
            top: game.food.y * cellSize + 3,
            backgroundColor: isCustomFoodColor ? foodColor : undefined,
          }}
        />
        {game.snake.map((segment, index) => (
          <div
            key={index}
            aria-hidden
            className={cn('absolute', index === 0 ? 'bg-brand-default' : 'bg-brand-600')}
            style={{
              width: cellSize - 2,
              height: cellSize - 2,
              left: segment.x * cellSize + 1,
              top: segment.y * cellSize + 1,
              borderRadius: segmentRadius,
              backgroundColor: isCustomSnakeColor ? snakeColor : undefined,
              opacity: isCustomSnakeColor && index > 0 ? 0.75 : undefined,
            }}
          />
        ))}

        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-3 bg-background/80 text-center backdrop-blur-sm">
            {isOver && (
              <>
                <div className="space-y-1">
                  <p className="text-sm text-foreground">Game over</p>
                  <p className="text-xs text-foreground-light">You scored {game.score}</p>
                </div>
                <Button variant="default" size="tiny" onClick={startGame}>
                  Play again
                </Button>
              </>
            )}
            {isIdle && (
              <>
                <p className="text-sm text-foreground">Snake while you wait?</p>
                <Button variant="default" size="tiny" onClick={startGame}>
                  Start game
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-foreground-lighter">Use arrow keys or WASD to move</p>
    </div>
  )
}
