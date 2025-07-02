const fsmConfig = require('./state.json')
const createFSM = require('./fsm.js')
const actionImpl = require('./actions')

// (optional) any guard/cond functions referenced in JSON
const guardImpl = {
  isGameOver: (s) => s.game.gameStatus === 'OVER',
  isRoundOver: (s) => s.game.roundStatus === 'ENDS',
  isSubRound: (s) => s.game.gameStatus === 'ONGOING'
}

const fsm = createFSM(fsmConfig.game, actionImpl, guardImpl)

module.exports = fsm
