import type { GroupMember, Team } from '@/shared/domain/group-people'

import type { Participant } from './schemas'

/** A person on the Participants screen (D-Participants). */
export type ParticipantRow = {
  userId: number
  name: string
  going: boolean
  /** Under the name: their Teams, "Owner" and "não vai" ("Produção · Owner"). */
  detail: string
  /** Their first Team, which colors the avatar; none for someone in no Team. */
  firstTeamId: number | null
}

/** "Marcar Team": a Team, how many of its people go, and who marking it would add. */
export type TeamShortcut = {
  id: number
  name: string
  going: number
  total: number
  missing: number[]
}

export type ParticipantsList = {
  rows: ParticipantRow[]
  /** "20 de 30": who goes, out of the Group members. */
  count: { going: number; group: number }
  shortcuts: TeamShortcut[]
}

/**
 * The Participants screen from three lists of the API: the Group members, the Teams and who goes.
 * Who edits sees the whole Group, each marked going or not, and a shortcut per Team; who only reads
 * sees who goes. A Team counts only who is still a Group member; a Participant no longer in the
 * Group is still listed, with no detail.
 */
export function participantsList(
  members: GroupMember[],
  teams: Team[],
  participants: Participant[],
  { editable }: { editable: boolean },
): ParticipantsList {
  const goingIds = new Set(participants.map((p) => p.userId))
  const memberIds = new Set(members.map((m) => m.userId))
  const people: { userId: number; name: string; role: 'OWNER' | 'VIEWER' | null }[] = [
    ...members.map(({ userId, name, role }) => ({ userId, name, role })),
    ...participants
      .filter((p) => !memberIds.has(p.userId))
      .map(({ userId, name }) => ({ userId, name, role: null })),
  ]

  const rows = people
    .filter((person) => editable || goingIds.has(person.userId))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map(({ userId, name, role }): ParticipantRow => {
      const going = goingIds.has(userId)
      const own = role === null ? [] : teams.filter((t) => t.memberIds.includes(userId))
      const detail = [
        own.map((t) => t.name).join(', '),
        role === 'OWNER' ? 'Owner' : '',
        going ? '' : 'não vai',
      ]
        .filter(Boolean)
        .join(' · ')
      return { userId, name, going, detail, firstTeamId: own[0]?.id ?? null }
    })

  const shortcuts = teams.map(({ id, name, memberIds: inTeam }) => {
    const current = inTeam.filter((userId) => memberIds.has(userId))
    const missing = current.filter((userId) => !goingIds.has(userId))
    return { id, name, going: current.length - missing.length, total: current.length, missing }
  })

  return { rows, count: { going: participants.length, group: members.length }, shortcuts }
}
