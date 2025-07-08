function dealOneCardToEachPlayer (state) {
  const deck = [...state.deckState.deck]
  const players = { ...state.players }
  Object.keys(players).forEach(pid => {
    players[pid] = {
      ...players[pid],
      hand: [deck.pop()],
      discardPile: [],
      legalMoves: [],
      eliminated: false,
      protected: false,
      knownHands: {}
    }
  })
  return {
    ...state,
    deckState: {
      ...state.deckState,
      deck
    },
    players
  }
}

module.exports = dealOneCardToEachPlayer
