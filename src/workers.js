import _data from "./lib/data.js"
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
  console.log(checkOutcome)
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
    lastChecked: Date.now(),
  }

  try {
    const error = await _data.update("checks", check.id, newCheck)
    if (error) {
      throw new Error(
        "Got an error trying to save updates to one of the checks"
      )
    }
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
    console.error(e.message)
    checkOutcome.error = {
      error: true,
      name: e.name,
      value: e.message,
      stack: e.stack,
    }
    if (!outcomeSent) {
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
    const files = await _data.list("checks")
    const checks = files.filter((file) => file !== ".gitkeep")
    if (!checks?.length) {
      throw new Error("Could not find any checks to process")
    }
    for (let check of checks) {
      const [error, data] = await _data.read("checks", check)
      if (error) {
        throw new Error("Could not read one of the checks data")
      }
      await workers.validateCheckData(data)
    }
  } catch (e) {
    console.error(e.message)
  }
}

workers.loop = function () {
  setInterval(async () => {
    await workers.gatherAllChecks()
  }, 1000 * 10) // 1 minute
}

workers.init = function () {
  workers.gatherAllChecks()
  workers.loop()
}

export default workers
