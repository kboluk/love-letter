function canPlayCard (state, player, cardDef) {
  if (!cardDef.playConditions) return true

  const holdingNames = new Set(player.hand.map(c => c.name))

  for (const cond of cardDef.playConditions) {
    switch (cond.when) {
      case 'holding':
        if (holdingNames.has(cond.test)) return cond.allow
        break

      case 'always':
        return cond.allow

      default:
        console.warn('unknown play condition', cond, cardDef.name)
    }
  }
  return true // fall‑through when no rule matched
}

function updateLegalMovesForCurrentPlayer (state) {
  const currentPlayerId = state.currentPlayerId
  const player = state.players[currentPlayerId]

  const legalMoves = player.hand
    .filter(c => canPlayCard(state, player, state.cards[c.name]))
    .map(card => ({ type: 'play_card', card }))

  return {
    ...state,
    players: {
      ...state.players,
      [currentPlayerId]: {
        ...player,
        legalMoves
      }
    }
  }
}

module.exports = updateLegalMovesForCurrentPlayer
