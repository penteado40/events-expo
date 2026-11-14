import { dateFromTyping, timeFromTyping, typedDate } from '@/shared/domain/local-dates'
import { ApiError } from '@/shared/lib/api-error'

import type {
  EventItemChanges,
  EventItemInput,
  ItemFieldChanges,
  ItemFieldInput,
  ItemPlaceInput,
} from './repository'
import type { EventItem } from './schemas'

/**
 * A text Field as the editor holds it: `key` names it on screen (`field-<id>` for one the item
 * has, `new-<n>` for one added here), `id` is the API's, `null` until it is saved.
 */
export type FieldDraft = {
  key: string
  id: number | null
  name: string
  value: string
  highlight: boolean
}

/**
 * The item draft (PRD, pure modules): the editor's state of an Event item, its name, date, time,
 * place and text Fields in the editor's order (Audience comes after). The date is typed
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
  fields: FieldDraft[]
}

/**
 * What is wrong with each input, with each Field (`field:<key>`), or with the save as a whole
 * (`form`).
 */
export type ItemDraftErrors = Partial<
  Record<Exclude<keyof ItemDraft, 'fields'> | 'form' | `field:${string}`, string>
>

/** Where the editor shows what is wrong with one Field. */
export const fieldErrorKey = (key: string) => `field:${key}` as const

/** Typing in a Field: its name or its value. */
export type FieldTextChanges = Partial<Pick<FieldDraft, 'name' | 'value'>>

const NAME_MAX = 200
const PLACE_NAME_MAX = 200
const PLACE_ADDRESS_MAX = 500
const FIELD_NAME_MAX = 100
const FIELD_VALUE_MAX = 2000

const MESSAGES = {
  nameMissing: 'Informe o nome do item.',
  nameLong: `Use um nome de até ${NAME_MAX} caracteres.`,
  notADate: 'Use uma data como 21/11/2026.',
  notATime: 'Use uma hora como 16:00.',
  timeWithoutDate: 'Para pôr a hora, informe o dia.',
  placeNameLong: `Use até ${PLACE_NAME_MAX} caracteres.`,
  placeAddressLong: `Use até ${PLACE_ADDRESS_MAX} caracteres.`,
  fieldNameMissing: 'Dê um nome ao Field.',
  fieldNameLong: `Use um nome de até ${FIELD_NAME_MAX} caracteres.`,
  fieldValueLong: `Use um valor de até ${FIELD_VALUE_MAX} caracteres.`,
  fieldRefused: 'Confira o nome e o valor do Field.',
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
    fields: (item?.fields ?? []).map(({ id, name, value, highlight }) => ({
      key: fieldKey(id),
      id,
      name,
      value,
      highlight,
    })),
  }
}

/** The key of a Field the item has. */
export const fieldKey = (id: number) => `field-${id}`

/** "+ Field de texto": an empty text Field at the end, out of the Resumo. */
export function addTextField(draft: ItemDraft): ItemDraft {
  const added = draft.fields.map((f) => Number(f.key.match(/^new-(\d+)$/)?.[1] ?? 0))
  const key = `new-${Math.max(0, ...added) + 1}`
  return {
    ...draft,
    fields: [...draft.fields, { key, id: null, name: '', value: '', highlight: false }],
  }
}

/** Typing in a Field's name or value. */
export function editField(draft: ItemDraft, key: string, changes: FieldTextChanges): ItemDraft {
  return { ...draft, fields: draft.fields.map((f) => (f.key === key ? { ...f, ...changes } : f)) }
}

/** "no Resumo": the Highlight on or off. */
export function toggleHighlight(draft: ItemDraft, key: string): ItemDraft {
  return {
    ...draft,
    fields: draft.fields.map((f) => (f.key === key ? { ...f, highlight: !f.highlight } : f)),
  }
}

/** One place up (`-1`) or down (`1`); at either end it stays. */
export function moveField(draft: ItemDraft, key: string, by: -1 | 1): ItemDraft {
  const from = draft.fields.findIndex((f) => f.key === key)
  const to = from + by
  if (from < 0 || to < 0 || to >= draft.fields.length) return draft
  const fields = [...draft.fields]
  ;[fields[from], fields[to]] = [fields[to], fields[from]]
  return { ...draft, fields }
}

