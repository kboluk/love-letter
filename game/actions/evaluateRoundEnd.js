const { logEntry } = require('./util')

/* ---------------------------- helpers --------------------------- */
function determineHighestCardWinner (state) {
  let bestValue = -1
  let contenders = []

  for (const [pid, player] of Object.entries(state.players)) {
    if (!player.eliminated && player.hand.length > 0) {
      const v = player.hand[0].value
      if (v > bestValue) { bestValue = v; contenders = [pid] } else if (v === bestValue) { contenders.push(pid) }
    }
  }

  /* Single winner on highest card -------------------------------- */
  if (contenders.length === 1) {
    const card = state.players[contenders[0]].hand[0].name
    return [contenders[0], `${contenders[0]} wins with the highest card (${card}).`]
  }

  /* Tie‑breaker: highest discard total --------------------------- */
  let bestSum = -1
  let winnerId = null

  for (const pid of contenders) {
    const sum = state.players[pid].discardPile.reduce((s, c) => s + c.value, 0)
    if (sum > bestSum) { bestSum = sum; winnerId = pid } else if (sum === bestSum) { winnerId = null } // absolute draw
  }

  if (winnerId) {
    return [
      winnerId,
      `${winnerId} wins by discard‑pile tie‑breaker (${bestSum} total).`
    ]
  }
  return [null, 'Absolute tie after tie‑breaker.']
}

/* ------------------------- main reducer ------------------------- */
function evaluateRoundEnd (state) {
  const survivors = Object.entries(state.players).filter(([, p]) => !p.eliminated)

  let roundStatus = 'CONTINUES'
  let winnerId = null
  let nextState = state // start with current

  /* --- last survivor ------------------------------------------- */
  if (survivors.length === 1) {
    roundStatus = 'ENDS'
    winnerId = survivors[0][0]
    nextState = logEntry(state, `END OF ROUND — ${winnerId} wins as the last person standing.`)
  } else if (state.deckState.deck.length === 0) {
    roundStatus = 'ENDS'
    const [winner, reason] = determineHighestCardWinner(state)
    winnerId = winner
    nextState = logEntry(state, `END OF ROUND — ${reason}`)
  }

  /* --- attach round result metadata ---------------------------- */
  return {
    ...nextState,
    game: {
      ...nextState.game,
      roundStatus,
      roundWinner: winnerId // may be null (draw or continues)
    }
  }
}

module.exports = evaluateRoundEnd
