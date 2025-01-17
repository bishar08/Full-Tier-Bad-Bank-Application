var express = require('express')
var app = express()
//var admin = require('./admin')
var cors = require('cors')
var dal = require('./dal.js')
const e = require('express')
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUI = require('swagger-ui-express')
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const swaggerDocument = require('./swagger.json')

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Library API',
      version: '1.0.0',
    },
  },
  apis: ['index.js'],
}

app.use(express.json())
const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument))

// used to serve static files from public directory
app.use(express.static('public'))
app.use(express.json())
app.use(cors())

async function verifyToken(req, res, next) {
  const idToken = req.headers.authorization
  console.log('idToken:', idToken)

  if (idToken) {
    admin
      .auth()
      .verifyIdToken(idToken)
      .then(function (decodedToken) {
        console.log('DecodedToken:', decodedToken)
        console.log('Decoded token success!')
        return next()
      })
      .catch(function (error) {
        console.log('Decoded token fail!')
        return res.status(401).send('You are not authorized')
      })
  } else {
    console.log('Token not found!')
    return res.status(401).send('You are not authorized')
  }
}

app.use('/alldata', verifyToken)
app.use('/deposit', verifyToken)
app.use('/withdraw', verifyToken)
app.use('/balance', verifyToken)

app.get('/alldata', function (req, res) {
  // read token from header
  const idToken = req.headers.authorization
  console.log('header:', idToken)

  // verify token
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(function (decodedToken) {
      console.log('decodedToken:', decodedToken)
      res.send('Authentication Sucess!')
    })
    .catch(function (error) {
      console.log('error:', error)
      res.send('Authentication Fail!')
    })
})

app.get('/account/create/:name/:email/:password', function (req, res) {
  // check if account exists
  dal.find(req.params.email).then((users) => {
    // if user exists, return error message
    if (users.length > 0) {
      console.log('User already in exists')
      res.send('User already in exists')
    } else {
      // else create user
      dal
        .create(req.params.name, req.params.email, req.params.password)
        .then((user) => {
          console.log(user)
          res.send(user)
        })
    }
  })
})

// login user
app.get('/account/login/:email/:password', function (req, res) {
  dal.find(req.params.email).then((user) => {
    // if user exists, check password
    if (user.length > 0) {
      if (user[0].password === req.params.password) {
        res.send(user[0])
      } else {
        res.send('Login failed: wrong password')
      }
    } else {
      res.send('Login failed: user not found')
    }
  })
})

// find user account
app.get('/account/find/:email', function (req, res) {
  dal.find(req.params.email).then((user) => {
    console.log(user)
    res.send(user)
  })
})

// find one user by email - alternative to find
app.get('/account/findOne/:email', function (req, res) {
  dal.findOne(req.params.email).then((user) => {
    console.log(user)
    res.send(user)
  })
})

// update - deposit/withdraw amount
app.get('/account/update/:email/:amount', function (req, res) {
  var amount = Number(req.params.amount)

  dal.update(req.params.email, amount).then((response) => {
    console.log(response)
    res.send(response)
  })
})

// all accounts
app.get('/account/all', function (req, res) {
  dal.all().then((docs) => {
    console.log(docs)
    res.send(docs)
  })
})

var port = process.env.PORT || 3000
app.listen(port)
console.log('Running on port: ' + port)
