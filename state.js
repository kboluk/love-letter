const { createStore } = require('redux');
const { shuffle } = require('lodash');

const ogdeck = [
  'guard',
  'guard',
  'guard',
  'guard',
  'guard',
  'princess',
  'countess',
  'king',
  'prince',
  'prince',
  'handmaid',
  'handmaid',
  'baron',
  'baron',
  'priest',
  'priest'
];

const cardValues = {
  guard: 1,
  priest: 2,
  baron: 3,
  handmaid: 4,
  prince: 5,
  king: 6,
  countess: 7,
  princess: 8
};

const deal = (initialDeck, ...initialHands) => {
  const hands = initialHands.map(hand => hand.slice())
  const deck = initialDeck.slice()
  hands.forEach(hand => {
    hand.push(deck.shift())
  })

  return { deck, hands }
}

const draw = (initialDeck, initialHand) => {
  const hand = initialHand.slice()
  const deck = initialDeck.slice()
  hand.push(deck.shift())
  return { deck, hand }
}

const initialState = {
  activePlayer: 'p1',
  aside: '',
  topDiscard: '',
  'p1#hand': [],
  'p2#hand': [],
  'p3#hand': [],
  'p4#hand': [],
  'p1#state': {
    activePlayer: 'p1',
    latest: '',
    hand: [],
    handSizes: [1, 1, 1, 1],
    names: [],
    'p1#discard': [],
    'p2#discard': [],
    'p3#discard': [],
    'p4#discard': [],
  },
  'p2#state': {
    activePlayer: 'p1',
    latest: '',
    hand: [],
    handSizes: [1, 1, 1, 1],
    names: [],
    'p1#discard': [],
    'p2#discard': [],
    'p3#discard': [],
    'p4#discard': [],
  },
  'p3#state': {
    activePlayer: 'p1',
    latest: '',
    hand: [],
    handSizes: [1, 1, 1, 1],
    names: [],
    'p1#discard': [],
    'p2#discard': [],
    'p3#discard': [],
    'p4#discard': [],
  },
  'p4#state': {
    activePlayer: 'p1',
    latest: '',
    hand: [],
    handSizes: [1, 1, 1, 1],
    names: [],
    'p1#discard': [],
    'p2#discard': [],
    'p3#discard': [],
    'p4#discard': [],
  },
  'p1#discard': [],
  'p2#discard': [],
  'p3#discard': [],
  'p4#discard': [],
  'p1#intel': [],
  'p2#intel': [],
  'p3#intel': [],
  'p4#intel': [],
  'p1#prot': false,
  'p2#prot': false,
  'p3#prot': false,
  'p4#prot': false,
  scores: { p1: 0, p2: 0, p3: 0, p4: 0 },
  playerOrder: ['p1', 'p2', 'p3', 'p4'],
  deadPlayers: {},
  playerIds: { p1: '', p2: '', p3: '', p4: '' },
  playersById: {},
  playerNamesById: {},
  deck: []
}

const getNextPlayer = (currentPlayer, playerOrder, deadPlayers) => {
  const currentPlayerPos = playerOrder.findIndex(p => p === currentPlayer)
  let nextPlayer = currentPlayerPos + 1;
  if (currentPlayerPos === playerOrder.length - 1) nextPlayer = 0
  if (deadPlayers[playerOrder[nextPlayer]]) {
    return getNextPlayer(playerOrder[nextPlayer], playerOrder, deadPlayers)
  }
  return playerOrder[nextPlayer]
}


