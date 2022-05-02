import dotenv from "dotenv"
import { expand } from "dotenv-expand"
expand(dotenv.config())
import cluster from "node:cluster"
import { cpus } from "node:os"
import server from "./server.js"
import workers from "./workers.js"
import cli from "./cli/cli.js"

const app = {}

app.init = function () {
  const numCPUs = cpus().length
  if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`)
    for (let i = 0; i < numCPUs; i++) cluster.fork()
    workers.init()
    setTimeout(() => {
      cli.init()
    }, 50)
    cluster.on("exit", (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died`)
    })
  } else {
    console.log(`Worker ${process.pid} is started`)
    server.init()
  }
}

app.init()

export default app
