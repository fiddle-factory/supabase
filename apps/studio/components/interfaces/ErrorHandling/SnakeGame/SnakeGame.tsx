import { KeyboardEvent, useEffect, useReducer, useRef } from 'react'
import { Button, cn } from 'ui'

import {
  createInitialState,
  GRID_SIZE,
  KEY_TO_DIRECTION,
  snakeGameReducer,
  TICK_MS,
} from './SnakeGame.utils'

const CELL_SIZE = 14
const BOARD_SIZE = GRID_SIZE * CELL_SIZE

export const SnakeGame = () => {
  const [state, dispatch] = useReducer(snakeGameReducer, undefined, () => createInitialState())
  const boardRef = useRef<HTMLDivElement>(null)

  const isPlaying = state.status === 'playing'
  const isGameOver = state.status === 'over'

  useEffect(() => {
    if (!isPlaying) return
    const interval = window.setInterval(() => {
      dispatch({ type: 'tick', seed: Math.random() })
    }, TICK_MS)
    return () => window.clearInterval(interval)
  }, [isPlaying])

  const handleRestart = () => {
    dispatch({ type: 'restart' })
    boardRef.current?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = KEY_TO_DIRECTION[event.key] ?? KEY_TO_DIRECTION[event.key.toLowerCase()]
    if (direction !== undefined) {
      event.preventDefault()
      dispatch({ type: 'turn', direction })
      return
    }
    if (isGameOver && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      handleRestart()
    }
  }

  return (
    <div className="flex flex-col items-center gap-y-3" onKeyDown={handleKeyDown}>
      <div className="flex flex-col items-center gap-y-1">
        <p className="text-sm text-foreground">While you wait, play a round of Snake</p>
        <p className="text-xs text-foreground-lighter">
          Click the board, then use the arrow keys to move
        </p>
      </div>

      <div className="flex items-center justify-between text-xs" style={{ width: BOARD_SIZE + 2 }}>
        <span className="text-foreground-light">
          Score <span className="font-mono text-foreground">{state.score}</span>
        </span>
        <span className="text-foreground-light">
          Best <span className="font-mono text-foreground">{state.bestScore}</span>
        </span>
      </div>

      <div
        ref={boardRef}
        role="application"
        aria-label="Snake game board. Use the arrow keys to move."
        tabIndex={0}
        className={cn(
          'relative overflow-hidden rounded-md border border-default bg-surface-100',
          'outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
        style={{ width: BOARD_SIZE + 2, height: BOARD_SIZE + 2 }}
      >
        <div
          aria-hidden
          className="absolute rounded-full bg-destructive"
          style={{
            left: state.food.x * CELL_SIZE + 2,
            top: state.food.y * CELL_SIZE + 2,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
          }}
        />
        {state.snake.map((segment, index) => (
          <div
            key={`${segment.x}-${segment.y}-${index}`}
            aria-hidden
            className={cn('absolute rounded-sm', index === 0 ? 'bg-brand-600' : 'bg-brand')}
            style={{
              left: segment.x * CELL_SIZE + 1,
              top: segment.y * CELL_SIZE + 1,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />
        ))}

        {state.status === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-100/70">
            <p className="text-xs text-foreground-light">Press an arrow key to start</p>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-2 bg-surface-100/80">
            <p className="text-sm text-foreground">Game over</p>
            <p className="text-xs text-foreground-light">
              You scored <span className="font-mono text-foreground">{state.score}</span>
            </p>
            <Button variant="default" onClick={handleRestart}>
              Play again
            </Button>
          </div>
        )}
      </div>

      <Button variant="text" onClick={handleRestart} disabled={state.status === 'idle'}>
        Restart
      </Button>
    </div>
  )
}
