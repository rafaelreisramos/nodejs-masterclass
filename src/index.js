import dotenv from "dotenv"
import { expand } from "dotenv-expand"
expand(dotenv.config())
import server from "./server.js"
import workers from "./workers.js"

function app() {
  server.init()
  workers.init()
}

app()

export default app
