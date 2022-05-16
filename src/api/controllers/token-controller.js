import { PerformanceObserver, performance } from "node:perf_hooks"
import { debuglog } from "node:util"
import User from "../models/User.js"
import Token from "../models/Token.js"
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
  tokenCreation: {
    start: "Start token creation",
    finish: "Finish token creation",
    name: "Token creation",
  },
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
  const user = await User.findOne(phone)
  if (!user) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "The specified user does not exist" }))
  }

  const passwordIsValid = user.checkPassword(password)
  if (!passwordIsValid) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Password does not match" }))
  }

  performance.mark(measures.userLookup.finish)

  let token = null
  try {
    performance.mark(measures.tokenCreation.start)
    token = await Token.create(phone)
    performance.mark(measures.tokenCreation.finish)
  } catch (e) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Could not create the new token" }))
  }

  const { validations, userLookup, tokenCreation } = measures
  performance.measure(validations.name, validations.start, validations.finish)
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

  const token = await Token.findOne(id)
  if (!token) {
    return res.writeHead(404).end()
  }

  return res.writeHead(200).end(JSON.stringify(token))
}

tokenController.put = async function ({ payload }, res) {
  if (!validators.tokenRefresh(payload)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const { id } = payload
  const token = await Token.findOne(id)
  if (!token) {
    return res.writeHead(404).end()
  }

  if (token.expires < Date.now()) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "The token has already expired and cannot be refreshed",
      })
    )
  }
  token.expires = Date.now() * 1000 * 60 * 60 // 1 hour

  let updatedToken
  try {
    updatedToken = await Token.update(id, token)
  } catch {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Could not refresh the token" }))
  }

  return res.writeHead(200).end(JSON.stringify(updatedToken))
}

tokenController.delete = async function ({ searchParams }, res) {
  const id = searchParams.get("id")
  if (!validators.tokenId(id)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const token = await Token.findOne(id)
  if (!token) {
    return res.writeHead(404).end()
  }
  try {
    await Token.delete(id)
  } catch {
    return res
      .status(500)
      .end(JSON.stringify({ error: "Could not delete the specified token" }))
  }

  return res.writeHead(204).end()
}

export default tokenController.main
