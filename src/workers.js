import Check from "./api/models/Check.js"
import _logs from "./lib/logs.js"
import sendTwilioSms from "./lib/sms-twilio.js"
import helpers from "./utils/helpers.js"
import validators from "./utils/validators.js"

const workers = {}

workers.alertUserToStatusChanges = async function (check) {
  const message = `Alert: Your check for ${check.method} ${check.protocol}://${check.url} is currently ${check.state} `
  try {
    // await sendTwilioSms(check.phone, message)
    console.log("Success: User was alerted to a status change on their check")
  } catch (e) {
    console.error(
      "Error: Could not send sms alert to user who had a state change in their check"
    )
  }
}

workers.processCheckOutcome = async function (check, checkOutcome) {
  const time = Date.now()
  const state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    check.successCodes.includes(checkOutcome.responseCode)
      ? "up"
      : "down"
  const alert = check.lastChecked && check.state !== state
  const newCheck = {
    ...check,
    state,
    lastChecked: time,
  }

  try {
    await workers.log(check, checkOutcome, state, alert, time)
    await Check.update(check.id, newCheck)
    if (!alert) {
      console.log("Check outcome has not changed, no alert needed")
      return
    }
    await workers.alertUserToStatusChanges(newCheck)
  } catch (e) {
    console.error(e.message)
  }
}

workers.performCheck = async function (check) {
  let checkOutcome = {
    error: false,
    responseCode: false,
  }
  let outcomeSent = false

  const { method, timeoutInSeconds } = check
  const url = new URL(`${check.protocol}://${check.url}`)

  const timeout = timeoutInSeconds * 1000 // miliseconds
  let controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  const options = {
    method: method.toUpperCase(),
    signal: controller.signal,
  }

  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`${response.status}, ${response.statusText}`)
    }
    checkOutcome.responseCode = response.status
    if (!outcomeSent) {
      await workers.processCheckOutcome(check, checkOutcome)
      outcomeSent = true
    }
  } catch (e) {
    console.error(`${e.name}: ${e.message}`)
    checkOutcome.error = {
      error: true,
      name: e.name,
      value: e.message,
      stack: e.stack,
    }
    if (!outcomeSent) {
      // console.log("--------------------------")
      await workers.processCheckOutcome(check, checkOutcome)
      outcomeSent = true
    }
  } finally {
    controller = null
    clearTimeout(id)
  }
}

workers.validateCheckData = async function (check) {
  try {
    const { id, phone } = check
    if (
      !validators.tokenId(id) &&
      !validators.phone(phone) &&
      !validators.check(check)
    )
      throw new Error(
        "One of the ckecks is not properly formatted, skipping it"
      )

    check.state =
      typeof check.state === "string" && ["up", "down"].includes(check.state)
        ? check.state
        : "down"
    check.lastChecked =
      typeof check.lastChecked === "number" &&
      check.timeoutInSeconds % 1 === 0 &&
      check.lastChecked >= 1 &&
      check.lastChecked <= 5
        ? check.lastChecked
        : false

    await workers.performCheck(check)
  } catch (e) {
    console.error(e.message)
  }
}

workers.gatherAllChecks = async function () {
  try {
    const checks = await Check.findAll()
    if (!checks.length) {
      throw new Error("Could not find any checks to process")
    }
    for (let check of checks) {
      const data = await Check.findOne(check)
      await workers.validateCheckData(data)
    }
  } catch (e) {
    console.error(e.message)
  }
}

workers.log = async function (check, outcome, state, alert, time) {
  let logObj = { check, outcome, state, alert, time }
  const log = JSON.stringify(logObj)
  const filename = check.id
  try {
    await _logs.append(filename, log)
  } catch (e) {
    console.error(e.message)
  }
}

workers.loop = function () {
  setInterval(async () => {
    await workers.gatherAllChecks()
  }, 1000 * 60) // 1 minute
}

workers.rotateLogs = async function () {
  try {
    const files = await _logs.list(false)
    if (!files.length) {
      throw new Error("Could not find any logs to rotate")
    }
    for (let file of files) {
      const fileId = file.replace(".log", "")
      const compressedFileId = `${fileId}-${Date.now()}`
      await _logs.compress(fileId, compressedFileId)
      await _logs.truncate(fileId)
    }
  } catch (e) {
    console.error(e.message)
  }
}

workers.logRotationLoop = function () {
  setInterval(async () => {
    await workers.rotateLogs()
  }, 1000 * 60 * 60 * 24) // 1 day - 24 hours
}

workers.init = function () {
  workers.gatherAllChecks()
  workers.loop()
  workers.rotateLogs()
  workers.logRotationLoop()
}

export default workers
