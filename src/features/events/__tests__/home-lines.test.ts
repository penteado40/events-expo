import type { Event } from '../api'
import { homeLines, type HomeOptions, type HomeViewer } from '../home-lines'

/** Saturday, 31 Oct 2026, noon in Vitória. */
const NOW = new Date('2026-10-31T12:00:00-03:00')

const OWNER: HomeViewer = { canSeeDrafts: true, isMember: true }
const VIEWER: HomeViewer = { canSeeDrafts: false, isMember: true }
const SUPER_ADMIN: HomeViewer = { canSeeDrafts: true, isMember: false }

function event(id: number, name: string, dates: [string, string], extra: Partial<Event> = {}) {
  return {
    id,
    groupId: 1,
    name,
    place: 'Vitória, ES',
    period: { startDate: dates[0], endDate: dates[1], timezone: 'America/Sao_Paulo' },
    status: 'PUBLISHED',
    cancelled: false,
    isParticipant: true,
    ...extra,
  } satisfies Event
}

const clip = event(1, 'Gravação do clipe', ['2026-10-10', '2026-10-10'])
const tour = event(2, 'Turnê Minas', ['2027-03-12', '2027-03-14'], {
  status: 'DRAFT',
  isParticipant: false,
  place: 'Belo Horizonte, MG',
})
const manaus = event(3, 'Saída Manaus', ['2026-11-20', '2026-11-22'], {
  place: 'Manaus, AM',
  period: { startDate: '2026-11-20', endDate: '2026-11-22', timezone: 'America/Manaus' },
})
const band = event(4, 'Ensaio da Banda', ['2026-11-08', '2026-11-08'], {
  place: 'Estúdio',
  isParticipant: false,
})
const festival = event(5, 'Festival de Verão', ['2026-11-28', '2026-11-28'], {
  place: 'Vila Velha, ES',
  cancelled: true,
})
const rehearsal = event(6, 'Ensaio geral', ['2026-11-05', '2026-11-05'], { place: 'Sede' })
const today = event(8, 'Passagem de som', ['2026-10-29', '2026-10-31'])

const ALL = [festival, clip, tour, manaus, band, rehearsal, today]

const lines = (options: Partial<HomeOptions> = {}) =>
  homeLines(ALL, { tab: 'upcoming', query: '', now: NOW, viewer: VIEWER, ...options })
const names = (options: Partial<HomeOptions> = {}) => lines(options).map((l) => l.event.name)

describe('homeLines tabs', () => {
  it('Próximos: every Event not finished yet, by start date, the one happening now included', () => {
    expect(names()).toEqual([
      'Passagem de som',
      'Ensaio geral',
      'Ensaio da Banda',
      'Saída Manaus',
      'Festival de Verão',
      'Turnê Minas',
    ])
  })

  it('Que eu vou: only those the person is a Participant of', () => {
    expect(names({ tab: 'going' })).toEqual([
      'Passagem de som',
      'Ensaio geral',
      'Saída Manaus',
      'Festival de Verão',
    ])
  })

  it('Passados: the Finished events, the latest first', () => {
    const earlier = event(9, 'Show de setembro', ['2026-09-12', '2026-09-12'])

    expect(
      homeLines([clip, earlier, manaus], {
        tab: 'past',
        query: '',
        now: NOW,
        viewer: VIEWER,
      }).map((l) => l.event.name),
    ).toEqual(['Gravação do clipe', 'Show de setembro'])
  })

  it('moves an Event to Passados only once its last day is over in its own timezone', () => {
    // 23:30 in Vitória on the 22nd is still 22:30 on the 22nd in Manaus; one hour later it is over.
    expect(names({ now: new Date('2026-11-22T23:30:00-03:00') })).toContain('Saída Manaus')
    expect(names({ tab: 'past', now: new Date('2026-11-23T01:00:00-03:00') })).toContain(
      'Saída Manaus',
    )
  })
})

