require('dotenv').config()

module.exports = {
  USE_CLERK: process.env.USE_CLERK === 'true',
  PORT: process.env.PORT || 8080
}
