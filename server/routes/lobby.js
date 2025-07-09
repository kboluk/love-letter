const router = require('express').Router()

const {
  getAuth, // (req) → { userId, ... }
  getUserProfile, // (uid) → Promise<{id,username,imageUrl}>
  authGuard // express middleware
} = require('../auth')

const { tableStatus, getState, gameVersion, streamsByUserId, startGame } = require('../game/stateManager')
const { isUserSeated, findChair, vacateSeat } = require('../game/seating')
const { sse, broadcastTableStatus, broadcastGameState } = require('../game/sse')
const getViewForSeat = require('../game/view')

router.get('/join', authGuard, async (req, res) => {
  const { userId } = getAuth(req)
  if (isUserSeated(userId)) return res.status(400).send('already seated')
  const user = await getUserProfile(userId)
  const { id, username, imageUrl } = user
  const emptySeat = findChair()
  const tableS = tableStatus()
  if (emptySeat) {
    tableS[emptySeat] = { id, username, imageUrl }
    broadcastTableStatus()
    const allSeatsFull = tableS.player1 && tableS.player2 && tableS.player3 && tableS.player4
    if (allSeatsFull) {
      console.log('game version: ', gameVersion())
      if (gameVersion() === 0) {
        startGame()
        broadcastGameState()
      } else {
        streamsByUserId.get(userId).write(sse({ type: 'GAME_STATE', ver: gameVersion(), payload: getViewForSeat(emptySeat, getState()) }))
      }
    }
  } else {
    return res.status(409).send('table full')
  }
  res.status(200).send('OK')
})

router.get('/game', authGuard, async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  const { userId } = getAuth(req)

  const user = await getUserProfile(userId)
  const { id, username, imageUrl } = user
  const tableS = tableStatus()

  res.write(sse({ type: 'USER_STATE', payload: { id, username, imageUrl } }))
  res.write(sse({ type: 'TABLE_STATE', payload: tableS }))
  streamsByUserId.set(userId, res)
  if (isUserSeated(userId)) {
    // send seat‑filtered view
    const seat = Object.entries(tableS).find(([, u]) => u?.id === userId)?.[0]
    res.write(sse({ type: 'GAME_STATE', ver: gameVersion(), payload: getViewForSeat(seat, getState()) }))
  }
  const cleanup = () => {
    streamsByUserId.delete(userId)
    vacateSeat(userId)
    broadcastTableStatus()
    res.end()
  }

  res.on('close', cleanup)
  res.on('error', cleanup)
})

module.exports = router
