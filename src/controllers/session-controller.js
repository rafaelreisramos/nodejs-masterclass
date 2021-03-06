import helpers from "../utils/helpers.js"

const sessionController = {}

sessionController.main = async (data, res) => {
  res.setHeader("Content-Type", "application/json")
  const methods = ["get"]
  if (!methods.includes(data.method)) {
    res.setHeader("Access-Control-Allow-Methods", "GET")
    return res.writeHead(405).end(JSON.stringify({ Allow: "GET" }))
  }
  try {
    const document = await sessionController[data.pathname]()
    if (!document) {
      throw new Error()
    }
    return res
      .setHeader("Content-Type", "text/html")
      .writeHead(200)
      .end(document)
  } catch (e) {
    const error = {
      error: e?.message ? e.message : "an unknown error has occured",
    }
    return res.writeHead(500).end(JSON.stringify(error))
  }
}

sessionController["session/create"] = async function () {
  const templateData = {
    "head.title": "Login to your account",
    "head.description":
      "Please enter your phone number and password to access your account.",
    "body.class": "sessionCreate",
  }

  return await helpers.getPage(templateData, "session-create.html")
}

sessionController["session/deleted"] = async function () {
  const templateData = {
    "head.title": "LoggedOut",
    "head.description": "You have been logged out of your account.",
    "body.class": "sessionDelete",
  }

  return await helpers.getPage(templateData, "session-deleted.html")
}

export default sessionController.main
