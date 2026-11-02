import { ApiError, networkError } from '@/shared/lib/api-error'

import { SignInError } from '../clerk-sign-in'
import { activationErrorMessage, sessionEndMessage, signInErrorMessage } from '../sign-in-messages'

const clerkError = (code: string) => ({
  code: 'api_response_error',
  message: 'Clerk message in English',
  errors: [{ code, message: 'Clerk message in English' }],
})

describe('signInErrorMessage', () => {
  it.each<[string, unknown, string]>([
    [
      'the API: no User has this email',
      new ApiError('USER_NOT_INVITED', 'x'),
      'Este e-mail não recebeu convite. Entre com o e-mail do convite da produção do seu Group.',
    ],
    [
      'the API: Deactivated user',
      new ApiError('USER_DEACTIVATED', 'x'),
      'Seu acesso foi retirado. Se for engano, fale com a produção do seu Group.',
    ],
    [
      'the API unreachable',
      networkError(),
      'Não foi possível conectar. Verifique sua internet e tente de novo.',
    ],
    [
      'another API error, with its message',
      new ApiError('INTERNAL_ERROR', 'Erro interno.'),
      'Erro interno.',
    ],
    ['Clerk: wrong password', clerkError('form_password_incorrect'), 'E-mail ou senha incorretos.'],
    [
      'Clerk: unknown email',
      clerkError('form_identifier_not_found'),
      'E-mail ou senha incorretos.',
    ],
    [
      'Clerk: wrong code',
      clerkError('form_code_incorrect'),
      'Código incorreto. Confira o e-mail e tente de novo.',
    ],
    [
      'Clerk: weak password',
      clerkError('form_password_pwned'),
      'Escolha outra senha, com pelo menos 8 caracteres e difícil de adivinhar.',
    ],
    [
      'Clerk: too many attempts',
      clerkError('too_many_requests'),
      'Muitas tentativas. Tente de novo em alguns minutos.',
    ],
    ...[
      'sign_up_mode_restricted',
      'not_allowed_to_sign_up',
      'invitation_account_not_exists',
      'external_account_not_found',
    ].map((code): [string, unknown, string] => [
      `Clerk in Restricted mode: ${code}`,
      clerkError(code),
      'Este e-mail não recebeu convite. Entre com o e-mail do convite da produção do seu Group.',
    ]),
    [
      'Clerk: locked after too many attempts',
      clerkError('user_locked'),
      'Muitas tentativas erradas: a conta foi bloqueada por um tempo. Tente mais tarde.',
    ],
    [
      'Google or Apple back without an account',
      new SignInError('sso_without_account'),
      'Este e-mail não recebeu convite. Entre com o e-mail do convite da produção do seu Group.',
    ],
    [
      "Clerk's error with the code at the top",
      { code: 'form_password_incorrect', message: 'x' },
      'E-mail ou senha incorretos.',
    ],
    ['anything else', new Error('boom'), 'Não foi possível entrar. Tente de novo.'],
  ])('%s', (_, error, expected) => {
    expect(signInErrorMessage(error)).toBe(expected)
  })
})

const LINK_GONE =
  'Este convite já foi usado ou não vale mais. Se você ainda não entrou, peça um novo à produção do seu Group.'
const OTHER_EMAIL = 'Essa conta não é do e-mail do convite. Entre com lu.andrade@example.com.'

describe('activationErrorMessage', () => {
  it.each<[string, unknown, string]>([
    ['Clerk: expired ticket', clerkError('ticket_expired_code'), LINK_GONE],
    ['Clerk: revoked or unknown ticket', clerkError('ticket_invalid_code'), LINK_GONE],
    ['Clerk: the invited account already exists', clerkError('form_identifier_exists'), LINK_GONE],
    [
      'the link was used before, or came without a ticket',
      new SignInError('activation_link_gone'),
      LINK_GONE,
    ],
    ['Google or Apple with another email', new SignInError('activation_other_email'), OTHER_EMAIL],
    [
      'Clerk in Restricted mode refusing another email',
      clerkError('sign_up_mode_restricted'),
      OTHER_EMAIL,
    ],
    [
      'Google or Apple back without an account',
      new SignInError('sso_without_account'),
      OTHER_EMAIL,
    ],
    ['the API: no User has this email', new ApiError('USER_NOT_INVITED', 'x'), OTHER_EMAIL],
    [
      'anything else, as the login says it',
      clerkError('form_password_pwned'),
      'Escolha outra senha, com pelo menos 8 caracteres e difícil de adivinhar.',
    ],
  ])('%s', (_, error, expected) => {
    expect(activationErrorMessage(error, 'lu.andrade@example.com')).toBe(expected)
  })

  it('names no email before Clerk has read the invitation', () => {
    expect(activationErrorMessage(new SignInError('activation_other_email'), null)).toBe(
      'Essa conta não é do e-mail do convite. Entre com o e-mail em que o convite chegou.',
    )
  })
})

describe('sessionEndMessage', () => {
  it.each([
    ['UNAUTHENTICATED', 'Sua sessão terminou. Entre de novo.'],
    [
      'USER_DEACTIVATED',
      'Seu acesso foi retirado. Se for engano, fale com a produção do seu Group.',
    ],
  ] as const)('%s', (reason, expected) => {
    expect(sessionEndMessage(reason)).toBe(expected)
  })
})
