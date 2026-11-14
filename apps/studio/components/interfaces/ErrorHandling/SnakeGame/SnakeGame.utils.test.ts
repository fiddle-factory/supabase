import { describe, expect, it } from 'vitest'

import {
  advanceGame,
  BOARD_SIZE,
  changeDirection,
  createInitialState,
  getDirectionFromKey,
  SnakeGameState,
} from './SnakeGame.utils'

const playing = (overrides: Partial<SnakeGameState> = {}): SnakeGameState => ({
  ...createInitialState('playing', () => 0),
  ...overrides,
})

describe('SnakeGame.utils', () => {
  it('maps arrow keys and WASD to directions', () => {
    expect(getDirectionFromKey('ArrowUp')).toBe('up')
    expect(getDirectionFromKey('D')).toBe('right')
    expect(getDirectionFromKey('x')).toBeUndefined()
  })

  it('moves the snake one cell in its direction', () => {
    const state = playing({ food: { x: 0, y: 0 } })
    const next = advanceGame(state)
    expect(next.snake[0]).toEqual({ x: state.snake[0].x + 1, y: state.snake[0].y })
    expect(next.snake).toHaveLength(state.snake.length)
  })

  it('grows and scores when eating food', () => {
    const state = playing()
    const head = state.snake[0]
    const next = advanceGame({ ...state, food: { x: head.x + 1, y: head.y } }, () => 0)
    expect(next.score).toBe(1)
    expect(next.snake).toHaveLength(state.snake.length + 1)
  })

  it('ignores reversing into itself', () => {
    const state = playing()
    expect(changeDirection(state, 'left').nextDirection).toBe('right')
    expect(changeDirection(state, 'up').nextDirection).toBe('up')
  })

  it('ends the game when hitting a wall', () => {
    const state = playing({
      snake: [{ x: BOARD_SIZE - 1, y: 0 }],
      food: { x: 0, y: 5 },
    })
    expect(advanceGame(state).status).toBe('over')
  })
})
