let lotion = require('lotion')
let coins = require('coins')
let hashcoin = require('./lib/hashcoin.js')

let app = lotion({
  initialState: {},
  devMode: true
})

app.use(
  coins({
    initialBalances: {},
    handlers: {
      hashcoin
    }
  })
)

app.listen(3000).then(console.log)
