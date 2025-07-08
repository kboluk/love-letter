function tallyScores (state) {
  const winner = state.game.roundWinner
  if (!winner) { // tie ⇒ nobody scores
    return {
      ...state,
      game: { ...state.game, gameStatus: 'ONGOING' }
    }
  }

  const newScore = (state.players[winner].score ?? 0) + 1

  const players = {
    ...state.players,
    [winner]: { ...state.players[winner], score: newScore }
  }

  const gameOver = newScore >= (state.game.scoreToWin || 4)

  return {
    ...state,
    players,
    game: {
      ...state.game,
      gameStatus: gameOver ? 'OVER' : 'ONGOING'
    }
  }
}

module.exports = tallyScores
