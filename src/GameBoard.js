/* GameBoard.jsx – 90 lines instead of ~230 */
import { useState, useMemo, useEffect, useCallback } from 'preact/hooks'

const GUESS_OPTIONS = [
  'Princess', 'Countess', 'King', 'Prince', 'Handmaid', 'Baron', 'Priest'
]

export default function GameBoard ({ play, position, gameState, tableState }) {
  /* ---------- derived helpers ---------- */
  const seats = ['player1', 'player2', 'player3', 'player4']
  const players = gameState.players

  /* ---------- local UI state ----------- */
  const [active, setActive] = useState(null) // card object
  const [target, setTarget] = useState(null) // seat string
  const [guess, setGuess] = useState(null) // guard guess

  /* ---------- card‑effect requirements -- */
  const needsTarget = useMemo(() =>
    active && ['Priest', 'Baron', 'Prince', 'King', 'Guard'].includes(active.name) &&
    !target, [active, target])

  const needsGuess = useMemo(() =>
    active?.name === 'Guard' && !guess, [active, guess])

  /* ---------- auto‑fire move when ready -- */
  useEffect(() => {
    if (!active) return
    if (needsTarget || needsGuess) return // still waiting for input

    play(active.name, target, guess) // send to server
    setActive(null); setTarget(null); setGuess(null)
  }, [active, needsTarget, needsGuess]) // eslint‑disable‑line

  /* ---------- helpers ------------------- */
  const chooseSeat = useCallback(seat => {
    const p = players[seat]
    if (needsTarget && !p.eliminated && !p.protected) setTarget(seat)
  }, [needsTarget, players])

  const renderHand = seat => {
    const p = players[seat]
    const playing = position === seat
    return playing
      ? p.hand.map((c, i) =>
        <li
          key={i} className='playable'
          onClick={() => setActive(c)}
        >
          <div className={`card ${c.name} ${active?.name === c.name && 'active'}`} />
        </li>)
      : Array.from({ length: p.handSize }).map((_, i) =>
        <li key={i}><div className='card' /></li>)
  }

  /* ---------- JSX ----------------------- */
  return (
    <section className='game-container'>
      {/* guess form ------------------------------------------------ */}
      {needsGuess && target && (
        <form
          className='guess-form' onSubmit={e => {
            e.preventDefault()
            setGuess(new FormData(e.currentTarget).get('guardGuess'))
          }}
        >
          Guard Guess&nbsp;
          {GUESS_OPTIONS.map(opt => (
            <label key={opt}><input type='radio' name='guardGuess' value={opt} /> {opt}</label>
          ))}
          <button>Guess</button>
        </form>
      )}
      <div className={`board active-${gameState.currentPlayerId}${needsTarget ? ' targeting' : ''}`}>

        {/* player panels -------------------------------------------- */}
        {seats.map(seat => {
          const p = players[seat]
          const { username = '???' } = tableState[seat] || {}
          return (
            <div key={seat} className={`${seat} panel${target === seat ? ' target' : ''}`}>
              <h3 className='player-name' onClick={() => chooseSeat(seat)}>{p.eliminated && '💀'} {username} {p.protected && '🛡️'}</h3>

              <ol className='hand'>{renderHand(seat)}</ol>

              <ol className='discard'>
                {p.discardPile.map((c, i) =>
                  <li key={i}><div className={`val ${c.name}`} /></li>)}
              </ol>
            </div>
          )
        })}

        {/* centre stack --------------------------------------------- */}
        <div className='shared panel'>
          <section>
            <h3>Deck (x{gameState.deckSize})</h3>
            <div className='card' />
          </section>
        </div>
      </div>

      <section className='meta'>
        <div className='scores'>
          <h3>Scores:</h3>
          <ul>
            {seats.map(seat => <li key={seat}>{tableState[seat]?.username || '???'}: {gameState.players[seat].score}</li>)}
          </ul>
        </div>
        <div className='logs'>
          <h3>Logs:</h3>
          <ol>
            {players[position].logs.map((log, idx) =>
              <li key={`${log}_${idx}`}>
                {seats.reduce((acc, seat) => acc.replace(seat, tableState[seat].username), log)}
              </li>
            )}
          </ol>
        </div>
      </section>
    </section>
  )
}
