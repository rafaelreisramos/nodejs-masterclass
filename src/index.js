import dotenv from "dotenv"
import { expand } from "dotenv-expand"
expand(dotenv.config())
import server from "./server.js"

function app() {
  server.init()
}

app()

export default app
