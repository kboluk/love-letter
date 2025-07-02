const http = require('http')
const express = require('express')
require('dotenv').config()
const loveLetter = require('./game/main')
const stateShape = require('./game/state.json')
const cookieParser = require('cookie-parser')
const {
  clerkMiddleware,
  clerkClient,
  requireAuth,
  getAuth: clerkGetAuth
} = require('@clerk/express')
const devAuth = require('./devAuth')

const USE_CLERK = process.env.USE_CLERK === 'true'

const app = express()

app.use(cookieParser())

if (USE_CLERK) {
  app.use(clerkMiddleware())
} else {
  app.use(devAuth)
}

const getAuth = USE_CLERK
  ? clerkGetAuth // Clerk helper
  : (req) => req.auth() // our stub function

function getUserProfile (userId) {
  if (USE_CLERK) {
    return clerkClient.users.getUser(userId) // promise
  }
  // dev stub
  return Promise.resolve({
    id: userId,
    username: `Dev #${userId}`,
    imageUrl: `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}`
  })
}

const authGuard = USE_CLERK
  ? requireAuth()
  : (req, res, next) => req.auth ? next() : res.sendStatus(401)

let state = loveLetter.start(structuredClone(stateShape))
let gameVersion = 0 // monotonically increasing counter

function setState (newState) {
  if (newState !== state) {
    state = newState
    gameVersion += 1
    broadcastGameState()
  }
}

const tableStatus = {
  player1: null,
  player2: null,
  player3: null,
  player4: null
}

const streamsByUserId = new Map()

const findChair = () => {
  const chairs = Object.keys(tableStatus)
  const chairIdx = chairs.findIndex(playerId => !tableStatus[playerId])
  if (chairIdx >= 0) {
    return chairs[chairIdx]
  }
}

const isUserSeated = userId => Object.values(tableStatus).some(u => u?.id === userId)

const vacateSeat = userId => {
  for (const playerId in tableStatus) {
    if (tableStatus[playerId]?.id === userId) {
      tableStatus[playerId] = null
      return
    }
  }
}

function getViewForSeat (seatId, state) {
  const view = { ...state, players: {}, deckSize: state.deckState.deck.length }
  delete view.deckState
  for (const [seat, p] of Object.entries(state.players)) {
    if (seat === seatId) {
      view.players[seat] = p
    } else {
      view.players[seat] = {
        eliminated: p.eliminated,
        protected: p.protected,
        score: p.score,
        discardPile: p.discardPile,
        handSize: p.hand.length
      }
    }
  }
  return view
}

const sse = event => `data: ${JSON.stringify(event)}\n\n`
const broadcast = event => {
  streamsByUserId.forEach(stream => {
    stream.write(sse(event))
  })
}
const broadcastTableStatus = broadcast.bind(null, { type: 'TABLE_STATE', payload: tableStatus })
const broadcastGameState = () => {
  streamsByUserId.forEach((stream, userId) => {
    let seat
    for (const playerId in tableStatus) {
      if (tableStatus[playerId]?.id === userId) seat = playerId
    }
    stream.write(sse({ type: 'GAME_STATE', ver: gameVersion, payload: getViewForSeat(seat, state) }))
  })
}

app.use(express.json())

app.get('/', authGuard, (_, res) => res.sendFile('index.html', { root: 'dist' }))

/**
 * Expected JSON body from the front‑end
 * {
 *   "cardName": "guard",
 *   "targetSeat": "player3",   // null for self/none
 *   "guess": "princess"        // only for Guard
 * }
 */
app.post('/move', authGuard, (req, res) => {
  const { userId } = getAuth(req)
  if (!isUserSeated(userId)) return res.sendStatus(403)

  /* Identify which player slot this user occupies */
  const playerSeat = Object.entries(tableStatus)
    .find(([_, u]) => u?.id === userId)?.[0]

  if (playerSeat !== state.currentPlayerId) {
    return res.status(409).send('not your turn')
  }

  /* Build the payload expected by the FSM */
  const payload = {
    cardName: req.body.cardName,
    targetId: req.body.targetSeat ?? null,
    guessedCardName: req.body.guess ?? null
  }

  /* Advance the FSM: "CARD_PLAYED" */
  const nextState = loveLetter.send(state, 'CARD_PLAYED', payload)

  if (nextState === state) {
    // reducer rejected the move (illegal) – inform client
    return res.status(400).send('illegal move')
  }
  setState(nextState)
  res.sendStatus(200)
})

app.use(express.static('dist', { index: false }))

app.get('/join', authGuard, async (req, res) => {
  const { userId } = getAuth(req)
  if (isUserSeated(userId)) return res.status(400).send('already seated')
  const user = await getUserProfile(userId)
  const { id, username, imageUrl } = user
  const emptySeat = findChair()
  if (emptySeat) {
    tableStatus[emptySeat] = { id, username, imageUrl }
    broadcastTableStatus()
    const allSeatsFull = tableStatus.player1 && tableStatus.player2 && tableStatus.player3 && tableStatus.player4
    if (allSeatsFull) {
      if (gameVersion === 0) {
        setState(loveLetter.send(state, 'START_GAME'))
      } else {
        streamsByUserId.get(userId).write(sse({ type: 'GAME_STATE', ver: gameVersion, payload: getViewForSeat(emptySeat, state) }))
      }
    }
  } else {
    return res.status(409).send('table full')
  }
  res.status(200).send('OK')
})

app.get('/game', authGuard, async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  const { userId } = getAuth(req)

  const user = await getUserProfile(userId)
  const { id, username, imageUrl } = user

  res.write(sse({ type: 'USER_STATE', payload: { id, username, imageUrl } }))
  res.write(sse({ type: 'TABLE_STATE', payload: tableStatus }))
  streamsByUserId.set(userId, res)
  if (isUserSeated(userId)) {
    // send seat‑filtered view
    const seat = Object.entries(tableStatus).find(([, u]) => u?.id === userId)?.[0]
    res.write(sse({ type: 'GAME_STATE', ver: gameVersion, payload: getViewForSeat(seat, state) }))
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

const server = http.createServer(app)

server.listen(process.env.PORT, function () {
  console.log(`Listening on http://localhost:${process.env.PORT}`)
})
