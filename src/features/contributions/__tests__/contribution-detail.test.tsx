import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Alert } from 'react-native'

import type { ContributionStatus } from '@/shared/domain/contributions'
import type { EventStatus } from '@/shared/domain/events'
import type { EventRole } from '@/shared/domain/roles'
import { eventCollectionKey } from '@/shared/lib/query-keys'

import { contributionsRepository } from '../api'
import { ContributionDetail } from '../components/contribution-detail'
import type { Contribution } from '../schemas'

const mockCloseSheet = jest.fn()
// The real sheet is native (gorhom + Reanimated); the detail only needs to be able to close it.
jest.mock('@/shared/components/ui/sheet', () => ({
  Sheet: () => null,
  useCloseSheet: () => mockCloseSheet,
}))

const contribution = (id: number, status: ContributionStatus): Contribution => ({
  id,
  guestName: 'Beatriz Nogueira',
  registryItemId: 121,
  amount: 450,
  status,
  paidAt: '2026-09-27T00:14:00.000Z',
  hasReceipt: true,
})

/** Ana & Rafael's sheet for one Contribution, as a viewer with that role (null: Super admin). */
async function renderSheet(
  item: Contribution,
  role: EventRole | null,
  status: EventStatus = 'ACTIVE',
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  })
  client.setQueryData(eventCollectionKey(12, 'contributions'), [item])
  const event = {
    id: 12,
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    status,
    membership: role ? { role, isPrimaryOwner: false } : null,
  }
  await render(
    <QueryClientProvider client={client}>
      <ContributionDetail
        event={event}
        contributionId={item.id}
        registryItemNames={new Map([[121, 'Jantar na lua de mel']])}
      />
    </QueryClientProvider>,
  )
}

/** Lets the Verification's last cache writes and their re-renders land inside the test. */
const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))

beforeEach(() => {
  mockCloseSheet.mockClear()
  jest
    .spyOn(contributionsRepository, 'verify')
    .mockImplementation(async (_, id) => contribution(id, 'VERIFIED'))
  jest
    .spyOn(contributionsRepository, 'reject')
    .mockImplementation(async (_, id) => contribution(id, 'REJECTED'))
})

afterEach(() => jest.restoreAllMocks())

describe('ContributionDetail: the Verification', () => {
  it.each<EventRole | null>(['OWNER', 'MANAGER', null])(
    'offers "Rejeitar" and "Verificar Pix" on a PAID one to %s',
    async (role) => {
      await renderSheet(contribution(301, 'PAID'), role)

      expect(screen.getByText('Rejeitar')).toBeTruthy()
      expect(screen.getByText('Verificar Pix')).toBeTruthy()
    },
  )

  it('verifies at once and closes the sheet, still showing it as it was', async () => {
    await renderSheet(contribution(301, 'PAID'), 'OWNER')

    await fireEvent.press(screen.getByText('Verificar Pix'))

    expect(contributionsRepository.verify).toHaveBeenCalledWith(12, 301)
    expect(mockCloseSheet).toHaveBeenCalledTimes(1)
    await settle()
    expect(screen.getByText('● pendente')).toBeTruthy()
    expect(screen.queryByText('rever · marcar como rejeitada')).toBeNull()
  })

  it('asks before rejecting, and rejects only once confirmed', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    await renderSheet(contribution(301, 'PAID'), 'OWNER')

    await fireEvent.press(screen.getByText('Rejeitar'))

    expect(alert).toHaveBeenCalledWith(
      'Rejeitar contribuição #301?',
      // formatMoney puts a no-break space after "R$".
      expect.stringMatching(/^O Pix de R\$\s450,00 de Beatriz Nogueira não chegou\?$/),
      expect.any(Array),
    )
    expect(contributionsRepository.reject).not.toHaveBeenCalled()
    const confirm = alert.mock.calls[0][2]?.find((button) => button.text === 'Rejeitar')
    await act(async () => confirm?.onPress?.())
    expect(contributionsRepository.reject).toHaveBeenCalledWith(12, 301)
    expect(mockCloseSheet).toHaveBeenCalledTimes(1)
    await settle()
  })

  it('tells a Viewer why there are no buttons', async () => {
    await renderSheet(contribution(301, 'PAID'), 'VIEWER')

    expect(screen.getByText('Viewers não fazem a conferência.')).toBeTruthy()
    expect(screen.queryByText('Verificar Pix')).toBeNull()
    expect(screen.queryByText('Rejeitar')).toBeNull()
  })

  it('offers a VERIFIED one only the revision to rejected, asking first', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    await renderSheet(contribution(298, 'VERIFIED'), 'OWNER')

    expect(screen.queryByText('Verificar Pix')).toBeNull()
    await fireEvent.press(screen.getByText('rever · marcar como rejeitada'))

    expect(alert).toHaveBeenCalledWith(
      'Marcar #298 como rejeitada?',
      'Ela sai do total verificado.',
      expect.any(Array),
    )
  })

  it("lets an archived Event's Owner revise a REJECTED one to verified, without asking", async () => {
    await renderSheet(contribution(290, 'REJECTED'), 'OWNER', 'ARCHIVED')

    await fireEvent.press(screen.getByText('rever · marcar como verificada'))

    expect(contributionsRepository.verify).toHaveBeenCalledWith(12, 290)
    await settle()
  })

  it('offers nothing to a Viewer on a decided one', async () => {
    await renderSheet(contribution(298, 'VERIFIED'), 'VIEWER')

    expect(screen.queryByText(/^rever/)).toBeNull()
  })
})
