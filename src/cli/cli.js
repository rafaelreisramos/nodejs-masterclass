import readline from "node:readline"
import util from "node:util"
import EventEmitter from "node:events"
import os from "node:os"
import v8 from "node:v8"
import helpers from "../utils/helpers.js"

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
  const commands = {
    exit: "Kill the CLI (and the rest of application)",
    man: "Show this help page",
    help: "Alias of 'man' command",
    stats:
      "Get statistics of the underlying operating system and resources utilization",
    "list users":
      "Show a list of all the registered (undeleted) users in the system",
    "more user info --{userId}": "Show details of a specific user",
    "list checks --up --down":
      "Show a list of all the active checks in the system, including their state. The '--up' and '--down' flags are both optional.",
    "more check info --{checkId}": "Show details of a specific check",
    "list logs":
      "Show a list of all the log files available to be read (compressed and uncompressed)",
    "more log info --{filename}": "Show details of a specified log file",
  }

  cli.horizontalLine()
  cli.centered("CLI MANUAL")
  cli.horizontalLine()
  cli.verticalSpace(2)

  for (const command in commands) {
    if (!commands.hasOwnProperty(command)) continue
    const description = commands[command]
    let line = `\x1b[33m${command}\x1b[0m`
    let padding = 60 - line.length
    line = `${line}${" ".repeat(padding)}${description}`
    console.log(line)
    cli.verticalSpace()
  }

  cli.verticalSpace(1)
  cli.horizontalLine()
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
  const uptimeInSeconds = os.uptime()
  const loadAverage = os.loadavg().join()
  const cpuCount = os.cpus().length
  const freeMemoryInMegabytes = Math.floor(os.totalmem() / (1024 * 1024))
  const currentMallocedMemoryInKilobytes = Math.floor(
    v8.getHeapStatistics().malloced_memory / 1024
  )
  const peekMallocedMemoryInKilobytes = Math.floor(
    v8.getHeapStatistics().peak_malloced_memory / 1024
  )
  const allocatedHeapInPercentage = Math.floor(
    (v8.getHeapStatistics().used_heap_size /
      v8.getHeapStatistics().total_heap_size) *
      100
  )
  const availableHeapAllocated = Math.floor(
    (v8.getHeapStatistics().total_heap_size /
      v8.getHeapStatistics().heap_size_limit) *
      100
  )

  const stats = {
    "Load Average": loadAverage,
    "CPU Count": cpuCount,
    "Free Memory": `${freeMemoryInMegabytes} MB`,
    "Current Malloced Memory": `${currentMallocedMemoryInKilobytes} kB`,
    "Peek Malloced Memory": `${peekMallocedMemoryInKilobytes} kB`,
    "Allocated Heap Used (%)": allocatedHeapInPercentage,
    "Available Heap Allocated (%)": availableHeapAllocated,
    Uptime: helpers.hoursMinutesSeconds(uptimeInSeconds),
  }

  cli.horizontalLine()
  cli.centered("SYSTEM STATISTICS")
  cli.horizontalLine()
  cli.verticalSpace(2)

  for (const stat in stats) {
    if (!stats.hasOwnProperty(stat)) continue
    const description = stats[stat]
    let line = `\x1b[33m${stat}\x1b[0m`
    let padding = 60 - line.length
    line = `${line}${" ".repeat(padding)}${description}`
    console.log(line)
    cli.verticalSpace()
  }

  cli.verticalSpace(1)
  cli.horizontalLine()
}

cli.verticalSpace = function (lines) {
  lines = typeof lines === "number" && lines > 0 ? lines : 1
  console.log(`${" ".repeat(lines)}`)
}

cli.horizontalLine = function () {
  const width = process.stdout.columns
  const line = `${"-".repeat(width)}`
  console.log(line)
}

cli.centered = function (str) {
  str = typeof str === "string" && str.length > 0 ? str.trim() : ""
  const width = process.stdout.columns
  const leftPadding = Math.floor((width - str.length) / 2)
  const line = `${" ".repeat(leftPadding)}${str}`
  console.log(line)
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
