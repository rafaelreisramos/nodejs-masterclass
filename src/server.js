import http from "node:http"
import https from "node:https"
import { URL } from "node:url"
import { StringDecoder } from "node:string_decoder"
import routes from "./routes/routes.js"
import environment from "./config.js"
import helpers from "./utils/helpers.js"

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

const handler = (req, res) => {
  const url = new URL(`${req.protocol}//${req.headers.host}${req.url}`)
  const pathname = url.pathname.replace(/^\//, "")
  const method = req.method.toLowerCase()
  const headers = req.headers
  const searchParams = url.searchParams
  const decoder = new StringDecoder("utf-8")
  let buffer = ""
  req.on("data", (data) => {
    buffer += decoder.write(data)
  })
  req.on("end", () => {
    buffer += decoder.end()

    const data = {
      pathname,
      method,
      headers,
      searchParams,
      payload: helpers.jsonParse(buffer),
    }

    let chosenHandler = routes[pathname] ?? routes["notFound"]
    chosenHandler = pathname.includes("public")
      ? routes["public"]
      : chosenHandler
    try {
      chosenHandler(data, res)
    } catch (e) {
      const error = {
        error: e?.message ? e.message : "an unknown error has occured",
      }
      res.setHeader("Content-Type", "application/json")
      res.writeHead(500)
      res.end(JSON.stringify(error))
    }
  })
}

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
