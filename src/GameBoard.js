function GameBoard(props) {
  const {
    activePlayer,
    latest,
    deckSize,
    hand,
    handSizes,
    names,
    position
  } = props;
  const [p1Name, p2Name, p3Name, p4Name] = names
  const [p1Hand, p2Hand, p3Hand, p4Hand] = handSizes
  return (
    <section>
      <div className={`board active-${activePlayer}`}>
        <div className="p1 panel">
          <h3>{p1Name}</h3>
          <ol className="hand">
            {
              Array.from({ length: p1Hand }, (_, idx) => idx).map(() => <li><div className="card"></div></li>)
            }
          </ol>
          <ol className="discard">
            {
              props['p1#discard'].map(c => <li><div className={`val ${c}`}></div></li>)
            }
          </ol>
        </div>
        <div className="p2 panel">
          <h3>{p2Name}</h3>
          <ol className="hand">
            {
              Array.from({ length: p2Hand }, (_, idx) => idx).map(() => <li><div className="card"></div></li>)
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
          <h3>{p3Name}</h3>
          <ol className="hand">
            {
              Array.from({ length: p3Hand }, (_, idx) => idx).map(() => <li><div className="card"></div></li>)
            }
          </ol>
          <ol className="discard">
            {
              props['p3#discard'].map(c => <li><div className={`val ${c}`}></div></li>)
            }
          </ol>
        </div>
        <div className="p4 panel">
          <h3>{p4Name}</h3>
          <ol className="hand">
            {
              Array.from({ length: p4Hand }, (_, idx) => idx).map(() => <li><div className="card"></div></li>)
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