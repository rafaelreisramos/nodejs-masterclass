import { createHmac, randomUUID } from "node:crypto"
import config from "../config.js"

function hash(str) {
  if (typeof str !== "string" || str.length === 0) {
    return false
  }
  return createHmac("sha256", config.hashSecret).update(str).digest("hex")
}

function jsonParse(str) {
  try {
    const obj = JSON.parse(str)
    return obj
  } catch {
    return {}
  }
}

async function createRandomString() {
  return randomUUID()
}

export default {
  hashPassword: hash,
  jsonParse,
  createRandomString,
}
