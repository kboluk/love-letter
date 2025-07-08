const { tableStatus, clearSeat } = require('./stateManager')

const findChair = () => {
  const tableS = tableStatus()
  const chairs = Object.keys(tableS)
  const chairIdx = chairs.findIndex(playerId => !tableS[playerId])
  if (chairIdx >= 0) {
    return chairs[chairIdx]
  }
}

const isUserSeated = userId => Object.values(tableStatus()).some(u => u?.id === userId)

const vacateSeat = userId => {
  const tableS = tableStatus()
  for (const playerId in tableS) {
    if (tableS[playerId]?.id === userId) {
      clearSeat(playerId)
      return
    }
  }
}

module.exports = {
  findChair,
  isUserSeated,
  vacateSeat
}
