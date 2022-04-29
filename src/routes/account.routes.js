import _data from "../lib/data.js"
import helpers from "../utils/helpers.js"

const routes = (data, callback) => {
  const methods = ["get"]
  if (!methods.includes(data.method)) {
    return callback(405)
  }
  handler[data.pathname](data, callback)
}

const handler = {}

handler["account/create"] = async function (data, callback) {
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
    return callback(500)
  }

  callback(200, document, "text/html")
}

handler["account/edit"] = async function (data, callback) {
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
    return callback(500)
  }

  callback(200, document, "text/html")
}

handler["account/deleted"] = async function (data, callback) {
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
    return callback(500)
  }

  callback(200, document, "text/html")
}

export default routes
