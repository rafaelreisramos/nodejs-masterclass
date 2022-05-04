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

handler["account/create"] = async function () {
  const templateData = {
    "head.title": "Create an account",
    "head.description": "Signup is easy and only takes a few seconds.",
    "body.class": "index",
  }

  return await helpers.getPage(templateData, "account-create.html")
}

handler["account/edit"] = async function () {
  const templateData = {
    "head.title": "Account Settings",
    "body.class": "accountEdit",
  }

  return await helpers.getPage(templateData, "account-edit.html")
}

handler["account/deleted"] = async function () {
  const templateData = {
    "head.title": "Account Deleted",
    "head.description": "Your account has been deleted",
    "body.class": "accountDeleted",
  }

  return await helpers.getPage(templateData, "account-deleted.html")
}

export default routes
