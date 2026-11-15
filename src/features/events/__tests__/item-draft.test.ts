import { ApiError, validationError } from '@/shared/lib/api-error'

import {
  addLooseName,
  addParticipants,
  addPeopleField,
  addTextField,
  editPersonalNote,
  draftTimezone,
  editField,
  errorsFromApi,
  FieldWriteError,
  fieldWrites,
  initialItemDraft,
  itemDraftInput,
  moveField,
  removeField,
  removePerson,
  setNotesVisibility,
  toggleHighlight,
  type ItemDraft,
  type PeopleFieldDraft,
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
  fields: [
    { id: 1, type: 'TEXT', name: 'Obs', value: 'Despachar o som às 14h', highlight: false },
    { id: 2, type: 'TEXT', name: 'Contato', value: '(92) 98888-0000', highlight: true },
  ],
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
      fields: [],
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
      fields: [
        {
          type: 'TEXT',
          key: 'field-1',
          id: 1,
          name: 'Obs',
          value: 'Despachar o som às 14h',
          highlight: false,
        },
        {
          type: 'TEXT',
          key: 'field-2',
          id: 2,
          name: 'Contato',
          value: '(92) 98888-0000',
          highlight: true,
        },
      ],
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

  it('puts a refused Field write on that Field, never on the item’s name', () => {
    const refused = validationError([{ path: 'name', message: 'x' }])
    const forbidden = new ApiError('FORBIDDEN', 'Você não tem permissão para esta ação.')

    expect(errorsFromApi(new FieldWriteError('new-1', refused))).toEqual({
      'field:new-1': 'Confira o nome e o valor do Field.',
    })
    expect(errorsFromApi(new FieldWriteError('field-2', forbidden))).toEqual({
      form: 'Você não tem permissão para esta ação.',
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

/** The keys of the draft's Fields, in the editor's order. */
const keys = (draft: ItemDraft) => draft.fields.map((f) => f.key)

describe('the Field actions', () => {
  const opened = initialItemDraft(passagem)

  it('adds an empty text Field at the end, out of the Resumo', () => {
    const added = addTextField(addTextField(opened))

    expect(added.fields.slice(2)).toEqual([
      { type: 'TEXT', key: 'new-1', id: null, name: '', value: '', highlight: false },
      { type: 'TEXT', key: 'new-2', id: null, name: '', value: '', highlight: false },
    ])
  })

  it('edits the name and the value of one Field', () => {
    const edited = editField(opened, 'field-1', { value: 'Às 13h' })

    expect(edited.fields[0]).toMatchObject({ name: 'Obs', value: 'Às 13h' })
    expect(edited.fields[1]).toBe(opened.fields[1])
  })

  it('turns the Highlight on and off', () => {
    const on = toggleHighlight(opened, 'field-1')

    expect(on.fields[0].highlight).toBe(true)
    expect(toggleHighlight(on, 'field-1').fields[0].highlight).toBe(false)
  })

  it('moves a Field up and down, staying put at either end', () => {
    expect(keys(moveField(opened, 'field-2', -1))).toEqual(['field-2', 'field-1'])
    expect(keys(moveField(opened, 'field-1', 1))).toEqual(['field-2', 'field-1'])
    expect(keys(moveField(opened, 'field-1', -1))).toEqual(['field-1', 'field-2'])
    expect(keys(moveField(opened, 'field-2', 1))).toEqual(['field-1', 'field-2'])
  })

  it('deletes a Field', () => {
    expect(keys(removeField(opened, 'field-1'))).toEqual(['field-2'])
  })
})

describe('itemDraftInput, the Fields', () => {
  it('refuses a Field with no name, or a long name or value, on that Field', () => {
    const draft = addTextField({ ...filled, fields: [] })
    const named = (name: string, value = '') => editField(draft, 'new-1', { name, value })

    expect(itemDraftInput(named('  ', 'In-ear'))).toEqual({
      errors: { 'field:new-1': 'Dê um nome ao Field.' },
      input: null,
    })
    expect(itemDraftInput(named('x'.repeat(101))).errors).toEqual({
      'field:new-1': 'Use um nome de até 100 caracteres.',
    })
    expect(itemDraftInput(named('Obs', 'x'.repeat(2001))).errors).toEqual({
      'field:new-1': 'Use um valor de até 2000 caracteres.',
    })
  })
})

describe('fieldWrites', () => {
  const opened = initialItemDraft(passagem)

  it('creating, adds every Field in the editor’s order, trimmed, with its Highlight', () => {
    let draft = addTextField(addTextField(filled))
    draft = editField(draft, 'new-1', { name: ' Voltagem ', value: ' 127 V ' })
    draft = toggleHighlight(editField(draft, 'new-2', { name: 'O que levar', value: '' }), 'new-2')
    draft = moveField(draft, 'new-2', -1)

    expect(fieldWrites(draft)).toEqual({
      remove: [],
      update: [],
      add: [
        { key: 'new-2', input: { type: 'TEXT', name: 'O que levar', value: '', highlight: true } },
        {
          key: 'new-1',
          input: { type: 'TEXT', name: 'Voltagem', value: '127 V', highlight: false },
        },
      ],
      order: null,
    })
  })

  it('editing, writes nothing when no Field changed', () => {
    expect(fieldWrites(opened, passagem)).toEqual({ remove: [], update: [], add: [], order: null })
  })

  it('sends only what changed of a Field, the Highlight on its own', () => {
    const draft = toggleHighlight(editField(opened, 'field-1', { value: 'Às 13h' }), 'field-2')

    expect(fieldWrites(draft, passagem).update).toEqual([
      { id: 1, changes: { value: 'Às 13h' } },
      { id: 2, changes: { highlight: false } },
    ])
  })

  it('deletes the Fields gone from the editor', () => {
    expect(fieldWrites(removeField(opened, 'field-1'), passagem)).toEqual({
      remove: [1],
      update: [],
      add: [],
      order: null,
    })
  })

  it('orders the Fields as the editor has them, by id and a new one by key, when adding at the end would not', () => {
    const swapped = moveField(opened, 'field-2', -1)
    const newFirst = moveField(moveField(addTextField(opened), 'new-1', -1), 'new-1', -1)
    const newLast = addTextField(opened)
    const named = (draft: ItemDraft) => editField(draft, 'new-1', { name: 'Obs 2' })

    expect(fieldWrites(swapped, passagem).order).toEqual([2, 1])
    expect(fieldWrites(named(newFirst), passagem).order).toEqual(['new-1', 1, 2])
    expect(fieldWrites(named(newLast), passagem).order).toBeNull()
  })
})

/**
 * Translado de volta, Sunday 00:40, with Carro 1 - EC: Matias driving, Jacque (out of the Event
 * since she was taken out) and Seu Raimundo, the local driver, as a loose name.
 */
const translado: EventItem = {
  id: 8,
  name: 'Translado de volta',
  when: { date: '2026-11-22', time: '00:40', timezone: MANAUS_TZ },
  place: null,
  state: 'PUBLISHED',
  fields: [
    {
      id: 3,
      type: 'PEOPLE',
      name: 'Carro 1 - EC',
      highlight: true,
      personalNotesVisibility: 'PRIVATE',
      people: [
        { userId: 3, name: 'Matias Costa', personalNote: 'dirigindo', outOfEvent: false },
        { userId: 4, name: 'Jacque Moreira', personalNote: null, outOfEvent: true },
        { userId: null, name: 'Seu Raimundo', personalNote: null, outOfEvent: false },
      ],
    },
  ],
}

const LU = { userId: 5, name: 'Lu Andrade' }
const MATIAS = { userId: 3, name: 'Matias Costa' }

/** The Field of people at that key. */
const people = (draft: ItemDraft, key: string) =>
  draft.fields.find((f): f is PeopleFieldDraft => f.key === key && f.type === 'PEOPLE')!.people

describe('the Field of people actions', () => {
  const opened = initialItemDraft(translado)

  it('opens with its people in order, each with the note, the loose name and who is out of the Event', () => {
    expect(opened.fields).toEqual([
      {
        type: 'PEOPLE',
        key: 'field-3',
        id: 3,
        name: 'Carro 1 - EC',
        highlight: true,
        visibility: 'PRIVATE',
        people: [
          { key: 'user-3', userId: 3, name: 'Matias Costa', note: 'dirigindo', outOfEvent: false },
          { key: 'user-4', userId: 4, name: 'Jacque Moreira', note: '', outOfEvent: true },
          { key: 'name-1', userId: null, name: 'Seu Raimundo', note: '', outOfEvent: false },
        ],
      },
    ])
  })

  it('adds an empty Field of people at the end, notes only for each one, out of the Resumo', () => {
    const added = addPeopleField(addTextField(opened))

    expect(added.fields[2]).toEqual({
      type: 'PEOPLE',
      key: 'new-2',
      id: null,
      name: '',
      highlight: false,
      visibility: 'PRIVATE',
      people: [],
    })
  })

  it('adds Participants at the end, each once', () => {
    const added = addParticipants(opened, 'field-3', [LU, MATIAS])

    expect(people(added, 'field-3').map((p) => p.key)).toEqual([
      'user-3',
      'user-4',
      'name-1',
      'user-5',
    ])
    expect(people(added, 'field-3')[3]).toEqual({
      key: 'user-5',
      userId: 5,
      name: 'Lu Andrade',
      note: '',
      outOfEvent: false,
    })
  })

  it('adds a loose name, trimmed, and nothing for a blank one', () => {
    const added = addLooseName(opened, 'field-3', '  Dona Célia ')

    expect(people(added, 'field-3')[3]).toEqual({
      key: 'name-2',
      userId: null,
      name: 'Dona Célia',
      note: '',
      outOfEvent: false,
    })
    expect(addLooseName(opened, 'field-3', '   ')).toBe(opened)
  })

  it('takes someone out of the Field, out of the Event or not', () => {
    const taken = removePerson(removePerson(opened, 'field-3', 'user-4'), 'field-3', 'name-1')

    expect(people(taken, 'field-3').map((p) => p.name)).toEqual(['Matias Costa'])
  })

  it('writes the Personal note of one person', () => {
    const noted = editPersonalNote(opened, 'field-3', 'name-1', 'motorista local')

    expect(people(noted, 'field-3').map((p) => p.note)).toEqual([
      'dirigindo',
      '',
      'motorista local',
    ])
  })

  it('shows the notes to everyone in the item, or again only to each one', () => {
    const all = setNotesVisibility(opened, 'field-3', 'ALL')

    expect(all.fields[0]).toMatchObject({ visibility: 'ALL' })
    expect(setNotesVisibility(all, 'field-3', 'PRIVATE').fields[0]).toMatchObject({
      visibility: 'PRIVATE',
    })
  })
})

describe('itemDraftInput, the Fields of people', () => {
  const draft = addPeopleField({ ...filled, fields: [] })

  it('refuses a Field of people with no name on that Field', () => {
    expect(itemDraftInput(draft).errors).toEqual({ 'field:new-1': 'Dê um nome ao Field.' })
  })

  it('refuses a long loose name or Personal note on that Field', () => {
    const named = editField(draft, 'new-1', { name: 'Carro 2' })

    expect(itemDraftInput(addLooseName(named, 'new-1', 'x'.repeat(101))).errors).toEqual({
      'field:new-1': 'Use um nome solto de até 100 caracteres.',
    })
    const noted = editPersonalNote(
      addParticipants(named, 'new-1', [LU]),
      'new-1',
      'user-5',
      'x'.repeat(501),
    )
    expect(itemDraftInput(noted).errors).toEqual({
      'field:new-1': 'Use uma nota de até 500 caracteres.',
    })
  })
})

describe('fieldWrites, the Fields of people', () => {
  const opened = initialItemDraft(translado)

  it('creating, adds the Field with its people in order, the notes trimmed or null, and the visibility', () => {
    let draft = editField(addPeopleField(filled), 'new-1', { name: ' Quarto 101 ' })
    draft = addLooseName(addParticipants(draft, 'new-1', [LU]), 'new-1', 'Dona Célia')
    draft = editPersonalNote(draft, 'new-1', 'user-5', ' LOC4X2 ')
    draft = setNotesVisibility(draft, 'new-1', 'ALL')

    expect(fieldWrites(draft).add).toEqual([
      {
        key: 'new-1',
        input: {
          type: 'PEOPLE',
          name: 'Quarto 101',
          highlight: false,
          personalNotesVisibility: 'ALL',
          people: [
            { userId: 5, personalNote: 'LOC4X2' },
            { name: 'Dona Célia', personalNote: null },
          ],
        },
      },
    ])
  })

  it('editing, writes nothing when no one changed', () => {
    expect(fieldWrites(opened, translado)).toEqual({ remove: [], update: [], add: [], order: null })
  })

  it('sends the people whole when someone came, left or got a note, keeping who is out of the Event', () => {
    const draft = editPersonalNote(
      addParticipants(opened, 'field-3', [LU]),
      'field-3',
      'user-5',
      'janela',
    )

    expect(fieldWrites(draft, translado).update).toEqual([
      {
        id: 3,
        changes: {
          people: [
            { userId: 3, personalNote: 'dirigindo' },
            { userId: 4, personalNote: null },
            { name: 'Seu Raimundo', personalNote: null },
            { userId: 5, personalNote: 'janela' },
          ],
        },
      },
    ])
  })

  it('sends only the visibility when only it changed', () => {
    expect(fieldWrites(setNotesVisibility(opened, 'field-3', 'ALL'), translado).update).toEqual([
      { id: 3, changes: { personalNotesVisibility: 'ALL' } },
    ])
  })
})
