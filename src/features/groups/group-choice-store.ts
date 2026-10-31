import { z } from 'zod'

import { createPersistedStore } from '@/shared/session/create-persisted-store'

type GroupChoiceState = {
  /** The Group each User last chose on this device, by User id. */
  chosenBy: Record<number, number>
  hydrated: boolean
  choose: (userId: number, groupId: number) => void
}

const storedSchema = z.object({ chosenBy: z.record(z.string(), z.number().int()) })

/** The Group chosen in the "Seus Groups" sheet, remembered per User across app launches. */
export function createGroupChoiceStore() {
  return createPersistedStore<GroupChoiceState, Pick<GroupChoiceState, 'chosenBy'>>(
    (set) => ({
      chosenBy: {},
      hydrated: false,
      choose: (userId, groupId) =>
        set((state) => ({ chosenBy: { ...state.chosenBy, [userId]: groupId } })),
    }),
    {
      name: 'group-choice',
      partialize: (state) => ({ chosenBy: state.chosenBy }),
      // Anything malformed is forgotten: the Início falls back to the first Group.
      merge: (persisted, current) => {
        const stored = storedSchema.safeParse(persisted)
        return stored.success ? { ...current, chosenBy: stored.data.chosenBy } : current
      },
    },
  )
}

export const useGroupChoice = createGroupChoiceStore()
