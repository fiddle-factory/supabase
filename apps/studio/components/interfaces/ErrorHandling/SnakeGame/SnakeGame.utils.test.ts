import { describe, expect, it } from 'vitest'

import {
  createSnakeState,
  getDirectionFromKey,
  placeFood,
  SNAKE_GRID_SIZE,
  snakeReducer,
} from './SnakeGame.utils'

describe('SnakeGame.utils', () => {
  it('maps arrow keys and WASD to directions', () => {
    expect(getDirectionFromKey('ArrowUp')).toBe('up')
    expect(getDirectionFromKey('A')).toBe('left')
    expect(getDirectionFromKey('d')).toBe('right')
    expect(getDirectionFromKey('x')).toBeUndefined()
  })

  it('never places food on the snake', () => {
    const snake = [{ x: 0, y: 0 }]
    expect(placeFood(snake, 0, 2)).toEqual({ x: 1, y: 0 })
  })

  it('ignores turning back on itself', () => {
    const state = createSnakeState()
    expect(snakeReducer(state, { type: 'turn', direction: 'left' })).toBe(state)
  })

  it('grows and scores when eating food', () => {
    const state = { ...createSnakeState(), status: 'playing' as const }
    const head = state.snake[0]
    const next = snakeReducer(
      { ...state, food: { x: head.x + 1, y: head.y } },
      { type: 'tick', random: 0 }
    )
    expect(next.score).toBe(1)
    expect(next.snake).toHaveLength(state.snake.length + 1)
  })

  it('ends the game when hitting a wall and keeps the best score', () => {
    const state = {
      ...createSnakeState(),
      status: 'playing' as const,
      score: 3,
      snake: [{ x: SNAKE_GRID_SIZE - 1, y: 0 }],
    }
    const next = snakeReducer(state, { type: 'tick', random: 0 })
    expect(next.status).toBe('over')
    expect(next.highScore).toBe(3)
    expect(snakeReducer(next, { type: 'start', random: 0 }).highScore).toBe(3)
  })
})
