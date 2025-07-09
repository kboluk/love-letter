const http = require('http')
const express = require('express')
const cookieParser = require('cookie-parser')
const { PORT } = require('./config')
const auth = require('./auth')

const routes = [
  require('./routes/lobby'),
  require('./routes/move'),
  require('./routes/static')
]

const app = express()
app.use(cookieParser())
app.use(auth.middleware)
app.use(express.json())
auth.mountLoginRoute(app)
routes.forEach(r => app.use(r)) // plug routers

http.createServer(app).listen(PORT, () =>
  console.log(`Listening on http://localhost:${PORT}`)
)
