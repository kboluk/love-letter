function getUserProfile (userId) {
  return Promise.resolve({
    id: userId,
    username: `Dev #${userId}`,
    imageUrl: `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}`
  })
}

let counter = 1

function devAuth (req, res, next) {
  // 1. read the cookie (may be undefined)
  let uid = req.cookies?.dev_uid

  // 2. if missing, generate & set it
  if (!uid) {
    uid = counter++
    res.cookie('dev_uid', uid, { httpOnly: true, sameSite: 'lax' })
  }

  // 3. normalise to string once we’re sure it exists
  uid = String(uid)

  // 4. mimic Clerk’s req.auth() shape
  req.auth = () => ({ userId: uid, sessionId: `dev-${uid}` })

  next()
}

module.exports = {
  middleware: devAuth, // to app.use(...)
  getAuth: (req) => req.auth(), // (req) → { userId, ... }
  getUserProfile, // (uid) → Promise<{id,username,imageUrl}>
  authGuard: (req, res, next) => req.auth ? next() : res.sendStatus(401) // express middleware
}