export function removeField(draft: ItemDraft, key: string): ItemDraft {
  return { ...draft, fields: draft.fields.filter((f) => f.key !== key) }
}

/** The Field writes of a save, one route each (PROJ-198), made after the item's own. */
export type FieldWrites = {
  remove: number[]
  update: { id: number; changes: ItemFieldChanges }[]
  add: { key: string; input: ItemFieldInput }[]
  /** Saved Fields by id, a new one by its key (it gets its id only when added). */
  order: (number | string)[] | null
}

/**
 * What a save writes of the Fields: delete those gone, edit what changed of the others, add the
 * new ones at the end in the editor's order, and then, only when that would not already leave
 * them in the editor's order, order them all. Assumes a draft `itemDraftInput` accepted.
 */
export function fieldWrites(draft: ItemDraft, item?: EventItem): FieldWrites {
  const before = item?.fields ?? []
  const kept = new Set(draft.fields.flatMap((f) => (f.id === null ? [] : [f.id])))
  const update: FieldWrites['update'] = []
  const add: FieldWrites['add'] = []
  for (const field of draft.fields) {
    const name = field.name.trim()
    const value = field.value.trim()
    const was = field.id === null ? undefined : before.find((f) => f.id === field.id)
    if (!was) {
      add.push({ key: field.key, input: { type: 'TEXT', name, value, highlight: field.highlight } })
      continue
    }
    const changes: ItemFieldChanges = {
      ...(name !== was.name && { name }),
      ...(value !== was.value && { value }),
      ...(field.highlight !== was.highlight && { highlight: field.highlight }),
    }
    if (Object.keys(changes).length > 0) update.push({ id: was.id, changes })
  }
  const remove = before.filter((f) => !kept.has(f.id)).map((f) => f.id)
  const saved = [
    ...before.filter((f) => kept.has(f.id)).map((f) => fieldKey(f.id)),
    ...add.map((a) => a.key),
  ]
  const wanted = draft.fields.map((f) => f.key)
  const inOrder = saved.every((key, i) => key === wanted[i])
  const order = inOrder ? null : draft.fields.map((f) => f.id ?? f.key)
  return { remove, update, add, order }
}

export function hasFieldWrites({ remove, update, add, order }: FieldWrites): boolean {
  return remove.length + update.length + add.length > 0 || order !== null
}

/** A write of one Field (added or edited) that failed, with the key of the Field it was. */
export class FieldWriteError extends Error {
  constructor(
    readonly key: string,
    readonly cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause))
    this.name = 'FieldWriteError'
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
  for (const field of draft.fields) {
    const fieldName = field.name.trim()
    const message = !fieldName
      ? MESSAGES.fieldNameMissing
      : fieldName.length > FIELD_NAME_MAX
        ? MESSAGES.fieldNameLong
        : field.value.trim().length > FIELD_VALUE_MAX
          ? MESSAGES.fieldValueLong
          : null
    if (message) errors[fieldErrorKey(field.key)] = message
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

const FIELD_BY_PATH: Record<string, [Exclude<keyof ItemDraft, 'fields'>, string]> = {
  name: ['name', 'Confira o nome do item.'],
  date: ['date', 'Confira o dia.'],
  time: ['time', 'Confira a hora.'],
  place: ['placeName', 'Informe o nome, o endereço ou o fuso do lugar.'],
  'place.name': ['placeName', 'Confira o nome do lugar.'],
  'place.address': ['placeAddress', 'Confira o endereço.'],
  'place.timezone': ['placeTimezone', 'Escolha o fuso de novo.'],
}

/**
 * A refused save on the inputs it is about: `EVENT_ITEM_TIME_WITHOUT_DATE` on the time,
 * `VALIDATION_ERROR` on the inputs its details name, or on the Field whose write it refused.
 * Anything else is the save's.
 */
export function errorsFromApi(error: unknown): ItemDraftErrors {
  if (error instanceof FieldWriteError) {
    const { cause, key } = error
    return cause instanceof ApiError && cause.code === 'VALIDATION_ERROR'
      ? { [fieldErrorKey(key)]: MESSAGES.fieldRefused }
      : errorsFromApi(cause)
  }
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
