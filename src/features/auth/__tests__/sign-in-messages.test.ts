import { ApiError, networkError } from '@/shared/lib/api-error'

import { SignInError } from '../clerk-sign-in'
import { sessionEndMessage, signInErrorMessage } from '../sign-in-messages'

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
