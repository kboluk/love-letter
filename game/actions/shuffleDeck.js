function shuffleDeck (state) {
  const shuffled = [...state.deckState.deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return {
    ...state,
    deckState: {
      ...state.deckState,
      deck: shuffled
    }
  }
}

module.exports = shuffleDeck
