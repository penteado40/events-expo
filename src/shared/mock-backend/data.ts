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
  amount: number
  status: ContributionStatus
  /** Null until the Guest marks it paid (PENDING, ABANDONED). */
  paidAt: string | null
  hasReceipt: boolean
}

export type RsvpRow = { name: string; email: string; attending: boolean; createdAt: string }

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
  { user: user(8, 'Otávio Kern', 'otavio@kora.com.br', '2026-07-20T12:00:00.000Z') },
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
  amount: number,
  paidAt: string | null,
  hasReceipt: boolean,
  status: ContributionRow['status'],
): ContributionRow => ({ id, guestName, amount, paidAt, hasReceipt, status })

/** An RSVP from the prototype: its `dd/mm` (2026) becomes noon in São Paulo. */
const rsvp = (name: string, email: string, attending: boolean, dayMonth: string): RsvpRow => {
  const [day, month] = dayMonth.split('/')
  return { name, email, attending, createdAt: `2026-${month}-${day}T15:00:00.000Z` }
}

type EventSeed = Pick<
  EventRow,
  'id' | 'type' | 'name' | 'slug' | 'siteUrl' | 'startsAt' | 'venueName' | 'city'
> &
  Partial<Pick<EventRow, 'status' | 'mapsUrl' | 'members' | 'rsvps' | 'contributions'>>

const event = (seed: EventSeed): EventRow => ({
  status: 'ACTIVE',
  endsAt: null,
  timezone: 'America/Sao_Paulo',
  locale: 'pt-BR',
  currency: 'BRL',
  venueAddress: null,
  mapsUrl: null,
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-01T12:00:00.000Z',
  members: [],
  rsvps: [],
  contributions: [],
  ...seed,
})

// The prototype's EVENTS (docs/design): its local times, stored as UTC for America/Sao_Paulo.
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
      rsvp('Beatriz Nogueira', 'bia.nogueira@gmail.com', true, '26/09'),
      rsvp('Carlos Menezes', 'carlos.m@uol.com.br', true, '25/09'),
      rsvp('Daniela Prado', 'dani.prado@gmail.com', false, '24/09'),
      rsvp('Eduardo Tavares', 'edu.tavares@hotmail.com', true, '22/09'),
      rsvp('Fernanda Ruiz', 'fe.ruiz@gmail.com', true, '20/09'),
      rsvp('Gustavo Leal', 'gleal@outlook.com', false, '18/09'),
      rsvp('Helena Costa', 'helena.costa@gmail.com', true, '15/09'),
    ],
    contributions: [
      contribution(301, 'Beatriz Nogueira', 450, '2026-09-27T00:14:00.000Z', true, 'PAID'),
      contribution(302, 'Carlos Menezes', 200, '2026-09-26T13:02:00.000Z', false, 'PAID'),
      contribution(303, 'Helena Costa', 620, '2026-09-25T22:40:00.000Z', true, 'PAID'),
      contribution(298, 'Eduardo Tavares', 200, '2026-09-21T11:30:00.000Z', true, 'VERIFIED'),
      contribution(295, 'Fernanda Ruiz', 890, '2026-09-19T18:12:00.000Z', true, 'VERIFIED'),
      contribution(290, 'Gustavo Leal', 450, '2026-09-17T15:00:00.000Z', false, 'REJECTED'),
      // Never marked paid: the API keeps them out of the members' list.
      contribution(304, 'Igor Santos', 300, null, false, 'PENDING'),
      contribution(296, 'Daniela Prado', 150, null, false, 'ABANDONED'),
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
      rsvp('Marina Alves', 'marina.alves@gmail.com', true, '23/09'),
      rsvp('Tatiane Rocha', 'tati.rocha@gmail.com', true, '21/09'),
      rsvp('Sônia Martins', 'sonia.m@terra.com.br', true, '19/09'),
    ],
    contributions: [
      contribution(412, 'Marina Alves', 180, '2026-09-24T12:20:00.000Z', true, 'PAID'),
      contribution(413, 'Tatiane Rocha', 180, '2026-09-22T21:45:00.000Z', false, 'PAID'),
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
      rsvp('Rodrigo Pires', 'rpires@gmail.com', true, '25/09'),
      rsvp('Luana Dias', 'luana.dias@gmail.com', false, '24/09'),
      rsvp('Tiago Moura', 'tiago.moura@gmail.com', true, '23/09'),
      rsvp('Paula Reis', 'paula.reis@gmail.com', true, '20/09'),
    ],
    contributions: [
      contribution(388, 'Tiago Moura', 100, '2026-09-26T01:10:00.000Z', false, 'PAID'),
      contribution(380, 'Rodrigo Pires', 520, '2026-09-20T14:00:00.000Z', true, 'VERIFIED'),
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
    rsvps: [rsvp('Renata Gomes', 'renata.g@gmail.com', true, '27/09')],
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
      rsvp('Otávio Kern', 'otavio@kora.com.br', true, '01/09'),
      rsvp('Isabela Faria', 'isabela@kora.com.br', true, '02/09'),
      rsvp('Jonas Lemos', 'jonas@kora.com.br', false, '03/09'),
    ],
  }),
]

/** A fresh copy of the sample data, so each backend's writes stay its own. */
export const createDataset = (): Dataset =>
  JSON.parse(JSON.stringify({ accounts: ACCOUNTS, events: EVENTS }))
