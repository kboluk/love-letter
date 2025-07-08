function resetForNextRound (state) {
  if (state.game.gameStatus === 'OVER') return state // nothing to reset

  /* reset every player except ‘score’ */
  const players = Object.fromEntries(
    Object.entries(state.players).map(([pid, p]) => [
      pid,
      {
        ...p,
        eliminated: false,
        protected: false,
        hand: [],
        discardPile: [],
        legalMoves: []
      }
    ])
  )

  return {
    ...state,
    players,
    deckState: {
      deck: [],
      setAsideCard: null
    },
    game: {
      ...state.game,
      roundWinner: null,
      roundStatus: null
    }
  }
}

module.exports = resetForNextRound
