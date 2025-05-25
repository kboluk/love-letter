import { useState, useRef } from 'preact/hooks';
import { render } from 'preact';

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
          setState(JSON.parse(event.data))
        });
      })
  };

  if (state) {
    if (state.names.every(i => i)) {
      return <div>game board</div>
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
    <form onSubmit={onSubmit}>
      <input type="text" name="name" placeholder="your name" />
      <button type="submit">Join</button>
    </form>
  );
}

render(<LoveLetter />, document.body);