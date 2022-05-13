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
    _data.update("users", phone, data)
  }

  static create = async function (phone, data) {
    _data.open("users", phone, data)
  }
}

// User.prototype.hashPassword = function (password) {
//   return hashPassword(password)
// }

// User.prototype.checkPassword = function (password) {
//   password === hashPassword(password) ? true : false
// }

export default User
