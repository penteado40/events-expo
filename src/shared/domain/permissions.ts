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
