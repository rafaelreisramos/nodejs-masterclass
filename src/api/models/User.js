import _data from "../../lib/data.js"
import helpers from "../../utils/helpers.js"

class User {
  constructor(firstname, lastName, phone, password, tosAgreement) {
    this.firstname = firstname
    this.lastName = lastName
    this.phone = phone
    this.password = password
    this.tosAgreement = tosAgreement

    return this
  }

  static findOne = async function (phone) {
    return _data.read("users", phone)
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
      const hashedPassword = this.hashPassword(password)
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
    const hashedPassword = this.hashPassword(password)
    if (!hashedPassword) {
      return Promise.reject(new Error("Could not hash the user's password"))
    }
    delete data.password
    _data.open("users", phone, { ...data, hashedPassword })
  }

  static checkPassword = async function (phone, password) {
    let user = null
    try {
      user = await this.findOne(phone)
    } catch {
      return Promise.reject(new Error("Could not hash the user's password"))
    }
    const hashedPassword = this.hashPassword(password)
    if (!hashedPassword) {
      return Promise.reject(new Error("Could not hash the user's password"))
    }
    return user.hashedPassword === hashedPassword ? true : false
  }

  static hashPassword = function (password) {
    return helpers.hashPassword(password)
  }
}

export default User
