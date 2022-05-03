import dgram from "node:dgram"
import config from "../config.js"

const { port } = config.server
const server = dgram
  .createSocket("udp4")
  .bind(port)
  .on("listening", () => {
    const { address, port } = server.address()
    console.log(`server listening ${address}:${port}`)
  })

server.on("error", (e) => {
  console.log(`server error:\n${e.stack}`)
  server.close()
})

const peer = {}
server.on("message", (buffer, remote) => {
  const msg = buffer.toString()
  peer.address = remote.address
  peer.port = remote.port
  console.log(`server got: ${msg} @${remote.address}:${remote.port}`)
})

setTimeout(() => {
  const message = Buffer.from(`Hello from server`)
  server.send(message, peer.port, peer.address, (error, bytes) => {
    if (error) {
      console.log(err.message)
    }
    console.log(`sent ${bytes} bytes to ${peer.address}:${peer.port}`)
    server.close()
  })
}, 10 * 1000)

export default server
