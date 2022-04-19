import { URL } from "node:url"
import { StringDecoder } from "node:string_decoder"

const handler = (req, res) => {
  const url = new URL(`${req.protocol}//${req.headers.host}${req.url}`)
  const pathname = url.pathname.replace(/^\//, "")
  const decoder = new StringDecoder("utf-8")

  let payload = {}
  req.on("data", (data) => {
    payload += decoder.write(data)
  })
  req.on("end", () => {
    payload += decoder.end()

    const chosenHandler = routes[pathname] ?? routes["notFound"]
    chosenHandler((status) => {
      res.writeHead(status).end()
      console.log(`Returning this response: ${status}`)
    })

    console.log(`Returning this payload: ${payload}`)
  })
}

const routes = {
  alive: (callback) => {
    callback(200)
  },

  notFound: (callback) => {
    callback(404)
  },
}

export default handler
