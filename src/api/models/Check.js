import _data from "../../lib/data.js"
import helpers from "../../utils/helpers.js"

class Check {
  constructor(
    id,
    phone,
    protocol,
    url,
    method,
    successCodes,
    timeoutInSeconds
  ) {
    this.id = id
    this.phone = phone
    this.protocol = protocol
    this.url = url
    this.method = method
    this.successCodes = successCodes
    this.timeoutInSeconds = timeoutInSeconds

    return this
  }

  static findOne = async function (id) {
    return _data.read("checks", id)
  }

  static findAll = async function () {
    return _data.list("checks")
  }
  static delete = async function (id) {
    _data.delete("checks", id)
  }

  static update = async function (id, data) {
    _data.update("checks", id, data)
  }

  static create = async function (data) {
    const id = helpers.createRandomString()
    _data.open("checks", id, data)
    return { id, ...data }
  }

  static verify = async function (id, phone) {
    const data = await this.findOne(id)
    if (!data) return false
    if (!(data.phone === phone && data.expires > Date.now())) return false
    return true
  }
}

export default Check
