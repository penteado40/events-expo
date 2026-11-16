import type { Period } from '@/shared/domain/local-dates'

import { personalItem, summaryCards } from '../personal-schedule'
import type { EventItem, ItemField, PeopleField, Schedule } from '../schemas'

const LU = 5
const MATIAS = 3
const JACQUE = 4
const BRUNO = 2
const MANAUS_TZ = 'America/Manaus'
const saidaManaus: Period = { startDate: '2026-11-20', endDate: '2026-11-22', timezone: MANAUS_TZ }

function item(
  id: number,
  name: string,
  date: string | null,
  time: string | null,
  fields: ItemField[] = [],
): EventItem {
  return {
    id,
    name,
    when: date === null ? null : { date, time, timezone: MANAUS_TZ },
    place: null,
    state: 'PUBLISHED',
    fields,
    audience: { kind: 'ALL' },
    updatedAt: null,
    updatedBy: null,
  }
}

const person = (userId: number | null, name: string, personalNote: string | null = null) => ({
  userId,
  name,
  personalNote,
  outOfEvent: false,
})

function people(
  id: number,
  name: string,
  members: PeopleField['people'],
  personalNotesVisibility: PeopleField['personalNotesVisibility'] = 'PRIVATE',
  highlight = true,
): PeopleField {
  return { id, type: 'PEOPLE', name, highlight, personalNotesVisibility, people: members }
}

const text = (id: number, name: string, value: string, highlight = false): ItemField => ({
  id,
  type: 'TEXT',
  name,
  value,
  highlight,
})

const quarto101 = people(4, 'Quarto 101', [
  person(LU, 'Lu Andrade', 'Cama extra pedida'),
  person(JACQUE, 'Jacque Moreira', 'Chega depois do show'),
])
const quarto102 = people(
  5,
  'Quarto 102',
  [person(MATIAS, 'Matias Costa', 'Acorda cedo'), person(BRUNO, 'Bruno Reis')],
  'ALL',
)
const carro1 = people(3, 'Carro 1 - EC', [
  person(MATIAS, 'Matias Costa', 'dirigindo'),
  person(LU, 'Lu Andrade'),
  person(null, 'Seu Raimundo'),
])

const checkIn = item(4, 'Check-in · Hotel Taj Mahal', '2026-11-20', '14:30', [
  text(9, 'Obs', 'Café até as 10h'),
  quarto101,
  quarto102,
])
const translado = item(8, 'Translado de volta', '2026-11-22', '00:40', [carro1])

describe('personalItem', () => {
  it('keeps every Field in the production order, the Fields of people only those with the viewer', () => {
    const shown = personalItem(checkIn, LU)

    expect(shown.fields.map((f) => f.name)).toEqual(['Obs', 'Quarto 101'])
    expect(shown.others.map((f) => f.name)).toEqual(['Quarto 102'])
  })

  it('names the viewer\'s own Field of people: "Seu quarto: 101", "Seu carro: Carro 1 - EC"', () => {
    expect(personalItem(checkIn, LU).yours).toEqual(['Seu quarto: 101'])
    expect(personalItem(translado, LU).yours).toEqual(['Seu carro: Carro 1 - EC'])
    expect(personalItem(translado, JACQUE).yours).toEqual([])
  })

  it('puts every Field of people behind "Ver todos" for someone in none of them', () => {
    const shown = personalItem(checkIn, BRUNO + 100)

    expect(shown.fields.map((f) => f.name)).toEqual(['Obs'])
    expect(shown.others.map((f) => f.name)).toEqual(['Quarto 101', 'Quarto 102'])
  })

  it('shows a private Personal note only to its person, saying who else sees it', () => {
    const [, room] = personalItem(checkIn, LU).fields
    const shownPeople = room.kind === 'PEOPLE' ? room.people : []

    expect(shownPeople).toEqual([
      expect.objectContaining({
        name: 'Você',
        isYou: true,
        note: 'Cama extra pedida',
        noteLabel: 'Sua nota · só você e a produção',
      }),
      expect.objectContaining({ name: 'Jacque Moreira', isYou: false, note: null }),
    ])
  })

  it('shows every note of a Field whose notes are for everyone in the item', () => {
    const [room] = personalItem(checkIn, LU).others

    expect(room.people.map((p) => [p.name, p.note])).toEqual([
      ['Matias Costa', 'Acorda cedo'],
      ['Bruno Reis', null],
    ])
  })

  it('marks a loose name as having no login, and who left the Event as out of it', () => {
    const leaving = item(8, 'Translado de volta', '2026-11-22', '00:40', [
      people(3, 'Carro 1 - EC', [
        person(LU, 'Lu Andrade'),
        person(null, 'Seu Raimundo'),
        { ...person(JACQUE, 'Jacque Moreira'), outOfEvent: true },
      ]),
    ])
    const [car] = personalItem(leaving, LU).fields
    const shownPeople = car.kind === 'PEOPLE' ? car.people : []

    expect(shownPeople.map((p) => [p.name, p.loose, p.outOfEvent])).toEqual([
      ['Você', false, false],
      ['Seu Raimundo', true, false],
      ['Jacque Moreira', false, true],
    ])
  })
})

describe('summaryCards', () => {
  const contatos = item(12, 'Contatos', null, null, [
    text(7, 'Produção', 'Bruno Reis · +55 27 99999-0002', true),
    text(10, 'Outros', 'só na Timeline'),
  ])
  const oQueLevar = item(1, 'O que levar', null, null, [text(11, 'Lista', 'figurino')])
  const passagem = item(6, 'Passagem de som', '2026-11-21', '16:00', [
    text(1, 'Obs', 'Despachar o som às 14h'),
    text(2, 'Contato', 'Técnico do teatro', true),
  ])
  const schedule: Schedule = {
    generalInfo: [oQueLevar, contatos],
    timeline: [
      { date: '2026-11-20', items: [checkIn] },
      { date: '2026-11-21', items: [passagem] },
      { date: '2026-11-22', items: [translado] },
    ],
  }
  const cards = (viewerId: number) =>
    summaryCards(schedule, saidaManaus, viewerId).map((card) => [card.line.name, card.highlights])

  it('makes a card per item with a Field in Highlight, the General info first, only with those Fields', () => {
    expect(cards(LU)).toEqual([
      ['Contatos', ['Produção: Bruno Reis · +55 27 99999-0002']],
      ['Check-in · Hotel Taj Mahal', ['Seu quarto: 101']],
      ['Passagem de som', ['Contato: Técnico do teatro']],
      ['Translado de volta', ['Seu carro: Carro 1 - EC']],
    ])
  })

  it('leaves out the Fields of people the viewer is not in, and a card left with nothing', () => {
    expect(cards(JACQUE)).toEqual([
      ['Contatos', ['Produção: Bruno Reis · +55 27 99999-0002']],
      ['Check-in · Hotel Taj Mahal', ['Seu quarto: 101']],
      ['Passagem de som', ['Contato: Técnico do teatro']],
    ])
  })

  it('keeps the day and the local time of each card, none for the General info', () => {
    const [info, room] = summaryCards(schedule, saidaManaus, LU)

    expect([info.date, info.line.time]).toEqual([null, null])
    expect([room.date, room.line.time]).toEqual(['2026-11-20', '14:30'])
  })
})
