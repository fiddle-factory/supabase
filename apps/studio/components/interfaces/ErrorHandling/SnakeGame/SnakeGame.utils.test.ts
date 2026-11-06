import { describe, expect, it } from 'vitest'

import { advanceSnake, getDirectionFromKey, type SnakeState } from './SnakeGame.utils'

const baseState: SnakeState = {
  snake: [
    { x: 2, y: 2 },
    { x: 1, y: 2 },
    { x: 0, y: 2 },
  ],
  direction: 'right',
  food: { x: 10, y: 10 },
  score: 0,
  isGameOver: false,
}

describe('getDirectionFromKey', () => {
  it('maps arrow keys and WASD', () => {
    expect(getDirectionFromKey('ArrowUp')).toBe('up')
    expect(getDirectionFromKey('W')).toBe('up')
    expect(getDirectionFromKey('d')).toBe('right')
    expect(getDirectionFromKey('x')).toBeUndefined()
  })
})

describe('advanceSnake', () => {
  it('moves the snake one cell forward', () => {
    const next = advanceSnake(baseState, 'right')
    expect(next.snake[0]).toEqual({ x: 3, y: 2 })
    expect(next.snake).toHaveLength(3)
  })

  it('ignores reversing into itself', () => {
    const next = advanceSnake(baseState, 'left')
    expect(next.direction).toBe('right')
    expect(next.snake[0]).toEqual({ x: 3, y: 2 })
  })

  it('grows and scores when eating food', () => {
    const next = advanceSnake({ ...baseState, food: { x: 3, y: 2 } }, 'right', 16, () => 0)
    expect(next.score).toBe(1)
    expect(next.snake).toHaveLength(4)
  })

  it('ends the game when hitting a wall', () => {
    const next = advanceSnake({ ...baseState, direction: 'up', snake: [{ x: 2, y: 0 }] }, 'up')
    expect(next.isGameOver).toBe(true)
  })
})
