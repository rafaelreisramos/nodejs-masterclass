const app = {}

app.config = {
  sessionToken: false,
}

app.api = async function (endpoint, { body, ...customOptions } = {}) {
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

  const url = new URL(`http://localhost:3000${endpoint}`)
  console.log(url)
  return window.fetch(url, options).then(async (response) => {
    console.log(`${response.status}, ${response.statusText}`)
    if (!response.ok) {
      const errorMessage = await response.text()
      return Promise.reject(new Error(errorMessage))
    }
    return await response.json()
  })
}

app.bindForms = function () {
  document.querySelector("form").addEventListener("submit", async function (e) {
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
      console.log(data)
      // app.formResponseProcessor(formId, payload, responsePayload)
    } catch (error) {
      console.log(`${e.name}: ${e.message}`)
      document.querySelector(`#${formId} .formError`).innerHTML = error.message
      document.querySelector(`#${formId} .formError`).style.display = "block"
    }
  })
}

app.init = function () {
  app.bindForms()
}

window.onload = function () {
  app.init()
}
