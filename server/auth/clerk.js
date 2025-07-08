const {
  clerkMiddleware,
  clerkClient,
  requireAuth,
  getAuth
} = require('@clerk/express')

function getUserProfile (userId) {
  return clerkClient.users.getUser(userId)
}

module.exports = {
  middleware: clerkMiddleware, // to app.use(...)
  getAuth, // (req) → { userId, ... }
  getUserProfile, // (uid) → Promise<{id,username,imageUrl}>
  authGuard: requireAuth // express middleware
}
