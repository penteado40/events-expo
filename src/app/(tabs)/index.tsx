import { refreshSessionUser } from '@/features/auth'
import { EventsHome } from '@/features/events'
import { GroupHome } from '@/features/groups'

/** Início: the current Group (or none yet) around its list of Events. */
export default function HomeScreen() {
  return (
    // "Atualizar" also re-reads the User, so a role just given comes with the Group.
    <GroupHome onRefresh={refreshSessionUser}>
      {({ group, switcher }) => (
        <EventsHome
          groupId={group.id}
          viewer={{
            canSeeDrafts: group.role !== 'VIEWER',
            isMember: group.role !== 'SUPER_ADMIN',
          }}
          groupSwitcher={switcher}
        />
      )}
    </GroupHome>
  )
}
