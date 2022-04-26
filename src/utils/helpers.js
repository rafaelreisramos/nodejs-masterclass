import path from "node:path"
import fs from "node:fs/promises"
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

async function getPageTemplate(template) {
  const pagesDir = path.join(process.cwd(), "src", "pages")
  try {
    const page = await fs.readFile(path.join(pagesDir, template), "utf-8")
    if (!page.length) {
      throw new Error("No template could be found")
    }
    return page
  } catch (e) {
    console.error(e.message)
  }
}

export default {
  hashPassword: hash,
  jsonParse,
  createRandomString,
  getPageTemplate,
}
