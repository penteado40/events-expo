import { dateFromTyping, typedDate } from '@/shared/domain/local-dates'
import { ApiError } from '@/shared/lib/api-error'

import type { EventChanges, EventInput } from './repository'
import type { Event } from './schemas'

/** The fields of "Novo Event" and of its editing, as typed: dates as `DD/MM/AAAA`. */
export type EventForm = {
  name: string
  place: string
  /** IANA, picked from a list. */
  timezone: string
  startDate: string
  endDate: string
}

/** What is wrong with each field, or with the save as a whole (`form`). */
export type EventFormErrors = Partial<Record<keyof EventForm | 'form', string>>

const NAME_MAX = 100
const PLACE_MAX = 200
const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

const MESSAGES = {
  nameMissing: 'Informe o nome do Event.',
  nameLong: `Use um nome de até ${NAME_MAX} caracteres.`,
  placeMissing: 'Informe a cidade ou o local.',
  placeLong: `Use até ${PLACE_MAX} caracteres.`,
  startMissing: 'Informe a data de início.',
  endMissing: 'Informe a data final.',
  notADate: 'Use uma data como 20/11/2026.',
  endBeforeStart: 'A data final não pode ser antes da inicial.',
  saveFailed: 'Não foi possível salvar. Tente de novo.',
}

/** The fields as they open: empty for a new Event, or the Event as it is. */
export function initialEventForm(event?: Event): EventForm {
  if (!event) {
    return { name: '', place: '', timezone: DEFAULT_TIMEZONE, startDate: '', endDate: '' }
  }
  const { name, place, period } = event
  return {
    name,
    place,
    timezone: period.timezone,
    startDate: typedDate(period.startDate),
    endDate: typedDate(period.endDate),
  }
}

/**
 * Checks the fields before sending (the API checks them again, PROJ-182). Creating, answers the
 * whole Event; editing (`event` given), only what changed, the period whole if any part did, or
 * `null` when nothing did.
 */
export function eventFormInput(form: EventForm): {
  errors: EventFormErrors
  input: EventInput | null
}
export function eventFormInput(
  form: EventForm,
  event: Event,
): { errors: EventFormErrors; input: EventChanges | null }
export function eventFormInput(
  form: EventForm,
  event?: Event,
): { errors: EventFormErrors; input: EventInput | EventChanges | null } {
  const errors: EventFormErrors = {}
  const name = form.name.trim()
  const place = form.place.trim()
  if (!name) errors.name = MESSAGES.nameMissing
  else if (name.length > NAME_MAX) errors.name = MESSAGES.nameLong
  if (!place) errors.place = MESSAGES.placeMissing
  else if (place.length > PLACE_MAX) errors.place = MESSAGES.placeLong

  const startDate = dateFromTyping(form.startDate)
  if (!form.startDate.trim()) errors.startDate = MESSAGES.startMissing
  else if (!startDate) errors.startDate = MESSAGES.notADate
  const endDate = dateFromTyping(form.endDate)
  if (!form.endDate.trim()) errors.endDate = MESSAGES.endMissing
  else if (!endDate) errors.endDate = MESSAGES.notADate
  else if (startDate && endDate && endDate < startDate) errors.endDate = MESSAGES.endBeforeStart

  if (Object.keys(errors).length > 0) return { errors, input: null }
  const period = { startDate: startDate!, endDate: endDate!, timezone: form.timezone }
  if (!event) return { errors, input: { name, place, period } }

  const before = event.period
  const periodChanged =
    period.startDate !== before.startDate ||
    period.endDate !== before.endDate ||
    period.timezone !== before.timezone
  const changes: EventChanges = {
    ...(name !== event.name && { name }),
    ...(place !== event.place && { place }),
    ...(periodChanged && { period }),
  }
  return { errors, input: Object.keys(changes).length > 0 ? changes : null }
}

const FIELD_BY_PATH: Record<string, [keyof EventForm, string]> = {
  name: ['name', 'Confira o nome do Event.'],
  place: ['place', 'Confira a cidade ou o local.'],
  'period.startDate': ['startDate', 'Confira a data de início.'],
  // The form already refuses what is not a date: what the API still refuses is the order.
  'period.endDate': ['endDate', 'Confira a data final: ela não pode vir antes da inicial.'],
  'period.timezone': ['timezone', 'Escolha o fuso de novo.'],
}

/**
 * A refused save on the fields it is about: the API's `VALIDATION_ERROR` names them in its
 * details (`period.endDate` for an end before the start). Anything else is the save's.
 */
export function errorsFromApi(error: unknown): EventFormErrors {
  if (!(error instanceof ApiError)) return { form: MESSAGES.saveFailed }
  if (error.code !== 'VALIDATION_ERROR') return { form: error.message }
  const details = Array.isArray(error.details) ? (error.details as { path?: unknown }[]) : []
  const errors: EventFormErrors = {}
  for (const { path } of details) {
    const field = typeof path === 'string' ? FIELD_BY_PATH[path] : undefined
    if (field) errors[field[0]] = field[1]
  }
  return Object.keys(errors).length > 0 ? errors : { form: error.message }
}
