import { URL } from "node:url"
import { StringDecoder } from "node:string_decoder"

const handler = (req, res) => {
  const url = new URL(`${req.protocol}//${req.headers.host}${req.url}`)
  const pathname = url.pathname.replace(/^\//, "")
  const method = req.method
  const headers = req.headers
  const searchParams = url.searchParams
  const decoder = new StringDecoder("utf-8")

  let buffer = {}
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
      payload: buffer,
    }

    const chosenHandler = routes[pathname] ?? routes["notFound"]
    chosenHandler(data, (status = 200, payload = {}) => {
      res
        .writeHead(status, { "Content-Type": "application/json" })
        .end(JSON.stringify(payload))
      console.log(`Status: ${status}, payload: ${JSON.stringify(payload)}`)
    })
  })
}

const routes = {
  alive: (_, callback) => {
    callback(200, { route: "alive" })
  },

  notFound: (_, callback) => {
    callback(404)
  },
}

export default handler
