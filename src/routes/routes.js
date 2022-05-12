import { URL } from "node:url"
import { StringDecoder } from "node:string_decoder"

import apiUsersRoutes from "../api/routes/users.routes.js"
import apiTokensRoutes from "../api/routes/tokens.routes.js"
import apiChecksRoutes from "../api/routes/checks.routes.js"
import accountRoutes from "./account.routes.js"
import sessionRoutes from "./session.routes.js"
import checksRoutes from "./checks.routes.js"
import helpers from "../utils/helpers.js"

const handler = (req, res) => {
  const url = new URL(`${req.protocol}//${req.headers.host}${req.url}`)
  const pathname = url.pathname.replace(/^\//, "")
  const method = req.method.toLowerCase()
  const headers = req.headers
  const searchParams = url.searchParams
  const decoder = new StringDecoder("utf-8")
  let buffer = ""
  req.on("data", (data) => {
    buffer += decoder.write(data)
  })
  req.on("end", () => {
    buffer += decoder.end()

    const data = {
      pathname,
      method,
      headers,
      searchParams,
      payload: helpers.jsonParse(buffer),
    }

    let chosenHandler = routes[pathname] ?? routes["notFound"]
    chosenHandler = pathname.includes("public")
      ? routes["public"]
      : chosenHandler
    try {
      chosenHandler(data, res)
    } catch (e) {
      const error = {
        error: e?.message ? e.message : "an unknown error has occured",
      }
      res.setHeader("Content-Type", "application/json")
      res.writeHead(500)
      res.end(JSON.stringify(error))
    }
  })
}

let handlers = {}

handlers.index = async function (data, res) {
  res.setHeader("Content-Type", "application/json")
  const methods = ["get"]
  if (!methods.includes(data.method)) {
    res.setHeader("Access-Control-Allow-Methods", "GET")
    return res.writeHead(405).end(JSON.stringify({ Allow: "GET" }))
  }

  try {
    const templateData = {
      "head.title": "Uptime Monitoring - Made Simple",
      "head.description":
        "We offer free, simple uptime monitoring for HTTP/HTTPS sites of all kinds.\n When your site goes down, we'll send you a text to let you know.",
      "body.class": "index",
    }

    const document = await helpers.getPage(templateData, "index.html")
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

const contentTypes = {
  js: "text/javascript",
  css: "text/css",
  png: "image/png",
  jpg: "image/jpeg",
  ico: "image/vnd.microsoft.icon",
  plain: "text/plain",
}

handlers.static = async function (data, res) {
  res.setHeader("Content-Type", "application/json")
  const methods = ["get"]
  if (!methods.includes(data.method)) {
    return res
      .setHeader("Access-Control-Allow-Methods", "GET")
      .writeHead(405)
      .end(JSON.stringify({ Allow: "GET" }))
  }
  let contentType = contentTypes["plain"]
  let asset = null
  try {
    const assetName = data.pathname.replace("public/", "").trim()
    if (!assetName.length) {
      throw new Error()
    }
    asset = await helpers.getStaticAsset(assetName)
    if (!asset) {
      throw new Error()
    }
    contentType = contentTypes[assetName.split(".")[1]]
  } catch {
    return res.writeHead(404).end()
  }

  return res.setHeader("Content-Type", contentType).writeHead(200).end(asset)
}

function errorRoute(_, res) {
  throw new Error("example error route")
}

function notFoundRoute(_, res) {
  return res.writeHead(404).end()
}

function pingRoute(_, res) {
  return res.writeHead(200).end(JSON.stringify({ route: "alive" }))
}

const routes = {
  "api/alive": pingRoute,
  "": handlers.index,
  "account/create": accountRoutes,
  "account/edit": accountRoutes,
  "account/deleted": accountRoutes,
  "session/create": sessionRoutes,
  "session/deleted": sessionRoutes,
  "checks/all": checksRoutes,
  "checks/create": checksRoutes,
  "checks/edit": checksRoutes,
  "api/users": apiUsersRoutes,
  "api/tokens": apiTokensRoutes,
  "api/checks": apiChecksRoutes,
  "example/error": errorRoute,
  public: handlers.static,
  notFound: notFoundRoute,
}

export { handler, routes }
