const crypto = require('crypto')
const USERS = new Map() // sessionId  ->  { id, username }

function createSession (username) {
  const id = crypto.randomUUID()
  USERS.set(id, { id, username })
  return id
}

/* ---------- middleware to parse cookie & attach req.auth() -------- */
function middleware (req, res, next) {
  const { sid } = req.cookies || {}
  if (sid && USERS.has(sid)) {
    const user = USERS.get(sid)
    req.auth = () => ({ userId: user.id })
  }
  next()
}

/* ---------- guard ------------------------------------------------- */
function authGuard (req, res, next) {
  return req.auth ? next() : res.sendStatus(401)
}

/* ---------- login route ------------------------------------------ */
function mountLoginRoute (app) {
  app.post('/login', (req, res) => {
    const { username } = req.body || {}
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'username too short' })
    }

    const sidCookie = req.cookies?.sid
    const current = sidCookie && USERS.get(sidCookie) // may be undefined
    const takenBy = [...USERS.values()].find(u => u.username === username)

    /* ---------- Case 1: already logged in with same name ---------- */
    if (current && current.username === username) {
      return res.sendStatus(200) // nothing to change
    }

    /* ---------- Case 2: name belongs to some *other* session ------ */
    if (takenBy && (!current || takenBy.id !== current.id)) {
      return res.status(409).json({ error: 'username taken' })
    }

    /* ---------- Case 3: update existing session name -------------- */
    if (current) {
      current.username = username // mutate in‑place
      return res.sendStatus(200)
    }

    /* ---------- Case 4: fresh session ----------------------------- */
    const sid = createSession(username)
    res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax' })
    res.sendStatus(200)
  })
}

/* ---------- helper ------------------------------------------------ */
function getUserProfile (id) {
  const user = USERS.get(id)
  return Promise.resolve({
    id: user.id,
    username: user.username,
    imageUrl: `https://api.dicebear.com/7.x/thumbs/svg?seed=${user.username}`
  })
}

module.exports = {
  middleware,
  authGuard,
  mountLoginRoute,
  getAuth: (req) => req.auth(), // always defined after middleware
  getUserProfile
}
