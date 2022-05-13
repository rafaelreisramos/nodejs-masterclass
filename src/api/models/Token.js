import _data from "../../lib/data.js"
import helpers from "../../utils/helpers.js"

class Token {
  constructor(id, phone, expires) {
    this.id = id
    this.phone = phone
    this.expires = expires

    return this
  }

  static findOne = async function (id) {
    return _data.read("tokens", id)
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
    return { id, phone, expires }
  }

  static verify = async function (id, phone) {
    const data = await this.findOne(id)
    if (!data) return false
    if (!(data.phone === phone && data.expires > Date.now())) return false
    return true
  }
}

export default Token
