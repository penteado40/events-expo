import type { GroupRole } from '@/shared/domain/group-role'

import { audienceMark, itemActions, lastChangeText, type ItemActions } from '../item-state'
import type { Event, EventItem } from '../schemas'

describe('itemActions', () => {
  const none: ItemActions = {
    edit: false,
    publish: false,
    cancel: false,
    uncancel: false,
    delete: false,
  }
  const published = { state: 'PUBLISHED', cancelled: false } as const
  const inDraft = { state: 'DRAFT', cancelled: false } as const
  const cancelled = { state: 'PUBLISHED', cancelled: true } as const

  type Row = [GroupRole, Pick<Event, 'state' | 'cancelled'>, EventItem['state'], ItemActions]
  it.each<Row>([
    // An Owner, by the item's state: in Draft, edited, published or deleted; published, edited or
    // cancelled; Cancelled, frozen, only uncancelled.
    ['OWNER', published, 'DRAFT', { ...none, edit: true, publish: true, delete: true }],
    ['OWNER', published, 'PUBLISHED', { ...none, edit: true, cancel: true }],
    ['OWNER', published, 'CANCELLED', { ...none, uncancel: true }],
    // In an Event in Draft, nobody sees its items yet: a published one is deleted too.
    ['OWNER', inDraft, 'PUBLISHED', { ...none, edit: true, cancel: true, delete: true }],
    ['OWNER', inDraft, 'CANCELLED', { ...none, uncancel: true }],
    // A Cancelled Event is frozen, items and all, until it is un-cancelled.
    ['OWNER', cancelled, 'DRAFT', none],
    ['OWNER', cancelled, 'PUBLISHED', none],
    ['OWNER', cancelled, 'CANCELLED', none],
    // The Super admin writes like an Owner.
    ['SUPER_ADMIN', published, 'DRAFT', { ...none, edit: true, publish: true, delete: true }],
    ['SUPER_ADMIN', published, 'PUBLISHED', { ...none, edit: true, cancel: true }],
    ['SUPER_ADMIN', cancelled, 'PUBLISHED', none],
    // A Viewer only reads, a Participant or not.
    ['VIEWER', published, 'DRAFT', none],
    ['VIEWER', published, 'PUBLISHED', none],
    ['VIEWER', published, 'CANCELLED', none],
    ['VIEWER', inDraft, 'PUBLISHED', none],
  ])('%s, in an Event %o, has for an item %s: %o', (role, event, item, actions) => {
    expect(itemActions(role, event, item)).toEqual(actions)
  })

  it('keeps the actions of a Finished event: its period over, it is still edited', () => {
    // A Finished event is a published one whose period is over: nothing in it says so.
    const finished = { state: 'PUBLISHED', cancelled: false } as const
    expect(itemActions('OWNER', finished, 'PUBLISHED')).toEqual({
      ...none,
      edit: true,
      cancel: true,
    })
  })
})

describe('lastChangeText', () => {
  const now = new Date('2026-11-21T22:00:00.000Z')
  const twoHoursAgo = '2026-11-21T20:00:00.000Z'

  it('says who changed the item last and when: "Alterado por Bruno Reis há 2 h"', () => {
    const item = { updatedAt: twoHoursAgo, updatedBy: { id: 2, name: 'Bruno Reis' } }
    expect(lastChangeText(item, now)).toBe('Alterado por Bruno Reis há 2 h')
  })

  it('says only when for a write by no User (a platform script)', () => {
    expect(lastChangeText({ updatedAt: twoHoursAgo, updatedBy: null }, now)).toBe('Alterado há 2 h')
  })

  it('reads "agora" right after the change', () => {
    const item = { updatedAt: now.toISOString(), updatedBy: { id: 2, name: 'Bruno Reis' } }
    expect(lastChangeText(item, now)).toBe('Alterado por Bruno Reis agora')
  })

  it('says nothing while the API does not send when', () => {
    expect(lastChangeText({ updatedAt: null, updatedBy: null }, now)).toBeNull()
  })
})

describe('audienceMark', () => {
  it('marks nothing on an item for "Todos que vão"', () => {
    expect(audienceMark({ kind: 'ALL' })).toBeNull()
  })

  it.each([
    [[5], { badge: 'SÓ 1 PESSOA', spoken: 'só 1 pessoa vê' }],
    [[3, 5, 7], { badge: 'SÓ 3 PESSOAS', spoken: 'só 3 pessoas veem' }],
  ])('marks an item of a chosen list %o with how many it has: %o', (userIds, mark) => {
    expect(audienceMark({ kind: 'SELECTED', userIds })).toEqual(mark)
  })
})
