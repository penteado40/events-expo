import { useLocalSearchParams } from 'expo-router'

import { EditItemScreen } from '@/features/events'

export default function EditItemRoute() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>()
  return <EditItemScreen eventId={Number(id)} itemId={Number(itemId)} />
}
