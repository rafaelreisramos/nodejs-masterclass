import { executionAsyncId, createHook } from "node:async_hooks"
import fs from "node:fs"

const whatTimeIsIt = function (callback) {
  setInterval(() => {
    callback(Date.now())
  }, 1000) // 1 second
}

whatTimeIsIt((time) => {
  fs.writeSync(1, `The time is ${time}\n`)
})

const { fd } = process.stdout
let indent = 0
const hooks = {
  init(asyncId, type, triggerAsyncId) {
    const eid = executionAsyncId()
    const indentStr = " ".repeat(indent)
    fs.writeSync(
      fd,
      `${indentStr}${type}(${asyncId}):` +
        ` trigger: ${triggerAsyncId} execution: ${eid}\n`
    )
  },
  before(asyncId) {
    const indentStr = " ".repeat(indent)
    fs.writeSync(fd, `${indentStr}before:  ${asyncId}\n`)
    indent += 2
  },
  after(asyncId) {
    indent -= 2
    const indentStr = " ".repeat(indent)
    fs.writeSync(fd, `${indentStr}after:  ${asyncId}\n`)
  },
  destroy(asyncId) {
    const indentStr = " ".repeat(indent)
    fs.writeSync(fd, `${indentStr}destroy:  ${asyncId}\n`)
  },
}

const asyncHook = createHook(hooks).enable()
