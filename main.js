const { WebSocketServer } = require('ws')
const http = require('http')
const session = require('express-session');
const express = require('express');
const uuid = require('uuid')

const { store } = require('./state')

function onSocketError(err) {
  console.error(err);
}

const app = express()
const map = new Map();

app.use(express.json())

const sessionParser = session({
  saveUninitialized: false,
  secret: '$blalala',
  resave: false
});

app.use(sessionParser)
app.use(express.static('dist'))

app.post('/login', function (req, res) {
  //
  // "Log in" user and set userId to session.
  //
  const id = uuid.v4();
  const name = req.body?.name;

  console.log(`Updating session for user ${id} ${name}`);
  req.session.userId = id;
  req.session.name = name
  res.send({ result: 'OK', message: 'Session updated' });
});

app.get('/state', (_, res) => {
  res.json(store.getState())
})

const server = http.createServer(app);

const wss = new WebSocketServer({ noServer: true, clientTracking: false });


server.on('upgrade', function (request, socket, head) {
  socket.on('error', onSocketError);

  console.log('Parsing session from request...');

  sessionParser(request, {}, () => {
    if (!request.session.userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    console.log('Session is parsed!');

    socket.removeListener('error', onSocketError);

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, request);
    });
  });
});

wss.on('connection', function (ws, request) {
  const { userId, name } = request.session;

  map.set(userId, ws);

  store.dispatch({ type: 'NEW_PLAYER', payload: { userId, name } })

  let updates = setInterval(() => {
    const state = store.getState()
    const player = state.playersById[userId]
    ws.send(JSON.stringify(state[`${player}#state`]))
    console.log(`pushing state for ${player} to ${userId}`)
  }, 2000)

  ws.on('error', console.error);

  ws.on('message', function (message) {
    store.dispatch({ ...JSON.parse(message), meta: { userId } })
  });

  ws.on('close', function () {
    map.delete(userId);
    clearInterval(updates)
    console.log(`cleared interal for ${userId}`)
    store.dispatch({ type: 'REMOVE_PLAYER', payload: { userId } })
  });
});


server.listen(8080, function () {
  console.log('Listening on http://localhost:8080');
});