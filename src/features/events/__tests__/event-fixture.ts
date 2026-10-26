import type { Event } from '../schemas'

/** An active Event the viewer is Primary owner of (Ana & Rafael), with `fields` changed. */
export const eventFixture = (fields: Partial<Event> = {}): Event => ({
  id: 12,
  type: 'WEDDING',
  status: 'ACTIVE',
  name: 'Ana & Rafael',
  slug: 'ana-e-rafael',
  siteUrl: 'https://anaerafael.com.br',
  startsAt: '2026-11-14T19:30:00.000Z',
  endsAt: null,
  timezone: 'America/Sao_Paulo',
  locale: 'pt-BR',
  currency: 'BRL',
  venueName: 'Fazenda Santa Clara',
  venueAddress: null,
  city: 'Itu, SP',
  mapsUrl: null,
  membership: { role: 'OWNER', isPrimaryOwner: true },
  paidContributionCount: 3,
  summary: { rsvpCount: 5, verifiedAmount: 1090, registryItemCount: 5 },
  ...fields,
})
