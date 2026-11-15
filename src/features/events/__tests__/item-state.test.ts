import { itemActions } from '../item-state'

describe('itemActions', () => {
  const none = { edit: false, publish: false, cancel: false, uncancel: false, delete: false }
  it.each<[Parameters<typeof itemActions>[0], Parameters<typeof itemActions>[1], object]>([
    ['DRAFT', 'PUBLISHED', { ...none, edit: true, publish: true, delete: true }],
    ['PUBLISHED', 'PUBLISHED', { ...none, edit: true, cancel: true }],
    ['CANCELLED', 'PUBLISHED', { ...none, uncancel: true }],
    // In an Event in Draft, nobody sees its items yet: a published one is deleted too.
    ['PUBLISHED', 'DRAFT', { ...none, edit: true, cancel: true, delete: true }],
    ['CANCELLED', 'DRAFT', { ...none, uncancel: true }],
  ])('an item %s in an Event %s offers %o', (item, event, actions) => {
    expect(itemActions(item, event)).toEqual(actions)
  })
})
