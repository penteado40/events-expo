import { useMutation } from '@tanstack/react-query'

import { useSession, type User } from '@/shared/session'

import { profileRepository, type ProfileChanges } from '../api'

/**
 * Saves the name and phone (`PATCH /me`) and puts the answer in the Session, so the Perfil and
 * everything else reading the User show it at once.
 */
export function useUpdateProfile() {
  return useMutation<User, unknown, ProfileChanges>({
    mutationFn: async (changes) => {
      const sessionId = useSession.getState().session?.id
      const user = await profileRepository.updateMe(changes)
      if (sessionId) useSession.getState().updateUser(sessionId, user)
      return user
    },
  })
}
