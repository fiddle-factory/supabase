import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button, cn } from 'ui'

import {
  advanceSnake,
  createInitialState,
  getDirectionFromKey,
  GRID_SIZE,
  type Direction,
  type SnakeState,
} from './SnakeGame.utils'

const TICK_MS = 120
const CELL_PERCENT = 100 / GRID_SIZE

type GameStatus = 'idle' | 'playing' | 'over'

export const SnakeGame = () => {
  const boardRef = useRef<HTMLDivElement>(null)
  const nextDirectionRef = useRef<Direction>('right')
  const [game, setGame] = useState<SnakeState>(() => createInitialState())
  const [hasStarted, setHasStarted] = useState(false)
  const [bestScore, setBestScore] = useState(0)

  let status: GameStatus = 'playing'
  if (!hasStarted) status = 'idle'
  if (game.isGameOver) status = 'over'

  useEffect(() => {
    if (status !== 'playing') return
    const interval = window.setInterval(() => {
      setGame((current) => advanceSnake(current, nextDirectionRef.current))
    }, TICK_MS)
    return () => window.clearInterval(interval)
  }, [status])

  const handleStart = () => {
    setBestScore((best) => Math.max(best, game.score))
    nextDirectionRef.current = 'right'
    setGame(createInitialState())
    setHasStarted(true)
    boardRef.current?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = getDirectionFromKey(event.key)
    if (direction) {
      event.preventDefault()
      nextDirectionRef.current = direction
      if (status === 'idle') setHasStarted(true)
      return
    }
    if ((event.key === ' ' || event.key === 'Enter') && status !== 'playing') {
      event.preventDefault()
      handleStart()
    }
  }

  return (
    <div className="flex w-[240px] flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground-light">
          Score <span className="font-mono text-foreground">{game.score}</span>
        </span>
        <span className="text-foreground-lighter">
          Best <span className="font-mono">{Math.max(bestScore, game.score)}</span>
        </span>
      </div>
      <div
        ref={boardRef}
        role="application"
        aria-label="Snake game. Use the arrow keys or WASD to move."
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-md border border-default bg-surface-100',
          'outline-none focus-visible:ring-1 focus-visible:ring-brand'
        )}
      >
        <div
          className="absolute rounded-full bg-warning"
          style={{
            left: `${game.food.x * CELL_PERCENT}%`,
            top: `${game.food.y * CELL_PERCENT}%`,
            width: `${CELL_PERCENT}%`,
            height: `${CELL_PERCENT}%`,
            transform: 'scale(0.7)',
          }}
        />
        {game.snake.map((segment, index) => (
          <div
            key={index}
            className={cn('absolute rounded-sm', index === 0 ? 'bg-brand' : 'bg-brand-500')}
            style={{
              left: `${segment.x * CELL_PERCENT}%`,
              top: `${segment.y * CELL_PERCENT}%`,
              width: `${CELL_PERCENT}%`,
              height: `${CELL_PERCENT}%`,
              transform: 'scale(0.9)',
            }}
          />
        ))}
        {status !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-100/80 backdrop-blur-[1px]">
            <p className="text-sm text-foreground">
              {status === 'over' ? `Game over · Score ${game.score}` : 'Pass the time?'}
            </p>
            <Button variant="default" size="tiny" onClick={handleStart}>
              {status === 'over' ? 'Play again' : 'Play Snake'}
            </Button>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-foreground-lighter">
        Use the arrow keys or WASD to move
      </p>
    </div>
  )
}
