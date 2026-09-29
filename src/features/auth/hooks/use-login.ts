import { useMutation } from '@tanstack/react-query'

import type { ApiError } from '@/shared/lib/api-error'
import { useLastEmail, useSession } from '@/shared/session'

import { authRepository } from '../api'
import type { LoginInput, LoginResponse } from '../schemas'

/** "Entrar": logs in against the API, opens a Live session and remembers the email. */
export function useLogin() {
  return useMutation<LoginResponse, ApiError, LoginInput>({
    mutationFn: (input) => authRepository.login(input),
    onSuccess: ({ token, user }, { email }) => {
      useSession.getState().signIn({ token, user, live: true })
      useLastEmail.getState().setEmail(email)
    },
  })
}
