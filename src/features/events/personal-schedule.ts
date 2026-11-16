import type { LocalDate, Period } from '@/shared/domain/local-dates'

import { assembleSchedule, type ItemLine } from './schedule-lines'
import type { EventItem, FieldPerson, PeopleField, Schedule } from './schemas'

/** One person of a Field of people as the viewer sees them. */
export type ShownPerson = {
  userId: number | null
  /** "Você" for the viewer. */
  name: string
  isYou: boolean
  /** A loose name: someone with no login ("SEM LOGIN"), with no phone to call. */
  loose: boolean
  /** A User who no longer goes ("fora do Event"). */
  outOfEvent: boolean
  /** Their Personal note, where the viewer may see it. */
  note: string | null
  /** Over the viewer's own note: who else sees it. */
  noteLabel: string | null
}

export type ShownPeopleField = {
  kind: 'PEOPLE'
  id: number
  name: string
  /** Whether the viewer is in it. */
  isYours: boolean
  people: ShownPerson[]
}

export type ShownField =
  { kind: 'TEXT'; id: number; name: string; value: string } | ShownPeopleField

/** An Event item as a person sees it (stories 27, 38–40, 43). */
export type PersonalItem = {
  /** Every Field in the production's order; of the Fields of people, only those with the viewer. */
  fields: ShownField[]
  /** The Fields of people without the viewer, behind "Ver todos" (the other cars). */
  others: ShownPeopleField[]
  /** The viewer's own Fields of people, named: "Seu quarto: 101". */
  yours: string[]
}

/**
 * An item for the person who sees it (PRD, schedule assembly): the Fields of people filtered to
 * the viewer's own, the rest kept for "Ver todos"; each Personal note shown where it may be, the
 * viewer's own always (the API already leaves out the ones they may not see) and the others' only
 * where the Field shows them to everyone in the item.
 */
export function personalItem(item: Pick<EventItem, 'fields'>, viewerId: number): PersonalItem {
  const fields: ShownField[] = []
  const others: ShownPeopleField[] = []
  const yours: string[] = []
  for (const field of item.fields) {
    if (field.type === 'TEXT') {
      fields.push({ kind: 'TEXT', id: field.id, name: field.name, value: field.value })
      continue
    }
    const shown = shownPeopleField(field, viewerId)
    if (shown.isYours) {
      fields.push(shown)
      yours.push(yourFieldLabel(field.name))
    } else {
      others.push(shown)
    }
  }
  return { fields, others, yours }
}

function shownPeopleField(field: PeopleField, viewerId: number): ShownPeopleField {
  const forAll = field.personalNotesVisibility === 'ALL'
  const people = field.people.map((person: FieldPerson): ShownPerson => {
    const isYou = person.userId === viewerId
    return {
      userId: person.userId,
      name: isYou ? 'Você' : person.name,
      isYou,
      loose: person.userId === null,
      outOfEvent: person.outOfEvent,
      note: isYou || forAll ? person.personalNote : null,
      noteLabel:
        isYou && person.personalNote
          ? forAll
            ? 'Sua nota · todos no item veem'
            : 'Sua nota · só você e a produção'
          : null,
    }
  })
  return {
    kind: 'PEOPLE',
    id: field.id,
    name: field.name,
    isYours: people.some((p) => p.isYou),
    people,
  }
}

/**
 * The viewer's Field of people named after its kind, the first word of its name: "Carro 1 - EC" is
 * "Seu carro: Carro 1 - EC"; a kind and a bare number, "Quarto 101", only "Seu quarto: 101". A
 * name of one word has no kind: "Você está em Motoristas".
 */
export function yourFieldLabel(name: string): string {
  const [kind, ...rest] = name.trim().split(/\s+/)
  if (rest.length === 0) return `Você está em ${name.trim()}`
  const remainder = rest.join(' ')
  return `Seu ${kind.toLowerCase()}: ${/^\d+$/.test(remainder) ? remainder : name.trim()}`
}

/** A card of the Summary: the item, its day (none in the General info) and its Highlights. */
export type SummaryCard = {
  line: ItemLine
  date: LocalDate | null
  /** "Contato: Técnico do teatro", "Seu quarto: 101". */
  highlights: string[]
}

/**
 * The Summary for a person (story 26, events-api Summary): the General info first, then the
 * Timeline in its order, one card per item with a Field in Highlight, showing only those: a text
 * Field as "Name: value", a Field of people only the viewer's own ("Seu carro: Carro 1 - EC"). An
 * item left with nothing to show makes no card.
 */
export function summaryCards(schedule: Schedule, period: Period, viewerId: number): SummaryCard[] {
  const lines = assembleSchedule(schedule, period)
  const dated = [
    ...lines.generalInfo.map((line) => ({ line, date: null })),
    ...lines.days.flatMap((day) => day.items.map((line) => ({ line, date: day.date }))),
  ]
  return dated.flatMap(({ line, date }) => {
    const highlights = line.item.fields.flatMap((field) => {
      if (!field.highlight) return []
      if (field.type === 'TEXT') return [`${field.name}: ${field.value}`]
      return field.people.some((p) => p.userId === viewerId) ? [yourFieldLabel(field.name)] : []
    })
    return highlights.length === 0 ? [] : [{ line, date, highlights }]
  })
}
