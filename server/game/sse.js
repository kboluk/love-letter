const { streamsByUserId, tableStatus, state, gameVersion } = require('./stateManager')
const getViewForSeat = require('./view')

const sse = event => `data: ${JSON.stringify(event)}\n\n`
const broadcast = event => {
  streamsByUserId.forEach(stream => {
    stream.write(sse(event))
  })
}
const broadcastTableStatus = () => broadcast({ type: 'TABLE_STATE', payload: tableStatus() })
const broadcastGameState = () => {
  streamsByUserId.forEach((stream, userId) => {
    let seat
    const tableS = tableStatus()
    for (const playerId in tableS) {
      if (tableS[playerId]?.id === userId) seat = playerId
    }
    stream.write(sse({ type: 'GAME_STATE', ver: gameVersion(), payload: getViewForSeat(seat, state()) }))
  })
}

module.exports = {
  sse,
  broadcast,
  broadcastGameState,
  broadcastTableStatus
}
