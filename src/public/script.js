const app = {}

app.config = {
  token: null,
}

app.api = async function (endpoint, { body, ...customOptions } = {}) {
  const token = app.config.token
  const headers = new Headers({
    "Content-Type": "application/json",
    ...customOptions.headers,
  })

  const options = {
    ...customOptions,
    headers,
  }
  if (token) {
    headers.append("tokenid", token.id)
  }
  if (body) {
    options.body = JSON.stringify(body)
  }
  const url = new URL(`http://localhost:3000${endpoint}`)
  return window.fetch(url, options).then(async (response) => {
    if (!response.ok) {
      const message = JSON.parse(await response.text()).error
      const error = {
        status: response.status,
        message,
      }
      console.log(error)
      console.log(JSON.stringify(error))
      return Promise.reject(new Error(JSON.stringify(error)))
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

app.logout = async function (redirect = true) {
  const tokenId = app.config.token.id
  const url = new URL("/api/tokens", "http://localhost:3000")
  url.searchParams.set("id", tokenId)
  try {
    const response = await app.api(`${url.pathname}${url.search}`, {
      method: "DELETE",
    })
    app.setSessionToken(false)
    if (redirect) {
      window.location.assign("/session/deleted")
    }
  } catch (e) {
    console.log(`${e.name}: ${e.message}`)
  }
}

app.formsBind = function () {
  if (document.querySelector("form")) {
    const forms = document.querySelectorAll("form")

    for (let i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", async function (e) {
        e.preventDefault()
        const formId = this.id
        const url = new URL(this.action)
        let method = this.method.toUpperCase()
        console.log(formId, method)

        document.querySelector(`#${formId} .formError`).style.display = "none"
        if (document.querySelector(`#${formId} .formSuccess`)) {
          document.querySelector(`#${formId} .formSuccess`).style.display =
            "none"
        }

        let body = {}
        const elements = this.elements
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].type !== "submit") {
            const valueOfElement =
              elements[i].type === "checkbox"
                ? elements[i].checked
                : elements[i].value
            if (elements[i].name === "_method") {
              method = valueOfElement
              continue
            }
            body[elements[i].name] = valueOfElement
          }
        }

        if (method === "DELETE") {
          url.searchParams.set("phone", body.phone)
        }

        try {
          const data = await app.api(`${url.pathname}${url.search}`, {
            body,
            method,
          })
          app.formsResponse(formId, body, data)
        } catch (error) {
          console.log(error)
          document.querySelector(`#${formId} .formError`).innerHTML =
            error.message
          document.querySelector(`#${formId} .formError`).style.display =
            "block"
        }
      })
    }
  }
}

app.formsResponse = async function (formId, requestBody, responseData) {
  if (formId === "accountCreate") {
    const body = {
      phone: requestBody.phone,
      password: requestBody.password,
    }

    try {
      const token = await app.api("/api/tokens", { body, method: "POST" })
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

  if (formId === "accountEdit3") {
    app.logout(false)
    window.location.assign("/account/deleted")
  }

  const formsWithSuccessMessages = ["accountEdit1", "accountEdit2"]
  if (formsWithSuccessMessages.indexOf(formId) > -1) {
    document.querySelector(`#${formId} .formSuccess`).style.display = "block"
  }
}

app.formsLoadData = async function () {
  const classes = document.querySelector("body").classList
  if (classes.contains("accountEdit")) {
    await app.formsLoadAccountSettings()
  }
}

app.formsLoadAccountSettings = async function () {
  const phone = app.config.token.phone
  if (!phone) {
    app.logout()
    return Promise.reject()
  }

  const url = new URL("/api/users", "http://localhost:3000")
  url.searchParams.set("phone", phone)
  try {
    const user = await app.api(`${url.pathname}${url.search}`, {
      method: "GET",
    })
    document.querySelector("#accountEdit1 .firstNameInput").value =
      user.firstName
    document.querySelector("#accountEdit1 .lastNameInput").value = user.lastName
    document.querySelector("#accountEdit1 .displayPhoneInput").value =
      user.phone
    const hiddenPhoneInputs = document.querySelectorAll(
      "input.hiddenPhoneNumberInput"
    )
    for (var i = 0; i < hiddenPhoneInputs.length; i++) {
      hiddenPhoneInputs[i].value = user.phone
    }
  } catch (e) {
    console.log(JSON.parse(e.message))
    app.logout()
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
  app.formsLoadData()
}

window.onload = function () {
  app.init()
}
