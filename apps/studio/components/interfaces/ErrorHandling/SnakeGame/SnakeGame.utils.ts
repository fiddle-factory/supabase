export const SNAKE_GRID_SIZE = 16
export const SNAKE_TICK_MS = 120
export const SNAKE_MIN_TICK_MS = 30
export const SNAKE_MIN_GRID_SIZE = 6

export type SnakeDirection = 'up' | 'down' | 'left' | 'right'

export type SnakePoint = { x: number; y: number }

export type SnakeStatus = 'idle' | 'playing' | 'over'

export type SnakeState = {
  status: SnakeStatus
  snake: SnakePoint[]
  food: SnakePoint
  direction: SnakeDirection
  pendingDirection: SnakeDirection
  score: number
  highScore: number
  width: number
  height: number
}

export type SnakeAction =
  | { type: 'start'; random: number }
  | { type: 'turn'; direction: SnakeDirection }
  | { type: 'tick'; random: number }
  | { type: 'resize'; width: number; height: number; random: number }

const DIRECTION_VECTORS: Record<SnakeDirection, SnakePoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE_DIRECTIONS: Record<SnakeDirection, SnakeDirection> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

const KEY_DIRECTIONS: Record<string, SnakeDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

export const getDirectionFromKey = (key: string): SnakeDirection | undefined =>
  KEY_DIRECTIONS[key.length === 1 ? key.toLowerCase() : key]

const isSamePoint = (a: SnakePoint, b: SnakePoint) => a.x === b.x && a.y === b.y

/** Picks a free cell for the food using a random number in [0, 1). */
export const placeFood = (
  snake: SnakePoint[],
  random: number,
  width = SNAKE_GRID_SIZE,
  height = width
) => {
  const freeCells: SnakePoint[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) freeCells.push({ x, y })
    }
  }
  if (freeCells.length === 0) return snake[0]
  return freeCells[Math.min(freeCells.length - 1, Math.floor(random * freeCells.length))]
}

const createInitialSnake = (width: number, height: number): SnakePoint[] => {
  const midX = Math.floor(width / 2)
  const midY = Math.floor(height / 2)
  return [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ]
}

/** Clamps a board dimension to a whole number of cells that fits the starting snake. */
export const clampGridSize = (size: number) =>
  Math.max(SNAKE_MIN_GRID_SIZE, Math.round(Number.isFinite(size) ? size : SNAKE_GRID_SIZE))

/** Tick interval after speeding up by `speedUpMs` for every food eaten. */
export const getTickMs = (baseTickMs: number, speedUpMs: number, score: number) =>
  Math.max(SNAKE_MIN_TICK_MS, baseTickMs - Math.max(0, speedUpMs) * score)

export const createSnakeState = (
  highScore = 0,
  random = 0.5,
  width = SNAKE_GRID_SIZE,
  height = SNAKE_GRID_SIZE
): SnakeState => {
  const boardWidth = clampGridSize(width)
  const boardHeight = clampGridSize(height)
  const snake = createInitialSnake(boardWidth, boardHeight)
  return {
    status: 'idle',
    snake,
    food: placeFood(snake, random, boardWidth, boardHeight),
    direction: 'right',
    pendingDirection: 'right',
    score: 0,
    highScore,
    width: boardWidth,
    height: boardHeight,
  }
}

export const snakeReducer = (state: SnakeState, action: SnakeAction): SnakeState => {
  switch (action.type) {
    case 'start':
      return {
        ...createSnakeState(state.highScore, action.random, state.width, state.height),
        status: 'playing',
      }

    case 'resize': {
      const width = clampGridSize(action.width)
      const height = clampGridSize(action.height)
      if (width === state.width && height === state.height) return state
      return createSnakeState(state.highScore, action.random, width, height)
    }

    case 'turn': {
      if (state.status === 'over') return state
      if (action.direction === OPPOSITE_DIRECTIONS[state.direction]) return state
      return {
        ...state,
        status: 'playing',
        pendingDirection: action.direction,
      }
    }

    case 'tick': {
      if (state.status !== 'playing') return state

      const direction = state.pendingDirection
      const vector = DIRECTION_VECTORS[direction]
      const head = state.snake[0]
      const nextHead = { x: head.x + vector.x, y: head.y + vector.y }
      const isEating = isSamePoint(nextHead, state.food)
      // The tail moves away this tick unless the snake grows
      const body = isEating ? state.snake : state.snake.slice(0, -1)

      const hitsWall =
        nextHead.x < 0 ||
        nextHead.y < 0 ||
        nextHead.x >= state.width ||
        nextHead.y >= state.height
      const hitsSelf = body.some((segment) => isSamePoint(segment, nextHead))

      if (hitsWall || hitsSelf) {
        return {
          ...state,
          direction,
          status: 'over',
          highScore: Math.max(state.highScore, state.score),
        }
      }

      const snake = [nextHead, ...body]
      const score = isEating ? state.score + 1 : state.score

      return {
        ...state,
        snake,
        direction,
        score,
        highScore: Math.max(state.highScore, score),
        food: isEating ? placeFood(snake, action.random, state.width, state.height) : state.food,
      }
    }
  }
}
