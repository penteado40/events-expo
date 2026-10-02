import { parseDetailTab } from '../detail-tab'

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
