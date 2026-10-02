import type { ContributionStatus } from '@/shared/domain/contributions'
import type { EventStatus, EventType } from '@/shared/domain/events'
import type { EventRole } from '@/shared/domain/roles'
import type { User } from '@/shared/session'

/** A User and, for the ones that log in through the mock's "Entrar", their password. */
export type Account = { user: User; password?: string }

export type MemberRow = { userId: number; role: EventRole; isPrimaryOwner: boolean }

export type ContributionRow = {
  id: number
  guestName: string
  registryItemId: number
  amount: number
  status: ContributionStatus
  /** Null until the Guest marks it paid (PENDING, ABANDONED). */
  paidAt: string | null
  hasReceipt: boolean
}

/** The API counts each item's Contributions (`contributionCount`) from the Contributions. */
export type RegistryItemRow = { id: number; name: string; price: number; imageUrl: string | null }

/** A Guest's confirmation: there's no RSVP for not going (events-api ADR-0015). */
export type RsvpRow = { name: string; email: string; createdAt: string }

export type EventRow = {
  id: number
  type: EventType
  status: EventStatus
  name: string
  slug: string
  siteUrl: string
  startsAt: string
  endsAt: string | null
  timezone: string
  locale: 'pt-BR'
  currency: 'BRL'
  venueName: string | null
  venueAddress: string | null
  city: string | null
  mapsUrl: string | null
  createdAt: string
  updatedAt: string
  members: MemberRow[]
  rsvps: RsvpRow[]
  registryItems: RegistryItemRow[]
  contributions: ContributionRow[]
}

export type Dataset = { accounts: Account[]; events: EventRow[] }

const user = (id: number, name: string, email: string, createdAt: string): User => ({
  id,
  name,
  email,
  role: 'USER',
  createdAt,
})

export const SUPER_ADMIN_ID = 1
export const DEMO_USER_ID = 7
/** The archived Offsite Kora's Manager: shows an archived Event without its Guest data. */
export const DEMO_MANAGER_ID = 8

const ACCOUNTS: Account[] = [
  {
    user: {
      id: SUPER_ADMIN_ID,
      name: 'Admin Local',
      email: 'admin@local.test',
      role: 'SUPER_ADMIN',
      createdAt: '2026-01-01T12:00:00.000Z',
    },
    password: 'admin123',
  },
  { user: user(2, 'Ana Lima', 'ana.lima@gmail.com', '2026-08-01T12:00:00.000Z') },
  { user: user(3, 'Rafael Souza', 'rafael.souza@gmail.com', '2026-08-01T12:00:00.000Z') },
  { user: user(4, 'Pedro Souza', 'pedro.souza@gmail.com', '2026-08-02T12:00:00.000Z') },
  { user: user(5, 'Júlia Martins', 'julia.martins@gmail.com', '2026-08-10T12:00:00.000Z') },
  { user: user(6, 'Marcos Andrade', 'marcos.andrade@gmail.com', '2026-08-15T12:00:00.000Z') },
  {
    user: user(DEMO_USER_ID, 'Cláudia Lima', 'claudia.lima@gmail.com', '2026-09-27T22:58:10.000Z'),
  },
  { user: user(DEMO_MANAGER_ID, 'Otávio Kern', 'otavio@kora.com.br', '2026-07-20T12:00:00.000Z') },
  // A member of no Event: the empty Events list.
  { user: user(9, 'Laura Mendes', 'laura.mendes@gmail.com', '2026-09-28T12:00:00.000Z') },
]

const member = (userId: number, role: EventRole, isPrimaryOwner = false): MemberRow => ({
  userId,
  role,
  isPrimaryOwner,
})

const contribution = (
  id: number,
  guestName: string,
  registryItemId: number,
  amount: number,
  paidAt: string | null,
  hasReceipt: boolean,
  status: ContributionRow['status'],
): ContributionRow => ({ id, guestName, registryItemId, amount, paidAt, hasReceipt, status })

/**
 * An RSVP from the prototype: its `dd/mm` (2026) becomes noon in São Paulo. The prototype's "não
 * vai" answers are gone: an RSVP is only a confirmation (events-api ADR-0015).
 */
const rsvp = (name: string, email: string, dayMonth: string): RsvpRow => {
  const [day, month] = dayMonth.split('/')
  return { name, email, createdAt: `2026-${month}-${day}T15:00:00.000Z` }
}

