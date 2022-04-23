import dotenv from "dotenv"
import { expand } from "dotenv-expand"
expand(dotenv.config())
import initServer from "./server.js"

function app() {
  initServer()
}

app()

export default app
