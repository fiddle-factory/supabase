import { describe, expect, it } from 'vitest'

import {
  advanceSnake,
  createInitialState,
  getDirectionFromKey,
  GRID_COLUMNS,
  type SnakeState,
} from './SnakeGame.utils'

const playing = (overrides: Partial<SnakeState> = {}): SnakeState => ({
  ...createInitialState(() => 0),
  status: 'playing',
  ...overrides,
})

describe('getDirectionFromKey', () => {
  it('maps arrow keys and WASD', () => {
    expect(getDirectionFromKey('ArrowUp')).toBe('up')
    expect(getDirectionFromKey('a')).toBe('left')
    expect(getDirectionFromKey('D')).toBe('right')
    expect(getDirectionFromKey('x')).toBeUndefined()
  })
})

describe('advanceSnake', () => {
  it('moves the snake one cell in the given direction', () => {
    const state = playing({ food: { x: 0, y: 0 } })
    const next = advanceSnake(state, 'right')
    expect(next.snake[0]).toEqual({ x: state.snake[0].x + 1, y: state.snake[0].y })
    expect(next.snake).toHaveLength(state.snake.length)
  })

  it('grows and scores when eating food', () => {
    const state = playing()
    const head = state.snake[0]
    const next = advanceSnake({ ...state, food: { x: head.x + 1, y: head.y } }, 'right')
    expect(next.score).toBe(1)
    expect(next.snake).toHaveLength(state.snake.length + 1)
  })

  it('ends the game when hitting a wall', () => {
    const state = playing({
      snake: [{ x: GRID_COLUMNS - 1, y: 0 }],
      food: { x: 0, y: 5 },
    })
    expect(advanceSnake(state, 'right').status).toBe('over')
  })
})
