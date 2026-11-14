import type { GroupMember } from '@/shared/domain/group-member'
import type { Team } from '@/shared/domain/team'

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

/** "Marcar Team": a Team and who of it marking it would add, none once all of them go. */
export type TeamShortcut = { id: number; name: string; missing: number[] }

export type ParticipantsList = {
  rows: ParticipantRow[]
  /** "20 de 30": the Group members who go, out of all of them. */
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
  const people: { userId: number; name: string; role: GroupMember['role'] | null }[] = [
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

  const shortcuts = teams.map(({ id, name, memberIds: inTeam }) => ({
    id,
    name,
    missing: inTeam.filter((userId) => memberIds.has(userId) && !goingIds.has(userId)),
  }))
  const going = members.filter((m) => goingIds.has(m.userId)).length

  return { rows, count: { going, group: members.length }, shortcuts }
}