/**
 * Contributions whose Verification always fails (`INTERNAL_ERROR`), so Demo mode can show the
 * rollback: Helena Costa's, on Ana & Rafael.
 */
export const FAILING_VERIFICATIONS = [303]

/** A sample image per item (stable by seed); `null` for no image, `'missing'` for a 404. */
const registryItem = (
  id: number,
  name: string,
  price: number,
  image: 'seed' | 'missing' | null = 'seed',
): RegistryItemRow => {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
  const imageUrl =
    image === 'seed'
      ? `https://picsum.photos/seed/${slug}/96`
      : image === 'missing'
        ? `https://picsum.photos/missing/${slug}.jpg`
        : null
  return { id, name, price, imageUrl }
}

/** Every sample Event's timezone: their dates are local times in São Paulo. */
const SAMPLE_TIMEZONE = 'America/Sao_Paulo'

type EventSeed = Pick<
  EventRow,
  'id' | 'type' | 'name' | 'slug' | 'siteUrl' | 'startsAt' | 'venueName' | 'city'
> &
  Partial<
    Pick<
      EventRow,
      | 'status'
      | 'mapsUrl'
      | 'createdAt'
      | 'updatedAt'
      | 'members'
      | 'rsvps'
      | 'registryItems'
      | 'contributions'
    >
  >

const event = (seed: EventSeed): EventRow => ({
  status: 'ACTIVE',
  endsAt: null,
  timezone: SAMPLE_TIMEZONE,
  locale: 'pt-BR',
  currency: 'BRL',
  venueAddress: null,
  mapsUrl: null,
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-01T12:00:00.000Z',
  members: [],
  rsvps: [],
  registryItems: [],
  contributions: [],
  ...seed,
})

