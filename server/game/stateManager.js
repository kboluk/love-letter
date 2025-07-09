const loveLetter = require('../../game/main')
const stateShape = require('../../game/state.json')

let state = loveLetter.start(structuredClone(stateShape))
let gameVersion = 0 // monotonically increasing counter

function setState (newState) {
  if (newState !== state) {
    state = newState
    gameVersion += 1
    return true
  }
  return false
}

const tableStatus = {
  player1: null,
  player2: null,
  player3: null,
  player4: null
}

const streamsByUserId = new Map()

const startGame = () => setState(loveLetter.send(state, 'START_GAME'))
const playCard = payload => setState(loveLetter.send(state, 'CARD_PLAYED', payload))
const clearSeat = playerId => { tableStatus[playerId] = null }

module.exports = {
  tableStatus: () => tableStatus,
  getState: () => state,
  gameVersion: () => gameVersion,
  streamsByUserId,
  startGame,
  playCard,
  setState,
  clearSeat
}
