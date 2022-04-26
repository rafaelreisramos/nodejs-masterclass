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

handler.post = async function ({ payload }, callback) {
  if (!validators.user(payload)) {
    return callback(400, { error: "Missing required fields" })
  }

  const { firstName, lastName, phone, password, tosAgreement } = payload
  const data = await _data.read("users", phone)
  if (data) {
    return callback(400, {
      error: "A user with that phone number already exists",
    })
  }

  const hashedPassword = helpers.hashPassword(password)
  if (!hashedPassword) {
    return callback(500, { error: "Could not hash the user's password" })
  }
  const user = {
    firstName,
    lastName,
    phone,
    hashedPassword,
    tosAgreement,
  }
  try {
    await _data.open("users", phone, user)
  } catch (e) {
    return callback(500, { error: "Could not create the new user" })
  }

  callback(201)
}

handler.get = async function ({ searchParams, headers }, callback) {
  const phone = searchParams.get("phone")
  if (!validators.phone(phone)) {
    return callback(400, { error: "Missing required field" })
  }

  const tokenId = headers.tokenid
  const tokenIsValid = await verifyToken(tokenId, phone)
  if (!tokenIsValid) {
    return callback(403, {
      error: "Missing required token in header or token is invalid",
    })
  }

  const data = await _data.read("users", phone)
  if (!data) {
    return callback(404)
  }
  delete data.hashedPassword
  callback(200, data)
}

handler.put = async function ({ payload, headers }, callback) {
  if (!validators.userUpdate(payload)) {
    return callback(400, { error: "Missing required fields" })
  }

  const { firstName, lastName, password, phone } = payload
  const tokenId = headers.tokenid
  const tokenIsValid = await verifyToken(tokenId, phone)
  if (!tokenIsValid) {
    return callback(403, {
      error: "Missing required token in header or token is invalid",
    })
  }

  const data = await _data.read("users", phone)
  if (!data) {
    return callback(400, { error: "The specified user does not exist" })
  }
  if (firstName) data.firstName = firstName
  if (lastName) data.lastName = lastName
  if (password) {
    const hashedPassword = helpers.hashPassword(password)
    if (!hashedPassword) {
      return callback(500, { error: "Could not hash the user's password" })
    }
    data.hashedPassword = hashedPassword
  }

  try {
    await _data.update("users", phone, data)
  } catch (e) {
    return callback(500, { error: "Could not update the user" })
  }

  callback(200)
}

handler.delete = async function ({ searchParams, headers }, callback) {
  const phone = searchParams.get("phone")
  if (!validators.phone(phone)) {
    return callback(400, { error: "Missing required field" })
  }

  const tokenId = headers.tokenid
  const tokenIsValid = await verifyToken(tokenId, phone)
  if (!tokenIsValid) {
    return callback(403, {
      error: "Missing required token in header or token is invalid",
    })
  }

  const data = await _data.read("users", phone)
  if (!data) {
    return callback(400, { error: "Could not find the specified user" })
  }
  try {
    await _data.delete("users", phone)
  } catch (e) {
    return callback(500, { error: "Could not delete the specified user" })
  }

  let { checks } = data
  if (!validators.userChecks(checks)) checks = []
  if (checks.length > 0) {
    try {
      await Promise.all(checks.map((id) => _data.delete("checks", id)))
    } catch (e) {
      return callback(500, {
        error:
          "Failed to delete checks from user. All checks may not have been deleted from the system successfully.",
      })
    }
  }

  callback(200)
}

export default routes
