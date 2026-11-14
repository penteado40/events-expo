import type { GroupMember, Team } from './schemas'

export type TeamRef = { id: number; name: string }

/** A Group member with their Teams, in the API's name order: the first one colors the avatar. */
export type Person = GroupMember & { teams: TeamRef[] }

/** A Team with how many of the Group members are in it. */
export type TeamSummary = TeamRef & { memberCount: number }

/**
 * Joins the Group members and the Teams (two lists from the API): each person's Teams and each
 * Team's count. Someone a Team still names but who is no longer a Group member does not count.
 */
export function joinPeopleAndTeams(
  members: GroupMember[],
  teams: Team[],
): { people: Person[]; teams: TeamSummary[] } {
  const memberIds = new Set(members.map((m) => m.userId))
  return {
    people: members.map((member) => ({
      ...member,
      teams: teams
        .filter((t) => t.memberIds.includes(member.userId))
        .map(({ id, name }) => ({ id, name })),
    })),
    teams: teams.map(({ id, name, memberIds: ids }) => ({
      id,
      name,
      memberCount: ids.filter((userId) => memberIds.has(userId)).length,
    })),
  }
}

/**
 * A Team's screen: the Group members in it and the ones who could join, each by name. Someone the
 * Team still names but who is no longer a Group member is in neither, as in `joinPeopleAndTeams`.
 */
export function teamPeople(
  members: GroupMember[],
  team: Team,
): { inTeam: GroupMember[]; outside: GroupMember[] } {
  const byName = [...members].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  return {
    inTeam: byName.filter((m) => team.memberIds.includes(m.userId)),
    outside: byName.filter((m) => !team.memberIds.includes(m.userId)),
  }
}
