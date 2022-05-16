import { URL } from "node:url"
import dns from "node:dns/promises"
import Check from "../models/Check.js"
import User from "../models/User.js"
import validators from "../../utils/validators.js"
import config from "../../config.js"

class CreateCheckService {
  async run(token, user, payload) {
    let { checks } = user
    if (!validators.userChecks(checks)) checks = []
    if (!(checks.length < config.maxChecks)) {
      throw new Error(
        `The user already has the maximum number ${config.maxChecks} of checks`
      )
    }

    const { protocol, url, method, successCodes, timeoutInSeconds } = payload
    const urlToTest = new URL(`${protocol}://www.${url}`)
    try {
      await dns.resolve4(urlToTest.hostname)
    } catch {
      throw new Error("The url entered did not resolve to any DNS entries")
    }

    const { phone } = token
    const data = {
      phone,
      protocol,
      url,
      method,
      successCodes,
      timeoutInSeconds,
    }

    let check = null
    try {
      check = await Check.create(data)
    } catch {
      throw new Error("Could not create the new check")
    }

    user.checks = checks
    user.checks.push(check.id)
    try {
      await User.update(phone, user)
    } catch {
      throw new Error("Could not update the user with the new checks")
    }
    return check
  }
}

export default new CreateCheckService()
