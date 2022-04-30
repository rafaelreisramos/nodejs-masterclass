import dotenv from "dotenv"
import { expand } from "dotenv-expand"
expand(dotenv.config())
import server from "./server.js"
import workers from "./workers.js"
import cli from "./cli/cli.js"

function app() {
  server.init()
  workers.init()
  setTimeout(() => {
    cli.init()
  }, 50)
}

app()

export default app
