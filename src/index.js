import { httpServer, httpsServer } from "./server.js"
import environment from "./config.js"

httpServer.listen(environment.httpPort, () =>
  console.info(
    `HTTP server is running on port ${environment.httpPort} in ${environment.name} mode`
  )
)

httpsServer.listen(environment.httpsPort, () =>
  console.info(
    `HTTPS server is running on port ${environment.httpsPort} in ${environment.name} mode`
  )
)
