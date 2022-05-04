import { URL } from "node:url"
import dns from "node:dns/promises"
import config from "../../config.js"
import _data from "../../lib/data.js"
import helpers from "../../utils/helpers.js"
import validators from "../../utils/validators.js"
import { verifyToken } from "./tokens.routes.js"

const routes = (data, res) => {
  res.setHeader("Content-Type", "application/json")
  const methods = ["post", "get", "put", "delete"]
  if (!methods.includes(data.method)) {
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE")
    return res
      .writeHead(405)
      .end(JSON.stringify({ Allow: "POST, GET, PUT, DELETE" }))
  }
  handler[data.method](data, res)
}

const handler = {}

handler.post = async function ({ payload, headers }, res) {
  if (!validators.check(payload)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const id = headers.tokenid
  const token = await _data.read("tokens", id)
  if (!token) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  const { phone } = token
  const user = await _data.read("users", phone)
  if (!user) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "The specified user does not exist",
      })
    )
  }

  let { checks } = user
  if (!validators.userChecks(checks)) checks = []
  if (!(checks.length < config.maxChecks)) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: `The user already has the maximum number (${config.maxChecks}) of checks`,
      })
    )
  }

  const { protocol, url, method, successCodes, timeoutInSeconds } = payload
  const urlToTest = new URL(`${protocol}://www.${url}`)
  try {
    await dns.resolve4(urlToTest.hostname)
  } catch (e) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "The url entered did not resolve to any DNS entries",
      })
    )
  }

  const checkId = helpers.createRandomString()
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
    throw new Error("Could not create the new check")
  }

  user.checks = checks
  user.checks.push(checkId)
  try {
    await _data.update("users", phone, user)
  } catch (e) {
    throw new Error("Could not update the user with the new checks")
  }

  return res.writeHead(201).end(JSON.stringify(check))
}

handler.get = async function ({ searchParams, headers }, res) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const check = await _data.read("checks", id)
  if (!check) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "Check id does not exist",
      })
    )
  }

  const { phone } = check
  const tokenId = headers.tokenid
  const tokenIsValid = await verifyToken(tokenId, phone)
  if (!tokenIsValid) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  return res.writeHead(200).end(JSON.stringify(check))
}

handler.put = async function ({ payload, headers }, res) {
  if (!validators.checkUpdate(payload)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const { id, protocol, url, method, successCodes, timeoutInSeconds } = payload
  const check = await _data.read("checks", id)
  if (!check) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "Check id does not exist",
      })
    )
  }

  const tokenId = headers.tokenid
  const { phone } = check
  const tokenIsValid = await verifyToken(tokenId, phone)
  if (!tokenIsValid) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  if (protocol) check.protocol = protocol
  if (url) check.url = url
  if (method) check.method = method
  if (successCodes) check.successCodes = successCodes
  if (timeoutInSeconds) check.timeoutInSeconds = timeoutInSeconds

  try {
    await _data.update("checks", id, check)
  } catch (e) {
    throw new Error("Could not update the check")
  }
  return res.writeHead(200).end()
}

handler.delete = async function ({ searchParams, headers }, res) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  const check = await _data.read("checks", id)
  if (!check) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "Check id does not exist",
      })
    )
  }

  const { phone } = check
  const tokenId = headers.tokenid
  const tokenIsValid = await verifyToken(tokenId, phone)
  if (!tokenIsValid) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  try {
    await _data.delete("checks", id)
  } catch (e) {
    throw new Error("Could not delete the specified check")
  }

  const user = await _data.read("users", phone)
  if (!user) {
    throw new Error(
      "Could not find the user who created the check, so could not remove the check from the users checks"
    )
  }
  let { checks } = user
  if (!validators.userChecks(checks)) checks = []
  const checkIndex = checks.indexOf(id)
  if (checkIndex < 0) {
    throw new Error("Could not find the user check on the users checks list")
  }
  checks.splice(checkIndex, 1)
  user.checks = checks

  try {
    await _data.update("users", phone, user)
  } catch (e) {
    throw new Error("Could not update the user")
  }

  return res.writeHead(204).end()
}

export default routes
