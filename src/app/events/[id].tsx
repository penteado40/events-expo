import { useLocalSearchParams } from 'expo-router'

import { EventDetailScreen } from '@/features/events'

export default function EventDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <EventDetailScreen id={Number(id)} />
}
