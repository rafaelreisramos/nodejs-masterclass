import _data from "../lib/data.js"
import helpers from "../utils/helpers.js"

const routes = async (data, res) => {
  res.setHeader("Content-Type", "application/json")
  const methods = ["get"]
  if (!methods.includes(data.method)) {
    res.setHeader("Access-Control-Allow-Methods", "GET")
    return res.writeHead(405).end(JSON.stringify({ Allow: "GET" }))
  }

  try {
    const document = await handler[data.pathname]()
    if (!document) {
      throw new Error()
    }
    return res
      .setHeader("Content-Type", "text/html")
      .writeHead(200)
      .end(document)
  } catch (e) {
    const error = {
      error: e?.message ? e.message : "an unknown error has occured",
    }
    return res.writeHead(500).end(JSON.stringify(error))
  }
}

const handler = {}

handler["checks/create"] = async function () {
  const templateData = {
    "head.title": "Create a New Check",
    "body.class": "checksCreate",
  }

  return await helpers.getPage(templateData, "checks-create.html")
}

handler["checks/all"] = async function () {
  const templateData = {
    "head.title": "Dashboard",
    "body.class": "checksList",
  }

  return await helpers.getPage(templateData, "checks-list.html")
}

handler["checks/edit"] = async function () {
  const templateData = {
    "head.title": "Check Details",
    "body.class": "checksEdit",
  }

  return await helpers.getPage(templateData, "checks-edit.html")
}

export default routes
