import { useLocalSearchParams } from 'expo-router'

import { ParticipantsScreen } from '@/features/events'

/** "Quem vai": the Event's Participants, from its screen. */
export default function ParticipantsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ParticipantsScreen eventId={Number(id)} />
}
