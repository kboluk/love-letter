import { render } from 'preact';
import { useState, useRef } from 'preact/hooks';
import GameBoard from './GameBoard'

function LoveLetter() {
  const [state, setState] = useState(null)
  const socket = useRef(null)
  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name')
    fetch('/login', { method: 'POST', body: JSON.stringify({ name }), headers: { 'content-type': 'application/json' } })
      .then(i => i.json())
      .then(() => {
        socket.current = new WebSocket(`ws${window.location.protocol === 'https:' ? 's' : ''}://${window.location.host}`);
        socket.current.addEventListener("message", (event) => {
          const newState = JSON.parse(event.data)
          if (!(state.activePlayer === state.position && activePlayer !== state.activePlayer)) {
            setState(newState)
          }
        });
      })
  };
  const play = (cardPosition, target, guess) => {
    socket.current.send(JSON.stringify({ type: 'PLAY_CARD', payload: { cardPosition, target, guess } }))
  }

  if (state) {
    if (state.names.every(i => i)) {
      return <GameBoard {...state} play={play} />
    }
    return (
      <>
        <h2>waiting on other players</h2>
        <ol>
          {state.names.map((name, idx) => <li>p{idx + 1}: {name || '???'}</li>)}
        </ol>
      </>
    )
  }
  return (
    <>
      <form onSubmit={onSubmit}>
        <input type="text" name="name" placeholder="your name" />
        <button type="submit">Join</button>
      </form>
    </>
  );
}

const App = <LoveLetter />

render(App, document.body);