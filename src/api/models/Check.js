import _data from "../../lib/data.js"
import helpers from "../../utils/helpers.js"

class Check {
  constructor({
    id,
    phone,
    protocol,
    url,
    method,
    successCodes,
    timeoutInSeconds,
  }) {
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
    const data = await _data.read("checks", id)
    if (!data) {
      return Promise.resolve(null)
    }
    return new Check(data)
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
    return new Check({ id, ...data })
  }
}

export default Check
