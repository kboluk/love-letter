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

module.exports = devAuth
