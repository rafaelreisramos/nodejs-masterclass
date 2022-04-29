import apiUsersRoutes from "../api/routes/users.routes.js"
import apiTokensRoutes from "../api/routes/tokens.routes.js"
import apiChecksRoutes from "../api/routes/checks.routes.js"
import accountRoutes from "./account.routes.js"
import sessionRoutes from "./session.routes.js"
import checksRoutes from "./checks.routes.js"
import helpers from "../utils/helpers.js"

let handlers = {}

handlers.index = async function (data, callback) {
  const methods = ["get"]
  if (!methods.includes(data.method)) {
    return callback(405)
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
    return callback(500)
  }

  callback(200, document, "text/html")
}

const contentTypes = {
  js: "text/javascript",
  css: "text/css",
  png: "image/png",
  jpg: "image/jpeg",
  ico: "image/vnd.microsoft.icon",
  plain: "text/plain",
}

handlers.static = async function (data, callback) {
  const methods = ["get"]
  if (!methods.includes(data.method)) {
    return callback(405)
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
    return callback(404)
  }

  callback(200, asset, contentType)
}

const routes = {
  alive: (_, callback) => {
    callback(200, { route: "alive" })
  },
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
  public: handlers.static,
  notFound: (_, callback) => {
    callback(404)
  },
}

export default routes
