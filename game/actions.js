const { discardCard, canPlayCard } = require('./util.js')
const cardEffects = require('./cardEffects.js')

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

function shuffleDeck (state) {
  const shuffled = [...state.deckState.deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return {
    ...state,
    deckState: {
      ...state.deckState,
      deck: shuffled
    }
  }
}

function setAsideTopCard (state) {
  const deck = [...state.deckState.deck]
  const setAside = deck.pop()
  return {
    ...state,
    deckState: {
      ...state.deckState,
      deck,
      setAsideCard: setAside
    }
  }
}

function dealOneCardToEachPlayer (state) {
  const deck = [...state.deckState.deck]
  const players = { ...state.players }
  Object.keys(players).forEach(pid => {
    players[pid] = {
      ...players[pid],
      hand: [deck.pop()],
      discardPile: [],
      legalMoves: [],
      eliminated: false,
      protected: false,
      knownHands: {}
    }
  })
  return {
    ...state,
    deckState: {
      ...state.deckState,
      deck
    },
    players
  }
}

/* ------------------------------------------------------------------ */
/*  1. applyCardEffect  – executed in state: resolve_effect.onEntry   */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  2. evaluateRoundEnd – state: check_end_condition.onEntry          */
/*      sets game.roundStatus = "CONTINUES" | "ENDS" and, if ended,   */
/*      game.roundWinner = <pid or null>                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  3. tallyScores – state: end_round.onEntry                          */
/*      grants +1 to roundWinner and sets game.gameStatus             */
/*      to "ONGOING" or "OVER"                                        */
/* ------------------------------------------------------------------ */
function tallyScores (state) {
  const winner = state.game.roundWinner
  if (!winner) { // tie ⇒ nobody scores
    return {
      ...state,
      game: { ...state.game, gameStatus: 'ONGOING' }
    }
  }

  const newScore = (state.players[winner].score ?? 0) + 1

  const players = {
    ...state.players,
    [winner]: { ...state.players[winner], score: newScore }
  }

  const gameOver = newScore >= (state.game.scoreToWin || 4)

  return {
    ...state,
    players,
    game: {
      ...state.game,
      gameStatus: gameOver ? 'OVER' : 'ONGOING'
    }
  }
}

/* ------------------------------------------------------------------ */
/*  4. resetForNextRound – state: end_round.onEntry (after tally)     */
/*      prepares a clean board but keeps scores.                      */
/* ------------------------------------------------------------------ */
function resetForNextRound (state) {
  if (state.game.gameStatus === 'OVER') return state // nothing to reset

  /* reset every player except ‘score’ */
  const players = Object.fromEntries(
    Object.entries(state.players).map(([pid, p]) => [
      pid,
      {
        ...p,
        eliminated: false,
        protected: false,
        hand: [],
        discardPile: [],
        legalMoves: []
      }
    ])
  )

  return {
    ...state,
    players,
    deckState: {
      deck: [],
      setAsideCard: null
    },
    game: {
      ...state.game,
      roundWinner: null,
      roundStatus: null
    }
  }
}

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

function drawCardForCurrentPlayer (state) {
  const currentPlayerId = state.currentPlayerId
  const deck = [...state.deckState.deck]
  if (deck.length === 0) return state

  const players = { ...state.players }
  const player = players[currentPlayerId]
  if (player.hand.length >= 2) return state

  const card = deck.pop()
  players[currentPlayerId] = {
    ...player,
    hand: [...player.hand, card]
  }

  return {
    ...state,
    deckState: {
      ...state.deckState,
      deck
    },
    players
  }
}

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

module.exports = {
  generateFullDeck,
  shuffleDeck,
  setAsideTopCard,
  dealOneCardToEachPlayer,
  applyCardEffect,
  resetForNextRound,
  tallyScores,
  evaluateRoundEnd,
  updateLegalMovesForCurrentPlayer,
  drawCardForCurrentPlayer,
  advanceCurrentPlayer,
  clearProtectionForCurrentPlayer
}
