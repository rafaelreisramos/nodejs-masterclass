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

handler["checks/create"] = async function (data, callback) {
  const templateData = {
    "head.title": "Create a New Check",
    "body.class": "checksCreate",
  }

  let document = ""
  try {
    const page = await helpers.getPageTemplate(
      "checks-create.html",
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

handler["checks/all"] = async function (data, callback) {
  const templateData = {
    "head.title": "Dashboard",
    "body.class": "checksList",
  }

  let document = ""
  try {
    const page = await helpers.getPageTemplate("checks-list.html", templateData)
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

handler["checks/edit"] = async function (data, callback) {
  const templateData = {
    "head.title": "Check Details",
    "body.class": "checksEdit",
  }

  let document = ""
  try {
    const page = await helpers.getPageTemplate("checks-edit.html", templateData)
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
