import { useMutation } from '@tanstack/react-query'

import type { ApiError } from '@/shared/lib/api-error'
import { useLastEmail, useSession } from '@/shared/session'

import { authRepository } from '../api'
import type { LoginInput, LoginResponse } from '../schemas'

/** "Entrar": logs in, opens the Session and remembers the email. */
export function useLogin() {
  return useMutation<LoginResponse, ApiError, LoginInput>({
    mutationFn: (input) => authRepository.login(input),
    onSuccess: ({ token, user }, { email }) => {
      useSession.getState().signIn({ token, user, live: false })
      useLastEmail.getState().setEmail(email)
    },
  })
}
