function drawCardForCurrentPlayer (state) {
  const currentPlayerId = state.currentPlayerId
  const deck = [...state.deckState.deck]
  if (deck.length === 0) return state

  const players = { ...state.players }
  const player = players[currentPlayerId]
  if (player.hand.length >= 2) return state

  const card = deck.pop()
  players[currentPlayerId] = {
    ...player,
    hand: [...player.hand, card]
  }

  return {
    ...state,
    deckState: {
      ...state.deckState,
      deck
    },
    players
  }
}

module.exports = drawCardForCurrentPlayer
