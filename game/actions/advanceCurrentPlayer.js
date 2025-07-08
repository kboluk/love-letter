/**
 * Returns the seat ID of the next non‑eliminated player.
 * If only one player remains it returns null (round should end).
 */
function getNextPlayerId (state) {
  const seats = Object.keys(state.players)
  if (seats.length === 0) return null

  // build the ring order once
  const startIdx = seats.indexOf(state.currentPlayerId)
  const aliveSeats = seats.filter(pid => !state.players[pid].eliminated)

  // if only one survivor => round end
  if (aliveSeats.length <= 1) return null

  // iterate clockwise starting *after* current index
  for (let step = 1; step < seats.length; step++) {
    const nextSeat = seats[(startIdx + step) % seats.length]
    if (!state.players[nextSeat].eliminated) return nextSeat
  }

  // fallback (should never hit)
  return null
}

function advanceCurrentPlayer (state) {
  const next = getNextPlayerId(state)
  if (!next) return state
  return { ...state, currentPlayerId: next }
}

module.exports = advanceCurrentPlayer
