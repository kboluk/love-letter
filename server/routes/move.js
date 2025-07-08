const router = require('express').Router()
const { USE_CLERK } = require('../config')

const {
  getAuth, // (req) → { userId, ... }
  authGuard // express middleware
} = USE_CLERK ? require('../auth/clerk') : require('../auth/devStub')

const { tableStatus, state, playCard } = require('../game/stateManager')
const { broadcastGameState } = require('../game/sse')
const { isUserSeated } = require('../game/seating')

router.post('/move', authGuard, (req, res) => {
  const { userId } = getAuth(req)
  if (!isUserSeated(userId)) return res.sendStatus(403)

  /* Identify which player slot this user occupies */
  const playerSeat = Object.entries(tableStatus())
    .find(([_, u]) => u?.id === userId)?.[0]

  if (playerSeat !== state().currentPlayerId) {
    return res.status(409).send('not your turn')
  }

  /* Build the payload expected by the FSM */
  const payload = {
    cardName: req.body.cardName,
    targetId: req.body.targetSeat ?? null,
    guessedCardName: req.body.guess ?? null
  }

  /* Advance the FSM: "CARD_PLAYED" */
  const nextState = playCard(payload)

  if (!nextState) {
    // reducer rejected the move (illegal) – inform client
    return res.status(400).send('illegal move')
  }
  broadcastGameState()
  res.sendStatus(200)
})

module.exports = router
