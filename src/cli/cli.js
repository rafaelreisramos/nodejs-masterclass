import readline from "node:readline"
import util from "node:util"
import EventEmitter from "node:events"

const debug = util.debuglog("cli")
class Emitter extends EventEmitter {}
const emitter = new Emitter()

const cli = {}

emitter
  .on("exit", () => {
    cli.responders.exit()
  })
  .on("help", () => {
    cli.responders.help()
  })
  .on("list checks", () => {
    cli.responders.listChecks()
  })
  .on("list logs", () => {
    cli.responders.listLogs()
  })
  .on("list users", () => {
    cli.responders.listUsers()
  })
  .on("man", () => {
    cli.responders.help()
  })
  .on("more check info", (str) => {
    cli.responders.checkInfo(str)
  })
  .on("more log info", (str) => {
    cli.responders.logInfo(str)
  })
  .on("more user info", (str) => {
    cli.responders.userInfo(str)
  })
  .on("stats", () => {
    cli.responders.stats()
  })

cli.responders = {}

cli.responders.help = function () {
  console.log("You asked for help")
}

cli.responders.exit = function () {
  process.exit(0)
}

cli.responders.listChecks = function () {
  console.log("You asked to list checks")
}

cli.responders.listLogs = function () {
  console.log("You asked to list logs")
}

cli.responders.listUsers = function () {
  console.log("You asked to list users")
}

cli.responders.checkInfo = function (str) {
  console.log("You asked for more check info", str)
}

cli.responders.logInfo = function (str) {
  console.log("You asked for more log info", str)
}

cli.responders.userInfo = function (str) {
  console.log("You asked for more user info", str)
}

cli.responders.stats = function () {
  console.log("You asked for stats")
}

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
