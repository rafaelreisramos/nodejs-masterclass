import config from "../../config.js"
import _data from "../../lib/data.js"
import helpers from "../../utils/helpers.js"
import validators from "../../utils/validators.js"
import { verifyToken } from "./tokens.routes.js"

const routes = (data, callback) => {
  const methods = ["post", "get", "put", "delete"]
  if (!methods.includes(data.method)) {
    return callback(405)
  }
  handler[data.method](data, callback)
}

const handler = {}

handler.post = async function ({ payload, headers }, callback) {
  if (!validators.check(payload)) {
    return callback(400, { error: "Missing required fields" })
  }

  const id = headers.tokenid
  const token = await _data.read("tokens", id)
  if (!token) {
    return callback(403)
  }

  const { phone } = token
  const user = await _data.read("users", phone)
  if (!user) {
    return callback(403)
  }

  let { checks } = user
  if (!validators.userChecks(checks)) checks = []
  if (!(checks.length < config.maxChecks)) {
    return callback(400, {
      error: `The user already has the maximum number (${config.maxChecks}) of checks`,
    })
  }

  const checkId = await helpers.createRandomString()
  const { protocol, url, method, successCodes, timeoutInSeconds } = payload
  const check = {
    id: checkId,
    phone,
    protocol,
    url,
    method,
    successCodes,
    timeoutInSeconds,
  }

  try {
    await _data.open("checks", checkId, check)
  } catch (e) {
    return callback(500, { error: "Could not create the new check" })
  }

  user.checks = checks
  user.checks.push(checkId)
  try {
    await _data.update("users", phone, user)
  } catch (e) {
    return callback(500, {
      error: "Could not update the user with the new checks",
    })
  }

  callback(201, check)
}

handler.get = async function ({ searchParams, headers }, callback) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return callback(400, { error: "Missing required field" })
  }

  const check = await _data.read("checks", id)
  if (!check) {
    return callback(404)
  }

  const { phone } = check
  const tokenId = headers.tokenid
  const tokenIsValid = await verifyToken(tokenId, phone)
  if (!tokenIsValid) {
    return callback(403)
  }

  callback(200, check)
}

handler.put = async function ({ payload, headers }, callback) {
  if (!validators.checkUpdate(payload)) {
    return callback(400, { error: "Missing required fields" })
  }

  const { id, protocol, url, method, successCodes, timeoutInSeconds } = payload
  const check = await _data.read("checks", id)
  if (!check) {
    return callback(400, { error: "Check id does not exist" })
  }

  const tokenId = headers.tokenid
  const { phone } = check
  const tokenIsValid = await verifyToken(tokenId, phone)
  if (!tokenIsValid) {
    return callback(403, {
      error: "Missing required token in header or token is invalid",
    })
  }

  if (protocol) check.protocol = protocol
  if (url) check.url = url
  if (method) check.method = method
  if (successCodes) check.successCodes = successCodes
  if (timeoutInSeconds) check.timeoutInSeconds = timeoutInSeconds

  try {
    await _data.update("checks", id, check)
  } catch (e) {
    return callback(500, { error: "Could not update the check" })
  }
  callback(200)
}

handler.delete = async function ({ searchParams, headers }, callback) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return callback(400, { error: "Missing required field" })
  }

  const check = await _data.read("checks", id)
  if (!check) {
    return callback(404)
  }

  const { phone } = check
  const tokenId = headers.tokenid
  const tokenIsValid = await verifyToken(tokenId, phone)
  if (!tokenIsValid) {
    return callback(403)
  }

  try {
    await _data.delete("checks", id)
  } catch (e) {
    return callback(500, { error: "Could not delete the specified check" })
  }

  const user = await _data.read("users", phone)
  if (!user) {
    return callback(500, {
      error:
        "Could not find the user who created the check, so could not remove the check from the users checks",
    })
  }
  let { checks } = user
  if (!validators.userChecks(checks)) checks = []
  const checkIndex = checks.indexOf(id)
  if (checkIndex < 0) {
    return callback(500, {
      error: "Could not find the user check on the users checks list",
    })
  }
  checks.splice(checkIndex, 1)
  user.checks = checks

  try {
    await _data.update("users", phone, user)
  } catch (e) {
    return callback(500, { error: "Could not update the user" })
  }

  callback(200)
}

export default routes
