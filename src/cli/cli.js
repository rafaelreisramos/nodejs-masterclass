import readline from "node:readline"
import util from "node:util"
import EventEmitter, { once } from "node:events"
import os from "node:os"
import v8 from "node:v8"
import childProcess from "node:child_process"
import path from "node:path"
import helpers from "../utils/helpers.js"
import User from "../api/models/User.js"
import Check from "../api/models/Check.js"
import _logs from "../lib/logs.js"

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
  .on("list checks", async (str) => {
    await cli.responders.listChecks(str)
  })
  .on("list logs", async () => {
    await cli.responders.listLogs()
  })
  .on("list users", async () => {
    await cli.responders.listUsers()
  })
  .on("man", () => {
    cli.responders.help()
  })
  .on("more check info", async (str) => {
    await cli.responders.checkInfo(str)
  })
  .on("more log info", async (str) => {
    await cli.responders.logInfo(str)
  })
  .on("more user info", async (str) => {
    await cli.responders.userInfo(str)
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
      "Show a list of all the log files available to be read (compressed only)",
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

cli.responders.listChecks = async function (str) {
  const command = str.toLowerCase()
  try {
    const checksIds = await Check.findAllIds()
    if (!checksIds) {
      throw new Error()
    }
    const promises = checksIds.map((id) => Check.findOne(id))
    const promisesResults = await Promise.allSettled(promises)
    const allChecks = promisesResults.map(({ status, value: check }) => {
      if (status === "fulfilled") return check
    })

    let checks = []
    checks = allChecks.map((check) => {
      if (!check.state || typeof check.state !== "string")
        check.state = "unknown"
      return check
    })
    let checksDown = []
    if (!command.includes("--up") || command.includes("--down")) {
      checksDown = checks.filter(
        (check) => check.state !== "up" && check.state !== "unknown"
      )
    }
    let checksUp = []
    if (!command.includes("--down") || command.includes("--up")) {
      checksUp = checks.filter(
        (check) => check.state !== "down" && check.state !== "unknown"
      )
    }
    let checksUnknown = []
    if (!command.includes("--down") && !command.includes("--up")) {
      checksUnknown = checks.filter((check) => check.state === "unknown")
    }

    cli.verticalSpace()
    const filteredChecks = [...checksUp, ...checksDown, ...checksUnknown]
    const lines = filteredChecks.map(
      (check) =>
        `ID: ${check.id} ${check.method.toUpperCase()} ${check.protocol}://${
          check.url
        }, status: ${check.state} `
    )
    lines.forEach((line) => console.log(line))
    cli.verticalSpace()
  } catch {}
}

const UUID_LENGTH = 36
cli.responders.listLogs = async function () {
  try {
    const logFiles = await lsLogsList(true)
    if (!logFiles.length) {
      throw new Error()
    }
    const compressedLogFiles = logFiles.filter(
      (file) => file.length > UUID_LENGTH
    )

    cli.verticalSpace()
    compressedLogFiles.forEach((filename) => console.log(filename))
    cli.verticalSpace()
  } catch {}
}

async function lsLogsList(includeCompressedFiles) {
  const { stdout, stderr } = childProcess.spawn("ls", [
    `${path.join(process.cwd(), ".logs")}`,
  ])
  await Promise.all([once(stdout, "readable"), once(stderr, "readable")])
  const [data, error] = [stdout, stderr].map((stream) => stream.read())
  if (error) return Promise.reject(new Error(error))
  const files = data.toString().split("\n")
  const logfiles = files.filter((file) => file !== ".gitkeep")
  let filenames = []
  for (const file of logfiles) {
    if (file.includes(".log")) {
      filenames.push(file.replace(".log", ""))
    }
    if (file.includes(".bz.b64") && includeCompressedFiles) {
      filenames.push(file.replace(".bz.b64", ""))
    }
  }
  return filenames
}

cli.responders.listUsers = async function () {
  try {
    const usersIds = await User.findAllIds()
    if (!usersIds) {
      throw new Error()
    }
    cli.verticalSpace()
    const promises = usersIds.map((id) => User.findOne(id))
    const promisesResults = await Promise.allSettled(promises)
    const lines = promisesResults.map(({ status, value: user }) => {
      if (status === "fulfilled")
        return `Name: ${user.firstName} ${user.lastName}, Phone: ${user.phone}`
    })
    lines.forEach((line) => console.log(line))
    cli.verticalSpace()
  } catch {}
}

cli.responders.checkInfo = async function (str) {
  let checkId = str.split("--")[1]
  checkId =
    typeof checkId === "string" && checkId.length > 0 ? checkId.trim() : ""
  try {
    if (!checkId) {
      throw new Error()
    }
    const check = await Check.findOne(checkId)
    cli.verticalSpace()
    console.dir(check, { colors: true })
    cli.verticalSpace()
  } catch {}
}

cli.responders.logInfo = async function (str) {
  let filename = str.split("--")[1]
  filename =
    typeof filename === "string" && filename.length > 0 ? filename.trim() : ""
  try {
    if (!filename) {
      throw new Error()
    }
    const content = await _logs.decompress(filename)
    if (!content) {
      throw new Error()
    }
    const checks = []
    content.split("\n").forEach((line) => {
      const check = helpers.jsonParse(line)
      if (check && JSON.stringify(check) !== "{}") checks.push(check)
    })

    cli.verticalSpace()
    checks.forEach((check) => console.dir(check, { colors: true }))
    cli.verticalSpace()
  } catch {}
}

cli.responders.userInfo = async function (str) {
  let userId = str.split("--")[1]
  userId = typeof userId === "string" && userId.length > 0 ? userId.trim() : ""
  try {
    if (!userId) {
      throw new Error()
    }

    const user = await User.findOne(userId)
    if (!user) {
      return res
        .writeHead(400)
        .end(JSON.stringify({ error: "The specified user does not exist" }))
    }
    cli.verticalSpace()
    console.dir(user, { colors: true })
    cli.verticalSpace()
  } catch {}
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

  cli.verticalSpace()
  cli.horizontalLine()
}

cli.verticalSpace = function (lines) {
  lines = typeof lines === "number" && lines > 0 ? lines : 1
  for (let line = 1; line <= lines; line++) console.log(" ")
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
