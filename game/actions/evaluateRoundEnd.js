function determineHighestCardWinner (state) {
  let bestValue = -1
  let contenders = []

  for (const [pid, player] of Object.entries(state.players)) {
    if (!player.eliminated && player.hand.length > 0) {
      const cardValue = player.hand[0].value
      if (cardValue > bestValue) {
        bestValue = cardValue
        contenders = [pid]
      } else if (cardValue === bestValue) {
        contenders.push(pid)
      }
    }
  }

  if (contenders.length === 1) return contenders[0]

  // Apply tiebreaker: highest total value in discard pile
  let bestSum = -1
  let winnerId = null

  for (const pid of contenders) {
    const player = state.players[pid]
    const discardSum = player.discardPile.reduce((acc, c) => acc + c.value, 0)

    if (discardSum > bestSum) {
      bestSum = discardSum
      winnerId = pid
    } else if (discardSum === bestSum) {
      winnerId = null // Still tied — absolute draw
    }
  }

  return winnerId
}

function evaluateRoundEnd (state) {
  const survivors = Object.entries(state.players)
    .filter(([, p]) => !p.eliminated)

  let roundStatus = 'CONTINUES'
  let winnerId = null

  if (survivors.length === 1) {
    roundStatus = 'ENDS'
    winnerId = survivors[0][0]
  } else if (state.deckState.deck.length === 0) {
    roundStatus = 'ENDS'
    winnerId = determineHighestCardWinner(state) // tiebreaker inside
  }

  return {
    ...state,
    game: {
      ...state.game,
      roundStatus, // driver or guard will emit ROUND_ENDS/CONTINUES
      roundWinner: winnerId // may be null if absolute tie
    }
  }
}

module.exports = evaluateRoundEnd
