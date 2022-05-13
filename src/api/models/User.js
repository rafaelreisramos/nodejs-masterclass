import _data from "../../lib/data.js"
import helpers from "../../utils/helpers.js"

class User {
  #hashedPassword

  constructor({
    firstName,
    lastName,
    phone,
    hashedPassword,
    tosAgreement,
    checks,
  }) {
    this.firstName = firstName
    this.lastName = lastName
    this.phone = phone
    this.#hashedPassword = hashedPassword
    this.tosAgreement = tosAgreement
    this.checks = checks

    return this
  }

  static findOne = async function (phone) {
    const data = await _data.read("users", phone)
    if (!data) {
      return Promise.resolve(null)
    }
    return new User(data)
  }

  static findAll = async function () {
    return _data.list("users")
  }

  static delete = async function (phone) {
    _data.delete("users", phone)
  }

  static update = async function (phone, data) {
    const { password } = data
    if (password) {
      const hashedPassword = helpers.hashPassword(password)
      if (!hashedPassword) {
        Promise.reject(new Error("Could not hash the user's password"))
      }
      delete data.password
      data.hashedPassword = hashedPassword
    }
    _data.update("users", phone, data)
  }

  static create = async function (phone, data) {
    const { password } = data
    const hashedPassword = helpers.hashPassword(password)
    if (!hashedPassword) {
      return Promise.reject(new Error("Could not hash the user's password"))
    }
    delete data.password
    _data.open("users", phone, { ...data, hashedPassword })
  }

  checkPassword = async function (password) {
    const hashedPassword = helpers.hashPassword(password)
    if (!hashedPassword) {
      return Promise.reject(new Error("Could not hash the user's password"))
    }
    return this.#hashedPassword === hashedPassword ? true : false
  }
}

export default User
