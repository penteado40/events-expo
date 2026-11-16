import type { GroupRole } from './group-role'

/** What a person may change in a Group. Only hides actions: the API decides. */
export type GroupPermissions = {
  /** Add, remove and invite people (the API's `manageViewers`). */
  managesPeople: boolean
  managesTeams: boolean
}

/** The person's permissions from their role in the Group: a Viewer only reads. */
export function groupPermissions(role: GroupRole): GroupPermissions {
  const manages = role !== 'VIEWER'
  return { managesPeople: manages, managesTeams: manages }
}

/** What a person may do in an Event, by their role, the Event's state and whether they go. */
export type EventPermissions = {
  /** Name, place and period; a Finished event too, never a Cancelled one (frozen). */
  editsEvent: boolean
  /** Create, edit and move its items: frozen like the Event while it is Cancelled. */
  editsItems: boolean
  /** Only a Draft is published (story 55). */
  publishes: boolean
  /** Items in Draft, and the Event's own Draft badge: the production's. */
  seesDrafts: boolean
  /**
   * The schedule (the Summary and the Timeline): the production always; a Viewer only as a
   * Participant of a published Event, a Cancelled one too, frozen for reference (story 48).
   */
  seesSchedule: boolean
}

/**
 * The person's permissions in an Event (PRD, pure modules): Owners and the Super admin write it
 * unless Cancelled and see it all; a Viewer only reads, and sees the schedule only where it is
 * theirs. `isParticipant` is `null` where the API does not say (the Super admin). Only hides
 * actions: the API decides.
 */
export function eventPermissions(
  role: GroupRole,
  event: { state: 'DRAFT' | 'PUBLISHED'; cancelled: boolean; isParticipant: boolean | null },
): EventPermissions {
  if (role === 'VIEWER') {
    return {
      editsEvent: false,
      editsItems: false,
      publishes: false,
      seesDrafts: false,
      seesSchedule: event.isParticipant === true && event.state === 'PUBLISHED',
    }
  }
  const edits = !event.cancelled
  return {
    editsEvent: edits,
    editsItems: edits,
    publishes: edits && event.state === 'DRAFT',
    seesDrafts: true,
    seesSchedule: true,
  }
}
