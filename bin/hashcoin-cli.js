#!/usr/bin/env node

let argv = require('minimist')(process.argv.slice(2))
let { generate } = require('hashcash-token')
let { connect } = require('lotion')
let mkdirp = require('mkdirp').sync
let fs = require('fs')
let { randomBytes } = require('crypto')
let { dirname, join } = require('path')
let Wallet = require('../lib/wallet-methods.js')

const GCI = process.env.GCI
const HOME = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
const keyPath = join(HOME, '.hashcoin/keys.json')

async function main() {
  if (argv._.length === 0) {
    console.log(`Usage:

    hashcoin balance
      Gets your wallet balance and address

    hashcoin send <address> <amount>
      Sends coins from your wallet to the specified address

    hashcoin mine
      Runs a simple CPU miner that pays rewards to your address\n\n`)
    process.exit(1)
  }

  let privkey
  try {
    // load existing key
    let privkeyContents = fs.readFileSync(keyPath, 'utf8')
    let privkeyHex = JSON.parse(privkeyContents)[0].private
    privkey = Buffer.from(privkeyHex, 'hex')
  } catch (err) {
    if (err.code !== 'ENOENT') throw err

    // no key, generate one
    let keys = [{ private: randomBytes(32).toString('hex') }]
    let keysJson = JSON.stringify(keys, null, '  ')
    mkdirp(dirname(keyPath))
    fs.writeFileSync(keyPath, keysJson, 'utf8')
    privkey = Buffer.from(keys[0].private, 'hex')
  }

  let client = await connect(GCI)
  let wallet = Wallet(privkey, client)

  if (argv._[0] === 'mine') {
    let totalMined = 0
    while (true) {
      await new Promise((resolve, reject) => {
        setImmediate(async function() {
          let token = generate({ data: wallet.address, difficulty: 1000 })
          if (token.rarity > 1e6) {
            let hashcoinTx = buildHashcoinTx(token, wallet.address)
            await client.send(hashcoinTx)

            totalMined += Math.round(token.rarity / 1e5)
            process.stdout.clearLine()
            process.stdout.cursorTo(0)
            process.stdout.write(`${totalMined} coins mined`)
          }
          resolve()
        })
      })
    }
  }

  // get balance
  if (argv._[0] === 'balance' && argv._.length === 1) {
    let balance = await wallet.getBalance()
    console.log('your address: ' + wallet.address)
    console.log('your balance: ' + balance)
    process.exit()
  }

  // send coins to another address
  if (argv._[0] === 'send' && argv._.length === 3) {
    let address = argv._[1]
    let amount = argv._[2]

    let result = await wallet.send(address, amount)
    console.log(result)
    process.exit()
  }
}

function buildHashcoinTx(token, address) {
  let amount = Math.round(token.rarity / 1e5)
  let hashcoinTx = {
    from: { type: 'hashcoin', token, amount },
    to: { address, amount }
  }
  return hashcoinTx
}

main()
