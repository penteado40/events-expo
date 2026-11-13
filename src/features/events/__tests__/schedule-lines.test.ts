import type { Period } from '@/shared/domain/local-dates'

import type { EventItem, ItemPlace, Schedule } from '../schemas'
import { assembleSchedule } from '../schedule-lines'

const MANAUS_TZ = 'America/Manaus'
const SAO_PAULO_TZ = 'America/Sao_Paulo'
const saidaManaus: Period = {
  startDate: '2026-11-20',
  endDate: '2026-11-22',
  timezone: MANAUS_TZ,
}

let nextId = 1
function item(
  name: string,
  [date, time]: [string | null, string | null] = [null, null],
  place: ItemPlace | null = null,
): EventItem {
  const when = date === null ? null : { date, time, timezone: place?.timezone ?? MANAUS_TZ }
  return { id: nextId++, name, when, place, state: 'PUBLISHED' }
}

const vitoria: ItemPlace = { name: 'Vitória', address: null, timezone: SAO_PAULO_TZ }
const teatro: ItemPlace = {
  name: 'Teatro Amazonas',
  address: 'Largo de São Sebastião',
  timezone: null,
}

const oQueLevar = item('O que levar')
const saida = item('Saída da sede', ['2026-11-20', '05:30'], vitoria)
const checkIn = item('Check-in', ['2026-11-20', '14:30'])
const show = item('Show', ['2026-11-21', '19:00'], teatro)
const passagem = item('Passagem de som', ['2026-11-21', '16:00'], teatro)
const almoco = item('Almoço', ['2026-11-21', null])
const translado = item('Translado de volta', ['2026-11-22', '00:40'])
const checkOut = item('Check-out', ['2026-11-22', '11:00'])
const tecnica = item('Técnica viaja antes', ['2026-11-19', null])

/** The Manaus scenario as the API sends it: the days and their order already right. */
const manausSchedule: Schedule = {
  generalInfo: [oQueLevar],
  timeline: [
    { date: '2026-11-19', items: [tecnica] },
    { date: '2026-11-20', items: [saida, checkIn] },
    { date: '2026-11-21', items: [almoco, passagem, show] },
    { date: '2026-11-22', items: [translado, checkOut] },
  ],
}

const names = (lines: { name: string }[]) => lines.map((l) => l.name)

describe('assembleSchedule', () => {
  it('keeps the General info apart, in the production order', () => {
    const lines = assembleSchedule(manausSchedule, saidaManaus)

    expect(names(lines.generalInfo)).toEqual(['O que levar'])
    expect(lines.generalInfo[0]).toMatchObject({ time: null, timezoneLabel: null })
  })

  it('heads each day and puts the 00:40 transfer on Sunday, the calendar day', () => {
    const lines = assembleSchedule(manausSchedule, saidaManaus)

    expect(lines.days.map((d) => d.heading)).toEqual(['Qui 19', 'Sex 20', 'Sáb 21', 'Dom 22'])
    expect(names(lines.days[3].items)).toEqual(['Translado de volta', 'Check-out'])
    expect(lines.days[3].items[0].time).toBe('00:40')
  })

  it('shows the eve on the eve, marked outside the period; the days of the period are not', () => {
    const lines = assembleSchedule(manausSchedule, saidaManaus)

    expect(lines.days[0]).toMatchObject({ date: '2026-11-19', outsidePeriod: true })
    expect(names(lines.days[0].items)).toEqual(['Técnica viaja antes'])
    expect(lines.days.slice(1).map((d) => d.outsidePeriod)).toEqual([false, false, false])
  })

  it('puts the untimed ("a definir") before the timed, then by time, whatever order it gets', () => {
    const shuffled: Schedule = {
      generalInfo: [],
      timeline: [{ date: '2026-11-21', items: [show, passagem, almoco] }],
    }

    const [day] = assembleSchedule(shuffled, saidaManaus).days

    expect(names(day.items)).toEqual(['Almoço', 'Passagem de som', 'Show'])
    expect(day.items.map((i) => i.time)).toEqual([null, '16:00', '19:00'])
  })

  it('keeps the order it gets for items at the same time, and among the untimed', () => {
    const lunch = item('Almoço da banda', ['2026-11-21', null])
    const soundA = item('Som A', ['2026-11-21', '16:00'])
    const soundB = item('Som B', ['2026-11-21', '16:00'])
    const tied: Schedule = {
      generalInfo: [],
      timeline: [{ date: '2026-11-21', items: [soundB, almoco, soundA, lunch] }],
    }

    const [day] = assembleSchedule(tied, saidaManaus).days

    expect(names(day.items)).toEqual(['Almoço', 'Almoço da banda', 'Som B', 'Som A'])
  })

  it('orders the days by date and places each item on its own date', () => {
    const misplaced: Schedule = {
      generalInfo: [],
      timeline: [
        { date: '2026-11-22', items: [translado] },
        { date: '2026-11-19', items: [tecnica] },
      ],
    }

    const lines = assembleSchedule(misplaced, saidaManaus)

    expect(lines.days.map((d) => d.date)).toEqual(['2026-11-19', '2026-11-22'])
  })

  it("labels a time in a timezone other than the Event's with the zone's city, never the place", () => {
    const lines = assembleSchedule(manausSchedule, saidaManaus)
    const [departure, hotel] = lines.days[1].items

    expect(departure).toMatchObject({
      time: '05:30',
      timezoneLabel: 'horário de São Paulo',
      detail: 'Vitória · horário de São Paulo',
    })
    expect(hotel.timezoneLabel).toBeNull()
  })

  it('names the zone by its city when the place has no name either', () => {
    const bh = item('Ensaio', ['2026-11-21', '10:00'], {
      name: null,
      address: 'Rua da Bahia, 1000',
      timezone: SAO_PAULO_TZ,
    })

    const [day] = assembleSchedule(
      { generalInfo: [], timeline: [{ date: '2026-11-21', items: [bh] }] },
      saidaManaus,
    ).days

    expect(day.items[0]).toMatchObject({
      timezoneLabel: 'horário de São Paulo',
      detail: 'Rua da Bahia, 1000 · horário de São Paulo',
    })
  })

  it('details an item by its place, and gives no label to an untimed one in another zone', () => {
    const lines = assembleSchedule(manausSchedule, saidaManaus)
    const away = item('Folga', ['2026-11-21', null], vitoria)
    const [day] = assembleSchedule(
      { generalInfo: [], timeline: [{ date: '2026-11-21', items: [away] }] },
      saidaManaus,
    ).days

    expect(lines.days[2].items[1].detail).toBe('Teatro Amazonas')
    expect(lines.days[2].items[0].detail).toBeNull()
    expect(day.items[0]).toMatchObject({ timezoneLabel: null, detail: 'Vitória' })
  })

  it('keeps the item itself on each line, for editing', () => {
    const lines = assembleSchedule(manausSchedule, saidaManaus)

    expect(lines.days[2].items[1].item).toBe(passagem)
  })

  it('is empty when there is no item', () => {
    expect(assembleSchedule({ generalInfo: [], timeline: [] }, saidaManaus)).toEqual({
      generalInfo: [],
      days: [],
      isEmpty: true,
    })
    expect(assembleSchedule(manausSchedule, saidaManaus).isEmpty).toBe(false)
  })
})
