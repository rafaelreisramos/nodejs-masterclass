import net from "node:net"
import config from "../config.js"

const { port, address } = config.server
const io = net.createConnection({ port, host: address }, () => {
  console.log(
    `socket created @${io.localAddress}:${io.localPort}, connected with ${io.remoteAddress}:${io.remotePort}`
  )
})

const sentMessage = "ping"

io.write(sentMessage)

io.on("data", (buffer) => {
  const receivedMessage = buffer.toString()
  console.log(`I wrote ${sentMessage} and they said ${receivedMessage}`)
  io.end()
})

io.on("end", () => {
  console.log(`disconnected from server ${io.remoteAddress}:${io.remotePort}`)
})
