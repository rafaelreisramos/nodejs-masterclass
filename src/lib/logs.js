import fs from "node:fs/promises"
import path from "node:path"
import zlib from "node:zlib"
import { promisify } from "node:util"

const baseDir = path.join(process.cwd(), ".logs")

async function appendToFile(file, data) {
  let fileHandle
  try {
    fileHandle = await fs.open(path.join(baseDir, `${file}.log`), "a")
    await fileHandle.writeFile(`${data}\n`)
  } catch (e) {
    console.error(e.message)
  } finally {
    fileHandle?.close()
  }
}

async function fileList(includeCompressedFiles) {
  try {
    const files = await fs.readdir(baseDir)
    const logfiles = files.filter((file) => file !== ".gitkeep")
    let filenames = []
    for (const file of logfiles) {
      if (file.includes(".log")) {
        filenames.push(file.replace(".log", ""))
      }
      if (file.includes(".bz.b64") && includeCompressedFiles) {
        filenames.push(file.replace(".bz.b64", ""))
      }
    }
    return filenames
  } catch (e) {
    console.error(e.message)
  }
}

async function compressFile(srcId, dstId) {
  const srcFilename = `${srcId}.log`
  const dstFilename = `${dstId}.bz.b64`
  const promiseGzip = promisify(zlib.gzip)

  let fileHandle
  try {
    const fileContent = await fs.readFile(
      path.join(baseDir, srcFilename),
      "utf-8"
    )
    const inputBuffer = Buffer.from(fileContent, "utf-8")
    const outputBuffer = await promiseGzip(inputBuffer)

    fileHandle = await fs.open(path.join(baseDir, dstFilename), "wx")
    await fileHandle.writeFile(outputBuffer.toString("base64"))
  } catch (e) {
    console.error(e.message)
  } finally {
    fileHandle?.close()
  }
}

async function decompressFile(fileId) {
  const filename = `${fileId}.gz.b64`
  const promiseUnzip = promisify(zlib.unzip)

  try {
    const fileContent = fs.readFile(path.join(baseDir, filename), "utf-8")
    const inputBuffer = Buffer.from(fileContent, "base64")
    const outputBuffer = await promiseUnzip(inputBuffer)
    return outputBuffer.toString()
  } catch (e) {
    console.error(e.message)
  }
}

async function truncateFile(fileId) {
  const filename = `${fileId}.log`
  try {
    await fs.truncate(path.join(baseDir, filename))
  } catch (e) {
    console.error(e.message)
  }
}

export default {
  append: appendToFile,
  list: fileList,
  compress: compressFile,
  decompress: decompressFile,
  truncate: truncateFile,
}
