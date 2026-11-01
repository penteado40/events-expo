import { formatPhone, phoneProblem } from '@/shared/domain/phone'
import { ApiError } from '@/shared/lib/api-error'
import type { User } from '@/shared/session'

import type { ProfileChanges } from './repository'

/** The editing's two fields, as typed. */
export type ProfileForm = { name: string; phone: string }

/** What is wrong with each field, or with the save as a whole (`form`). */
export type ProfileErrors = { name?: string; phone?: string; form?: string }

const NAME_MAX = 100
const NAME_TOO_LONG = `Use um nome de até ${NAME_MAX} caracteres.`
const PHONE_INVALID = 'Telefone inválido. Use o formato +55 27 99999-9999.'

/** The fields as they open: the User's name and phone, the phone as people read it. */
export const profileForm = (user: User): ProfileForm => ({
  name: user.name,
  phone: formatPhone(user.phone),
})

/**
 * Checks the fields before sending: errors on the fields, or only what changed (`null` when
 * nothing did). A phone left as it opened is not checked again: it is the one the API holds.
 */
export function profileChanges(
  form: ProfileForm,
  user: User,
): { errors: ProfileErrors; changes: ProfileChanges | null } {
  const name = form.name.trim()
  const errors: ProfileErrors = {}
  if (name === '') errors.name = 'Informe seu nome.'
  else if (name.length > NAME_MAX) errors.name = NAME_TOO_LONG

  const phoneChanged = form.phone.trim() !== profileForm(user).phone
  const problem = phoneChanged ? phoneProblem(form.phone) : null
  if (problem) errors.phone = problem

  if (errors.name || errors.phone) return { errors, changes: null }
  const changes: ProfileChanges = {
    ...(name !== user.name && { name }),
    ...(phoneChanged && { phone: form.phone.trim() }),
  }
  return { errors, changes: Object.keys(changes).length > 0 ? changes : null }
}

/**
 * A refused save on the field it is about: the API's `VALIDATION_ERROR` names the name in its
 * details, and says nothing for a phone its E.164 check refused. Anything else is the save's.
 */
export function errorsFromApi(error: unknown, sent: ProfileChanges): ProfileErrors {
  if (!(error instanceof ApiError)) return { form: 'Não foi possível salvar. Tente de novo.' }
  if (error.code !== 'VALIDATION_ERROR') return { form: error.message }
  const details = Array.isArray(error.details) ? (error.details as { path?: unknown }[]) : []
  if (details.some((detail) => detail.path === 'name')) return { name: NAME_TOO_LONG }
  if (sent.phone !== undefined) return { phone: PHONE_INVALID }
  return { form: error.message }
}
