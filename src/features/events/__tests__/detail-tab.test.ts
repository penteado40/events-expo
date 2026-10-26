import { detailHref, parseDetailTab } from '../detail-tab'

describe('parseDetailTab', () => {
  it.each(['summary', 'rsvps', 'registry', 'contributions'] as const)('opens on %s', (tab) => {
    expect(parseDetailTab(tab)).toBe(tab)
  })

  it.each([
    ['absent', undefined],
    ['unknown', 'members'],
    ['empty', ''],
    ['repeated', ['rsvps', 'contributions']],
  ])('falls back to Resumo when %s', (_, value) => {
    expect(parseDetailTab(value)).toBe('summary')
  })
})

describe('detailHref', () => {
  it('opens Resumo without a tab param', () => {
    expect(detailHref(12, 'summary')).toEqual({ pathname: '/events/[id]', params: { id: 12 } })
  })

  it.each(['rsvps', 'registry', 'contributions'] as const)('opens %s with its tab param', (tab) => {
    expect(detailHref(12, tab)).toEqual({ pathname: '/events/[id]', params: { id: 12, tab } })
  })
})
