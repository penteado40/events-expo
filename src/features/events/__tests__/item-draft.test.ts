import { ApiError, validationError } from '@/shared/lib/api-error'

import {
  draftTimezone,
  errorsFromApi,
  initialItemDraft,
  itemDraftInput,
  type ItemDraft,
} from '../item-draft'
import type { EventItem } from '../schemas'

const MANAUS_TZ = 'America/Manaus'

/** Passagem de som, Saturday at the Teatro Amazonas, in Manaus' time (the Event's). */
const passagem: EventItem = {
  id: 6,
  name: 'Passagem de som',
  when: { date: '2026-11-21', time: '15:00', timezone: MANAUS_TZ },
  place: { name: 'Teatro Amazonas', address: 'Largo de São Sebastião, s/n', timezone: null },
  state: 'PUBLISHED',
}

const empty = initialItemDraft()
const filled: ItemDraft = {
  ...empty,
  name: ' Translado de volta ',
  date: '22/11/2026',
  time: '0:40',
}

describe('initialItemDraft', () => {
  it('opens empty for a new item, in the Event’s timezone', () => {
    expect(empty).toEqual({
      name: '',
      date: '',
      time: '',
      placeName: '',
      placeAddress: '',
      placeTimezone: null,
    })
  })

  it('opens with the item as it is, the date as typed', () => {
    expect(initialItemDraft(passagem)).toEqual({
      name: 'Passagem de som',
      date: '21/11/2026',
      time: '15:00',
      placeName: 'Teatro Amazonas',
      placeAddress: 'Largo de São Sebastião, s/n',
      placeTimezone: null,
    })
  })
})

describe('itemDraftInput, creating', () => {
  it('sends name, date and local time, trimmed, with no place', () => {
    expect(itemDraftInput(filled)).toEqual({
      errors: {},
      input: { name: 'Translado de volta', date: '2026-11-22', time: '00:40', place: null },
    })
  })

  it('sends an item with no date (the General info)', () => {
    expect(itemDraftInput({ ...empty, name: 'O que levar' }).input).toEqual({
      name: 'O que levar',
      date: null,
      time: null,
      place: null,
    })
  })

  it('sends a date with no time ("a definir")', () => {
    expect(itemDraftInput({ ...filled, time: '' }).input).toMatchObject({
      date: '2026-11-22',
      time: null,
    })
  })

  it("sends the place, its own timezone or none for the Event's", () => {
    const toVitoria = { ...filled, placeName: ' Vitória ', placeTimezone: 'America/Sao_Paulo' }

    expect(itemDraftInput(toVitoria).input?.place).toEqual({
      name: 'Vitória',
      address: null,
      timezone: 'America/Sao_Paulo',
    })
    expect(itemDraftInput({ ...filled, placeAddress: 'Hotel Taj Mahal' }).input?.place).toEqual({
      name: null,
      address: 'Hotel Taj Mahal',
      timezone: null,
    })
  })

  it('refuses a time with no date, sending nothing', () => {
    expect(itemDraftInput({ ...filled, date: '' })).toEqual({
      errors: { time: 'Para pôr a hora, informe o dia.' },
      input: null,
    })
  })

  it.each([
    ['a missing name', { name: '  ' }, 'name', 'Informe o nome do item.'],
    ['a long name', { name: 'x'.repeat(201) }, 'name', 'Use um nome de até 200 caracteres.'],
    ['a date that is not one', { date: '31/02/2026' }, 'date', 'Use uma data como 21/11/2026.'],
    ['a time that is not one', { time: '24:00' }, 'time', 'Use uma hora como 16:00.'],
    [
      'a long address',
      { placeAddress: 'x'.repeat(501) },
      'placeAddress',
      'Use até 500 caracteres.',
    ],
  ])('refuses %s on its field', (_, change, field, message) => {
    expect(itemDraftInput({ ...filled, ...change })).toEqual({
      errors: { [field]: message },
      input: null,
    })
  })
})

describe('itemDraftInput, editing', () => {
  it('sends only the time when only the time changed (15:00 → 16:00)', () => {
    const draft = { ...initialItemDraft(passagem), time: '16:00' }

    expect(itemDraftInput(draft, passagem)).toEqual({ errors: {}, input: { time: '16:00' } })
  })

  it('sends nothing when nothing changed', () => {
    expect(itemDraftInput(initialItemDraft(passagem), passagem)).toEqual({
      errors: {},
      input: null,
    })
  })

  it('clears the date and the time with null, moving the item to the General info', () => {
    const draft = { ...initialItemDraft(passagem), date: '', time: '' }

    expect(itemDraftInput(draft, passagem).input).toEqual({ date: null, time: null })
  })

  it('sends the place whole when a part of it changed, and null when it is emptied', () => {
    const inVitoria = { ...initialItemDraft(passagem), placeTimezone: 'America/Sao_Paulo' }
    const nowhere = { ...initialItemDraft(passagem), placeName: '', placeAddress: '' }

    expect(itemDraftInput(inVitoria, passagem).input).toEqual({
      place: {
        name: 'Teatro Amazonas',
        address: 'Largo de São Sebastião, s/n',
        timezone: 'America/Sao_Paulo',
      },
    })
    expect(itemDraftInput(nowhere, passagem).input).toEqual({ place: null })
  })
})

describe('draftTimezone', () => {
  it("is the place's own timezone, or else the Event's", () => {
    expect(draftTimezone(empty, MANAUS_TZ)).toBe(MANAUS_TZ)
    expect(draftTimezone({ ...empty, placeTimezone: 'America/Sao_Paulo' }, MANAUS_TZ)).toBe(
      'America/Sao_Paulo',
    )
  })
})

describe('errorsFromApi', () => {
  it('puts a time with no date on the time', () => {
    const error = new ApiError(
      'EVENT_ITEM_TIME_WITHOUT_DATE',
      'O Event item só pode ter hora se tiver data.',
    )

    expect(errorsFromApi(error)).toEqual({ time: 'Para pôr a hora, informe o dia.' })
  })

  it('puts a VALIDATION_ERROR on the fields its details name', () => {
    const error = validationError([
      { path: 'name', message: 'x' },
      { path: 'place.timezone', message: 'x' },
      { path: 'place', message: 'x' },
    ])

    expect(errorsFromApi(error)).toEqual({
      name: 'Confira o nome do item.',
      placeTimezone: 'Escolha o fuso de novo.',
      placeName: 'Informe o nome, o endereço ou o fuso do lugar.',
    })
  })

  it("shows any other refusal with the API's message, and a failure with its own", () => {
    expect(
      errorsFromApi(new ApiError('FORBIDDEN', 'Você não tem permissão para esta ação.')),
    ).toEqual({ form: 'Você não tem permissão para esta ação.' })
    expect(errorsFromApi(new Error('boom'))).toEqual({
      form: 'Não foi possível salvar. Tente de novo.',
    })
  })
})
