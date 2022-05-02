import test from "node:test"
import assert from "node:assert"
import math from "../utils/math-test.js"

test("should return a number 1", () => {
  const num = math.getANumber()
  assert.ok(typeof num, "number")
  assert.equal(num, 1)
})

test("should do the 4 arithmetic operations", async (t) => {
  await t.test("it should return 3 as 2 + 1 addition", () => {
    const num = math.add(2, 1)
    assert.equal(num, 3)
  })

  await t.test("should return 6 as 2 * 3 multiplication", () => {
    const num = math.multiply(2, 3)
    assert.equal(num, 6)
  })

  await t.test("should return 1 as 4 - 3 subtraction", () => {
    const num = math.subtract(4, 3)
    assert.equal(num, 1)
  })

  await t.test("should return 2 as 6 / 3 division", () => {
    const num = math.divide(6, 3)
    assert.equal(num, 2)
  })
})

test("should fail on this test", () => {
  const num = math.add(1, 1)
  assert.equal(num, 1)
})

test("should treat division correctly", async (t) => {
  await t.test("should return Infinity on +1 / 0"),
    () => {
      const num = math.divide(1, 0)
      assert.equal(typeof num, "number")
      assert.equal(num, Infinity)
    }

  await t.test("should return -Infinity on -1 / 0"),
    () => {
      const num = math.divide(1, 0)
      assert.equal(typeof num, "number")
      assert.strictEqual(num, -Infinity)
    }

  await t.test("should return NaN 0 / 0"),
    () => {
      const num = math.divide(0, 0)
      assert.equal(typeof num, "number") // ops... ;-)
      assert.equal(num, NaN)
    }
})

test("should skip this test", { skip: true }, () => {})

test("should also skip this test", (t) => {
  t.skip("this is skipped")
})

test("this is a todo test", { todo: true }, () => {})
