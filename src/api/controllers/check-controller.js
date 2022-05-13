import { URL } from "node:url"
import dns from "node:dns/promises"
import config from "../../config.js"
import User from "../models/User.js"
import Token from "../models/Token.js"
import Check from "../models/Check.js"
import helpers from "../../utils/helpers.js"
import validators from "../../utils/validators.js"

const checkController = {}

checkController.main = (data, res) => {
  res.setHeader("Content-Type", "application/json")
  const methods = ["post", "get", "put", "delete"]
  if (!methods.includes(data.method)) {
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE")
    return res
      .writeHead(405)
      .end(JSON.stringify({ Allow: "POST, GET, PUT, DELETE" }))
  }
  checkController[data.method](data, res)
}

checkController.post = async function ({ payload, headers }, res) {
  if (!validators.check(payload)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const id = headers.tokenid
  const token = await Token.findOne(id)
  if (!token) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  const { phone } = token
  const user = await User.findOne(phone)
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

  const data = {
    phone,
    protocol,
    url,
    method,
    successCodes,
    timeoutInSeconds,
  }

  let check = null
  try {
    check = await Check.create(data)
  } catch (e) {
    throw new Error("Could not create the new check")
  }

  user.checks = checks
  user.checks.push(check.id)
  try {
    await User.update(phone, user)
  } catch (e) {
    throw new Error("Could not update the user with the new checks")
  }

  return res.writeHead(201).end(JSON.stringify(check))
}

checkController.get = async function ({ searchParams, headers }, res) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const check = await Check.findOne(id)
  if (!check) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "Check id does not exist",
      })
    )
  }

  const { phone } = check
  const tokenId = headers.tokenid
  const tokenIsValid = await Token.verify(tokenId, phone)
  if (!tokenIsValid) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  return res.writeHead(200).end(JSON.stringify(check))
}

checkController.put = async function ({ payload, headers }, res) {
  if (!validators.checkUpdate(payload)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const { id, protocol, url, method, successCodes, timeoutInSeconds } = payload
  const check = await Check.findOne(id)
  if (!check) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "Check id does not exist",
      })
    )
  }

  const tokenId = headers.tokenid
  const { phone } = check
  const tokenIsValid = await Token.verify(tokenId, phone)
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
    await Check.update(id, check)
  } catch (e) {
    throw new Error("Could not update the check")
  }
  return res.writeHead(200).end()
}

checkController.delete = async function ({ searchParams, headers }, res) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  const check = await Check.findOne(id)
  if (!check) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "Check id does not exist",
      })
    )
  }

  const { phone } = check
  const tokenId = headers.tokenid
  const tokenIsValid = await Token.verify(tokenId, phone)
  if (!tokenIsValid) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  try {
    await Check.delete(id)
  } catch (e) {
    throw new Error("Could not delete the specified check")
  }

  const user = await User.findOne(phone)
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
    await User.update(phone, user)
  } catch (e) {
    throw new Error("Could not update the user")
  }

  return res.writeHead(204).end()
}

export default checkController.main
