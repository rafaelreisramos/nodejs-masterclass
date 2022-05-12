import http from "node:http"
import https from "node:https"
import environment from "./config.js"
import { handler } from "./routes/routes.js"

const httpServer = http.createServer((req, res) => {
  req.protocol = "http:"
  handler(req, res)
})

const httpsServer = https.createServer(
  { key: environment.httpsPrivateKey, cert: environment.httpsCertificate },
  (req, res) => {
    req.protocol = "https:"
    handler(req, res)
  }
)

function init() {
  httpServer.listen(environment.httpPort, () =>
    console.info(
      `HTTP server is running on port ${environment.httpPort} in ${environment.name} mode`
    )
  )
  httpsServer.listen(environment.httpsPort, () =>
    console.info(
      `HTTPS server is running on port ${environment.httpsPort} in ${environment.name} mode`
    )
  )
}

export default {
  init,
}
