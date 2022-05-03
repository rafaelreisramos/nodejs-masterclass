import repl from "node:repl"

const replServer = repl.start({
  prompt: "> ",
  ignoreUndefined: true,
  eval: function customEval() {
    this.displayPrompt()
  },
})

replServer.defineCommand("ping", {
  help: "Request a pong",
  action() {
    this.clearBufferedCommand()
    console.log("pong")
    this.displayPrompt()
  },
})

replServer.defineCommand("bye", function bye() {
  console.log("Goodbye!")
  this.close()
})

replServer.on("exit", () => {
  console.log('Received "exit" event from repl!')
  process.exit()
})
