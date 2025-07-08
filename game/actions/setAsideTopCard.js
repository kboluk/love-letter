function setAsideTopCard (state) {
  const deck = [...state.deckState.deck]
  const setAside = deck.pop()
  return {
    ...state,
    deckState: {
      ...state.deckState,
      deck,
      setAsideCard: setAside
    }
  }
}

module.exports = setAsideTopCard
