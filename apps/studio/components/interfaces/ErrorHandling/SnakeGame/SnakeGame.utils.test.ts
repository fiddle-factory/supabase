import { describe, expect, it } from 'vitest'

import { createInitialState, GRID_SIZE, placeFood, snakeGameReducer } from './SnakeGame.utils'

describe('snakeGameReducer', () => {
  it('starts playing on the first turn and ignores reversing direction', () => {
    const idle = createInitialState()
    const playing = snakeGameReducer(idle, { type: 'turn', direction: 'left' })
    expect(playing.status).toBe('playing')
    expect(playing.pendingDirection).toBe('right')
  })

  it('moves the snake one cell per tick', () => {
    const playing = snakeGameReducer(createInitialState(), { type: 'turn', direction: 'up' })
    const next = snakeGameReducer(playing, { type: 'tick', seed: 0 })
    expect(next.snake[0]).toEqual({ x: 4, y: playing.snake[0].y - 1 })
    expect(next.snake).toHaveLength(3)
  })

  it('grows and scores when eating food', () => {
    const state = {
      ...createInitialState(),
      status: 'playing' as const,
      food: { x: 5, y: Math.floor(GRID_SIZE / 2) },
    }
    const next = snakeGameReducer(state, { type: 'tick', seed: 0 })
    expect(next.score).toBe(1)
    expect(next.bestScore).toBe(1)
    expect(next.snake).toHaveLength(4)
  })

  it('ends the game when hitting a wall and keeps the best score on restart', () => {
    const state = {
      ...createInitialState(3),
      status: 'playing' as const,
      snake: [{ x: GRID_SIZE - 1, y: 0 }],
    }
    const over = snakeGameReducer(state, { type: 'tick', seed: 0 })
    expect(over.status).toBe('over')

    const restarted = snakeGameReducer(over, { type: 'restart' })
    expect(restarted.status).toBe('playing')
    expect(restarted.score).toBe(0)
    expect(restarted.bestScore).toBe(3)
  })
})

describe('placeFood', () => {
  it('never places food on the snake', () => {
    const snake = [{ x: 0, y: 0 }]
    expect(placeFood(snake, 0)).toEqual({ x: 1, y: 0 })
  })
})
