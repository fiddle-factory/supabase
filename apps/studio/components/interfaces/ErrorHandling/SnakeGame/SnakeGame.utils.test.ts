import { describe, expect, it } from 'vitest'

import {
  createSnakeState,
  getDirectionFromKey,
  getTickMs,
  placeFood,
  SNAKE_GRID_SIZE,
  SNAKE_MIN_TICK_MS,
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

  it('respects a custom board size for walls and food', () => {
    const state = snakeReducer(createSnakeState(), {
      type: 'resize',
      width: 10,
      height: 8,
      random: 0.99,
    })
    expect(state).toMatchObject({ width: 10, height: 8, status: 'idle' })
    expect(state.food.x).toBeLessThan(10)
    expect(state.food.y).toBeLessThan(8)

    const atRightWall = { ...state, status: 'playing' as const, snake: [{ x: 9, y: 0 }] }
    expect(snakeReducer(atRightWall, { type: 'tick', random: 0 }).status).toBe('over')
  })

  it('speeds up per food eaten without dropping below the minimum interval', () => {
    expect(getTickMs(120, 0, 10)).toBe(120)
    expect(getTickMs(120, 5, 4)).toBe(100)
    expect(getTickMs(120, 5, 100)).toBe(SNAKE_MIN_TICK_MS)
  })
})
