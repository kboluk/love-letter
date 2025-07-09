// view.js
const { tableStatus } = require('./stateManager')

/* ---------- one‑time regex cache --------------------------------- */
const SEATS = ['player1', 'player2', 'player3', 'player4']
const seatRx = Object.fromEntries(
  SEATS.map(seat => [seat, new RegExp(`\\b${seat}\\b`, 'g')])
)

/* ---------- helper ------------------------------------------------ */
function replaceIds (message) {
  let out = message
  for (const seat of SEATS) {
    const name = tableStatus()[seat]?.username || seat
    out = out.replace(seatRx[seat], name)
  }
  return out
}

/* ---------- main view builder ------------------------------------ */
function getViewForSeat (seatId, state) {
  const view = { ...state, players: {}, deckSize: state.deckState.deck.length }
  delete view.deckState

  for (const [seat, p] of Object.entries(state.players)) {
    if (seat === seatId) {
      view.players[seat] = {
        ...p,
        logs: p.logs.map(entry => ({ ...entry, msg: replaceIds(entry.msg) }))
      }
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

module.exports = getViewForSeat
