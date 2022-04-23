import http from "node:http"
import https from "node:https"
import handler from "./routes/routes.js"
import environment from "./config.js"

const httpServer = http.createServer((req, res) => {
  req.protocol = "http:"
  handler(req, res)
})

const httpsServerOptions = {
  key: environment.httpsPrivateKey,
  cert: environment.httpsCertificate,
}

const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  req.protocol = "https:"
  handler(req, res)
})

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

export default init
