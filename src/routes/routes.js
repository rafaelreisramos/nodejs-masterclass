import apiUsersRoutes from "../api/routes/users.routes.js"
import apiTokensRoutes from "../api/routes/tokens.routes.js"
import apiChecksRoutes from "../api/routes/checks.routes.js"

const routes = {
  alive: (_, callback) => {
    callback(200, { route: "alive" })
  },
  "api/users": apiUsersRoutes,
  "api/tokens": apiTokensRoutes,
  "api/checks": apiChecksRoutes,
  notFound: (_, callback) => {
    callback(404)
  },
}

export default routes
