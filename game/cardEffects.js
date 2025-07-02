const { discardCard, logEntry } = require('./util.js')

const cardEffects = {
  effect_guard: (state, playerId, targetId, guessedCardName) => {
    const target = state.players[targetId]
    if (!target || target.protected || target.eliminated) return state
    let withLog = logEntry(state, `${playerId} plays a Guard against ${targetId} and asks: Are you a ${guessedCardName}?`)
    const targetCard = target.hand[0]
    if (targetCard && targetCard.name === guessedCardName) {
      withLog = logEntry(withLog, `Guard: ${targetId} is actually a ${guessedCardName} and is out of the round!`)
      return eliminatePlayer(withLog, targetId)
    }

    return logEntry(withLog, `${targetId} is not a ${guessedCardName}`)
  },

  effect_priest: (state, playerId, targetId) => {
    const target = state.players[targetId]
    if (!target || target.protected || target.eliminated) return state

    let withLog = logEntry(state, `${playerId} plays a Priest against ${targetId}`)
    const viewedCard = target.hand[0]
    withLog = logEntry(withLog, `${targetId} reveals a ${viewedCard.name}`, playerId)
    return {
      ...withLog,
      players: {
        ...withLog.players,
        [playerId]: {
          ...withLog.players[playerId],
          knownCards: {
            ...withLog.players[playerId].knownCards,
            [targetId]: viewedCard
          }
        }
      }
    }
  },

  effect_baron: (state, playerId, targetId) => {
    const playerCard = state.players[playerId]?.hand[0]
    const targetCard = state.players[targetId]?.hand[0]
    if (!playerCard || !targetCard || state.players[targetId].protected) return state

    let withLog = logEntry(state, `${playerId} plays a Baron against ${targetId}`)
    if (playerCard.value > targetCard.value) {
      withLog = logEntry(withLog, `Baron: ${targetId} has a ${targetCard.name}, lower than ${playerId}'s card, and is out of this round.`)
      return eliminatePlayer(withLog, targetId)
    }
    if (targetCard.value > playerCard.value) {
      withLog = logEntry(withLog, `Baron: ${playerId} has a ${playerCard.name}, lower than ${targetId}'s card, and is out of this round.`)
      return eliminatePlayer(withLog, playerId)
    }
    return logEntry(withLog, `Baron: ${playerId} and ${targetId} have the same card.`)
  },

  effect_handmaid: (state, playerId) => {
    const withLog = logEntry(state, `${playerId} plays a Handmaid`)
    return {
      ...withLog,
      players: {
        ...withLog.players,
        [playerId]: {
          ...withLog.players[playerId],
          protected: true
        }
      }
    }
  },

  effect_prince: (state, playerId, targetId) => {
    const target = state.players[targetId]
    if (!target || target.eliminated) return state

    const discardedCard = target.hand[0]
    const newState = discardCard(state, targetId, discardedCard)
    let withLog = logEntry(newState, `${playerId} plays a Prince against ${targetId}`)
    if (discardedCard.name === 'Princess') {
      withLog = logEntry(withLog, `Princess: ${targetId} discards a ${discardedCard.name} and is out of the round`)
      return eliminatePlayer(newState, targetId)
    }
    withLog = logEntry(withLog, `Prince: ${targetId} discards a ${discardedCard.name}`)

    const deck = [...withLog.deckState.deck]
    const newCard = deck.pop()

    return {
      ...withLog,
      deckState: {
        ...withLog.deckState,
        deck
      },
      players: {
        ...withLog.players,
        [targetId]: {
          ...withLog.players[targetId],
          hand: [newCard]
        }
      }
    }
  },

  effect_king: (state, playerId, targetId) => {
    const player = state.players[playerId]
    const target = state.players[targetId]
    if (!player || !target || player.protected || target.protected) return state

    const [pCard] = player.hand
    const [tCard] = target.hand
    const withLog = logEntry(state, `${playerId} plays a King against ${targetId}`)

    return {
      ...withLog,
      players: {
        ...withLog.players,
        [playerId]: { ...player, hand: [tCard] },
        [targetId]: { ...target, hand: [pCard] }
      }
    }
  },

  effect_countess: (state, playerId) => logEntry(state, `${playerId} plays a Countess`), // No effect

  effect_princess: (state, playerId) => {
    const withLog = logEntry(state, `${playerId} plays a Princess and is out of the round!`)
    return eliminatePlayer(withLog, playerId)
  }
}

function eliminatePlayer (state, playerId) {
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        eliminated: true,
        hand: []
      }
    }
  }
}

module.exports = cardEffects
