export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'

export type SnakeState = {
  snake: Point[]
  direction: Direction
  food: Point
  score: number
  isGameOver: boolean
}

export const GRID_SIZE = 16

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

export const isOppositeDirection = (current: Direction, next: Direction) =>
  OPPOSITE_DIRECTIONS[current] === next

const isSamePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y

export const getRandomFreeCell = (
  snake: Point[],
  gridSize = GRID_SIZE,
  random: () => number = Math.random
): Point => {
  const freeCells: Point[] = []
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) freeCells.push({ x, y })
    }
  }
  return freeCells[Math.floor(random() * freeCells.length)] ?? { x: 0, y: 0 }
}

export const createInitialState = (gridSize = GRID_SIZE): SnakeState => {
  const center = Math.floor(gridSize / 2)
  const snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ]
  return {
    snake,
    direction: 'right',
    food: getRandomFreeCell(snake, gridSize),
    score: 0,
    isGameOver: false,
  }
}

export const advanceSnake = (
  state: SnakeState,
  nextDirection: Direction,
  gridSize = GRID_SIZE,
  random: () => number = Math.random
): SnakeState => {
  if (state.isGameOver) return state

  const direction = isOppositeDirection(state.direction, nextDirection)
    ? state.direction
    : nextDirection
  const vector = DIRECTION_VECTORS[direction]
  const head = state.snake[0]
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y }

  const isOutOfBounds =
    nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= gridSize || nextHead.y >= gridSize
  const hasEaten = isSamePoint(nextHead, state.food)
  // The tail moves away this tick unless the snake grows, so it is not an obstacle
  const body = hasEaten ? state.snake : state.snake.slice(0, -1)
  const hitsSelf = body.some((segment) => isSamePoint(segment, nextHead))

  if (isOutOfBounds || hitsSelf) return { ...state, direction, isGameOver: true }

  const snake = [nextHead, ...body]
  return {
    snake,
    direction,
    food: hasEaten ? getRandomFreeCell(snake, gridSize, random) : state.food,
    score: hasEaten ? state.score + 1 : state.score,
    isGameOver: false,
  }
}
