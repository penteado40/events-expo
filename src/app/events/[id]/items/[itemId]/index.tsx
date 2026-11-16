import { useLocalSearchParams } from 'expo-router'

import { ItemScreen } from '@/features/events'

/** An Event item as a Participant reads it, from the Summary or the Timeline. */
export default function ItemRoute() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>()
  return <ItemScreen eventId={Number(id)} itemId={Number(itemId)} />
}
