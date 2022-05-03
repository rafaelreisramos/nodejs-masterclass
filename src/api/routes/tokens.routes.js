import { PerformanceObserver, performance } from "node:perf_hooks"
import { debuglog } from "node:util"
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

const routes = (data, callback) => {
  const methods = ["post", "get", "put", "delete"]
  if (!methods.includes(data.method)) {
    return callback(405)
  }
  handler[data.method](data, callback)
}

const handler = {}

handler.post = async function ({ payload }, callback) {
  performanceObserver.observe({ entryTypes: ["measure"], buffered: true })
  performance.measure(measures.start)

  performance.mark(measures.validations.start)
  if (!validators.token(payload)) {
    return callback(400, { error: "Missing required fields" })
  }
  performance.mark(measures.validations.finish)

  const { phone, password } = payload
  performance.mark(measures.userLookup.start)
  const data = await _data.read("users", phone)
  performance.mark(measures.userLookup.finish)
  if (!data) {
    return callback(400, { error: "The specified user does not exist" })
  }

  performance.mark(measures.passwordHash.start)
  const hashedPassword = helpers.hashPassword(password)
  performance.mark(measures.passwordHash.finish)
  if (!hashedPassword) {
    return callback(500, { error: "Could not hash the user's password" })
  }
  if (data.hashedPassword !== hashedPassword) {
    return callback(400, { error: "Password did not match" })
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
    return callback(500, { error: "Could not create the new token" })
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

  callback(201, token)
}

handler.get = async function ({ searchParams }, callback) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return callback(400, { error: "Missing required field" })
  }

  const data = await _data.read("tokens", id)
  if (!data) {
    return callback(404)
  }
  callback(200, data)
}

handler.put = async function ({ payload }, callback) {
  if (!validators.tokenRefresh(payload)) {
    return callback(400, { error: "Missing required fields or invalid" })
  }

  const { id } = payload
  const data = await _data.read("tokens", id)
  if (!data) {
    return callback(400, { error: "The specified token does not exist" })
  }
  if (data.expires < Date.now()) {
    return callback(400, {
      error: "The token has already expired and cannot be refreshed",
    })
  }
  data.expires = Date.now() * 1000 * 60 * 60 // 1 hour

  try {
    await _data.update("tokens", id, data)
  } catch (e) {
    return callback(500, { error: "Could not refresh the token" })
  }

  callback(200)
}

handler.delete = async function ({ searchParams }, callback) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return callback(400, { error: "Missing required field" })
  }

  const data = await _data.read("tokens", id)
  if (!data) {
    return callback(400, { error: "Could not find the specified token" })
  }
  try {
    await _data.delete("tokens", id)
  } catch (e) {
    return callback(500, { error: "Could not delete the specified token" })
  }

  callback(200)
}

export default routes
