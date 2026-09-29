/** Stable error codes from the events-api contract (ADR-0008), plus `NETWORK` for unreachable API. */
export type KnownApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'NETWORK'

/** A known code, or any other the API sends (e.g. `USER_PENDING`), shown with the API's message. */
// `string & {}` keeps editor completion for the known codes.
export type ApiErrorCode = KnownApiErrorCode | (string & {})

/** An error in the API's `{ error: { code, message, details? } }` shape, from HTTP or the mock. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Invalid input, as both the API and the client-side form check report it. */
export const validationError = (details?: unknown) =>
  new ApiError('VALIDATION_ERROR', 'Dados inválidos.', details)

/** The API could not be reached (fetch failure or timeout). Never names the server. */
export const networkError = (cause?: unknown) =>
  new ApiError('NETWORK', 'Não foi possível conectar. Verifique sua internet e tente de novo.', {
    cause,
  })

/** The API answered with something that is not the contract. Same message as the API's own. */
export const internalError = (details?: unknown) =>
  new ApiError('INTERNAL_ERROR', 'Erro interno. Tente novamente mais tarde.', details)
