import net from "node:net"
import config from "../config.js"

const server = net.createServer((io) => {
  console.log(`client ${io.remoteAddress}:${io.remotePort} connected`)

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
      console.log("closing server")
    })
  })
})

server.on("error", (error) => {
  console.log(error)
})

const { port, address } = config.server
server.listen(port, address, () => {
  const { port, address } = server.address()
  console.log(`server is listening on $${address}:${port}`)
})
