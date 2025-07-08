function clearProtectionForCurrentPlayer (state) {
  const pid = state.currentPlayerId
  if (!pid) return state

  const player = state.players[pid]
  if (!player.protected) return state // nothing to do

  return {
    ...state,
    players: {
      ...state.players,
      [pid]: { ...player, protected: false }
    }
  }
}

module.exports = clearProtectionForCurrentPlayer
