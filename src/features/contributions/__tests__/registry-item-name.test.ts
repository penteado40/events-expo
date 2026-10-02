import { registryItemName } from '../registry-item-name'

describe('registryItemName', () => {
  const names = new Map([[121, 'Jantar na lua de mel']])

  it("names the Contribution's Registry item", () => {
    expect(registryItemName(names, 121)).toBe('Jantar na lua de mel')
  })

  it('is "—" when the item is not in the Registry (or the Registry failed to load)', () => {
    expect(registryItemName(names, 999)).toBe('—')
    expect(registryItemName(new Map(), 121)).toBe('—')
  })

  it('is undefined while the Registry loads, for a skeleton to show', () => {
    expect(registryItemName(undefined, 121)).toBeUndefined()
  })
})
