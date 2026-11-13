import { useLocalSearchParams } from 'expo-router'

import { NewItemScreen } from '@/features/events'

export default function NewItemRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <NewItemScreen eventId={Number(id)} />
}
