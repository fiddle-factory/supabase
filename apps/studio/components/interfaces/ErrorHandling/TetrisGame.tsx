import { KeyboardEvent, useCallback, useEffect, useReducer, useRef } from 'react'
import { Button, cn } from 'ui'

const COLS = 10
const ROWS = 20

type Matrix = number[][]
type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

const PIECE_TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

const SHAPES: Record<PieceType, Matrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
}

// Semantic and theme-aware palette colors, so pieces adapt to light and dark mode
const PIECE_CLASSES: Record<PieceType, string> = {
  I: 'bg-brand',
  O: 'bg-warning',
  T: 'bg-purple-900',
  S: 'bg-green-900',
  Z: 'bg-destructive',
  J: 'bg-blue-900',
  L: 'bg-amber-900',
}

const LINE_SCORES = [0, 100, 300, 500, 800]

type Cell = PieceType | null
type Board = Cell[][]

interface Piece {
  type: PieceType
  shape: Matrix
  x: number
  y: number
}

type Status = 'idle' | 'playing' | 'paused' | 'over'

interface GameState {
  board: Board
  piece: Piece | null
  next: PieceType
  score: number
  lines: number
  status: Status
}

type Action =
  | { type: 'start'; random: [number, number] }
  | { type: 'tick'; random: number }
  | { type: 'move'; dx: number }
  | { type: 'rotate' }
  | { type: 'softDrop'; random: number }
  | { type: 'hardDrop'; random: number }
  | { type: 'pause' }
  | { type: 'resume' }

const emptyBoard = (): Board => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))

const pickType = (random: number): PieceType =>
  PIECE_TYPES[Math.floor(random * PIECE_TYPES.length) % PIECE_TYPES.length]

const spawn = (type: PieceType): Piece => {
  const shape = SHAPES[type]
  return { type, shape, x: Math.floor((COLS - shape[0].length) / 2), y: type === 'I' ? -1 : 0 }
}

const rotateMatrix = (m: Matrix): Matrix => m[0].map((_, i) => m.map((row) => row[i]).reverse())

const collides = (board: Board, piece: Piece, dx = 0, dy = 0, shape = piece.shape) => {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue
      const x = piece.x + c + dx
      const y = piece.y + r + dy
      if (x < 0 || x >= COLS || y >= ROWS) return true
      if (y >= 0 && board[y][x]) return true
    }
  }
  return false
}

const getLevel = (lines: number) => Math.floor(lines / 10) + 1

// Locks the current piece into the board, clears lines and spawns the next piece
const lockPiece = (state: GameState, piece: Piece, random: number, bonus = 0): GameState => {
  const board = state.board.map((row) => [...row])
  let toppedOut = false
  piece.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (!v) return
      const y = piece.y + r
      if (y < 0) toppedOut = true
      else board[y][piece.x + c] = piece.type
    })
  )

  const remaining = board.filter((row) => row.some((cell) => !cell))
  const cleared = ROWS - remaining.length
  const newBoard = [
    ...Array.from({ length: cleared }, () => Array<Cell>(COLS).fill(null)),
    ...remaining,
  ]
  const score = state.score + bonus + LINE_SCORES[cleared] * getLevel(state.lines)
  const lines = state.lines + cleared
  const nextPiece = spawn(state.next)

  if (toppedOut || collides(newBoard, nextPiece)) {
    return { ...state, board: newBoard, piece: null, score, lines, status: 'over' }
  }
  return { ...state, board: newBoard, piece: nextPiece, next: pickType(random), score, lines }
}

const initialState: GameState = {
  board: emptyBoard(),
  piece: null,
  next: 'T',
  score: 0,
  lines: 0,
  status: 'idle',
}

const reducer = (state: GameState, action: Action): GameState => {
  if (action.type === 'start') {
    return {
      board: emptyBoard(),
      piece: spawn(pickType(action.random[0])),
      next: pickType(action.random[1]),
      score: 0,
      lines: 0,
      status: 'playing',
    }
  }
  if (action.type === 'pause') {
    return state.status === 'playing' ? { ...state, status: 'paused' } : state
  }
  if (action.type === 'resume') {
    return state.status === 'paused' ? { ...state, status: 'playing' } : state
  }

  const { piece } = state
  if (state.status !== 'playing' || !piece) return state

  switch (action.type) {
    case 'move':
      return collides(state.board, piece, action.dx, 0)
        ? state
        : { ...state, piece: { ...piece, x: piece.x + action.dx } }
    case 'rotate': {
      const shape = rotateMatrix(piece.shape)
      // Simple wall kicks so pieces can rotate next to walls
      for (const kick of [0, -1, 1, -2, 2]) {
        if (!collides(state.board, piece, kick, 0, shape)) {
          return { ...state, piece: { ...piece, shape, x: piece.x + kick } }
        }
      }
      return state
    }
    case 'tick':
    case 'softDrop':
      if (collides(state.board, piece, 0, 1)) return lockPiece(state, piece, action.random)
      return {
        ...state,
        piece: { ...piece, y: piece.y + 1 },
        score: state.score + (action.type === 'softDrop' ? 1 : 0),
      }
    case 'hardDrop': {
      let distance = 0
      while (!collides(state.board, piece, 0, distance + 1)) distance++
      return lockPiece(state, { ...piece, y: piece.y + distance }, action.random, distance * 2)
    }
    default:
      return state
  }
}

