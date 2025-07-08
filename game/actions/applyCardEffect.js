const { discardCard } = require('./util.js')
const cardEffects = require('./cardEffects.js')

function applyCardEffect (state, payload = {}) {
  const playerId = state.currentPlayerId
  const targetId = payload.targetId ?? null
  const guessedCard = payload.guessedCardName // only Guards use this

  /* 1‑a) locate & remove chosen card from the player’s hand */
  const idx = state.players[playerId].hand.findIndex(
    c => c.name === payload.cardName
  )
  if (idx === -1) return state // illegal message – ignore

  const [playedCard] = state.players[playerId].hand.splice(idx, 1)

  /* 1‑b)  move it to player’s discard pile */
  let newState = discardCard(state, playerId, playedCard)

  /* 1‑c)  execute effect hook */
  const hookName = state.cards[playedCard.name].hook
  const effectFn = cardEffects[hookName]
  if (typeof effectFn === 'function') {
    newState = effectFn(newState, playerId, targetId, guessedCard)
  }

  return newState
}

module.exports = applyCardEffect
