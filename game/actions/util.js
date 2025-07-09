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

function logEntry (state, message, playerId) {
  const entry = { ts: Date.now(), msg: message }
  if (playerId) {
    const player = state.players[playerId]
    return {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          logs: [...(player.logs ?? []), entry]
        }
      }
    }
  }
  const players = Object.fromEntries(
    Object.entries(state.players).map(([pid, p]) => [
      pid,
      {
        ...p,
        logs: [...(p.logs ?? []), entry]
      }
    ])
  )
  return {
    ...state,
    players
  }
}

module.exports = { discardCard, logEntry }
