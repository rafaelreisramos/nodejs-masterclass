import { executionAsyncId, createHook } from "node:async_hooks"
import fs from "node:fs"

const targetExecutionContext = false

const whatTimeIsIt = function (callback) {
  setInterval(() => {
    fs.writeSync(
      1,
      `When the setInterval runs, the execution context is ${executionAsyncId()}\n`
    )
    callback(Date.now())
  }, 1000) // 1 second
}

whatTimeIsIt((time) => {
  fs.writeSync(1, `The time is ${time}\n`)
})

const hooks = {
  init(id, type, triggerId, resource) {
    fs.writeSync(1, `init ${id}\n`)
  },
  before(id) {
    fs.writeSync(1, `before ${id}\n`)
  },
  after(id) {
    fs.writeSync(1, `after ${id}\n`)
  },
  destroy(id) {
    fs.writeSync(1, `destroy ${id}\n`)
  },
  promiseResolve(id) {
    fs.writeSync(1, `promiseResolve ${id}\n`)
  },
}

const asyncHook = createHook(hooks).enable()
