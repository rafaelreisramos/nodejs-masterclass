import fs from "node:fs/promises"
import path from "node:path"

const baseDir = path.join(process.cwd(), ".data")

async function fileOpen(dir, file, data) {
  let fileHandle
  try {
    fileHandle = await fs.open(path.join(baseDir, dir, `${file}.json`), "wx")
    await fileHandle.writeFile(JSON.stringify(data))
  } catch (error) {
    console.error(`Got an error trying to write to a file: ${error.message}`)
  } finally {
    fileHandle.close()
  }
}

async function fileUpdate(dir, file, data) {
  let fileHandle
  try {
    fileHandle = await fs.open(path.join(baseDir, dir, `${file}.json`), "r+")
    await fileHandle.truncate()
    await fileHandle.writeFile(JSON.stringify(data))
  } catch (error) {
    console.error(`Got an error trying to write to a file: ${error.message}`)
  } finally {
    fileHandle.close()
  }
}

async function fileRead(dir, file) {
  try {
    const data = await fs.readFile(
      path.join(baseDir, dir, `${file}.json`),
      "utf-8"
    )
    return data
  } catch (error) {
    console.error(`Got an error trying to read the file: ${error.message}`)
  }
}

async function fileDelete(dir, file) {
  try {
    await fs.unlink(path.join(baseDir, dir, `${file}.json`))
  } catch (error) {
    console.error(`Got an error trying to delete file: ${error.message}`)
  }
}

export default {
  open: fileOpen,
  read: fileRead,
  update: fileUpdate,
  delete: fileDelete,
}
