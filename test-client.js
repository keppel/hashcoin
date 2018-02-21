let Wallet = require('./lib/wallet-methods.js')
let { createHash } = require('crypto')
let { connect } = require('lotion')
let { generate, validate } = require('hashcash-token')

async function main() {
  let client = await connect(process.env.GCI)
  let priv = createHash('sha256')
    .update('foo')
    .digest()
  let wallet = Wallet(priv, client)

  console.log('generating token...')
  let token = generate({
    data: 'LEH8BEZgC4onZ4GLm8UpZ3vXGAr7SHjnD'
  })
  console.log(token)

  console.log(validate(token))
  let amount = Math.round(token.rarity / 1e5)
  let hashcoinTx = {
    from: { type: 'hashcoin', token, amount },
    to: { address: 'LEH8BEZgC4onZ4GLm8UpZ3vXGAr7SHjnD', amount }
  }
  console.log(hashcoinTx)
  console.log(await client.send(hashcoinTx))
}

process.on('unhandledRejection', e => {
  console.log(e)
})

main()
