/**
 * The node:vm module is not a security mechanism.
 * Do not use it to run untrusted code.
 */
import vm from "node:vm"

const context = vm.createContext({
  foo: 25,
})

const script = new vm.Script(`foo = foo * 2; bar = foo + 1; fizz = 52`)
script.runInNewContext(context)

console.log(context)
