export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'
export type GameStatus = 'idle' | 'playing' | 'over'

export type SnakeState = {
  snake: Point[]
  direction: Direction
  food: Point
  score: number
  status: GameStatus
}

export const GRID_COLUMNS = 20
export const GRID_ROWS = 14

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

export const isOppositeDirection = (a: Direction, b: Direction) => OPPOSITE_DIRECTIONS[a] === b

const isSamePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y

export const getRandomFreeCell = (snake: Point[], random: () => number = Math.random): Point => {
  const freeCells: Point[] = []
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLUMNS; x++) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) freeCells.push({ x, y })
    }
  }
  if (freeCells.length === 0) return snake[0]
  return freeCells[Math.floor(random() * freeCells.length)]
}

export const createInitialState = (random?: () => number): SnakeState => {
  const centerY = Math.floor(GRID_ROWS / 2)
  const snake = [
    { x: 6, y: centerY },
    { x: 5, y: centerY },
    { x: 4, y: centerY },
  ]
  return {
    snake,
    direction: 'right',
    food: getRandomFreeCell(snake, random),
    score: 0,
    status: 'idle',
  }
}

export const advanceSnake = (
  state: SnakeState,
  direction: Direction,
  random?: () => number
): SnakeState => {
  if (state.status !== 'playing') return state

  const vector = DIRECTION_VECTORS[direction]
  const head = state.snake[0]
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y }

  const hasHitWall =
    nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= GRID_COLUMNS || nextHead.y >= GRID_ROWS
  const hasEatenFood = isSamePoint(nextHead, state.food)
  // The tail moves away this tick unless the snake grows, so it is safe to move into
  const body = hasEatenFood ? state.snake : state.snake.slice(0, -1)
  const hasHitSelf = body.some((segment) => isSamePoint(segment, nextHead))

  if (hasHitWall || hasHitSelf) return { ...state, direction, status: 'over' }

  const snake = [nextHead, ...body]
  return {
    snake,
    direction,
    food: hasEatenFood ? getRandomFreeCell(snake, random) : state.food,
    score: hasEatenFood ? state.score + 1 : state.score,
    status: 'playing',
  }
}
