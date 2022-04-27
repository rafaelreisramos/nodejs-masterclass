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

function createRandomString() {
  return randomUUID()
}

async function getPageTemplate(template, data) {
  const pagesDir = path.join(process.cwd(), "src", "pages")
  try {
    const page = await fs.readFile(path.join(pagesDir, template), "utf-8")
    if (!page.length) {
      throw new Error("No template could be found")
    }
    const interpolatedPage = interpolate(page, data)
    return interpolatedPage
  } catch (e) {
    console.error(e.message)
  }
}

async function documentTemplate(str, data) {
  str = typeof str === "string" && str.length ? str : ""
  data = typeof data === "object" && data ? data : {}
  try {
    const header = await getPageTemplate("_header.html", data)
    if (!header) {
      throw new Error("Could not find the header template")
    }
    const footer = await getPageTemplate("_footer.html", data)
    if (!footer) {
      throw new Error("Could not find the footer template")
    }
    return `${header}${str}${footer}`
  } catch (e) {
    console.log(e.message)
  }
}

function interpolate(str, data) {
  str = typeof str === "string" && str.length ? str : ""
  data = typeof data === "object" && data ? data : {}
  let newStr
  for (const key in config.templateGlobals) {
    if (config.templateGlobals.hasOwnProperty(key)) {
      data[`global.${key}`] = config.templateGlobals[key]
    }
  }
  for (const key in data) {
    if (data.hasOwnProperty(key) && typeof data[key] === "string") {
      str = str.replace(`{${key}}`, data[key])
    }
  }
  return str
}

export default {
  hashPassword: hash,
  jsonParse,
  createRandomString,
  getPageTemplate,
  documentTemplate,
}
