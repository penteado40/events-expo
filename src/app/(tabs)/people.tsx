import { refreshSessionUser } from '@/features/auth'
import { GroupHome, GroupPeople } from '@/features/groups'

/** Pessoas: the people and Teams of the current Group (or none yet). */
export default function PeopleScreen() {
  return (
    <GroupHome onRefresh={refreshSessionUser}>
      {({ group, refresh }) => <GroupPeople group={group} onRefresh={refresh} />}
    </GroupHome>
  )
}
