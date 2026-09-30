import { siteLabel } from '../site-label'

describe('siteLabel', () => {
  it.each([
    ['https://anaerafael.com.br', 'anaerafael.com.br'],
    ['http://offsite.kora.com.br/', 'offsite.kora.com.br'],
    ['https://site.com.br/ana-e-rafael', 'site.com.br/ana-e-rafael'],
  ])('%s → %s', (url, expected) => {
    expect(siteLabel(url)).toBe(expected)
  })
})
