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
      throw new Error("no template could be found")
    }
    const interpolatedPage = interpolate(page, data)
    return interpolatedPage
  } catch (e) {
    console.error(`${e.name}: ${e.message}`)
  }
}

async function documentTemplate(str, data) {
  str = typeof str === "string" && str.length ? str : ""
  data = typeof data === "object" && data ? data : {}
  try {
    const header = await getPageTemplate("_header.html", data)
    if (!header) {
      throw new Error("could not find the header template")
    }
    const footer = await getPageTemplate("_footer.html", data)
    if (!footer) {
      throw new Error("could not find the footer template")
    }
    return `${header}${str}${footer}`
  } catch (e) {
    console.error(`${e.name}: ${e.message}`)
  }
}

async function buildPageFromTemplates(data, template) {
  let document = ""
  try {
    const page = await getPageTemplate(template, data)
    if (!page) {
      throw new Error("html template page is empty")
    }
    document = await documentTemplate(page, data)
    if (!document) {
      throw new Error("generated html page is empty")
    }
    return document
  } catch (e) {
    console.error(`${e.name}: ${e.message}`)
  }
}

async function getPage(data, template) {
  let document = ""
  try {
    document = await buildPageFromTemplates(data, template)
    if (!document) {
      throw new Error("could not building page from template")
    }
    return document
  } catch (e) {
    console.error(`${e.name}: ${e.message}`)
  }
}

function interpolate(str, data) {
  str = typeof str === "string" && str.length ? str : ""
  data = typeof data === "object" && data ? data : {}
  let newStr = ""
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

async function getStaticAsset(filename) {
  filename = typeof filename === "string" && filename.length ? filename : false
  try {
    if (!filename) {
      throw new Error("A valid filename was not specified")
    }
    const publicDir = path.join(process.cwd(), "src", "public")
    const file = await fs.readFile(path.join(publicDir, filename))
    if (!file) {
      throw new Error("No file could be found")
    }
    return file
  } catch (e) {
    console.error(`${e.name}: ${e.message}`)
  }
}

function hoursMinutesSeconds(totalSeconds) {
  const hourMinutsSeconds = new Date(totalSeconds * 1000)
    .toISOString()
    .substring(11, 19)
  const [hours, minutes, seconds] = hourMinutsSeconds.split(":")
  return `${hours} hours, ${minutes} minutes and ${seconds} seconds`
}

export default {
  hashPassword: hash,
  jsonParse,
  createRandomString,
  getPage,
  getStaticAsset,
  hoursMinutesSeconds,
  buildPageFromTemplates,
}
