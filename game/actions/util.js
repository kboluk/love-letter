function discardCard (state, playerId, card) {
  const player = state.players[playerId]
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        // hand already has the played card removed by applyCardEffect()
        hand: player.hand,
        discardPile: [...(player.discardPile || []), card]
      }
    }
  }
}

function logEntry (state, log, playerId) {
  if (playerId) {
    const player = state.players[playerId]
    return {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          logs: [...(player.logs ?? []), log]
        }
      }
    }
  }
  const players = Object.fromEntries(
    Object.entries(state.players).map(([pid, p]) => [
      pid,
      {
        ...p,
        logs: [...(p.logs ?? []), log]
      }
    ])
  )
  return {
    ...state,
    players
  }
}

module.exports = { discardCard, logEntry }
