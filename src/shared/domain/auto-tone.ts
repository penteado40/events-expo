import type { Tone } from '@/shared/theme'

/** The categorical tones an Event or a Team can take, in turn. Never the brand blue. */
export const AUTO_TONES = ['coral', 'green', 'purple', 'pink', 'turquoise', 'gold'] as const

export type AutoTone = (typeof AUTO_TONES)[number] & Tone

/**
 * The automatic color of an Event or a Team (PROJ-210): picked from its id, so it is stable and
 * the API has no field for it. Ids in a row get different tones.
 */
export function autoTone(id: number): AutoTone {
  const count = AUTO_TONES.length
  return AUTO_TONES[(((id - 1) % count) + count) % count]
}
