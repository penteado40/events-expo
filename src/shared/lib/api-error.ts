/** Stable error codes from the events-api contract (ADR-0008), plus `NETWORK` for unreachable API. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'NETWORK'

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
