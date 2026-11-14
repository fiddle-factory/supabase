export const BOARD_SIZE = 20
export const BASE_TICK_MS = 140
export const MIN_TICK_MS = 65

export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'
export type GameStatus = 'idle' | 'playing' | 'over'

export type SnakeGameState = {
  status: GameStatus
  snake: Point[]
  direction: Direction
  nextDirection: Direction
  food: Point
  score: number
}

const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

export const getDirectionFromKey = (key: string): Direction | undefined =>
  KEY_DIRECTIONS[key.length === 1 ? key.toLowerCase() : key]

export const isSamePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y

export const getRandomFood = (snake: Point[], random: () => number = Math.random): Point => {
  const freeCells: Point[] = []
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) freeCells.push({ x, y })
    }
  }
  if (freeCells.length === 0) return snake[0]
  return freeCells[Math.floor(random() * freeCells.length)]
}

export const createInitialState = (
  status: GameStatus = 'idle',
  random: () => number = Math.random
): SnakeGameState => {
  const center = Math.floor(BOARD_SIZE / 2)
  const snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ]
  return {
    status,
    snake,
    direction: 'right',
    nextDirection: 'right',
    food: getRandomFood(snake, random),
    score: 0,
  }
}

export const changeDirection = (state: SnakeGameState, direction: Direction): SnakeGameState => {
  if (state.status !== 'playing') return state
  // Compare against the direction already applied, so quick double-presses can't reverse the snake
  if (direction === OPPOSITE_DIRECTIONS[state.direction]) return state
  return { ...state, nextDirection: direction }
}

export const advanceGame = (
  state: SnakeGameState,
  random: () => number = Math.random
): SnakeGameState => {
  if (state.status !== 'playing') return state

  const direction = state.nextDirection
  const vector = DIRECTION_VECTORS[direction]
  const head = state.snake[0]
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y }

  const isEating = isSamePoint(nextHead, state.food)
  // The tail moves away this tick unless the snake grows, so it isn't an obstacle
  const body = isEating ? state.snake : state.snake.slice(0, -1)

  const isOutOfBounds =
    nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= BOARD_SIZE || nextHead.y >= BOARD_SIZE
  const isSelfCollision = body.some((segment) => isSamePoint(segment, nextHead))

  if (isOutOfBounds || isSelfCollision) {
    return { ...state, direction, status: 'over' }
  }

  const snake = [nextHead, ...body]
  return {
    ...state,
    snake,
    direction,
    food: isEating ? getRandomFood(snake, random) : state.food,
    score: isEating ? state.score + 1 : state.score,
  }
}

export const getTickInterval = (score: number) =>
  Math.max(MIN_TICK_MS, BASE_TICK_MS - Math.floor(score / 3) * 8)