const playbook = {
  'PLAY_CARD': (state, action) => {
    const { cardPosition, target, guess } = action.payload
    const { userId } = action.meta
    const player = state.playersById[userId]
    const handKey = `${player}#hand`;
    const discardKey = `${player}#discard`;
    const card = state[handKey][cardPosition]
    if (card === 'handmaid') {
      return playbook.NEW_TURN({
        ...state,
        topDiscard: card,
        [discardKey]: [...state[discardKey], card],
        [handKey]: state[handKey].filter((_, i) => i !== cardPosition),
        [`${player}#prot`]: true
      })
    }
    if (card === 'countess') {
      return playbook.NEW_TURN({
        ...state,
        topDiscard: card,
        [discardKey]: [...state[discardKey], card],
        [handKey]: state[handKey].filter((_, i) => i !== cardPosition),
      })
    }
    if (card === 'king') {
      const targetHandKey = `${target}#hand`;
      return playbook.NEW_TURN({
        ...state,
        topDiscard: card,
        [discardKey]: [...state[discardKey], card],
        [handKey]: state[targetHandKey].slice(),
        [targetHandKey]: state[handKey].filter((_, i) => i !== cardPosition),
      })
    }
    if (card === 'prince') {
      const targetHandKey = `${target}#hand`;
      const targetDiscardKey = `${target}#discard`;
      const safeToDraw = state.deck.length > 0;
      const { deck, hand } = draw(state.deck, [])
      return playbook.NEW_TURN({
        ...state,
        topDiscard: card,
        ...(
          state[targetHandKey][0] === 'princess'
            ? { deadPlayers: { ...state.deadPlayers, [target]: true } }
            : {}
        ),
        [discardKey]: [...state[discardKey], card],
        [handKey]: state[handKey].filter((_, i) => i !== cardPosition),
        ...(
          safeToDraw
            ? { deck, [targetHandKey]: hand }
            : { [targetHandKey]: [state.aside] }
        ),
        [targetDiscardKey]: [...state[targetDiscardKey], ...state[targetHandKey]]
      })
    }
    if (card === 'priest') {
      const targetHandKey = `${target}#hand`;
      return playbook.NEW_TURN({
        ...state,
        topDiscard: card,
        [discardKey]: [...state[discardKey], card],
        [handKey]: state[handKey].filter((_, i) => i !== cardPosition),
        [`${player}#intel`]: state[targetHandKey].slice()
      })
    }
    if (card === 'baron') {
      const targetHandKey = `${target}#hand`;
      const playerHand = state[handKey].filter((_, i) => i !== cardPosition)
      const playerVal = cardValues[playerHand[0]];
      const targetVal = cardValues[state[targetHandKey][0]]
      let outcome = 'draw';
      if (playerVal > targetVal) outcome = 'win'
      if (targetVal > playerVal) outcome = 'loss'
      return playbook.NEW_TURN({
        ...state,
        topDiscard: card,
        ...(
          outcome === 'win'
            ? { deadPlayers: { ...state.deadPlayers, [target]: true } }
            : {}
        ),
        ...(
          outcome === 'loss'
            ? { deadPlayers: { ...state.deadPlayers, [player]: true } }
            : {}
        ),
        [discardKey]: [...state[discardKey], card],
        [handKey]: playerHand,
      })
    }
    if (card === 'guard') {
      const targetHandKey = `${target}#hand`;
      return playbook.NEW_TURN({
        ...state,
        topDiscard: card,
        ...(
          state[targetHandKey][0] === guess
            ? { deadPlayers: { ...state.deadPlayers, [target]: true } }
            : {}
        ),
        [discardKey]: [...state[discardKey], card],
        [handKey]: state[handKey].filter((_, i) => i !== cardPosition),
      })
    }
  },
  'NEW_ROUND': (state) => {
    const newDeck = shuffle(ogdeck)
    const aside = newDeck.shift()
    const { deck: deckAfterDeal, hands } = deal(newDeck, [], [], [], [])
    const { deck, hand: activePlayerHand } = draw(deckAfterDeal, hands[0])
    const activePlayerIdx = state.playerOrder.findIndex(p => p === state.activePlayer)
    const handSizes = [1, 1, 1, 1];
    handSizes[activePlayerIdx] = 2
    const names = [
      state.playerNamesById[state.playerIds.p1],
      state.playerNamesById[state.playerIds.p2],
      state.playerNamesById[state.playerIds.p3],
      state.playerNamesById[state.playerIds.p4],
    ]
    return {
      ...state,
      deadPlayers: {},
      aside,
      deck,
      'p1#hand': state.activePlayer === 'p1' ? activePlayerHand : hands[0],
      'p2#hand': state.activePlayer === 'p2' ? activePlayerHand : hands[1],
      'p3#hand': state.activePlayer === 'p3' ? activePlayerHand : hands[2],
      'p4#hand': state.activePlayer === 'p4' ? activePlayerHand : hands[3],
      'p1#state': {
        activePlayer: state.activePlayer,
        latest: '',
        hand: state.activePlayer === 'p1' ? activePlayerHand : hands[0],
        handSizes,
        'p1#discard': [],
        'p2#discard': [],
        'p3#discard': [],
        'p4#discard': [],
        names
      },
      'p2#state': {
        activePlayer: state.activePlayer,
        latest: '',
        hand: state.activePlayer === 'p2' ? activePlayerHand : hands[1],
        handSizes,
        'p1#discard': [],
        'p2#discard': [],
        'p3#discard': [],
        'p4#discard': [],
        names
      },
      'p3#state': {
        activePlayer: state.activePlayer,
        latest: '',
        hand: state.activePlayer === 'p3' ? activePlayerHand : hands[2],
        handSizes,
        'p1#discard': [],
        'p2#discard': [],
        'p3#discard': [],
        'p4#discard': [],
        names
      },
      'p4#state': {
        activePlayer: state.activePlayer,
        latest: '',
        hand: state.activePlayer === 'p4' ? activePlayerHand : hands[3],
        handSizes,
        'p1#discard': [],
        'p2#discard': [],
        'p3#discard': [],
        'p4#discard': [],
        names
      },
      'p1#discard': [],
      'p2#discard': [],
      'p3#discard': [],
      'p4#discard': [],
      'p1#intel': [],
      'p2#intel': [],
      'p3#intel': [],
      'p4#intel': [],
    }
  },
  'NEW_TURN': (state) => {
    const survivors = state.playerOrder.filter(p => !state.deadPlayers[p])
    if (survivors.length === 1) {
      return playbook.NEW_ROUND({ ...state, activePlayer: survivors[0], scores: { ...state.scores, [survivors[0]]: state.scores[survivors[0]] + 1 } })
    }
    if (state.deck.length === 0) {
      // reveal + calc
    }
    const activePlayer = getNextPlayer(state.activePlayer, state.playerOrder, state.deadPlayers)
    const activePlayerHandKey = `${activePlayer}#hand`
    const { deck, hand } = draw(state.deck, state[activePlayerHandKey])
    if (deck.length === 0) {
      // reveal + calc
    }
    const playerStates = {}
    state.playerOrder.forEach(p => {
      const key = `${p}#state`
      playerStates[key] = {
        ...state[key],
        handSizes: [
          state['p1#hand'].length,
          state['p2#hand'].length,
          state['p3#hand'].length,
          state['p4#hand'].length,
        ],
        latest: state.topDiscard,
        'p1#discard': state['p1#discard'].slice(),
        'p2#discard': state['p2#discard'].slice(),
        'p3#discard': state['p3#discard'].slice(),
        'p4#discard': state['p4#discard'].slice(),
      }
    })
    return {
      ...state,
      ...playerStates,
      activePlayer,
      [activePlayerHandKey]: hand,
      [`${activePlayer}#prot`]: false,
      deck
    }
  },
  'NEW_PLAYER': (state, action) => {
    const unoccupiedSeat = Object.entries(state.playerIds).find(pair => pair[1] === '')
    if (unoccupiedSeat) {
      const { userId, name } = action.payload
      const nextState = {
        ...state,
        playerIds: {
          ...state.playerIds,
          [unoccupiedSeat[0]]: userId
        },
        playersById: {
          ...state.playersById,
          [userId]: unoccupiedSeat[0]
        },
        playerNamesById: {
          ...state.playerNamesById,
          [userId]: name
        }
      }
      const names = nextState.playerOrder.map((p) => nextState.playerNamesById[nextState.playerIds[p]])
      const playerStates = {}
      state.playerOrder.forEach(p => {
        const key = `${p}#state`
        playerStates[key] = {
          ...nextState[key],
          names
        }
      })

      if (!Object.entries(nextState.playerIds).find(pair => pair[1] === '')) {
        return playbook.NEW_ROUND(nextState)
      }
      return {
        ...nextState,
        ...playerStates
      }
    }
    return state
  },
  'REMOVE_PLAYER': (state, action) => {
    const { userId } = action.payload
    const occupiedSeat = Object.entries(state.playerIds).find(pair => pair[1] === userId)
    if (occupiedSeat) {
      const playerIds = { ...state.playerIds }
      const playersById = { ...state.playersById }
      const playerNamesById = { ...state.playerNamesById }
      delete playersById[userId]
      delete playerNamesById[userId]
      playerIds[occupiedSeat[0]] = ''
      const names = state.playerOrder.map((p) => playerNamesById[playerIds[p]])
      const playerStates = {}
      state.playerOrder.forEach(p => {
        const key = `${p}#state`
        playerStates[key] = {
          ...state[key],
          names
        }
      })
      return {
        ...state,
        playerIds,
        playerNamesById,
        playerNamesById,
        ...playerStates
      }
    }
    return state
  }
}

const reducer = (state = initialState, action) => {
  if (playbook[action.type]) return playbook[action.type](state, action)
  return state
}

const store = createStore(reducer, initialState)

module.exports = { store }