import { useLocalSearchParams } from 'expo-router'

import { TimelineScreen } from '@/features/events'

export default function TimelineRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <TimelineScreen eventId={Number(id)} />
}
