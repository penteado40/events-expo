import { dateFromTyping, timeFromTyping, typedDate } from '@/shared/domain/local-dates'
import { ApiError } from '@/shared/lib/api-error'

import type { EventItemChanges, EventItemInput, ItemPlaceInput } from './repository'
import type { EventItem } from './schemas'

/**
 * The item draft (PRD, pure modules): the editor's state of an Event item, for now its name, date,
 * time and place (Fields and Audience come with PROJ-223 and after). The date is typed
 * `DD/MM/AAAA` and the time `HH:mm`, both local to the place, never converted.
 */
export type ItemDraft = {
  name: string
  date: string
  time: string
  placeName: string
  placeAddress: string
  /** The place's own IANA zone; `null` means the Event's. */
  placeTimezone: string | null
}

/** What is wrong with each field, or with the save as a whole (`form`). */
export type ItemDraftErrors = Partial<Record<keyof ItemDraft | 'form', string>>

const NAME_MAX = 200
const PLACE_NAME_MAX = 200
const PLACE_ADDRESS_MAX = 500

const MESSAGES = {
  nameMissing: 'Informe o nome do item.',
  nameLong: `Use um nome de até ${NAME_MAX} caracteres.`,
  notADate: 'Use uma data como 21/11/2026.',
  notATime: 'Use uma hora como 16:00.',
  timeWithoutDate: 'Para pôr a hora, informe o dia.',
  placeNameLong: `Use até ${PLACE_NAME_MAX} caracteres.`,
  placeAddressLong: `Use até ${PLACE_ADDRESS_MAX} caracteres.`,
  saveFailed: 'Não foi possível salvar. Tente de novo.',
}

/** The draft as it opens: empty for a new item, or the item as it is. */
export function initialItemDraft(item?: EventItem): ItemDraft {
  return {
    name: item?.name ?? '',
    date: item?.when ? typedDate(item.when.date) : '',
    time: item?.when?.time ?? '',
    placeName: item?.place?.name ?? '',
    placeAddress: item?.place?.address ?? '',
    placeTimezone: item?.place?.timezone ?? null,
  }
}

/** Whose clock the time is on: the place's own zone, or else the Event's ("Hora · Manaus"). */
export function draftTimezone(draft: ItemDraft, eventTimezone: string): string {
  return draft.placeTimezone ?? eventTimezone
}

/**
 * Checks the draft before sending (the API checks it again, PROJ-187): a time only with a date.
 * Creating, answers the whole payload; editing (`item` given), only what changed, the place whole
 * if any part did, or `null` when nothing did.
 */
export function itemDraftInput(draft: ItemDraft): {
  errors: ItemDraftErrors
  input: EventItemInput | null
}
export function itemDraftInput(
  draft: ItemDraft,
  item: EventItem,
): { errors: ItemDraftErrors; input: EventItemChanges | null }
export function itemDraftInput(
  draft: ItemDraft,
  item?: EventItem,
): { errors: ItemDraftErrors; input: EventItemInput | EventItemChanges | null } {
  const errors: ItemDraftErrors = {}
  const name = draft.name.trim()
  if (!name) errors.name = MESSAGES.nameMissing
  else if (name.length > NAME_MAX) errors.name = MESSAGES.nameLong

  const date = dateFromTyping(draft.date)
  if (draft.date.trim() && !date) errors.date = MESSAGES.notADate
  const time = timeFromTyping(draft.time)
  if (draft.time.trim() && !time) errors.time = MESSAGES.notATime
  else if (time && !draft.date.trim()) errors.time = MESSAGES.timeWithoutDate

  const placeName = draft.placeName.trim() || null
  const placeAddress = draft.placeAddress.trim() || null
  if (placeName && placeName.length > PLACE_NAME_MAX) errors.placeName = MESSAGES.placeNameLong
  if (placeAddress && placeAddress.length > PLACE_ADDRESS_MAX) {
    errors.placeAddress = MESSAGES.placeAddressLong
  }

  if (Object.keys(errors).length > 0) return { errors, input: null }
  const place: ItemPlaceInput | null =
    placeName || placeAddress || draft.placeTimezone
      ? { name: placeName, address: placeAddress, timezone: draft.placeTimezone }
      : null
  if (!item) return { errors, input: { name, date, time, place } }

  const before = item.place
  const placeChanged =
    (place?.name ?? null) !== (before?.name ?? null) ||
    (place?.address ?? null) !== (before?.address ?? null) ||
    (place?.timezone ?? null) !== (before?.timezone ?? null)
  const changes: EventItemChanges = {
    ...(name !== item.name && { name }),
    ...(date !== (item.when?.date ?? null) && { date }),
    ...(time !== (item.when?.time ?? null) && { time }),
    ...(placeChanged && { place }),
  }
  return { errors, input: Object.keys(changes).length > 0 ? changes : null }
}

const FIELD_BY_PATH: Record<string, [keyof ItemDraft, string]> = {
  name: ['name', 'Confira o nome do item.'],
  date: ['date', 'Confira o dia.'],
  time: ['time', 'Confira a hora.'],
  place: ['placeName', 'Informe o nome, o endereço ou o fuso do lugar.'],
  'place.name': ['placeName', 'Confira o nome do lugar.'],
  'place.address': ['placeAddress', 'Confira o endereço.'],
  'place.timezone': ['placeTimezone', 'Escolha o fuso de novo.'],
}

/**
 * A refused save on the fields it is about: `EVENT_ITEM_TIME_WITHOUT_DATE` on the time, and
 * `VALIDATION_ERROR` on the fields its details name. Anything else is the save's.
 */
export function errorsFromApi(error: unknown): ItemDraftErrors {
  if (!(error instanceof ApiError)) return { form: MESSAGES.saveFailed }
  if (error.code === 'EVENT_ITEM_TIME_WITHOUT_DATE') return { time: MESSAGES.timeWithoutDate }
  if (error.code !== 'VALIDATION_ERROR') return { form: error.message }
  const details = Array.isArray(error.details) ? (error.details as { path?: unknown }[]) : []
  const errors: ItemDraftErrors = {}
  for (const { path } of details) {
    const field = typeof path === 'string' ? FIELD_BY_PATH[path] : undefined
    if (field) errors[field[0]] = field[1]
  }
  return Object.keys(errors).length > 0 ? errors : { form: error.message }
}
