import User from "../models/User.js"
import Token from "../models/Token.js"
import Check from "../models/Check.js"
import createCheckService from "../services/create-check-service.js"
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
  const { phone } = token
  const tokenIsValid = token?.verify(phone)
  if (!token || !tokenIsValid) {
    return res
      .writeHead(401)
      .end(JSON.stringify({ error: "Token is missing or invalid or expired" }))
  }

  const user = await User.findOne(phone)
  if (!user) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "The specified user does not exist" }))
  }

  let check = null
  try {
    check = await createCheckService.run(token, user, payload)
  } catch (e) {
    return res.writeHead(400).end(JSON.stringify(e.message))
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
    return res.writeHead(404).end()
  }

  const { phone } = check
  const tokenId = headers.tokenid
  const token = await Token.findOne(tokenId)
  const tokenIsValid = token?.verify(phone)
  if (!token || !tokenIsValid) {
    return res
      .writeHead(401)
      .end(JSON.stringify({ error: "Token is missing or invalid or expired" }))
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
    return res.writeHead(404).end()
  }

  const tokenId = headers.tokenid
  const { phone } = check
  const token = await Token.findOne(tokenId)
  const tokenIsValid = token?.verify(phone)
  if (!token || !tokenIsValid) {
    return res
      .writeHead(401)
      .end(JSON.stringify({ error: "Token is missing or invalid or expired" }))
  }

  if (protocol) check.protocol = protocol
  if (url) check.url = url
  if (method) check.method = method
  if (successCodes) check.successCodes = successCodes
  if (timeoutInSeconds) check.timeoutInSeconds = timeoutInSeconds

  try {
    await Check.update(id, check)
  } catch {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Could not update the check" }))
  }

  return res.writeHead(200).end()
}

checkController.delete = async function ({ searchParams, headers }, res) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const check = await Check.findOne(id)
  if (!check) {
    return res.writeHead(404).end()
  }

  const { phone } = check
  const tokenId = headers.tokenid
  const token = await Token.findOne(tokenId)
  const tokenIsValid = token?.verify(phone)
  if (!token || !tokenIsValid) {
    return res
      .writeHead(401)
      .end(JSON.stringify({ error: "Token is missing or invalid or expired" }))
  }

  try {
    await Check.delete(id)
  } catch {
    return res
      .writeHead(500)
      .end(JSON.stringify({ error: "Could not delete the specified check" }))
  }

  const user = await User.findOne(phone)
  if (!user) {
    return res.writeHead(400).end(
      JSON.stringify({
        error:
          "Could not find the user who created the check, so could not remove the check from the users checks",
      })
    )
  }

  let { checks } = user
  if (!validators.userChecks(checks)) checks = []
  const checkIndex = checks.indexOf(id)
  if (checkIndex < 0) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "Could not find the user check on the users checks list",
      })
    )
  }
  checks.splice(checkIndex, 1)
  user.checks = checks

  try {
    await User.update(phone, user)
  } catch (e) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Could not update the user" }))
  }

  return res.writeHead(204).end()
}

export default checkController.main
