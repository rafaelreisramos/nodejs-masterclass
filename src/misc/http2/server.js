import config from "../config.js"
let http2
try {
  http2 = await import("node:http2")
} catch (err) {
  console.log("http2 support is disabled!")
}

/**
 * Since there are no browsers known that support unencrypted HTTP/2,
 * the use of http2.createSecureServer() is necessary when communicating
 * with browser clients.
 */

const {
  server: { port, address: host },
  ssl: { key, cert },
} = config
const server = http2.createSecureServer({ key, cert })

server.on("stream", (stream, headers) => {
  console.log("request received")
  stream.respond({
    "Content-Type": "'text/html'; charset=utf-8",
    ":status": 200,
  })
  stream.end("<h1>Hello World</h1>")
  console.log("response sent")
  server.close(() => console.log("closing http2 server"))
})

server.on("sessionError", (error) => console.error(error))

server.listen(port, host, () => {
  const { port, address } = server.address()
  console.log(`http2 secure server is listening on ${address}:${port}`)
})
