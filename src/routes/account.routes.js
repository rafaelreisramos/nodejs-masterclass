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

handler["account/create"] = async function (_, res) {
  const templateData = {
    "head.title": "Create an account",
    "head.description": "Signup is easy and only takes a few seconds.",
    "body.class": "index",
  }

  let document = ""
  try {
    const page = await helpers.getPageTemplate(
      "account-create.html",
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

handler["account/edit"] = async function (_, res) {
  const templateData = {
    "head.title": "Account Settings",
    "body.class": "accountEdit",
  }

  let document = ""
  try {
    const page = await helpers.getPageTemplate(
      "account-edit.html",
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

handler["account/deleted"] = async function (_, res) {
  const templateData = {
    "head.title": "Account Deleted",
    "head.description": "Your account has been deleted",
    "body.class": "accountDeleted",
  }

  let document = ""
  try {
    const page = await helpers.getPageTemplate(
      "account-deleted.html",
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
