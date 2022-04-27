import _data from "../../lib/data.js"
import helpers from "../../utils/helpers.js"
import validators from "../../utils/validators.js"

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
  if (!validators.token(payload)) {
    return callback(400, { error: "Missing required fields" })
  }

  const { phone, password } = payload
  const data = await _data.read("users", phone)
  if (!data) {
    return callback(400, { error: "The specified user does not exist" })
  }

  const hashedPassword = helpers.hashPassword(password)
  if (!hashedPassword) {
    return callback(500, { error: "Could not hash the user's password" })
  }
  if (data.hashedPassword !== hashedPassword) {
    return callback(400, { error: "Password did not match" })
  }

  const id = helpers.createRandomString()
  const expires = Date.now() * 1000 * 60 * 60 // 1 hour
  const token = {
    phone,
    id,
    expires,
  }
  try {
    await _data.open("tokens", id, token)
  } catch (e) {
    return callback(500, { error: "Could not create the new token" })
  }

  callback(201)
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
