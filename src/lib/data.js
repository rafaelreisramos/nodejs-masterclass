import fs from "node:fs"
import path from "node:path"

const lib = {
  baseDir: path.join(process.cwd(), ".data"),
}

lib.create = (dir, file, data, callback) => {
  fs.open(path.join(lib.baseDir, dir, `${file}.json`), "wx", (error, fd) => {
    if (!error && fd) {
      fs.writeFile(fd, JSON.stringify(data), (error) => {
        if (!error) {
          fs.close(fd, (error) => {
            if (!error) {
              callback(false)
            } else {
              callback("Error closing new file")
            }
          })
        } else {
          callback("Error writing to a new file")
        }
      })
    } else {
      callback("Could not crate a new file, it may already exist")
    }
  })
}

lib.read = (dir, file, callback) => {
  fs.readFile(
    path.join(lib.baseDir, dir, `${file}.json`),
    "utf-8",
    (error, data) => {
      callback(error, data)
    }
  )
}

lib.update = (dir, file, data, callback) => {
  fs.open(path.join(lib.baseDir, dir, `${file}.json`), "r+", (error, fd) => {
    if (!error && fd) {
      fs.ftruncate(fd, (error) => {
        if (!error) {
          fs.writeFile(fd, JSON.stringify(data), (error) => {
            if (!error) {
              fs.close(fd, (error) => {
                if (!error) {
                  callback(false)
                } else {
                  callback("Error closing the file")
                }
              })
            } else {
              callback("Error writing to existing file")
            }
          })
        } else {
          callback("Error truncating file")
        }
      })
    } else {
      callback("Could not open the file for updating, it may not existing yet")
    }
  })
}

lib.delete = (dir, file, callback) => {
  fs.unlink(path.join(lib.baseDir, dir, `${file}.json`), (error) => {
    if (!error) {
      callback(false)
    } else {
      callback("Error deleting file")
    }
  })
}

export default lib
