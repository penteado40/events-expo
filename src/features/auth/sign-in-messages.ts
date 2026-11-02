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

const LINK_GONE =
  'Este convite já foi usado ou não vale mais. Se você ainda não entrou, peça um novo à produção do seu Group.'

/** Clerk's and the app's codes for an Activation link that can't be used: used, revoked, expired. */
const LINK_GONE_CODES = new Set([
  'ticket_expired_code',
  'ticket_invalid_code',
  // The ticket's account exists already: the invitation was accepted before.
  'form_identifier_exists',
  'activation_link_gone',
])

/** Every way an account of another email is refused, by Clerk, the app or the API. */
const OTHER_EMAIL_CODES = new Set([
  ...Object.keys(CLERK_MESSAGES).filter((code) => CLERK_MESSAGES[code] === NOT_INVITED),
  'activation_other_email',
  'USER_NOT_INVITED',
])

/**
 * What "Ativar conta" says about a failure: a link that no longer works asks for a new one; an
 * account of another email names the invitation's; anything else as the login says it.
 */
export function activationErrorMessage(error: unknown, invitedEmail: string | null): string {
  const code = error instanceof ApiError ? error.code : clerkCode(error)
  if (code && LINK_GONE_CODES.has(code)) return LINK_GONE
  if (code && OTHER_EMAIL_CODES.has(code)) {
    return `Essa conta não é do e-mail do convite. Entre com ${invitedEmail ?? 'o e-mail em que o convite chegou'}.`
  }
  return signInErrorMessage(error)
}

/** What the login says when the API ended the last Session. */
export function sessionEndMessage(reason: SessionEndReason): string {
  return reason === 'USER_DEACTIVATED' ? DEACTIVATED : 'Sua sessão terminou. Entre de novo.'
}