// The prototype's EVENTS (docs/design): its local times, stored as UTC for America/Sao_Paulo.
// These are the dates on SAMPLE_DATE; `createDataset` moves them to the day the mock loads.
const EVENTS: EventRow[] = [
  event({
    id: 12,
    type: 'WEDDING',
    name: 'Ana & Rafael',
    slug: 'ana-e-rafael',
    siteUrl: 'https://anaerafael.com.br',
    startsAt: '2026-11-14T19:30:00.000Z',
    venueName: 'Fazenda Santa Clara',
    city: 'Itu, SP',
    mapsUrl: 'https://maps.google.com/?q=Fazenda+Santa+Clara,+Itu,+SP',
    members: [
      member(2, 'OWNER', true),
      member(3, 'OWNER'),
      member(7, 'OWNER'),
      member(4, 'VIEWER'),
    ],
    rsvps: [
      rsvp('Beatriz Nogueira', 'bia.nogueira@gmail.com', '26/09'),
      rsvp('Carlos Menezes', 'carlos.m@uol.com.br', '25/09'),
      rsvp('Eduardo Tavares', 'edu.tavares@hotmail.com', '22/09'),
      rsvp('Fernanda Ruiz', 'fe.ruiz@gmail.com', '20/09'),
      rsvp('Helena Costa', 'helena.costa@gmail.com', '15/09'),
    ],
    registryItems: [
      registryItem(121, 'Jantar na lua de mel', 450),
      registryItem(122, 'Jogo de panelas', 890),
      registryItem(123, 'Passeio de barco em Ilhabela', 620),
      registryItem(124, 'Cafeteira espresso', 1290, null),
      registryItem(125, 'Cota da viagem', 200),
    ],
    contributions: [
      contribution(301, 'Beatriz Nogueira', 121, 450, '2026-09-27T00:14:00.000Z', true, 'PAID'),
      contribution(302, 'Carlos Menezes', 125, 200, '2026-09-26T13:02:00.000Z', false, 'PAID'),
      contribution(303, 'Helena Costa', 123, 620, '2026-09-25T22:40:00.000Z', true, 'PAID'),
      contribution(298, 'Eduardo Tavares', 125, 200, '2026-09-21T11:30:00.000Z', true, 'VERIFIED'),
      contribution(295, 'Fernanda Ruiz', 122, 890, '2026-09-19T18:12:00.000Z', true, 'VERIFIED'),
      contribution(290, 'Gustavo Leal', 121, 450, '2026-09-17T15:00:00.000Z', false, 'REJECTED'),
      // Never marked paid: the API keeps them out of the members' list.
      contribution(304, 'Igor Santos', 125, 300, null, false, 'PENDING'),
      contribution(296, 'Daniela Prado', 125, 150, null, false, 'ABANDONED'),
    ],
  }),
  event({
    id: 15,
    type: 'BABY_SHOWER',
    name: 'Chá da Júlia',
    slug: 'cha-da-julia',
    siteUrl: 'https://chadajulia.com.br',
    startsAt: '2026-10-11T18:00:00.000Z',
    venueName: 'Casa da vó Lurdes',
    city: 'Campinas, SP',
    members: [member(5, 'OWNER', true), member(7, 'VIEWER')],
    rsvps: [
      rsvp('Marina Alves', 'marina.alves@gmail.com', '23/09'),
      rsvp('Tatiane Rocha', 'tati.rocha@gmail.com', '21/09'),
      rsvp('Sônia Martins', 'sonia.m@terra.com.br', '19/09'),
    ],
    registryItems: [
      registryItem(151, 'Carrinho de bebê', 1800),
      registryItem(152, 'Kit fraldas M', 180, 'missing'),
    ],
    contributions: [
      contribution(412, 'Marina Alves', 152, 180, '2026-09-24T12:20:00.000Z', true, 'PAID'),
      contribution(413, 'Tatiane Rocha', 152, 180, '2026-09-22T21:45:00.000Z', false, 'PAID'),
    ],
  }),
  event({
    id: 14,
    type: 'BIRTHDAY',
    name: 'Marcos, 40',
    slug: 'marcos-40',
    siteUrl: 'https://marcos40.com.br',
    startsAt: '2026-10-24T23:00:00.000Z',
    venueName: 'Bar do Alemão',
    city: 'Pinheiros, SP',
    members: [member(6, 'OWNER', true), member(7, 'MANAGER')],
    rsvps: [
      rsvp('Rodrigo Pires', 'rpires@gmail.com', '25/09'),
      rsvp('Tiago Moura', 'tiago.moura@gmail.com', '23/09'),
      rsvp('Paula Reis', 'paula.reis@gmail.com', '20/09'),
    ],
    registryItems: [
      registryItem(141, 'Garrafa de single malt', 520),
      registryItem(142, 'Cota do churrasco', 100),
    ],
    contributions: [
      contribution(388, 'Tiago Moura', 142, 100, '2026-09-26T01:10:00.000Z', false, 'PAID'),
      contribution(380, 'Rodrigo Pires', 141, 520, '2026-09-20T14:00:00.000Z', true, 'VERIFIED'),
    ],
  }),
  event({
    id: 16,
    type: 'PARTY',
    name: 'Festa de fim de ano Vera Cruz',
    slug: 'festa-vera-cruz',
    siteUrl: 'https://festaveracruz.com.br',
    startsAt: '2026-12-12T22:00:00.000Z',
    venueName: 'Colégio Vera Cruz',
    city: 'São Paulo, SP',
    rsvps: [rsvp('Renata Gomes', 'renata.g@gmail.com', '27/09')],
  }),
  event({
    id: 9,
    type: 'CORPORATE',
    status: 'ARCHIVED',
    name: 'Offsite Kora 2026',
    slug: 'offsite-kora-2026',
    siteUrl: 'https://offsite.kora.com.br',
    startsAt: '2026-09-12T12:00:00.000Z',
    venueName: 'Hotel Boa Vista',
    city: 'Porto Feliz, SP',
    mapsUrl: 'https://maps.google.com/?q=Hotel+Boa+Vista,+Porto+Feliz,+SP',
    members: [member(7, 'OWNER', true), member(8, 'MANAGER')],
    rsvps: [
      rsvp('Otávio Kern', 'otavio@kora.com.br', '01/09'),
      rsvp('Isabela Faria', 'isabela@kora.com.br', '02/09'),
    ],
    registryItems: [registryItem(91, 'Cota do happy hour', 150)],
    // Verified before archiving: its Owner can still revise it (events-api ADR-0011).
    contributions: [
      contribution(201, 'Isabela Faria', 91, 150, '2026-09-05T13:00:00.000Z', true, 'VERIFIED'),
    ],
  }),
]

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS

