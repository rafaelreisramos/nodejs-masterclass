import config from "../config.js"
let tls
try {
  tls = await import("node:tls")
} catch (error) {
  console.log("tls support is disabled")
}

const { key, cert } = config.ssl
const server = tls.createServer({ key, cert }, (io) => {
  console.log(`client ${io.remoteAddress}:${io.remotePort} connected securely`)

  const sentMessage = "pong"
  io.write(sentMessage)

  io.on("data", (buffer) => {
    const receivedMessage = buffer.toString()
    console.log(`I wrote ${sentMessage} and they said ${receivedMessage}`)
  })

  io.on("end", () => {
    console.log(
      `remote ${io.remoteAddress}:${io.remotePort} client disconnected`
    )
    server.close(() => {
      console.log("closing secure server")
    })
  })
})

server.on("error", (error) => {
  console.log(error)
})

const { port, address } = config.server
server.listen(port, address, () => {
  const { port, address } = server.address()
  console.log(`secure server is listening on $${address}:${port}`)
})
