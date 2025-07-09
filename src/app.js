import { render } from 'preact'
import { useState, useRef, useEffect } from 'preact/hooks'
import GameBoard from './GameBoard'

/* --------------------------- component --------------------------- */
function LoveLetter () {
  const [userState, setUserState] = useState(null)
  const [tableState, setTableState] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [position, setPosition] = useState(null)

  const esRef = useRef(null)
  const prevPlaying = useRef(false)
  const playing = position === gameState?.currentPlayerId

  /* ---------- open (and always cleanup) SSE connection ----------- */
  useEffect(() => {
    async function ensureLogin () {
      const hasCookie = document.cookie.includes('sid=')
      if (hasCookie) return

      let username = prompt('Choose a user­name (min 3 chars)')
      while (username && username.length < 3) {
        username = prompt('Too short. Try again:')
      }
      if (!username) return // user cancelled → stay idle

      const resp = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })
      if (!resp.ok) alert('login failed: ' + (await resp.text()))
    }

    ensureLogin().then(() => {
      const es = new EventSource('/game') // same‑origin ⇒ cookies auto
      esRef.current = es

      es.onmessage = e => {
        const msg = JSON.parse(e.data)
        switch (msg.type) {
          case 'TABLE_STATE': setTableState(msg.payload); break
          case 'USER_STATE' : setUserState(msg.payload); break
          case 'GAME_STATE' : setGameState(msg.payload); break
          default: console.warn('unknown SSE', msg)
        }
      }
    })
    return () => esRef.current && esRef.current.close() // clean up on unmount
  }, [])

  /* ------------- derive my seat every time deps change ----------- */
  useEffect(() => {
    if (!userState || !tableState) return
    const seat = Object.keys(tableState)
      .find(s => tableState[s]?.id === userState.id)
    setPosition(seat ?? null)
  }, [userState, tableState])

  /* ---- side effects when my turn starts ----------------------- */

  useEffect(() => {
    if (playing && !prevPlaying.current) {
      document.title = '▶ Your turn!'
    }
    if (!playing && prevPlaying.current) {
      document.title = 'Love Letter'
    }
    prevPlaying.current = playing
  }, [playing])

  /* ------------------- helper: play a card ----------------------- */
  async function play (cardName, targetSeat = null, guess = null) {
    try {
      await fetch('/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardName, targetSeat, guess })
      })
    } catch (e) {
      console.error('move failed', e)
      alert('move failed: ' + e.message)
    }
  }

  /* ------------------- helper: join the table -------------------- */
  async function join () {
    try {
      await fetch('/join', { method: 'GET' }) // same‑origin, cookie sent
    } catch (e) {
      alert('join failed: ' + e.message)
    }
  }

  /* --------------------------- render ---------------------------- */
  if (gameState) {
    return (
      <>
        {playing && <div className='turn-banner'>Your turn!</div>}
        <GameBoard
          gameState={gameState}
          tableState={tableState}
          position={position}
          play={play}
        />
      </>
    )
  }

  if (tableState) {
    return (
      <>
        <h2>Waiting room</h2>
        <ol>
          {Object.keys(tableState).map(seat => (
            <li key={seat}>
              {seat}: {tableState[seat]?.username ?? ' — empty —'}
            </li>
          ))}
        </ol>
        <button onClick={join} disabled={!!position}>
          {position ? 'SEATED' : 'JOIN'}
        </button>
      </>
    )
  }

  return <>loading…</>
}

render(<LoveLetter />, document.body)
