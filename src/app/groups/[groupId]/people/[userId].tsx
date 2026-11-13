import { useLocalSearchParams } from 'expo-router'

import { PersonScreen } from '@/features/groups'

/** A person of the Group, from the Pessoas tab. */
export default function PersonRoute() {
  const { groupId, userId } = useLocalSearchParams<{ groupId: string; userId: string }>()
  return <PersonScreen groupId={Number(groupId)} userId={Number(userId)} />
}
