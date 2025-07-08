const generateFullDeck = require('./generateFullDeck')
const shuffleDeck = require('./shuffleDeck')
const setAsideTopCard = require('./setAsideTopCard')
const dealOneCardToEachPlayer = require('./dealOneCardToEachPlayer')
const applyCardEffect = require('./applyCardEffect')
const resetForNextRound = require('./resetForNextRound')
const tallyScores = require('./tallyScores')
const evaluateRoundEnd = require('./evaluateRoundEnd')
const updateLegalMovesForCurrentPlayer = require('./updateLegalMovesForCurrentPlayer')
const advanceCurrentPlayer = require('./advanceCurrentPlayer')
const drawCardForCurrentPlayer = require('./drawCardForCurrentPlayer')
const clearProtectionForCurrentPlayer = require('./clearProtectionForCurrentPlayer')

module.exports = {
  generateFullDeck,
  shuffleDeck,
  setAsideTopCard,
  dealOneCardToEachPlayer,
  applyCardEffect,
  resetForNextRound,
  tallyScores,
  evaluateRoundEnd,
  updateLegalMovesForCurrentPlayer,
  drawCardForCurrentPlayer,
  advanceCurrentPlayer,
  clearProtectionForCurrentPlayer
}
