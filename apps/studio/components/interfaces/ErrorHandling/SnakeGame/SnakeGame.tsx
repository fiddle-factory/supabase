import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
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

const CELL_SIZE = 16
const TICK_MS = 120

export const SnakeGame = () => {
  const boardRef = useRef<HTMLDivElement>(null)
  const [game, setGame] = useState(() => createInitialState())
  const [bestScore, setBestScore] = useState(0)
  const nextDirectionRef = useRef<Direction>(game.direction)

  const isIdle = game.status === 'idle'
  const isPlaying = game.status === 'playing'
  const isOver = game.status === 'over'

  useEffect(() => {
    if (!isPlaying) return
    const interval = window.setInterval(() => {
      setGame((current) => advanceSnake(current, nextDirectionRef.current))
    }, TICK_MS)
    return () => window.clearInterval(interval)
  }, [isPlaying])

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
        style={{ width: GRID_COLUMNS * CELL_SIZE + 2, height: GRID_ROWS * CELL_SIZE + 2 }}
      >
        <div
          aria-hidden
          className="absolute rounded-full bg-destructive"
          style={{
            width: CELL_SIZE - 6,
            height: CELL_SIZE - 6,
            left: game.food.x * CELL_SIZE + 3,
            top: game.food.y * CELL_SIZE + 3,
          }}
        />
        {game.snake.map((segment, index) => (
          <div
            key={index}
            aria-hidden
            className={cn('absolute rounded-sm', index === 0 ? 'bg-brand-default' : 'bg-brand-600')}
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              left: segment.x * CELL_SIZE + 1,
              top: segment.y * CELL_SIZE + 1,
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
