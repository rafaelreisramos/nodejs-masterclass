import dotenv from "dotenv"
import { expand } from "dotenv-expand"
expand(dotenv.config())
import { fileURLToPath } from "node:url"
import server from "./server.js"
import workers from "./workers.js"
import cli from "./cli/cli.js"

const modulePath = fileURLToPath(import.meta.url)
const scriptPath = process.argv[1]

const app = {}

app.init = function (done) {
  server.init()
  workers.init()
  setTimeout(() => {
    cli.init()
    done()
  }, 50)
}

// replacement for commonjs require.main. Check es-main on github
if (modulePath === scriptPath) app.init(() => {})

export default app
