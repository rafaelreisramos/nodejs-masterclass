import _data from "../lib/data.js"
import helpers from "../utils/helpers.js"
import validators from "../utils/validators.js"

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
  const [_, data] = await _data.read("users", phone)
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
  const error = await _data.open("users", phone, user)
  if (error) {
    return callback(500, { error: "Could not create the new user" })
  }

  callback(201)
}

handler.get = async function ({ searchParams }, callback) {
  const phone = searchParams.get("phone")
  if (!validators.phone(phone)) {
    return callback(400, { error: "Missing required field" })
  }

  const [_, data] = await _data.read("users", phone)
  if (!data) {
    return callback(404)
  }
  delete data.hashedPassword
  callback(200, data)
}

handler.put = async function ({ payload }, callback) {
  if (!validators.userUpdate(payload)) {
    return callback(400, { error: "Missing required fields" })
  }

  const { firstName, lastName, password, phone } = payload

  const [_, data] = await _data.read("users", phone)
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

  const error = await _data.update("users", phone, data)
  if (error) {
    return callback(500, { error: "Could not update the user" })
  }
  callback(200)
}

handler.delete = async function ({ searchParams }, callback) {
  const phone = searchParams.get("phone")
  if (!validators.phone(phone)) {
    return callback(400, { error: "Missing required field" })
  }

  const [_, data] = await _data.read("users", phone)
  if (!data) {
    return callback(400, { error: "Could not find the specified user" })
  }
  const error = await _data.delete("users", phone)
  if (error) {
    return callback(500, { error: "Could not delete the specified user" })
  }
  callback(200)
}

export default routes
