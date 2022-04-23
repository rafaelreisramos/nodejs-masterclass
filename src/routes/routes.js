import usersRoutes from "./users.routes.js"
import tokensRoutes from "./tokens.routes.js"
import checksRoutes from "./checks.routes.js"

const routes = {
  alive: (_, callback) => {
    callback(200, { route: "alive" })
  },
  users: usersRoutes,
  tokens: tokensRoutes,
  checks: checksRoutes,
  notFound: (_, callback) => {
    callback(404)
  },
}

export default routes
