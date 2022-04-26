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
    return callback(405, undefined, "text/html")
  }

  let page
  try {
    page = await helpers.getPageTemplate("index.html")
    if (!page.length) {
      throw new Error()
    }
  } catch (e) {
    return callback(500, undefined, "text/html")
  }

  callback(200, page, "text/html")
}

const routes = {
  alive: (_, callback) => {
    callback(200, { route: "alive" })
  },
  "": handlers.index,
  "account/create": accountRoutes,
  "account/edit": accountRoutes,
  "account/delete": accountRoutes,
  "session/create": sessionRoutes,
  "session/delete": sessionRoutes,
  "checks/all": checksRoutes,
  "checks/create": checksRoutes,
  "checks/edit": checksRoutes,
  "api/users": apiUsersRoutes,
  "api/tokens": apiTokensRoutes,
  "api/checks": apiChecksRoutes,
  notFound: (_, callback) => {
    callback(404)
  },
}

export default routes
