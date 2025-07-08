function generateFullDeck (state) {
  const deck = []
  Object.values(state.cards).forEach(cardDef => {
    for (let i = 0; i < cardDef.count; i++) {
      deck.push({ name: cardDef.name, value: cardDef.value })
    }
  })

  return {
    ...state,
    deckState: {
      ...state.deckState,
      deck
    }
  }
}

module.exports = generateFullDeck
