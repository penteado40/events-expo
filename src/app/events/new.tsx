import { useLocalSearchParams } from 'expo-router'

import { NewEventScreen } from '@/features/events'

/** "Novo Event" in the Group the Início shows (`?groupId=`). */
export default function NewEventRoute() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  return <NewEventScreen groupId={Number(groupId)} />
}
