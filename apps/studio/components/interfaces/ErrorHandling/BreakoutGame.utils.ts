export const BOARD_WIDTH = 480
export const BOARD_HEIGHT = 320

export const PADDLE_WIDTH = 72
export const PADDLE_HEIGHT = 8
export const PADDLE_OFFSET_BOTTOM = 16
export const PADDLE_SPEED = 420 // px per second

export const BALL_RADIUS = 5
export const BALL_SPEED = 260 // px per second

export const BRICK_ROWS = 5
export const BRICK_COLUMNS = 8
export const BRICK_GAP = 6
export const BRICK_HEIGHT = 14
export const BRICK_OFFSET_TOP = 32
export const BRICK_OFFSET_SIDE = 16

export const STARTING_LIVES = 3
export const POINTS_PER_BRICK = 10

export interface Brick {
  x: number
  y: number
  width: number
  height: number
  row: number
  isBroken: boolean
}

export interface Ball {
  x: number
  y: number
  dx: number
  dy: number
}

export function createBricks(): Brick[] {
  const width =
    (BOARD_WIDTH - BRICK_OFFSET_SIDE * 2 - BRICK_GAP * (BRICK_COLUMNS - 1)) / BRICK_COLUMNS
  const bricks: Brick[] = []
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLUMNS; col++) {
      bricks.push({
        x: BRICK_OFFSET_SIDE + col * (width + BRICK_GAP),
        y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width,
        height: BRICK_HEIGHT,
        row,
        isBroken: false,
      })
    }
  }
  return bricks
}

export function createBall(paddleX: number): Ball {
  // Launch upward at a slight random angle
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI
  return {
    x: paddleX + PADDLE_WIDTH / 2,
    y: BOARD_HEIGHT - PADDLE_OFFSET_BOTTOM - PADDLE_HEIGHT - BALL_RADIUS - 1,
    dx: Math.sin(angle) * BALL_SPEED,
    dy: -Math.cos(angle) * BALL_SPEED,
  }
}

export function clampPaddleX(x: number) {
  return Math.max(0, Math.min(BOARD_WIDTH - PADDLE_WIDTH, x))
}

export function circleIntersectsRect(
  ball: Pick<Ball, 'x' | 'y'>,
  rect: { x: number; y: number; width: number; height: number }
) {
  const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.width))
  const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.height))
  const distX = ball.x - closestX
  const distY = ball.y - closestY
  return distX * distX + distY * distY <= BALL_RADIUS * BALL_RADIUS
}

/**
 * Returns the new horizontal/vertical velocity after the ball hits the paddle.
 * The further from the paddle center, the steeper the bounce angle.
 */
export function getPaddleBounce(ballX: number, paddleX: number) {
  const hitPosition = (ballX - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2)
  const clamped = Math.max(-1, Math.min(1, hitPosition))
  const angle = clamped * (Math.PI / 3)
  return { dx: Math.sin(angle) * BALL_SPEED, dy: -Math.cos(angle) * BALL_SPEED }
}
