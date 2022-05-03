import config from "../config.js"
let tls
try {
  tls = await import("node:tls")
} catch (error) {
  console.log("tls support is disabled")
}

const {
  server: { port, address: host },
  ssl: { cert: ca },
} = config
const io = tls.connect(port, host, { ca }, () => {
  console.log(
    `secure socket created @${io.localAddress}:${io.localPort}, connected with ${io.remoteAddress}:${io.remotePort}`
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
  console.log(
    `disconnected from secure server ${io.remoteAddress}:${io.remotePort}`
  )
})
