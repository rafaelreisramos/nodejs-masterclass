import "dotenv/config"

const currentEnv = process.env.NODE_ENV
  ? process.env.NODE_ENV.toLowerCase()
  : "development"

export default {
  httpPort: process.env.HTTP_PORT,
  httpsPort: process.env.HTTPS_PORT,
  httpsCertificate: process.env.SERVER_CERTIFICATE,
  httpsPrivateKey: process.env.SERVER_PRIVATE_KEY,
  name: currentEnv,
  hashSecret: process.env.HASH_SECRET,
  maxChecks: process.env.MAX_CHECKS,
}
