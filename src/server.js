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

export { httpServer, httpsServer }
