import { ApiError } from '@/shared/lib/api-error'
import type { SessionEndReason } from '@/shared/session'

const NOT_INVITED =
  'Este e-mail não recebeu convite. Entre com o e-mail do convite da produção do seu Group.'
const DEACTIVATED = 'Seu acesso foi retirado. Se for engano, fale com a produção do seu Group.'
const WRONG_CREDENTIALS = 'E-mail ou senha incorretos.'
const WEAK_PASSWORD = 'Escolha outra senha, com pelo menos 8 caracteres e difícil de adivinhar.'

/**
 * Clerk's error codes the person can act on (its `ERROR_CODES`, @clerk/shared); Clerk's own
 * messages are in English.
 */
const CLERK_MESSAGES: Record<string, string> = {
  form_password_incorrect: WRONG_CREDENTIALS,
  form_identifier_not_found: WRONG_CREDENTIALS,
  form_code_incorrect: 'Código incorreto. Confira o e-mail e tente de novo.',
  verification_expired: 'O código expirou. Peça outro.',
  form_password_pwned: WEAK_PASSWORD,
  form_password_length_too_short: WEAK_PASSWORD,
  form_password_validation_failed: WEAK_PASSWORD,
  too_many_requests: 'Muitas tentativas. Tente de novo em alguns minutos.',
  user_locked: 'Muitas tentativas erradas: a conta foi bloqueada por um tempo. Tente mais tarde.',
  // No open sign-up (events-api ADR-0020, Clerk in Restricted mode): Google or Apple with an
  // email nobody invited.
  sign_up_mode_restricted: NOT_INVITED,
  not_allowed_to_sign_up: NOT_INVITED,
  invitation_account_not_exists: NOT_INVITED,
  external_account_not_found: NOT_INVITED,
  // The app's own (SignInError): Google or Apple came back without an account to sign in.
  sso_without_account: NOT_INVITED,
}

const API_MESSAGES: Record<string, string> = {
  USER_NOT_INVITED: NOT_INVITED,
  USER_DEACTIVATED: DEACTIVATED,
}

/** A Clerk error's code: in `errors[0]` for an API response, else at the top. */
function clerkCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const { code, errors } = error as { code?: unknown; errors?: { code?: unknown }[] }
  const first = Array.isArray(errors) ? errors[0]?.code : undefined
  if (typeof first === 'string') return first
  return typeof code === 'string' ? code : undefined
}

/** What the login screens say about a failed sign-in, from the API or from Clerk, in pt-BR. */
export function signInErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return API_MESSAGES[error.code] ?? error.message
  const code = clerkCode(error)
  return (code && CLERK_MESSAGES[code]) || 'Não foi possível entrar. Tente de novo.'
}

/** What the login says when the API ended the last Session. */
export function sessionEndMessage(reason: SessionEndReason): string {
  return reason === 'USER_DEACTIVATED' ? DEACTIVATED : 'Sua sessão terminou. Entre de novo.'
}
