import { URLSearchParams } from "node:url"

function validatePhoneNumber(phoneNumber) {
  const regex = new RegExp(
    /^(?:(?:\+)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))$/
  )
  return regex.test(phoneNumber)
}

const MAXIMUM_SMS_MESSAGE_LENGTH = 1600
function validateSmsMessage(message) {
  if (typeof message !== "string") return false
  const length = encodeURI(message.trim()).length
  if (!(length > 0 && length <= MAXIMUM_SMS_MESSAGE_LENGTH)) return false
  return true
}

async function sendTwilioSms(phoneNumber, message) {
  if (!validatePhoneNumber(phoneNumber))
    return `Phone number ${phoneNumber} is not valid`
  if (!validateSmsMessage(message)) return `Message is not valid`

  const smsPayload = {
    From: process.env.TWILIO_FROM_NUMBER,
    To: phoneNumber,
    Body: message,
  }

  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const options = {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString(
        "base64"
      )}`,
    },
    body: new URLSearchParams(smsPayload),
  }

  const smsPost = async () => {
    const response = await fetch(
      `https://api.twilio.com${process.env.TWILIO_API_PATH}`,
      options
    )
    const data = await response.json()
    if (!response.ok) {
      throw new Error(`${response.status}, ${data.message}`)
    }
    return data
  }

  try {
    const result = await smsPost()
    return [null, result]
  } catch (error) {
    return [error.message]
  }
}

export default sendTwilioSms
