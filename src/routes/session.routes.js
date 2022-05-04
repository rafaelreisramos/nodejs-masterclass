import _data from "../lib/data.js"
import helpers from "../utils/helpers.js"

const routes = (data, res) => {
  res.setHeader("Content-Type", "application/json")
  const methods = ["get"]
  if (!methods.includes(data.method)) {
    res.setHeader("Access-Control-Allow-Methods", "GET")
    return res.writeHead(405).end(JSON.stringify({ Allow: "GET" }))
  }
  handler[data.pathname](data, res)
}

const handler = {}

handler["session/create"] = async function (_, res) {
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
    throw new Error()
  }

  return res.setHeader("Content-Type", "text/html").writeHead(200).end(document)
}

handler["session/deleted"] = async function (_, res) {
  const templateData = {
    "head.title": "LoggedOut",
    "head.description": "You have been logged out of your account.",
    "body.class": "sessionDelete",
  }

  let document = ""
  try {
    const page = await helpers.getPageTemplate(
      "session-deleted.html",
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
    throw new Error()
  }

  return res.setHeader("Content-Type", "text/html").writeHead(200).end(document)
}

export default routes
