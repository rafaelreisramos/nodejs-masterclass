import dgram from "node:dgram"
import config from "../config.js"

const client = dgram.createSocket("udp4")

const { address, port } = config.server
let message = Buffer.from(`Hello from client`)
client.send(message, port, address, (err, bytes) => {
  if (err) {
    console.log(err.message)
    client.close()
  }
  console.log(`sent ${bytes} bytes to ${address}:${port}`)
})

client.on("message", (buffer, remote) => {
  const msg = buffer.toString()
  console.log(`client got: ${msg} @${remote.address}:${remote.port}`)
  client.close()
})

export default client
