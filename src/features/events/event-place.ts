import type { EventType } from '@/shared/domain/events'

const TYPE_LABELS: Record<EventType, string> = {
  WEDDING: 'Casamento',
  BIRTHDAY: 'Aniversário',
  CORPORATE: 'Corporativo',
  BABY_SHOWER: 'Chá de bebê',
  PARTY: 'Festa',
  OTHER: 'Outro',
}

export const eventTypeLabel = (type: EventType) => TYPE_LABELS[type]

/** `Tipo · Cidade, UF`, or just the type when the Event has no city. */
export const eventPlace = ({ type, city }: { type: EventType; city: string | null }) =>
  city ? `${eventTypeLabel(type)} · ${city}` : eventTypeLabel(type)
