function firstNameValidation(firstName) {
  if (typeof firstName !== "string" || firstName.trim().length === 0)
    return false
  return true
}

function lastNameValidation(lastName) {
  if (typeof lastName !== "string" || lastName.trim().length === 0) return false
  return true
}

function phoneValidation(phone) {
  const regex = new RegExp(
    /^(?:(?:\+)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))$/
  )
  if (typeof phone !== "string" || !regex.test(phone.trim())) return false
  return true
}

function passwordValidation(password) {
  if (typeof password !== "string" || password.trim().length < 6) return false
  return true
}

function tosAgreementValidation(tosAgreement) {
  if (typeof tosAgreement !== "boolean" || tosAgreement === false) return false
  return true
}

const UUID_LENGTH = 36
function tokenIdValidation(id) {
  if (typeof id !== "string" || id.trim().length !== UUID_LENGTH) return false
  return true
}

function refreshValidation(refresh) {
  if (typeof refresh !== "boolean" && refresh !== true) return false
  return true
}

function userValidation(user) {
  const { firstName, lastName, phone, password, tosAgreement } = user

  return (
    firstNameValidation(firstName) &&
    lastNameValidation(lastName) &&
    phoneValidation(phone) &&
    passwordValidation(password) &&
    tosAgreementValidation(tosAgreement)
  )
}

function userUpdateValidation(user) {
  const { firstName, lastName, phone, password } = user

  if (!phoneValidation(phone)) return false
  if (
    firstName === undefined &&
    lastName === undefined &&
    password === undefined
  )
    return false
  if (firstName !== undefined && !firstNameValidation(firstName)) return false
  if (lastName !== undefined && !lastNameValidation(lastName)) return false
  if (password !== undefined && !passwordValidation(password)) return false

  return true
}

function checkUpdateValidation(check) {
  const { id, protocol, url, method, successCodes, timeoutInSeconds } = check

  if (!tokenIdValidation(id)) return false
  if (
    protocol === undefined &&
    url === undefined &&
    method === undefined &&
    successCodes === undefined &&
    timeoutInSeconds === undefined
  )
    return false
  if (protocol !== undefined && !protocolValidation(protocol)) return false
  if (url !== undefined && !urlValidation(url)) return false
  if (method !== undefined && !methodValidation(method)) return false
  if (successCodes !== undefined && !successCodesValidation(successCodes))
    return false
  if (
    timeoutInSeconds !== undefined &&
    !timeoutInSecondsValidation(timeoutInSeconds)
  )
    return false

  return true
}

function tokenValidation(params) {
  const { phone, password } = params
  return phoneValidation(phone) && passwordValidation(password)
}

function tokenRefreshValidation(params) {
  const { id, refresh } = params
  return tokenIdValidation(id) && refreshValidation(refresh)
}

function protocolValidation(protocol) {
  if (typeof protocol !== "string" || !["http", "https"].includes(protocol))
    return false
  return true
}

function urlValidation(url) {
  if (typeof url !== "string" || url.trim().length === 0) return false
  return true
}

function methodValidation(method) {
  if (
    typeof method !== "string" ||
    !["post", "get", "put", "delete"].includes(method)
  )
    return false
  return true
}

function successCodesValidation(successCodes) {
  if (
    typeof successCodes !== "object" ||
    !(successCodes instanceof Array) ||
    successCodes.length === 0
  )
    return false
  return true
}

function userChecksValidation(checks) {
  if (typeof checks !== "object" || !(checks instanceof Array)) return false
  return true
}

function timeoutInSecondsValidation(timeoutInSeconds) {
  if (
    typeof timeoutInSeconds !== "number" ||
    timeoutInSeconds % 1 !== 0 ||
    !(timeoutInSeconds >= 1 && timeoutInSeconds <= 5)
  )
    return false
  return true
}

function checkValidation(check) {
  const { protocol, url, method, successCodes, timeoutInSeconds } = check
  return (
    protocolValidation(protocol) &&
    urlValidation(url) &&
    methodValidation(method) &&
    successCodesValidation(successCodes) &&
    timeoutInSecondsValidation(timeoutInSeconds)
  )
}

export default {
  user: userValidation,
  phone: phoneValidation,
  userUpdate: userUpdateValidation,
  token: tokenValidation,
  tokenId: tokenIdValidation,
  tokenRefresh: tokenRefreshValidation,
  check: checkValidation,
  userChecks: userChecksValidation,
  checkUpdate: checkUpdateValidation,
}
