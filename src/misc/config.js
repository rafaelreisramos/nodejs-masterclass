import dotenv from "dotenv"
import { expand } from "dotenv-expand"
expand(dotenv.config())

export default {
  server: {
    address: "localhost",
    port: 6000,
  },
  ssl: {
    cert: process.env.SERVER_CERTIFICATE,
    key: process.env.SERVER_PRIVATE_KEY,
  },
}
