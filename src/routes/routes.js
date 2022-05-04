import apiUsersRoutes from "../api/routes/users.routes.js"
import apiTokensRoutes from "../api/routes/tokens.routes.js"
import apiChecksRoutes from "../api/routes/checks.routes.js"
import accountRoutes from "./account.routes.js"
import sessionRoutes from "./session.routes.js"
import checksRoutes from "./checks.routes.js"
import helpers from "../utils/helpers.js"

let handlers = {}

handlers.index = async function (data, res) {
  res.setHeader("Content-Type", "application/json")
  const methods = ["get"]
  if (!methods.includes(data.method)) {
    res.setHeader("Access-Control-Allow-Methods", "GET")
    return res.writeHead(405).end(JSON.stringify({ Allow: "GET" }))
  }

  const templateData = {
    "head.title": "Uptime Monitoring - Made Simple",
    "head.description":
      "We offer free, simple uptime monitoring for HTTP/HTTPS sites of all kinds.\n When your site goes down, we'll send you a text to let you know.",
    "body.class": "index",
  }

  let document = ""
  try {
    const page = await helpers.getPageTemplate("index.html", templateData)
    if (!page.length) {
      throw new Error()
    }
    document = await helpers.documentTemplate(page, templateData)
    if (!document.length) {
      throw new Error()
    }
  } catch {
    return res.writeHead(500).end()
  }

  res.setHeader("Content-Type", "text/html").writeHead(200).end(document)
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

export default routes
