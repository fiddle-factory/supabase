export const GRID_SIZE = 16
export const TICK_MS = 120

export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'
export type GameStatus = 'idle' | 'playing' | 'over'

export type SnakeGameState = {
  status: GameStatus
  snake: Point[]
  direction: Direction
  pendingDirection: Direction
  food: Point
  score: number
  bestScore: number
}

export type SnakeGameAction =
  | { type: 'tick'; seed: number }
  | { type: 'turn'; direction: Direction }
  | { type: 'restart' }

const DELTAS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITES: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

export const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

const isSamePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y

/** Picks a free cell for the food; `seed` is a number in [0, 1). */
export const placeFood = (snake: Point[], seed: number): Point => {
  const freeCells: Point[] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) freeCells.push({ x, y })
    }
  }
  if (freeCells.length === 0) return snake[0]
  const index = Math.min(freeCells.length - 1, Math.floor(seed * freeCells.length))
  return freeCells[index]
}

export const createInitialState = (bestScore = 0): SnakeGameState => {
  const middle = Math.floor(GRID_SIZE / 2)
  return {
    status: 'idle',
    snake: [
      { x: 4, y: middle },
      { x: 3, y: middle },
      { x: 2, y: middle },
    ],
    direction: 'right',
    pendingDirection: 'right',
    food: { x: GRID_SIZE - 4, y: middle },
    score: 0,
    bestScore,
  }
}

export const stepGame = (state: SnakeGameState, seed: number): SnakeGameState => {
  if (state.status !== 'playing') return state

  const direction = state.pendingDirection
  const delta = DELTAS[direction]
  const head = state.snake[0]
  const nextHead = { x: head.x + delta.x, y: head.y + delta.y }

  const isEating = isSamePoint(nextHead, state.food)
  // The tail moves away this tick unless the snake grows, so it is not an obstacle
  const body = isEating ? state.snake : state.snake.slice(0, -1)

  const isOutOfBounds =
    nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= GRID_SIZE || nextHead.y >= GRID_SIZE
  const isHittingSelf = body.some((segment) => isSamePoint(segment, nextHead))

  if (isOutOfBounds || isHittingSelf) {
    return {
      ...state,
      status: 'over',
      direction,
      bestScore: Math.max(state.bestScore, state.score),
    }
  }

  const snake = [nextHead, ...body]
  const score = isEating ? state.score + 1 : state.score

  return {
    ...state,
    snake,
    direction,
    food: isEating ? placeFood(snake, seed) : state.food,
    score,
    bestScore: Math.max(state.bestScore, score),
  }
}

export const snakeGameReducer = (
  state: SnakeGameState,
  action: SnakeGameAction
): SnakeGameState => {
  switch (action.type) {
    case 'tick':
      return stepGame(state, action.seed)
    case 'turn': {
      if (state.status === 'over') return state
      // Prevent reversing straight into the snake's own body
      if (action.direction === OPPOSITES[state.direction]) {
        return state.status === 'idle' ? { ...state, status: 'playing' } : state
      }
      return { ...state, status: 'playing', pendingDirection: action.direction }
    }
    case 'restart':
      return { ...createInitialState(state.bestScore), status: 'playing' }
  }
}
