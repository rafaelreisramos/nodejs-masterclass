import { URL } from "node:url"

const handler = (req, res) => {
  const url = new URL(`${req.protocol}//${req.headers.host}${req.url}`)
  const pathname = url.pathname.replace(/^\//, "")

  const chosenHandler = routes[pathname] ?? routes["notFound"]

  chosenHandler((status) => {
    res.writeHead(status).end()
    console.log("Returning this response:", status)
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
