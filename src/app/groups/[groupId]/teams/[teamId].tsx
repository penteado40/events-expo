import { useLocalSearchParams } from 'expo-router'

import { TeamScreen } from '@/features/groups'

/** A Team of the Group, from the Teams tab. */
export default function TeamRoute() {
  const { groupId, teamId } = useLocalSearchParams<{ groupId: string; teamId: string }>()
  return <TeamScreen groupId={Number(groupId)} teamId={Number(teamId)} />
}
