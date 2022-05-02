import dotenv from "dotenv"
import { expand } from "dotenv-expand"
expand(dotenv.config())
import test from "node:test"
import assert from "node:assert"
import app from "../index.js"

async function fetchApi(endpoint, { body, ...customOptions } = {}) {
  const headers = { "Content-Type": "application/json" }
  const options = {
    method: body ? "POST" : "GET",
    ...customOptions,
    headers: {
      ...headers,
      ...customOptions.headers,
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }
  const url = new URL(endpoint, process.env.API_URL)
  debugger
  const response = await fetch(url.href, options)
  if (!response.ok) {
    const error = await response.text()
    return { status: response.status, error }
  }
  const data = await response.json()
  return { status: response.status, data }
}

test("beforeAll - start the app", (t, done) => {
  app.init(done)
})

test("should respond to GET with 200", async () => {
  const response = await fetchApi("/api/alive")
  assert.equal(response.status, 200)
})

test("should respond to GET with 400", async () => {
  const response = await fetchApi("/api/users")
  assert.equal(response.status, 400)
})

test("should respond inexistent path with 404 ", async () => {
  const response = await fetchApi("/inexistent-path")
  assert.equal(response.status, 404)
})

test("afterAll - kill the app", (t, done) => {
  process.exit(0)
})
