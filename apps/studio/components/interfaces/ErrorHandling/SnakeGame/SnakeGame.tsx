import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Button, cn } from 'ui'

import {
  createInitialState,
  Direction,
  getDirectionFromKey,
  GRID_COLUMNS,
  GRID_ROWS,
  isOppositeDirection,
  stepSnake,
} from './SnakeGame.utils'

const CELL_SIZE = 14
const TICK_MS = 120

const formatScore = (score: number) => String(score).padStart(3, '0')

export const SnakeGame = () => {
  const [game, setGame] = useState(() => createInitialState())
  const [bestScore, setBestScore] = useState(0)
  const pendingDirection = useRef<Direction>(game.direction)
  const boardRef = useRef<HTMLDivElement>(null)

  const isPlaying = game.status === 'playing'
  const isOver = game.status === 'over'

  // Game loop timer
  useEffect(() => {
    if (!isPlaying) return
    const interval = window.setInterval(() => {
      setGame((current) => stepSnake(current, pendingDirection.current))
    }, TICK_MS)
    return () => window.clearInterval(interval)
  }, [isPlaying])

  const handleStart = () => {
    pendingDirection.current = 'right'
    setBestScore((best) => Math.max(best, game.score))
    setGame(createInitialState('playing'))
    boardRef.current?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isPlaying && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault()
      handleStart()
      return
    }
    const direction = getDirectionFromKey(event.key)
    if (!direction || !isPlaying) return
    event.preventDefault()
    if (!isOppositeDirection(game.direction, direction)) pendingDirection.current = direction
  }

  const displayedBest = Math.max(bestScore, isOver ? game.score : 0)

  return (
    <div className="flex flex-col gap-y-2 font-mono text-xs">
      <div className="flex items-center justify-between text-foreground-lighter uppercase tracking-wider">
        <span>
          Score <span className="text-foreground">{formatScore(game.score)}</span>
        </span>
        <span>
          Best <span className="text-foreground-light">{formatScore(displayedBest)}</span>
        </span>
      </div>
      <div
        ref={boardRef}
        tabIndex={0}
        role="application"
        aria-label="Snake game. Use arrow keys or WASD to move."
        onKeyDown={handleKeyDown}
        className={cn(
          'relative overflow-hidden rounded-md border border-default bg-surface-100 outline-none',
          'focus-visible:ring-2 focus-visible:ring-foreground-muted'
        )}
        style={{ width: GRID_COLUMNS * CELL_SIZE + 2, height: GRID_ROWS * CELL_SIZE + 2 }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle, var(--border-strong) 1px, transparent 1px)',
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
            backgroundPosition: `${CELL_SIZE / 2}px ${CELL_SIZE / 2}px`,
          }}
        />
        <div
          aria-hidden
          className="absolute rounded-full bg-destructive"
          style={{
            left: game.food.x * CELL_SIZE + 3,
            top: game.food.y * CELL_SIZE + 3,
            width: CELL_SIZE - 6,
            height: CELL_SIZE - 6,
          }}
        />
        {game.snake.map((segment, index) => (
          <div
            key={index}
            aria-hidden
            className={cn('absolute rounded-sm', index === 0 ? 'bg-brand-600' : 'bg-brand-default')}
            style={{
              left: segment.x * CELL_SIZE + 1,
              top: segment.y * CELL_SIZE + 1,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />
        ))}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-3 bg-surface-100/80 backdrop-blur-[1px]">
            <p className="text-foreground-light">
              {isOver ? `Game over · ${formatScore(game.score)}` : 'Play while you wait?'}
            </p>
            <Button variant="default" size="tiny" onClick={handleStart}>
              {isOver ? 'Play again' : 'Start game'}
            </Button>
          </div>
        )}
      </div>
      <p className="text-center text-foreground-muted">Arrow keys or WASD to move</p>
    </div>
  )
}
