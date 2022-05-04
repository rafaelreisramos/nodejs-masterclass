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

handler["checks/create"] = async function (_, res) {
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
    throw new Error()
  }

  return res.setHeader("Content-Type", "text/html").writeHead(200).end(document)
}

handler["checks/all"] = async function (_, res) {
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
    throw new Error()
  }

  return res.setHeader("Content-Type", "text/html").writeHead(200).end(document)
}

handler["checks/edit"] = async function (_, res) {
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
    throw new Error()
  }

  return res.setHeader("Content-Type", "text/html").writeHead(200).end(document)
}

export default routes
