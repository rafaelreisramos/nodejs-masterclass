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
  if (typeof phone !== "string" || phone.trim().length !== 10) return false
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

export default {
  user: userValidation,
  phone: phoneValidation,
  userUpdate: userUpdateValidation,
}
