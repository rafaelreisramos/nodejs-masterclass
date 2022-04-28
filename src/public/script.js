const app = {}

app.config = {
  token: null,
}

app.api = async function (endpoint, { body, ...customOptions } = {}) {
  const token = app.config.token
  const headers = { "Content-Type": "application/json" }
  const options = {
    method: body ? "POST" : "GET",
    ...customOptions,
    headers: {
      ...headers,
      ...customOptions.headers,
    },
  }
  if (token) {
    headers.token = { tokenid: token.id }
  }
  if (body) {
    options.body = JSON.stringify(body)
  }

  const url = new URL(`http://localhost:3000${endpoint}`)
  return window.fetch(url, options).then(async (response) => {
    if (!response.ok) {
      const errorMessage = await response.text()
      return Promise.reject(new Error(errorMessage))
    }
    return await response.json()
  })
}

app.buttonsBind = function () {
  document
    .getElementById("logoutButton")
    ?.addEventListener("click", function (e) {
      e.preventDefault()
      app.logout()
    })
}

app.logout = async function () {
  const tokenId = app.config.token.id
  const url = new URL("/api/tokens", "http://localhost:3000")
  url.searchParams.set("id", tokenId)
  try {
    const response = await app.api(`${url.pathname}${url.search}`, {
      method: "DELETE",
    })
    app.setSessionToken(false)
    window.location.assign("/session/deleted")
  } catch (e) {
    console.log(`${e.name}: ${e.message}`)
  }
}

app.formsBind = function () {
  document
    .querySelector("form")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault()
      const formId = this.id
      const url = new URL(this.action)

      document.querySelector(`#${formId} .formError`).style.display = "hidden"

      let body = {}
      const elements = this.elements
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].type !== "submit") {
          const valueOfElement =
            elements[i].type === "checkbox"
              ? elements[i].checked
              : elements[i].value
          body[elements[i].name] = valueOfElement
        }
      }

      try {
        const data = await app.api(url.pathname, { body })
        app.formsResponse(formId, body, data)
      } catch (error) {
        console.log(error)
        document.querySelector(`#${formId} .formError`).innerHTML =
          error.message
        document.querySelector(`#${formId} .formError`).style.display = "block"
      }
    })
}

app.formsResponse = async function (formId, requestBody, responseData) {
  if (formId === "accountCreate") {
    const body = {
      phone: requestBody.phone,
      password: requestBody.password,
    }

    try {
      const token = await app.api("/api/tokens", { body })
      app.setSessionToken(token)
      window.location.assign("/checks/all")
    } catch (error) {
      console.log(error)
      document.querySelector(`#${formId} .formError`).innerHTML =
        "Sorry, an error has occurred. Please try again."
      document.querySelector(`#${formId} .formError`).style.display = "block"
    }
  }

  if (formId === "sessionCreate") {
    app.setSessionToken(responseData)
    window.location.assign("/checks/all")
  }
}

app.setSessionToken = function (token) {
  app.config.token = token
  if (token) {
    localStorage.setItem("token", JSON.stringify(token))
    app.addLoggedInClass(true)
    return
  }
  localStorage.removeItem("token")
  app.addLoggedInClass(false)
}

app.getSessionToken = function () {
  const tokenStr = localStorage.getItem("token")
  if (!tokenStr) return
  try {
    const token = JSON.parse(tokenStr)
    app.config.token = token
    app.addLoggedInClass(true)
  } catch {
    app.config.token = false
    app.addLoggedInClass(false)
  }
}

app.addLoggedInClass = function (add) {
  const element = document.querySelector("body")
  if (add) {
    element.classList.add("loggedIn")
    return
  }
  element.classList.remove("loggedIn")
}

app.init = function () {
  app.formsBind()
  app.buttonsBind()
  app.getSessionToken()
}

window.onload = function () {
  app.init()
}
