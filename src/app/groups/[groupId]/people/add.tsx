import { useLocalSearchParams } from 'expo-router'

import { AddPersonScreen } from '@/features/groups'

/** "Adicionar pessoa", over the Pessoas tab. */
export default function AddPersonRoute() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  return <AddPersonScreen groupId={Number(groupId)} />
}
