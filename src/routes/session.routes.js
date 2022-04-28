import _data from "../lib/data.js"
import helpers from "../utils/helpers.js"

const routes = (data, callback) => {
  const methods = ["get"]
  if (!methods.includes(data.method)) {
    return callback(405)
  }
  handler[data.method](data, callback)
}

const handler = {}

handler.get = async function (data, callback) {
  const templateData = {
    "head.title": "Login to your account",
    "head.description":
      "Please enter your phone number and password to access your account.",
    "body.class": "sessionCreate",
  }

  let document = ""
  try {
    const page = await helpers.getPageTemplate(
      "session-create.html",
      templateData
    )
    if (!page.length) {
      throw new Error()
    }
    document = await helpers.documentTemplate(page, templateData)
    if (!document.length) {
      throw new Error()
    }
  } catch {
    return callback(500)
  }

  callback(200, document, "text/html")
}

export default routes