describe('homeLines search', () => {
  it('finds by name or place, ignoring case and accents', () => {
    expect(names({ query: 'ensaio' })).toEqual(['Ensaio geral', 'Ensaio da Banda'])
    expect(names({ query: 'MANAUS' })).toEqual(['Saída Manaus'])
    expect(names({ query: 'saida' })).toEqual(['Saída Manaus'])
    expect(names({ query: 'estudio' })).toEqual(['Ensaio da Banda'])
  })

  it('searches within the chosen tab only', () => {
    expect(names({ tab: 'past', query: 'ensaio' })).toEqual([])
    expect(names({ tab: 'past', query: 'clipe' })).toEqual(['Gravação do clipe'])
  })

  it('ignores blank space around the query', () => {
    expect(names({ query: '  sede ' })).toEqual(['Ensaio geral'])
  })
})

describe('homeLines line states', () => {
  const line = (name: string, options: Partial<HomeOptions> = {}) =>
    lines(options).find((l) => l.event.name === name)!

  it('marks an Event the person goes to with VOCÊ VAI', () => {
    expect(line('Ensaio geral')).toMatchObject({ badge: 'going', notGoing: false, faded: false })
  })

  it('tells a Group member who is not a Participant that they are not going, faded', () => {
    expect(line('Ensaio da Banda')).toMatchObject({ badge: null, notGoing: true, faded: true })
  })

  it('never says "você não vai" to the Super admin, who is not a Group member', () => {
    expect(line('Ensaio da Banda', { viewer: SUPER_ADMIN })).toMatchObject({
      notGoing: false,
      faded: false,
    })
  })

  it('strikes a Cancelled Event and badges it CANCELADO, over any other badge', () => {
    expect(line('Festival de Verão')).toMatchObject({
      badge: 'cancelled',
      struck: true,
      faded: true,
    })
  })

  it('badges a Draft with RASCUNHO only for those who see Drafts', () => {
    expect(line('Turnê Minas', { viewer: OWNER }).badge).toBe('draft')
    expect(line('Turnê Minas', { viewer: SUPER_ADMIN }).badge).toBe('draft')
    expect(line('Turnê Minas', { viewer: VIEWER }).badge).toBeNull()
  })

  it('a Cancelled Draft is CANCELADO even for the Owner', () => {
    const cancelledDraft = { ...tour, cancelled: true }

    expect(
      homeLines([cancelledDraft], { tab: 'upcoming', query: '', now: NOW, viewer: OWNER })[0].badge,
    ).toBe('cancelled')
  })

  it('gives each line the automatic tone of its Event', () => {
    expect(line('Saída Manaus').tone).toBe('purple')
    expect(line('Ensaio geral').tone).toBe('gold')
  })

  it('writes the date column and the subtitle without converting the dates', () => {
    expect(line('Saída Manaus')).toMatchObject({
      start: { day: '20', month: 'NOV' },
      endDay: '22',
      days: 3,
      subtitle: 'sex. · Manaus, AM',
    })
    expect(line('Ensaio geral')).toMatchObject({ endDay: null, days: 1, subtitle: 'qui. · Sede' })
    expect(line('Ensaio da Banda').subtitle).toBe('dom. · Estúdio · você não vai')
  })
})

describe('homeLines featured Event', () => {
  const featured = (options: Partial<HomeOptions> = {}) =>
    lines(options)
      .filter((l) => l.featured)
      .map((l) => l.event.name)

  it('features the first Event the person goes to that is not Cancelled', () => {
    expect(featured()).toEqual(['Passagem de som'])
    expect(featured({ tab: 'going' })).toEqual(['Passagem de som'])
  })

  it('skips Cancelled ones', () => {
    const cancelledRehearsal = { ...rehearsal, cancelled: true }

    expect(
      homeLines([manaus, cancelledRehearsal], {
        tab: 'upcoming',
        query: '',
        now: NOW,
        viewer: VIEWER,
      }).map((l) => [l.event.name, l.featured]),
    ).toEqual([
      ['Ensaio geral', false],
      ['Saída Manaus', true],
    ])
  })

  it('features nothing in Passados, nor for someone who goes to nothing', () => {
    expect(featured({ tab: 'past' })).toEqual([])
    expect(featured({ viewer: SUPER_ADMIN, query: 'banda' })).toEqual([])
  })
})
