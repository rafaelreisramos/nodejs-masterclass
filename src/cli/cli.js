import readline from "node:readline"
import util from "node:util"
import EventEmitter from "node:events"

const debug = util.debuglog("cli")
class Emitter extends EventEmitter {}
const emitter = new Emitter()

const cli = {}

cli.input = function (str) {
  str = typeof str === "string" && str.trim().length > 0 ? str.trim() : false
  if (!str) return

  const allowedInputs = [
    "exit",
    "help",
    "list checks",
    "list logs",
    "list users",
    "man",
    "more check info",
    "more log info",
    "more user info",
    "stats",
  ]
  let match = false
  allowedInputs.some((input) => {
    if (str.toLowerCase().includes(input)) {
      match = true
      emitter.emit(input, str)
      return true
    }
  })

  if (!match) {
    console.log("Sorry, try again")
  }
}

cli.init = function () {
  console.log("\x1b[34m%s\x1b[0m", "The CLI is running")

  const _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "cli>",
  })
  _interface.prompt()

  _interface
    .on("line", (str) => {
      cli.input(str)
      _interface.prompt()
    })
    .on("close", () => process.exit(0))
}

export default cli
