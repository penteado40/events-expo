import { ApiError, validationError } from '@/shared/lib/api-error'

import { errorsFromApi, eventFormInput, initialEventForm, type EventForm } from '../event-form'
import type { Event } from '../schemas'

const saidaManaus: Event = {
  id: 3,
  groupId: 1,
  name: 'Saída Manaus',
  place: 'Manaus, AM',
  period: { startDate: '2026-11-20', endDate: '2026-11-22', timezone: 'America/Manaus' },
  status: 'DRAFT',
  cancelled: false,
  isParticipant: true,
}

const filled: EventForm = {
  name: ' Saída BH ',
  place: 'Belo Horizonte, MG',
  timezone: 'America/Sao_Paulo',
  startDate: '04/12/2026',
  endDate: '06/12/2026',
}

describe('initialEventForm', () => {
  it("opens empty for a new Event, in São Paulo's timezone", () => {
    expect(initialEventForm()).toEqual({
      name: '',
      place: '',
      timezone: 'America/Sao_Paulo',
      startDate: '',
      endDate: '',
    })
  })

  it('opens with the Event as it is, dates as typed', () => {
    expect(initialEventForm(saidaManaus)).toEqual({
      name: 'Saída Manaus',
      place: 'Manaus, AM',
      timezone: 'America/Manaus',
      startDate: '20/11/2026',
      endDate: '22/11/2026',
    })
  })
})

describe('eventFormInput, creating', () => {
  it('sends the whole Event, trimmed, with the period as local dates', () => {
    expect(eventFormInput(filled)).toEqual({
      errors: {},
      input: {
        name: 'Saída BH',
        place: 'Belo Horizonte, MG',
        period: { startDate: '2026-12-04', endDate: '2026-12-06', timezone: 'America/Sao_Paulo' },
      },
    })
  })

  it.each<[string, Partial<EventForm>, Record<string, string>]>([
    ['no name', { name: ' ' }, { name: 'Informe o nome do Event.' }],
    ['a long name', { name: 'x'.repeat(101) }, { name: 'Use um nome de até 100 caracteres.' }],
    ['no place', { place: '' }, { place: 'Informe a cidade ou o local.' }],
    ['no start', { startDate: '' }, { startDate: 'Informe a data de início.' }],
    ['no end', { endDate: '' }, { endDate: 'Informe a data final.' }],
    [
      'a start that is no date',
      { startDate: '31/11/2026' },
      { startDate: 'Use uma data como 20/11/2026.' },
    ],
    ['an end that is no date', { endDate: '6/12' }, { endDate: 'Use uma data como 20/11/2026.' }],
    [
      'an end before the start',
      { endDate: '03/12/2026' },
      { endDate: 'A data final não pode ser antes da inicial.' },
    ],
  ])('refuses %s on its field, sending nothing', (_, change, errors) => {
    expect(eventFormInput({ ...filled, ...change })).toEqual({ errors, input: null })
  })
})

describe('eventFormInput, editing', () => {
  it('sends nothing when nothing changed', () => {
    expect(eventFormInput(initialEventForm(saidaManaus), saidaManaus)).toEqual({
      errors: {},
      input: null,
    })
  })

  it('sends only the name when only it changed', () => {
    const form = { ...initialEventForm(saidaManaus), name: 'Saída Manaus 2026' }

    expect(eventFormInput(form, saidaManaus).input).toEqual({ name: 'Saída Manaus 2026' })
  })

  it('sends the whole period when any of its parts changed', () => {
    const form = { ...initialEventForm(saidaManaus), timezone: 'America/Sao_Paulo' }

    expect(eventFormInput(form, saidaManaus).input).toEqual({
      period: { startDate: '2026-11-20', endDate: '2026-11-22', timezone: 'America/Sao_Paulo' },
    })
  })
})

describe('errorsFromApi', () => {
  it('puts the API refusal on the fields its details name', () => {
    const error = validationError([
      { path: 'period.endDate', message: 'x' },
      { path: 'name', message: 'x' },
    ])

    expect(errorsFromApi(error)).toEqual({
      endDate: 'Confira a data final: ela não pode vir antes da inicial.',
      name: 'Confira o nome do Event.',
    })
  })

  it("shows anything else as the save's, with the API's message", () => {
    expect(
      errorsFromApi(new ApiError('FORBIDDEN', 'Você não tem permissão para esta ação.')),
    ).toEqual({ form: 'Você não tem permissão para esta ação.' })
    expect(errorsFromApi(new Error('boom'))).toEqual({
      form: 'Não foi possível salvar. Tente de novo.',
    })
  })
})
