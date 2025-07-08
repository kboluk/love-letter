function getViewForSeat (seatId, state) {
  const view = { ...state, players: {}, deckSize: state.deckState.deck.length }
  delete view.deckState
  for (const [seat, p] of Object.entries(state.players)) {
    if (seat === seatId) {
      view.players[seat] = p
    } else {
      view.players[seat] = {
        eliminated: p.eliminated,
        protected: p.protected,
        score: p.score,
        discardPile: p.discardPile,
        handSize: p.hand.length
      }
    }
  }
  return view
}

module.exports = getViewForSeat
