import { useEffect, useState } from 'react'

import {
  advanceGame,
  changeDirection,
  createInitialState,
  Direction,
  getTickInterval,
} from './SnakeGame.utils'
import { useLocalStorage } from '@/hooks/misc/useLocalStorage'

const HIGH_SCORE_STORAGE_KEY = 'supabase-snake-high-score'

export function useSnakeGame() {
  const [game, setGame] = useState(() => createInitialState())
  const [storedHighScore, setStoredHighScore] = useLocalStorage<number>(HIGH_SCORE_STORAGE_KEY, 0)

  const isPlaying = game.status === 'playing'
  const highScore = Math.max(storedHighScore, game.score)

  // Game loop: one timeout per tick, so speed follows the score
  useEffect(() => {
    if (!isPlaying) return

    const timeout = setTimeout(() => {
      const nextGame = advanceGame(game)
      setGame(nextGame)
      if (nextGame.status === 'over' && nextGame.score > storedHighScore) {
        setStoredHighScore(nextGame.score)
      }
    }, getTickInterval(game.score))

    return () => clearTimeout(timeout)
  }, [game, isPlaying, storedHighScore, setStoredHighScore])

  const start = () => setGame(createInitialState('playing'))
  const turn = (direction: Direction) => setGame((current) => changeDirection(current, direction))

  return { game, highScore, start, turn }
}