/** The day the sample dates above were written for: loaded on it, the mock keeps them as they are. */
export const SAMPLE_DATE = new Date('2026-10-01T15:00:00.000Z')

/** `YYYY-MM-DD` of a moment in São Paulo. */
function saoPauloDay(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SAMPLE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** Midnight in São Paulo, which has had no daylight saving time since 2019 (always UTC-3). */
const startOfSaoPauloDay = (date: Date) => new Date(`${saoPauloDay(date)}T00:00:00.000-03:00`)

/** Whole days from SAMPLE_DATE to `now`, counted on São Paulo's calendar. */
const daysSinceSampleDate = (now: Date) =>
  Math.round((Date.parse(saoPauloDay(now)) - Date.parse(saoPauloDay(SAMPLE_DATE))) / DAY_MS)

const shift = (iso: string, ms: number) => new Date(Date.parse(iso) + ms).toISOString()

/** The Event with every date moved by `ms`: whole days keep each one's time of day. */
const shiftEvent = (row: EventRow, ms: number): EventRow => ({
  ...row,
  startsAt: shift(row.startsAt, ms),
  endsAt: row.endsAt && shift(row.endsAt, ms),
  createdAt: shift(row.createdAt, ms),
  updatedAt: shift(row.updatedAt, ms),
  rsvps: row.rsvps.map((r) => ({ ...r, createdAt: shift(r.createdAt, ms) })),
  contributions: row.contributions.map((c) => ({ ...c, paidAt: c.paidAt && shift(c.paidAt, ms) })),
})

/**
 * Cláudia's birthday, happening when the mock loads: it started 2 h earlier, but never before
 * today's midnight, since an Event without `endsAt` lasts until the end of its day.
 */
function happeningEvent(now: Date): EventRow {
  const startsAt = Math.max(now.getTime() - 2 * HOUR_MS, startOfSaoPauloDay(now).getTime())
  const before = (days: number, hours = 0) =>
    new Date(startsAt - days * DAY_MS - hours * HOUR_MS).toISOString()
  return event({
    id: 17,
    type: 'BIRTHDAY',
    name: 'Aniversário da Cláudia',
    slug: 'aniversario-da-claudia',
    siteUrl: 'https://aniversariodaclaudia.com.br',
    startsAt: before(0),
    venueName: 'Empório Alto de Pinheiros',
    city: 'São Paulo, SP',
    mapsUrl: 'https://maps.google.com/?q=Emporio+Alto+de+Pinheiros,+Sao+Paulo,+SP',
    createdAt: before(30),
    updatedAt: before(30),
    members: [member(DEMO_USER_ID, 'OWNER', true), member(2, 'VIEWER')],
    rsvps: [
      { name: 'Rita Campos', email: 'rita.campos@gmail.com', createdAt: before(1, 4) },
      { name: 'Bruno Lacerda', email: 'bruno.lacerda@gmail.com', createdAt: before(3, 2) },
      { name: 'Juliana Prates', email: 'ju.prates@hotmail.com', createdAt: before(5, 6) },
      { name: 'Vinícius Arantes', email: 'vini.arantes@gmail.com', createdAt: before(8, 1) },
    ],
    registryItems: [
      registryItem(171, 'Vinho do Porto', 280),
      registryItem(172, 'Kit de jardinagem', 350),
      registryItem(173, 'Cota do bolo', 120),
    ],
    contributions: [
      contribution(504, 'Rita Campos', 171, 280, before(0, 20), true, 'PAID'),
      contribution(503, 'Bruno Lacerda', 173, 120, before(2, 5), false, 'PAID'),
      contribution(502, 'Juliana Prates', 172, 350, before(4, 3), true, 'VERIFIED'),
      contribution(501, 'Vinícius Arantes', 173, 120, before(7, 2), false, 'REJECTED'),
    ],
  })
}

/**
 * A fresh copy of the sample data, so each backend's writes stay its own. Its dates are relative to
 * `now`: the sample Events keep their distance from SAMPLE_DATE, and Cláudia's birthday is on.
 */
export function createDataset(now: Date): Dataset {
  const ms = daysSinceSampleDate(now) * DAY_MS
  const events = [...EVENTS.map((row) => shiftEvent(row, ms)), happeningEvent(now)]
  return JSON.parse(JSON.stringify({ accounts: ACCOUNTS, events }))
}
