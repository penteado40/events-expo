import { Redirect, useLocalSearchParams } from 'expo-router'

import { NewEventScreen } from '@/features/events'

/** "Novo Event" in the Group the Início shows (`?groupId=`). Without a valid one, back to the Início. */
export default function NewEventRoute() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>()
  const id = Number(groupId)
  if (!groupId || !Number.isInteger(id) || id <= 0) return <Redirect href="/" />
  return <NewEventScreen groupId={id} />
}
