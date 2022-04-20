import fs from "node:fs/promises"
import path from "node:path"
import helpers from "../utils/helpers.js"

const baseDir = path.join(process.cwd(), ".data")

async function fileOpen(dir, file, data) {
  let fileHandle
  let error = false
  try {
    fileHandle = await fs.open(path.join(baseDir, dir, `${file}.json`), "wx")
    await fileHandle.writeFile(JSON.stringify(data))
  } catch (e) {
    error = `Got an error trying to write to a file: ${e.message}`
  } finally {
    fileHandle.close()
    return error
  }
}

async function fileUpdate(dir, file, data) {
  let fileHandle
  let error = false
  try {
    fileHandle = await fs.open(path.join(baseDir, dir, `${file}.json`), "r+")
    await fileHandle.truncate()
    await fileHandle.writeFile(JSON.stringify(data))
  } catch (e) {
    error = `Got an error trying to write to a file: ${e.message}`
  } finally {
    fileHandle.close()
    return error
  }
}

async function fileRead(dir, file) {
  try {
    const data = await fs.readFile(
      path.join(baseDir, dir, `${file}.json`),
      "utf-8"
    )
    return [null, helpers.jsonParse(data)]
  } catch (e) {
    const error = `Got an error trying to read the file: ${e.message}`
    return [error, null]
  }
}

async function fileDelete(dir, file) {
  let error = false
  try {
    await fs.unlink(path.join(baseDir, dir, `${file}.json`))
  } catch (e) {
    error = `Got an error trying to delete file: ${e.message}`
  } finally {
    return error
  }
}

export default {
  open: fileOpen,
  read: fileRead,
  update: fileUpdate,
  delete: fileDelete,
}
