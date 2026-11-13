import { describe, expect, it } from 'vitest'

import { createInitialState, getDirectionFromKey, GRID_COLUMNS, stepSnake } from './SnakeGame.utils'

describe('SnakeGame.utils', () => {
  it('maps arrow keys and WASD to directions', () => {
    expect(getDirectionFromKey('ArrowUp')).toBe('up')
    expect(getDirectionFromKey('A')).toBe('left')
    expect(getDirectionFromKey('x')).toBeUndefined()
  })

  it('moves the snake forward and ignores reversing', () => {
    const state = createInitialState('playing')
    const next = stepSnake(state, 'left')
    expect(next.direction).toBe('right')
    expect(next.snake[0]).toEqual({ x: state.snake[0].x + 1, y: state.snake[0].y })
    expect(next.snake).toHaveLength(state.snake.length)
  })

  it('grows and scores when eating food', () => {
    const state = createInitialState('playing')
    const head = state.snake[0]
    const next = stepSnake({ ...state, food: { x: head.x + 1, y: head.y } }, 'right')
    expect(next.score).toBe(1)
    expect(next.snake).toHaveLength(state.snake.length + 1)
  })

  it('ends the game when hitting a wall', () => {
    const state = createInitialState('playing')
    const atEdge = { ...state, snake: [{ x: GRID_COLUMNS - 1, y: 0 }], food: { x: 0, y: 5 } }
    expect(stepSnake(atEdge, 'right').status).toBe('over')
  })
})
