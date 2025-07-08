const http = require('http')
const express = require('express')
const cookieParser = require('cookie-parser')
const { USE_CLERK, PORT } = require('./config')

const { middleware } = USE_CLERK
  ? require('./auth/clerk')
  : require('./auth/devStub')
const routes = [
  require('./routes/lobby'),
  require('./routes/move'),
  require('./routes/static')
]

const app = express()
app.use(cookieParser())
app.use(middleware)
app.use(express.json())
routes.forEach(r => app.use(r)) // plug routers

http.createServer(app).listen(PORT, () =>
  console.log(`Listening on http://localhost:${PORT}`)
)
