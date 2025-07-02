/**
 * build a runnable FSM instance
 * @param {object} config   – the `game` node from state.json
 * @param {object} actions  – { fnName(state,payload)=>state, ... }
 * @param {object} guards   – { condName(state,payload)=>boolean, ... }
 */
function createFSM (config, actions = {}, guards = {}) {
  let current = config.initial

  // helper – run every action name in order; returns last state snapshot
  const run = (state, list, payload) =>
    (list || []).reduce(
      (acc, name) =>
        typeof actions[name] === 'function' ? actions[name](acc, payload) : acc,
      state
    )

  function autoAdvance (st, payload) {
    while (true) {
      const cfg = config.states[current]
      const list = cfg.always ?? []
      const next = list.find(c => !c.cond || guards[c.cond]?.(st, payload))
      if (!next) break

      current = next.target
      st = run(st, config.states[current]?.onEntry, payload)
    }
    return st
  }
  // run onEntry of the initial state exactly once
  function start (state) {
    const st = run(state, config.states[current]?.onEntry)
    return autoAdvance(st)
  }

  /**
   * dispatch an event; returns **new** game state (or same if no transition)
   */
  function send (state, event, payload = {}) {
    const stateDef = config.states[current]
    if (!stateDef) return state

    const trans = stateDef.on?.[event]
    if (!trans) return state // no transition

    // normalise to an array of {target, cond?}
    const candidates = Array.isArray(trans)
      ? trans
      : [{ target: trans }]

    let next = null
    for (const c of candidates) {
      if (!c.cond || guards[c.cond]?.(state, payload)) {
        next = c.target
        break
      }
    }
    if (!next) return state // no cond satisfied

    let newState = state
    // (optional) run onExit if you later add it
    // newState = run(newState, stateDef.onExit, payload);

    current = next
    newState = run(newState, config.states[next]?.onEntry, payload)
    return autoAdvance(newState)
  }

  // expose a simple API
  return { start, send, getCurrent: () => current }
}

module.exports = createFSM
