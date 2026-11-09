/** The separators people type in a phone number, dropped before validating (as the events-api). */
const SEPARATORS = /[\s().-]/g
/** E.164: `+`, the country code (never starting at 0) and 8 to 15 digits in all. */
const E164 = /^\+[1-9]\d{7,14}$/
/** A Brazilian number in E.164: `+55`, the area code and 8 (landline) or 9 (mobile) digits. */
const BRAZIL = /^\+55(\d{2})(\d{4,5})(\d{4})$/

const EXAMPLE = '+55 27 99999-9999'

/** A phone that is not one, as the field says it. */
export const PHONE_INVALID = `Telefone inválido. Use o formato ${EXAMPLE}.`

/**
 * A phone typed with any usual separators, in E.164 (`+5527999990005`) as the events-api stores
 * it; null when it is not a phone with the country code. Contact only (WhatsApp), never sign-in.
 */
export function normalizePhone(raw: string): string | null {
  const value = raw.replace(SEPARATORS, '')
  return E164.test(value) ? value : null
}

/**
 * What is wrong with a typed phone, to show on its field; null when it is valid. Stricter than the
 * API for Brazil, where E.164 alone takes a number cut short (`+55 27 9973`) as valid.
 */
export function phoneProblem(raw: string): string | null {
  const value = raw.replace(SEPARATORS, '')
  if (value === '') return `Informe o telefone com DDI, como ${EXAMPLE}.`
  if (!value.startsWith('+')) return `Comece pelo DDI, como ${EXAMPLE}.`
  const digits = /^\+[1-9]\d*$/.test(value) ? value.length - 1 : null
  // A Brazilian number: `55`, the area code and 8 or 9 digits.
  const [min, max] = value.startsWith('+55') ? [12, 13] : [8, 15]
  if (digits !== null && digits >= min && digits <= max) return null
  if (digits !== null && digits < min) return `Telefone incompleto. Use o formato ${EXAMPLE}.`
  return PHONE_INVALID
}

/** A stored phone as people read it: Brazilian ones grouped (`+55 27 99999-0005`), others as stored. */
export function formatPhone(e164: string): string {
  const brazil = e164.match(BRAZIL)
  if (!brazil) return e164
  const [, area, first, last] = brazil
  return `+55 ${area} ${first}-${last}`
}

/** The WhatsApp conversation with a stored phone; null when the person has none. */
export function whatsappUrl(e164: string): string | null {
  const digits = e164.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}
