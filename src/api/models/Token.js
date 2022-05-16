import _data from "../../lib/data.js"
import helpers from "../../utils/helpers.js"

class Token {
  constructor({ id, phone, expires }) {
    this.id = id
    this.phone = phone
    this.expires = expires

    return this
  }

  static findOne = async function (id) {
    const data = await _data.read("tokens", id)
    return data ? new Token(data) : null
  }

  static delete = async function (id) {
    _data.delete("tokens", id)
  }

  static update = async function (id, data) {
    _data.update("tokens", id, data)
  }

  static create = async function (phone) {
    const id = helpers.createRandomString()
    const expires = Date.now() * 1000 * 60 * 60 // 1 hour
    _data.open("tokens", id, { phone, expires })
    return new Token({ id, phone, expires })
  }

  verify = function (phone) {
    return this.phone === phone && this.expires > Date.now() ? true : false
  }
}

export default Token
