export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'

export const GRID_COLUMNS = 20
export const GRID_ROWS = 12

export type SnakeState = {
  status: 'idle' | 'playing' | 'over'
  snake: Point[]
  direction: Direction
  food: Point
  score: number
}

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

const KEY_DIRECTIONS: Record<string, Direction> = {
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right',
}

export const getDirectionFromKey = (key: string): Direction | undefined =>
  KEY_DIRECTIONS[key.toLowerCase()]

export const isOppositeDirection = (a: Direction, b: Direction) => OPPOSITES[a] === b

export const isSamePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y

export const getRandomFreeCell = (snake: Point[], random: () => number = Math.random): Point => {
  const freeCells: Point[] = []
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLUMNS; x++) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) freeCells.push({ x, y })
    }
  }
  return freeCells[Math.floor(random() * freeCells.length)] ?? { x: 0, y: 0 }
}

export const createInitialState = (status: SnakeState['status'] = 'idle'): SnakeState => {
  const midY = Math.floor(GRID_ROWS / 2)
  const snake = [
    { x: 6, y: midY },
    { x: 5, y: midY },
    { x: 4, y: midY },
  ]
  return { status, snake, direction: 'right', food: { x: 14, y: midY }, score: 0 }
}

/** Advance the game by one tick in the given direction. */
export const stepSnake = (state: SnakeState, direction: Direction): SnakeState => {
  if (state.status !== 'playing') return state

  const nextDirection = isOppositeDirection(state.direction, direction) ? state.direction : direction
  const head = state.snake[0]
  const delta = DELTAS[nextDirection]
  const nextHead = { x: head.x + delta.x, y: head.y + delta.y }

  const isOutOfBounds =
    nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= GRID_COLUMNS || nextHead.y >= GRID_ROWS
  const hasEaten = isSamePoint(nextHead, state.food)
  // The tail moves away this tick unless the snake grows
  const body = hasEaten ? state.snake : state.snake.slice(0, -1)
  const hitsItself = body.some((segment) => isSamePoint(segment, nextHead))

  if (isOutOfBounds || hitsItself) return { ...state, status: 'over', direction: nextDirection }

  const snake = [nextHead, ...body]
  return {
    ...state,
    snake,
    direction: nextDirection,
    food: hasEaten ? getRandomFreeCell(snake) : state.food,
    score: hasEaten ? state.score + 1 : state.score,
  }
}
