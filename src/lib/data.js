import fs from "node:fs/promises"
import path from "node:path"
import helpers from "../utils/helpers.js"

const baseDir = path.join(process.cwd(), ".data")

async function fileOpen(dir, file, data) {
  let fileHandle
  try {
    fileHandle = await fs.open(path.join(baseDir, dir, `${file}.json`), "wx")
    await fileHandle.writeFile(JSON.stringify(data))
  } catch (e) {
    console.error(e.message)
  } finally {
    fileHandle?.close()
  }
}

async function fileUpdate(dir, file, data) {
  let fileHandle
  try {
    fileHandle = await fs.open(path.join(baseDir, dir, `${file}.json`), "r+")
    await fileHandle.truncate()
    await fileHandle.writeFile(JSON.stringify(data))
  } catch (e) {
    console.error(e.message)
  } finally {
    fileHandle?.close()
  }
}

async function fileRead(dir, file) {
  try {
    const data = await fs.readFile(
      path.join(baseDir, dir, `${file}.json`),
      "utf-8"
    )
    return helpers.jsonParse(data)
  } catch (e) {
    console.error(e.message)
  }
}

async function fileDelete(dir, file) {
  try {
    await fs.unlink(path.join(baseDir, dir, `${file}.json`))
  } catch (e) {
    console.error(e.message)
  }
}

async function fileList(dir) {
  try {
    const files = await fs.readdir(path.join(baseDir, dir))
    const filteredFiles = files.filter((file) => file !== ".gitkeep")
    let filenames = []
    for (const file of filteredFiles) {
      filenames.push(file.replace(".json", ""))
    }
    return filenames
  } catch (e) {
    console.error(e.message)
  }
}

export default {
  open: fileOpen,
  read: fileRead,
  update: fileUpdate,
  delete: fileDelete,
  list: fileList,
}