const getGhostY = (board: Board, piece: Piece) => {
  let distance = 0
  while (!collides(board, piece, 0, distance + 1)) distance++
  return piece.y + distance
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col">
    <span className="text-xs text-foreground-lighter">{label}</span>
    <span className="text-sm font-mono text-foreground tabular-nums">{value}</span>
  </div>
)

const CONTROLS = [
  ['← →', 'Move'],
  ['↑', 'Rotate'],
  ['↓', 'Soft drop'],
  ['Space', 'Hard drop'],
]

export const TetrisGame = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const boardRef = useRef<HTMLDivElement>(null)
  const { board, piece, next, score, lines, status } = state
  const level = getLevel(lines)

  useEffect(() => {
    if (status !== 'playing') return
    const speed = Math.max(100, 800 - (level - 1) * 70)
    const id = setInterval(() => dispatch({ type: 'tick', random: Math.random() }), speed)
    return () => clearInterval(id)
  }, [status, level])

  const start = useCallback(() => {
    dispatch({ type: 'start', random: [Math.random(), Math.random()] })
    boardRef.current?.focus()
  }, [])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'p', 'P', 'Enter']
    if (!handled.includes(e.key)) return
    e.preventDefault()

    if (status === 'idle' || status === 'over') {
      if (e.key === 'Enter' || e.key === ' ') start()
      return
    }
    if (e.key === 'p' || e.key === 'P') {
      dispatch({ type: status === 'paused' ? 'resume' : 'pause' })
      return
    }
    if (status !== 'playing') return

    switch (e.key) {
      case 'ArrowLeft':
        return dispatch({ type: 'move', dx: -1 })
      case 'ArrowRight':
        return dispatch({ type: 'move', dx: 1 })
      case 'ArrowUp':
        return dispatch({ type: 'rotate' })
      case 'ArrowDown':
        return dispatch({ type: 'softDrop', random: Math.random() })
      case ' ':
        return dispatch({ type: 'hardDrop', random: Math.random() })
    }
  }

  // Compose the visible grid: locked cells, ghost piece and active piece
  const ghostY = piece ? getGhostY(board, piece) : null
  const cells: { type: Cell; ghost: boolean }[][] = board.map((row) =>
    row.map((type) => ({ type, ghost: false }))
  )
  if (piece && ghostY !== null) {
    piece.shape.forEach((row, r) =>
      row.forEach((v, c) => {
        const y = ghostY + r
        if (v && y >= 0 && !cells[y][piece.x + c].type) cells[y][piece.x + c].ghost = true
      })
    )
    piece.shape.forEach((row, r) =>
      row.forEach((v, c) => {
        const y = piece.y + r
        if (v && y >= 0) cells[y][piece.x + c] = { type: piece.type, ghost: false }
      })
    )
  }

  const nextShape = SHAPES[next].filter((row) => row.some(Boolean))

  return (
    <div className="flex gap-4 rounded-md border bg-surface-100 p-4">
      <div
        ref={boardRef}
        role="application"
        aria-label="Tetris game board"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => dispatch({ type: 'pause' })}
        onFocus={() => dispatch({ type: 'resume' })}
        className={cn(
          'relative grid w-[160px] gap-px rounded-sm border bg-border p-px outline-none',
          'focus-visible:ring-2 focus-visible:ring-brand-500/50'
        )}
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {cells.flatMap((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={cn(
                'aspect-square',
                cell.type
                  ? PIECE_CLASSES[cell.type]
                  : cell.ghost
                    ? 'bg-surface-300'
                    : 'bg-surface-200'
              )}
            />
          ))
        )}

        {status !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 p-2 text-center backdrop-blur-[1px]">
            {status === 'over' && (
              <>
                <p className="text-sm text-foreground">Game over</p>
                <p className="text-xs text-foreground-light">Score: {score}</p>
              </>
            )}
            {status === 'paused' ? (
              <>
                <p className="text-sm text-foreground">Paused</p>
                <p className="text-xs text-foreground-light">Click or press P to resume</p>
              </>
            ) : (
              <Button variant="primary" onClick={start}>
                {status === 'over' ? 'Play again' : 'Play Tetris'}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex w-[120px] flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-foreground-lighter">Next</span>
          <div
            className="grid w-fit gap-px"
            style={{ gridTemplateColumns: `repeat(${nextShape[0].length}, 10px)` }}
          >
            {nextShape.flatMap((row, r) =>
              row.map((v, c) => (
                <div
                  key={`${r}-${c}`}
                  className={cn('h-[10px] w-[10px]', v ? PIECE_CLASSES[next] : 'bg-transparent')}
                />
              ))
            )}
          </div>
        </div>
        <Stat label="Score" value={score} />
        <Stat label="Lines" value={lines} />
        <Stat label="Level" value={level} />
        <ul className="flex flex-col gap-0.5 text-xs text-foreground-lighter">
          {CONTROLS.map(([key, label]) => (
            <li key={label} className="flex justify-between gap-2">
              <span className="font-mono text-foreground-light">{key}</span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <Button variant="default" className="mt-auto" disabled={status === 'idle'} onClick={start}>
          Restart
        </Button>
      </div>
    </div>
  )
}
