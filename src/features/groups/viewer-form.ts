import { PHONE_INVALID, phoneProblem } from '@/shared/domain/phone'
import { ApiError } from '@/shared/lib/api-error'

import type { NewViewer } from './repository'

/** "Adicionar pessoa"'s fields, as typed. */
export type ViewerForm = { name: string; email: string; phone: string }

/** What is wrong with each field, or with the adding as a whole (`form`). */
export type ViewerErrors = { name?: string; email?: string; phone?: string; form?: string }

const NAME_MAX = 100
const NAME_MISSING = 'Informe o nome.'
const NAME_TOO_LONG = `Use um nome de até ${NAME_MAX} caracteres.`
const EMAIL_MISSING = 'Informe o e-mail.'
const EMAIL_INVALID = 'E-mail inválido.'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Codes about who the email is: shown on the email field, with the API's message. */
const EMAIL_CODES = ['ALREADY_A_GROUP_MEMBER', 'SUPER_ADMIN_NOT_A_GROUP_MEMBER']

/**
 * Checks the fields before sending: the errors, or the person to add, trimmed. All three are
 * required, as by the API, though name and phone count only for an email with no User yet.
 */
export function checkViewerForm(form: ViewerForm): {
  errors: ViewerErrors
  viewer: NewViewer | null
} {
  const name = form.name.trim()
  const email = form.email.trim()
  const phone = form.phone.trim()
  const errors: ViewerErrors = {}
  if (name === '') errors.name = NAME_MISSING
  else if (name.length > NAME_MAX) errors.name = NAME_TOO_LONG
  if (email === '') errors.email = EMAIL_MISSING
  else if (!EMAIL.test(email)) errors.email = EMAIL_INVALID
  const problem = phoneProblem(phone)
  if (problem) errors.phone = problem

  if (Object.keys(errors).length > 0) return { errors, viewer: null }
  return { errors, viewer: { name, email, phone } }
}

/**
 * A refused adding on the field it is about: who the email is (already in the Group, the Super
 * admin), a field the API's `VALIDATION_ERROR` names, or the phone when it names none (its E.164
 * check has no details). Anything else, a Viewer's `FORBIDDEN` included, is the form's.
 */
export function viewerErrorsFromApi(error: unknown): ViewerErrors {
  if (!(error instanceof ApiError)) return { form: 'Não foi possível adicionar. Tente de novo.' }
  if (EMAIL_CODES.includes(error.code)) return { email: error.message }
  if (error.code !== 'VALIDATION_ERROR') return { form: error.message }
  const details = Array.isArray(error.details) ? (error.details as { path?: unknown }[]) : []
  const paths = new Set(details.map((detail) => detail.path))
  if (details.length === 0) return { phone: PHONE_INVALID }
  const errors: ViewerErrors = {}
  if (paths.has('name')) errors.name = NAME_MISSING
  if (paths.has('email')) errors.email = EMAIL_INVALID
  if (paths.has('phone')) errors.phone = PHONE_INVALID
  return Object.keys(errors).length > 0 ? errors : { form: error.message }
}
