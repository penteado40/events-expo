import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'

import { eventKey } from '@/shared/lib/query-keys'

import { EventDetailScreen } from '../components/event-detail-screen'
import type { DetailTab } from '../detail-tab'
import type { Event } from '../schemas'

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), replace: jest.fn() }) }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const event: Event = {
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
}

/** The detail of a cached Event, each tab's content naming its tab. */
async function renderDetail(initialTab?: DetailTab) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  })
  client.setQueryData(eventKey(12), event)
  await render(
    <QueryClientProvider client={client}>
      <EventDetailScreen
        id={12}
        initialTab={initialTab}
        summary={() => <Text>conteúdo Resumo</Text>}
        rsvps={() => <Text>conteúdo RSVPs</Text>}
        registry={() => <Text>conteúdo Presentes</Text>}
        contributions={() => <Text>conteúdo Conferir</Text>}
      />
    </QueryClientProvider>,
  )
}

describe('EventDetailScreen', () => {
  it('opens on Resumo by default', async () => {
    await renderDetail()

    expect(screen.getByText('conteúdo Resumo')).toBeOnTheScreen()
    expect(screen.getByRole('tab', { name: 'Resumo' })).toBeSelected()
  })

  it.each([
    ['rsvps', 'RSVPs', 'RSVPs'],
    ['contributions', 'Conferir', 'Conferir, com pendentes'],
  ] as const)('opens on the tab it is asked for (%s)', async (tab, content, tabName) => {
    await renderDetail(tab)

    expect(screen.getByText(`conteúdo ${content}`)).toBeOnTheScreen()
    expect(screen.queryByText('conteúdo Resumo')).toBeNull()
    expect(screen.getByRole('tab', { name: tabName })).toBeSelected()
  })

  it('still lets the viewer change tabs after opening on one', async () => {
    await renderDetail('rsvps')

    await fireEvent.press(screen.getByRole('tab', { name: 'Resumo' }))

    expect(screen.getByText('conteúdo Resumo')).toBeOnTheScreen()
  })
})
