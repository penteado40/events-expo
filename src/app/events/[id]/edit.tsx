import { useLocalSearchParams } from 'expo-router'

import { EditEventScreen } from '@/features/events'

export default function EditEventRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <EditEventScreen eventId={Number(id)} />
}
