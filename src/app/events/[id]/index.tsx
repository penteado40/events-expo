import { useLocalSearchParams } from 'expo-router'

import { EventScreen } from '@/features/events'

export default function EventRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <EventScreen eventId={Number(id)} />
}
