import User from "../models/User.js"
import Token from "../models/Token.js"
import Check from "../models/Check.js"
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

  const { phone } = payload
  const user = await User.findOne(phone)
  if (user) {
    return res.writeHead(400).end(
      JSON.stringify({
        error: "A user with that phone number already exists",
      })
    )
  }

  try {
    await User.create(phone, payload)
  } catch (e) {
    const error = e.message ?? "Could not create the new user"
    return res.writeHead(500).end(JSON.stringify({ error }))
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

  const id = headers.tokenid
  const token = await Token.findOne(id)
  const tokenIsValid = token?.verify(phone)
  if (!token || !tokenIsValid) {
    return res
      .writeHead(401)
      .end(JSON.stringify({ error: "Token is missing or invalid or expired" }))
  }

  const user = await User.findOne(phone)
  if (!user) {
    return res.writeHead(404).end()
  }

  return res.writeHead(200).end(JSON.stringify(user))
}

UserController.put = async function ({ payload, headers }, res) {
  if (!validators.userUpdate(payload)) {
    return res
      .writeHead(400)
      .end(JSON.stringify({ error: "Missing required fields" }))
  }

  const { firstName, lastName, password, phone } = payload
  const id = headers.tokenid
  const token = await Token.findOne(id)
  const tokenIsValid = token?.verify(phone)
  if (!token || !tokenIsValid) {
    return res
      .writeHead(401)
      .end(JSON.stringify({ error: "Token is missing or invalid or expired" }))
  }

  const user = await User.findOne(phone)
  if (!user) {
    return res.writeHead(404).end()
  }

  if (firstName) user.firstName = firstName
  if (lastName) user.lastName = lastName
  if (password) user.password = password

  try {
    await User.update(phone, user)
  } catch (e) {
    const error = e.message ?? "Could not update the user"
    return res.writeHead(500).end(JSON.stringify({ error }))
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

  const id = headers.tokenid
  const token = await Token.findOne(id)
  const tokenIsValid = token?.verify(phone)
  if (!token || !tokenIsValid) {
    return res
      .writeHead(401)
      .end(JSON.stringify({ error: "Token is missing or invalid or expired" }))
  }

  const user = await User.findOne(phone)
  if (!user) {
    return res.writeHead(404).end()
  }

  try {
    await User.delete(phone)
  } catch (e) {
    return res
      .writeHead(500)
      .end(JSON.stringify({ error: "Could not delete the specified user" }))
  }

  let { checks } = user
  if (!validators.userChecks(checks)) checks = []
  if (checks.length > 0) {
    try {
      await Promise.all(checks.map((id) => Check.delete(id)))
    } catch {
      return res.writeHead(500).end(
        JSON.stringify({
          error:
            "Failed to delete checks from user. All checks may not have been deleted from the system successfully.",
        })
      )
    }
  }

  return res.writeHead(204).end()
}

export default UserController.main
