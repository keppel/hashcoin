let { validate } = require('hashcash-token')

let hashcoin = {
  initialState: {
    redeemedHashes: {}
  },
  onInput(input, tx, state) {
    // validate the work proof
    let isValid = validate(input.token)
    if (!isValid) {
      throw new Error('invalid work proof')
    }

    // make sure this work proof hasn't already been redeemed
    if (state.redeemedHashes[input.token.hash]) {
      throw new Error('duplicate work proof')
    }

    // check that the tx will pay out the correct amount
    let amount = Math.round(input.token.rarity / 1e5)
    if (input.amount !== amount) {
      throw new Error('invalid input amount')
    }

    // make sure the data being hashed contained recipient address
    if (tx.to[0].address !== input.token.data) {
      throw new Error('invalid recipient address for work proof')
    }

    // work proof is valid; mark it redeemed
    state.redeemedHashes[input.token.hash] = true
  }
}

module.exports = hashcoin
