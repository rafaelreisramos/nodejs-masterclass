const app = {}

app.config = {
  token: false,
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

        document.querySelector(`#${formId} .formError`).style.display = "none"
        if (document.querySelector(`#${formId} .formSuccess`)) {
          document.querySelector(`#${formId} .formSuccess`).style.display =
            "none"
        }

        let body = {}
        const elements = this.elements
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].type !== "submit") {
            const classOfElement =
              typeof elements[i].classList.value == "string" &&
              elements[i].classList.value.length > 0
                ? elements[i].classList.value
                : ""
            const valueOfElement =
              elements[i].type === "checkbox" &&
              classOfElement.indexOf("multiselect") === -1
                ? elements[i].checked
                : classOfElement.indexOf("intval") === -1
                ? elements[i].value
                : parseInt(elements[i].value)
            const elementIsChecked = elements[i].checked
            let nameOfElement = elements[i].name
            if (nameOfElement === "_method") {
              method = valueOfElement
              continue
            }
            if (nameOfElement === "httpmethod") {
              nameOfElement = "method"
            }
            if (nameOfElement == "uid") {
              nameOfElement = "id"
            }

            if (classOfElement.indexOf("multiselect") > -1) {
              if (elementIsChecked) {
                body[nameOfElement] =
                  typeof body[nameOfElement] == "object" &&
                  body[nameOfElement] instanceof Array
                    ? body[nameOfElement]
                    : []
                body[nameOfElement].push(valueOfElement)
              }
            } else {
              body[nameOfElement] = valueOfElement
            }
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

  if (formId === "checksCreate") {
    window.location.assign("/checks/all")
  }

  const formsWithSuccessMessages = ["accountEdit1", "accountEdit2"]
  if (formsWithSuccessMessages.indexOf(formId) > -1) {
    document.querySelector(`#${formId} .formSuccess`).style.display = "block"
  }
}

app.formsLoadData = async function () {
  const classes = document.querySelector("body").classList
  const primaryClass = typeof classes[0] == "string" ? classes[0] : false

  if (primaryClass == "accountEdit") {
    await app.formsLoadAccountSettings()
    return
  }

  if (primaryClass == "checksList") {
    await app.loadChecksListPage()
    return
  }

  if (primaryClass == "checksEdit") {
    await app.loadChecksEditPage()
    return
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
    for (let i = 0; i < hiddenPhoneInputs.length; i++) {
      hiddenPhoneInputs[i].value = user.phone
    }
  } catch (e) {
    console.log(JSON.parse(e.message))
    app.logout()
  }
}

app.loadChecksListPage = async function () {
  const phone = app.config.token.phone
  if (!phone) {
    app.logout()
    return Promise.reject()
  }

  const url = new URL("/api/users", "http://localhost:3000")
  url.searchParams.set("phone", phone)
  try {
    const { checks } = await app.api(`${url.pathname}${url.search}`, {
      method: "GET",
    })
    if (checks?.length) {
      checks.forEach(async (id) => {
        const url = new URL("/api/checks", "http://localhost:3000")
        url.searchParams.set("id", id)
        try {
          const check = await app.api(`${url.pathname}${url.search}`, {
            method: "GET",
          })
          const table = document.getElementById("checksListTable")
          const tr = table.insertRow(-1)
          tr.classList.add("checkRow")
          const td0 = tr.insertCell(0)
          const td1 = tr.insertCell(1)
          const td2 = tr.insertCell(2)
          const td3 = tr.insertCell(3)
          const td4 = tr.insertCell(4)
          td0.innerHTML = check.method.toUpperCase()
          td1.innerHTML = check.protocol + "://"
          td2.innerHTML = check.url
          const state = typeof check.state == "string" ? check.state : "unknown"
          td3.innerHTML = state
          td4.innerHTML = `<a href="/checks/edit?id=${check.id}">View / Edit / Delete</a>`
        } catch {
          console.error("Error trying to load check ID: ", id)
        }
      })
      if (checks.length < 5) {
        document.getElementById("createCheckCTA").style.display = "block"
      }
    } else {
      document.getElementById("noChecksMessage").style.display = "table-row"
      document.getElementById("createCheckCTA").style.display = "block"
    }
  } catch {
    app.logout()
  }
}

app.loadChecksEditPage = async function () {
  const id =
    typeof window.location.href.split("=")[1] === "string" &&
    window.location.href.split("=")[1].length > 0
      ? window.location.href.split("=")[1]
      : false

  if (!id) {
    window.location.assign("/checks/all")
    return Promise.reject()
  }

  const url = new URL("/api/checks", "http://localhost:3000")
  url.searchParams.set("id", id)
  try {
    const check = await app.api(`${url.pathname}${url.search}`, {
      method: "GET",
    })
    let hiddenIdInputs = document.querySelectorAll("input.hiddenIdInput")
    for (let i = 0; i < hiddenIdInputs.length; i++) {
      hiddenIdInputs[i].value = check.id
    }

    document.querySelector("#checksEdit1 .displayIdInput").value = check.id
    document.querySelector("#checksEdit1 .displayStateInput").value =
      check.state
    document.querySelector("#checksEdit1 .protocolInput").value = check.protocol
    document.querySelector("#checksEdit1 .urlInput").value = check.url
    document.querySelector("#checksEdit1 .methodInput").value = check.method
    document.querySelector("#checksEdit1 .timeoutInput").value =
      check.timeoutInSeconds
    let successCodeCheckboxes = document.querySelectorAll(
      "#checksEdit1 input.successCodesInput"
    )
    for (let i = 0; i < successCodeCheckboxes.length; i++) {
      if (
        check.successCodes.indexOf(parseInt(successCodeCheckboxes[i].value)) >
        -1
      ) {
        successCodeCheckboxes[i].checked = true
      }
    }
  } catch {
    window.location.assign("/checks/all")
  }
}

app.setSessionToken = function (token) {
  app.config.token = token
  if (token) {
    localStorage.setItem("token", JSON.stringify(token))
    app.addLoggedInClass(true)
    console.log(`set body class to loggedIn`)
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
