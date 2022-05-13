import User from "../models/User.js"
import Token from "../models/Token.js"
import Check from "../models/Check.js"
import helpers from "../../utils/helpers.js"
import validators from "../../utils/validators.js"

const UserController = {}

UserController.main = (data, res) => {
  res.setHeader("Content-Type", "application/json")
  const methods = ["post", "get", "put", "delete"]
  if (!methods.includes(data.method)) {
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE")
    return res
      .writeHead(405)
      .end(JSON.stringify({ Allow: "POST, GET, PUT, DELETE" }))
  }
  UserController[data.method](data, res)
}

UserController.post = async function ({ payload }, res) {
  if (!validators.user(payload)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const { firstName, lastName, phone, password, tosAgreement } = payload
  const data = await User.findOne(phone)
  if (data) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "A user with that phone number already exists",
      })
    )
  }

  const user = {
    firstName,
    lastName,
    phone,
    password,
    tosAgreement,
  }
  try {
    await User.create(phone, user)
  } catch {
    return Promise.reject(new Error("Could not create the new user"))
  }

  return res.writeHead(201).end()
}

UserController.get = async function ({ searchParams, headers }, res) {
  const phone = searchParams.get("phone")?.trim()
  if (!validators.phone(phone)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const tokenId = headers.tokenid
  const token = await Token.findOne(tokenId)
  if (!token) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "The specified token does not exist" }))
  }
  const tokenIsValid = await token.verify(phone)
  if (!tokenIsValid) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  const data = await User.findOne(phone)
  if (!data) {
    return res.writeHead(404).end()
  }
  delete data.hashedPassword
  return res.writeHead(200).end(JSON.stringify(data))
}

UserController.put = async function ({ payload, headers }, res) {
  if (!validators.userUpdate(payload)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const { firstName, lastName, password, phone } = payload
  const tokenId = headers.tokenid
  const token = await Token.findOne(tokenId)
  if (!token) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "The specified token does not exist" }))
  }
  const tokenIsValid = await token.verify(phone)
  if (!tokenIsValid) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  const data = await User.findOne(phone)
  if (!data) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "The specified user does not exist",
      })
    )
  }
  if (firstName) data.firstName = firstName
  if (lastName) data.lastName = lastName
  if (password) data.password = password

  try {
    await User.update(phone, data)
  } catch (e) {
    throw new Error("Could not update the user")
  }

  return res.writeHead(200).end()
}

UserController.delete = async function ({ searchParams, headers }, res) {
  const phone = searchParams.get("phone")?.trim()
  if (!validators.phone(phone)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const tokenId = headers.tokenid
  const token = await Token.findOne(tokenId)
  if (!token) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "The specified token does not exist" }))
  }
  const tokenIsValid = await token.verify(phone)
  if (!tokenIsValid) {
    return res.writeHead(403).end(
      JSON.stringify({
        error: "Missing required token in header or token is invalid",
      })
    )
  }

  const data = await User.findOne(phone)
  if (!data) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "The specified user does not exist",
      })
    )
  }
  try {
    await User.delete(phone)
  } catch (e) {
    throw new Error("Could not delete the specified user")
  }

  let { checks } = data
  if (!validators.userChecks(checks)) checks = []
  if (checks.length > 0) {
    try {
      await Promise.all(checks.map((id) => Check.delete(id)))
    } catch (e) {
      throw new Error(
        "Failed to delete checks from user. All checks may not have been deleted from the system successfully."
      )
    }
  }

  return res.writeHead(204).end()
}

export default UserController.main
