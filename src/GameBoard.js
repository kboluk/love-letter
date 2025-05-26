import { useState, useEffect } from 'preact/hooks';

const guessTypes = [
  'princess',
  'countess',
  'king',
  'prince',
  'handmaid',
  'baron',
  'priest',
];

function GameBoard(props) {
  const {
    activePlayer,
    latest,
    deckSize,
    hand,
    handSizes,
    names,
    position,
    play
  } = props;
  const [target, setTarget] = useState(null)
  const [activeCard, setActiveCard] = useState(null)
  const [guess, setGuess] = useState(null)
  const [p1Name, p2Name, p3Name, p4Name] = names
  const [p1Hand, p2Hand, p3Hand, p4Hand] = handSizes

  useEffect(() => {
    if (typeof activeCard === 'number' && typeof target === 'string') {
      if (hand[activeCard] !== 'guard') {
        play(activeCard, target)
        setTarget(null)
        setActiveCard(null)
        return
      }
      if (guess) {
        play(activeCard, target, guess)
        setTarget(null)
        setActiveCard(null)
        setGuess(null)
      }
    }
  }, [target, activeCard, guess])

  const chooseTarget = (targetPos) => {
    if (typeof activeCard === 'number') {
      setTarget(targetPos)
    }
  }

  const guessSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const guardGuess = formData.get('guardGuess')
    setGuess(guardGuess)
  }
  const showGuessForm = typeof activeCard === 'number' && typeof target === 'string' && hand[activeCard] === 'guard'
  const playable = activePlayer === position
  return (
    <section>
      <div className={`board active-${activePlayer}`}>
        <form onSubmit={guessSubmit} className={`guess-form ${showGuessForm ? 'show' : ''}`}>
          Guard Guess
          {guessTypes.map(type => <label><input type='radio' name='guardGuess' value={type} /> {type}</label>)}
          <button type='submit'>Guess</button>
        </form>
        <div className="p1 panel">
          <h3 onClick={() => chooseTarget('p1')}>{p1Name}</h3>
          <ol className="hand">
            {
              playable && position === 'p1'
                ? hand.map((c, idx) =>
                  <li className="playable" onClick={() => setActiveCard(idx)}>
                    <div className={`card ${c} ${activeCard === idx && 'active'}`}></div>
                  </li>)
                : Array.from({ length: p1Hand }, (_, idx) => idx)
                  .map(() => <li><div className="card"></div></li>)
            }
          </ol>
          <ol className="discard">
            {
              props['p1#discard'].map(c => <li><div className={`val ${c}`}></div></li>)
            }
          </ol>
        </div>
        <div className="p2 panel">
          <h3 onClick={() => chooseTarget('p2')}>{p2Name}</h3>
          <ol className="hand">
            {
              playable && position === 'p2'
                ? hand.map((c, idx) => <li className="playable" onClick={() => play(idx)}><div className={`card ${c}`}></div></li>)
                : Array.from({ length: p2Hand }, (_, idx) => idx)
                  .map(() => <li><div className="card"></div></li>)
            }
          </ol>
          <ol className="discard">
            {
              props['p2#discard'].map(c => <li><div className={`val ${c}`}></div></li>)
            }
          </ol>
        </div>
        <div className="shared panel">
          <section>
            <h3>Last Played</h3>
            <div className={`card ${latest}`}></div>
          </section>
          <section>
            <h3>Deck (x{deckSize})</h3>
            <div className="card"></div>
          </section>
        </div>
        <div className="p3 panel">
          <h3 onClick={() => chooseTarget('p3')}>{p3Name}</h3>
          <ol className="hand">
            {
              playable && position === 'p3'
                ? hand.map((c, idx) => <li className="playable" onClick={() => play(idx)}><div className={`card ${c}`}></div></li>)
                : Array.from({ length: p3Hand }, (_, idx) => idx)
                  .map(() => <li><div className="card"></div></li>)
            }
          </ol>
          <ol className="discard">
            {
              props['p3#discard'].map(c => <li><div className={`val ${c}`}></div></li>)
            }
          </ol>
        </div>
        <div className="p4 panel">
          <h3 onClick={() => chooseTarget('p4')}>{p4Name}</h3>
          <ol className="hand">
            {
              playable && position === 'p4'
                ? hand.map((c, idx) => <li className="playable" onClick={() => play(idx)}><div className={`card ${c}`}></div></li>)
                : Array.from({ length: p4Hand }, (_, idx) => idx)
                  .map(() => <li><div className="card"></div></li>)
            }
          </ol>
          <ol className="discard">
            {
              props['p4#discard'].map(c => <li><div className={`val ${c}`}></div></li>)
            }
          </ol>
        </div>
      </div>
    </section>
  );
}

export default GameBoard