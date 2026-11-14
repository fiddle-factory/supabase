import { KeyboardEvent, useRef } from 'react'
import { Button, cn, KeyboardShortcut } from 'ui'

import { BOARD_SIZE, getDirectionFromKey, Point } from './SnakeGame.utils'
import { useSnakeGame } from './useSnakeGame'

const CELL_PERCENT = 100 / BOARD_SIZE
const CHECKER_CELLS = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => index)

const getCellStyle = ({ x, y }: Point) => ({
  left: `${x * CELL_PERCENT}%`,
  top: `${y * CELL_PERCENT}%`,
  width: `${CELL_PERCENT}%`,
  height: `${CELL_PERCENT}%`,
})

interface SnakeGameProps {
  className?: string
}

export const SnakeGame = ({ className }: SnakeGameProps) => {
  const boardRef = useRef<HTMLDivElement>(null)
  const { game, highScore, start, turn } = useSnakeGame()

  const isIdle = game.status === 'idle'
  const isOver = game.status === 'over'
  const isPlaying = game.status === 'playing'
  const isNewHighScore = isOver && game.score > 0 && game.score >= highScore

  const startGame = () => {
    start()
    boardRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isPlaying && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      startGame()
      return
    }

    const direction = getDirectionFromKey(event.key)
    if (!direction) return
    event.preventDefault()
    turn(direction)
  }

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider">
        <div className="flex items-center gap-2 text-foreground-light">
          Score
          <span className="text-base tabular-nums text-foreground">{game.score}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground-light">
          High score
          <span className="text-base tabular-nums text-brand">{highScore}</span>
        </div>
      </div>

      <div
        ref={boardRef}
        role="application"
        aria-label="Snake game board. Use the arrow keys to steer."
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative aspect-square w-full overflow-hidden rounded-md border border-default bg-surface-100 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <div
          aria-hidden
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
        >
          {CHECKER_CELLS.map((index) => {
            const isAlternate = (Math.floor(index / BOARD_SIZE) + index) % 2 === 0
            return <div key={index} className={isAlternate ? 'bg-surface-200/40' : undefined} />
          })}
        </div>

        <div aria-hidden className="absolute p-[3px]" style={getCellStyle(game.food)}>
          <div className="h-full w-full animate-pulse rounded-full bg-warning" />
        </div>

        {game.snake.map((segment, index) => (
          <div key={index} aria-hidden className="absolute p-px" style={getCellStyle(segment)}>
            <div
              className={cn(
                'h-full w-full rounded-sm',
                index === 0 ? 'bg-brand' : 'bg-brand-500',
                isOver && 'opacity-50'
              )}
            />
          </div>
        ))}

        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 px-6 text-center backdrop-blur-sm">
            {isIdle && (
              <>
                <p className="text-lg text-foreground">Pass the time with a quick game</p>
                <p className="text-sm text-foreground-light">
                  Eat the dots, grow longer, and don’t hit the walls or yourself.
                </p>
              </>
            )}
            {isOver && (
              <>
                <p className="text-lg text-foreground">Game over</p>
                <p className="text-sm text-foreground-light">
                  {isNewHighScore
                    ? `New high score: ${game.score}`
                    : `You scored ${game.score}. Best: ${highScore}`}
                </p>
              </>
            )}
            <Button variant="primary" size="small" onClick={startGame}>
              {isIdle ? 'Start game' : 'Play again'}
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-foreground-lighter">
              Steer with
              <KeyboardShortcut keys={['ArrowUp']} />
              <KeyboardShortcut keys={['ArrowDown']} />
              <KeyboardShortcut keys={['ArrowLeft']} />
              <KeyboardShortcut keys={['ArrowRight']} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
