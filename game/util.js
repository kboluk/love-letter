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
          logs: [...player.logs, log]
        }
      }
    }
  }
  const players = Object.fromEntries(
    Object.entries(state.players).map(([pid, p]) => [
      pid,
      {
        ...p,
        logs: [...p.logs, log]
      }
    ])
  )
  return {
    ...state,
    players
  }
}

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

module.exports = { discardCard, logEntry, canPlayCard }
