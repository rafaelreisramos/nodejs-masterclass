import config from "../config.js"
import { URL } from "node:url"
let http2
try {
  http2 = await import("node:http2")
} catch (err) {
  console.log("http2 support is disabled!")
}

const {
  server: { port, address: host },
  ssl: { cert: ca },
} = config
const url = new URL(`https://${host}:${port}`)
const client = http2.connect(url.href, { ca })

client.on("error", (error) => console.error(error))

const req = client.request({ ":path": "/" })

req.on("response", (headers, flags) => {
  for (const name in headers) {
    console.log(`${name}: ${headers[name]}`)
  }
})

req.setEncoding("utf8")
let data = ""
req
  .on("data", (chunk) => {
    data += chunk
  })
  .on("end", () => {
    console.log(`\n${data}`)
    client.close()
  })
  .end()
