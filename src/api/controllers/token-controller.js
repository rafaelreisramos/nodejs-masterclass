import { PerformanceObserver, performance } from "node:perf_hooks"
import { debuglog } from "node:util"
import User from "../models/User.js"
import _data from "../../lib/data.js"
import helpers from "../../utils/helpers.js"
import validators from "../../utils/validators.js"

const debug = debuglog("performance")

const performanceObserver = new PerformanceObserver((items) => {
  debug(items.getEntries())
})

const measures = {
  start: "Start to Now",
  validations: {
    start: "Start validations",
    finish: "Finish validations",
    name: "Validations",
  },
  userLookup: {
    start: "Start user lookup",
    finish: "Finish user lookup",
    name: "User lookup",
  },
  passwordHash: {
    start: "Start password hash",
    finish: "Finish password hash",
    name: "Password hash",
  },
  tokenCreation: {
    start: "Start token creation",
    finish: "Finish token creation",
    name: "Token creation",
  },
}

export async function verifyToken(id, phone) {
  const data = await _data.read("tokens", id)
  if (!data) return false
  if (!(data.phone === phone && data.expires > Date.now())) return false
  return true
}

const tokenController = {}

tokenController.main = (data, res) => {
  res.setHeader("Content-Type", "application/json")
  const methods = ["post", "get", "put", "delete"]
  if (!methods.includes(data.method)) {
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE")
    return res
      .writeHead(405)
      .end(JSON.stringify({ Allow: "POST, GET, PUT, DELETE" }))
  }
  tokenController[data.method](data, res)
}

tokenController.post = async function ({ payload }, res) {
  performanceObserver.observe({ entryTypes: ["measure"], buffered: true })
  performance.measure(measures.start)

  performance.mark(measures.validations.start)
  if (!validators.token(payload)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }
  performance.mark(measures.validations.finish)

  const { phone, password } = payload
  performance.mark(measures.userLookup.start)
  const data = await User.findOne(phone)
  performance.mark(measures.userLookup.finish)
  if (!data) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "The specified user does not exist",
      })
    )
  }

  performance.mark(measures.passwordHash.start)
  const hashedPassword = helpers.hashPassword(password)
  performance.mark(measures.passwordHash.finish)
  if (!hashedPassword) {
    throw new Error("Could not hash the user's password")
  }
  if (data.hashedPassword !== hashedPassword) {
    throw new Error("Could not hash the user's password")
  }

  performance.mark(measures.tokenCreation.start)
  const id = helpers.createRandomString()
  const expires = Date.now() * 1000 * 60 * 60 // 1 hour
  const token = {
    phone,
    id,
    expires,
  }
  performance.mark(measures.tokenCreation.finish)
  try {
    await _data.open("tokens", id, token)
  } catch (e) {
    throw new Error("Could not create the new token")
  }

  const { validations, passwordHash, userLookup, tokenCreation } = measures
  performance.measure(validations.name, validations.start, validations.finish)
  performance.measure(
    passwordHash.name,
    passwordHash.start,
    passwordHash.finish
  )
  performance.measure(userLookup.name, userLookup.start, userLookup.finish)
  performance.measure(
    tokenCreation.name,
    tokenCreation.start,
    tokenCreation.finish
  )

  return res.writeHead(201).end(JSON.stringify(token))
}

tokenController.get = async function ({ searchParams }, res) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const data = await _data.read("tokens", id)
  if (!data) {
    return res.writeHead(404).end()
  }
  return res.writeHead(200).end(JSON.stringify(data))
}

tokenController.put = async function ({ payload }, res) {
  if (!validators.tokenRefresh(payload)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const { id } = payload
  const data = await _data.read("tokens", id)
  if (!data) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "The specified token does not exist" }))
  }
  if (data.expires < Date.now()) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "The token has already expired and cannot be refreshed",
      })
    )
  }
  data.expires = Date.now() * 1000 * 60 * 60 // 1 hour

  try {
    await _data.update("tokens", id, data)
  } catch (e) {
    throw new Error("Could not refresh the token")
  }

  return res.writeHead(200).end()
}

tokenController.delete = async function ({ searchParams }, res) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const data = await _data.read("tokens", id)
  if (!data) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "Could not find the specified token",
      })
    )
  }
  try {
    await _data.delete("tokens", id)
  } catch (e) {
    throw new Error("Could not delete the specified token")
  }

  return res.writeHead(204).end()
}

export default tokenController.main
