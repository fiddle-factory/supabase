import { useCallback, useEffect, useReducer, useRef, type KeyboardEvent } from 'react'
import { Button, cn } from 'ui'

const COLS = 10
const ROWS = 20
const TICK_MS = 600

type Matrix = number[][]

// Each value maps to a shade of the brand green so the board stays on-theme
const PIECES: Matrix[] = [
  [[1, 1, 1, 1]],
  [
    [2, 2],
    [2, 2],
  ],
  [
    [0, 3, 0],
    [3, 3, 3],
  ],
  [
    [4, 0, 0],
    [4, 4, 4],
  ],
  [
    [0, 0, 5],
    [5, 5, 5],
  ],
  [
    [0, 6, 6],
    [6, 6, 0],
  ],
  [
    [7, 7, 0],
    [0, 7, 7],
  ],
]

const CELL_CLASSES: Record<number, string> = {
  1: 'bg-brand-default',
  2: 'bg-brand-600',
  3: 'bg-brand-500',
  4: 'bg-brand-400',
  5: 'bg-brand-link',
  6: 'bg-brand-600/70',
  7: 'bg-brand-default/70',
}

const LINE_POINTS = [0, 100, 300, 500, 800]

interface Piece {
  shape: Matrix
  x: number
  y: number
}

interface GameState {
  board: Matrix
  piece: Piece
  score: number
  lines: number
  isGameOver: boolean
  isPaused: boolean
}

type Action =
  | { type: 'move'; dx: number }
  | { type: 'rotate' }
  | { type: 'drop' }
  | { type: 'hardDrop' }
  | { type: 'togglePause' }
  | { type: 'restart' }

const emptyBoard = (): Matrix => Array.from({ length: ROWS }, () => Array(COLS).fill(0))

const randomPiece = (): Piece => {
  const shape = PIECES[Math.floor(Math.random() * PIECES.length)]
  return { shape, x: Math.floor((COLS - shape[0].length) / 2), y: 0 }
}

const rotate = (shape: Matrix): Matrix =>
  shape[0].map((_, col) => shape.map((row) => row[col]).reverse())

const collides = (board: Matrix, { shape, x, y }: Piece) =>
  shape.some((row, r) =>
    row.some((value, c) => {
      if (!value) return false
      const bx = x + c
      const by = y + r
      return bx < 0 || bx >= COLS || by >= ROWS || (by >= 0 && board[by][bx] !== 0)
    })
  )

const initialState = (): GameState => ({
  board: emptyBoard(),
  piece: randomPiece(),
  score: 0,
  lines: 0,
  isGameOver: false,
  isPaused: false,
})

const lockPiece = (state: GameState, extraPoints = 0): GameState => {
  const merged = state.board.map((row) => [...row])
  state.piece.shape.forEach((row, r) =>
    row.forEach((value, c) => {
      const by = state.piece.y + r
      if (value && by >= 0) merged[by][state.piece.x + c] = value
    })
  )
  const remaining = merged.filter((row) => row.some((value) => value === 0))
  const cleared = ROWS - remaining.length
  const board = [...Array.from({ length: cleared }, () => Array(COLS).fill(0)), ...remaining]
  const next = randomPiece()

  return {
    ...state,
    board,
    piece: next,
    score: state.score + LINE_POINTS[cleared] + extraPoints,
    lines: state.lines + cleared,
    isGameOver: collides(board, next),
  }
}

const reducer = (state: GameState, action: Action): GameState => {
  if (action.type === 'restart') return initialState()
  if (state.isGameOver) return state
  if (action.type === 'togglePause') return { ...state, isPaused: !state.isPaused }
  if (state.isPaused) return state

  switch (action.type) {
    case 'move': {
      const piece = { ...state.piece, x: state.piece.x + action.dx }
      return collides(state.board, piece) ? state : { ...state, piece }
    }
    case 'rotate': {
      const shape = rotate(state.piece.shape)
      // Try a small wall kick so rotating near the edges still works
      for (const offset of [0, -1, 1, -2, 2]) {
        const piece = { ...state.piece, shape, x: state.piece.x + offset }
        if (!collides(state.board, piece)) return { ...state, piece }
      }
      return state
    }
    case 'drop': {
      const piece = { ...state.piece, y: state.piece.y + 1 }
      return collides(state.board, piece) ? lockPiece(state) : { ...state, piece }
    }
    case 'hardDrop': {
      let piece = state.piece
      let distance = 0
      while (!collides(state.board, { ...piece, y: piece.y + 1 })) {
        piece = { ...piece, y: piece.y + 1 }
        distance++
      }
      return lockPiece({ ...state, piece }, distance * 2)
    }
    default:
      return state
  }
}

export const TetrisGame = () => {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const boardRef = useRef<HTMLDivElement>(null)
  const isRunning = !state.isGameOver && !state.isPaused

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => dispatch({ type: 'drop' }), TICK_MS)
    return () => clearInterval(interval)
  }, [isRunning])

  // Key handling is scoped to the focused board, so it never hijacks page shortcuts
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const actions: Record<string, Action> = {
      ArrowLeft: { type: 'move', dx: -1 },
      ArrowRight: { type: 'move', dx: 1 },
      ArrowUp: { type: 'rotate' },
      ArrowDown: { type: 'drop' },
      ' ': { type: 'hardDrop' },
      p: { type: 'togglePause' },
    }
    const action = actions[event.key]
    if (!action) return
    event.preventDefault()
    dispatch(action)
  }, [])

  const onRestart = () => {
    dispatch({ type: 'restart' })
    boardRef.current?.focus()
  }

  const cells = state.board.map((row) => [...row])
  if (!state.isGameOver) {
    state.piece.shape.forEach((row, r) =>
      row.forEach((value, c) => {
        const by = state.piece.y + r
        if (value && by >= 0) cells[by][state.piece.x + c] = value
      })
    )
  }

  return (
    <div className="flex items-start gap-4 rounded-md border border-default bg-surface-100 p-4">
      <div
        ref={boardRef}
        tabIndex={0}
        role="application"
        aria-label="Tetris board. Use arrow keys to move and rotate, space to drop."
        onKeyDown={onKeyDown}
        className="group relative grid cursor-pointer gap-px rounded-sm border border-strong bg-background p-px outline-none focus-visible:ring-2 focus-visible:ring-brand-default"
        style={{ gridTemplateColumns: `repeat(${COLS}, 12px)` }}
      >
        {cells.flatMap((row, r) =>
          row.map((value, c) => (
            <div
              key={`${r}-${c}`}
              className={cn('h-3 w-3 rounded-[2px]', value ? CELL_CLASSES[value] : 'bg-surface-200')}
            />
          ))
        )}
        {state.isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <p className="text-sm text-foreground">Game over</p>
          </div>
        )}
        {state.isPaused && !state.isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <p className="text-sm text-foreground">Paused</p>
          </div>
        )}
      </div>

      <div className="flex w-36 flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground-lighter">Score</p>
          <p className="font-mono text-xl text-brand">{state.score}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground-lighter">Lines</p>
          <p className="font-mono text-xl text-foreground">{state.lines}</p>
        </div>
        <ul className="space-y-1 text-xs text-foreground-light">
          <li>← → Move</li>
          <li>↑ Rotate</li>
          <li>↓ Soft drop</li>
          <li>Space Hard drop</li>
          <li>P Pause</li>
        </ul>
        <p className="text-xs text-foreground-lighter">Click the board to play.</p>
        <Button variant="default" size="tiny" onClick={onRestart}>
          Restart
        </Button>
      </div>
    </div>
  )
}
