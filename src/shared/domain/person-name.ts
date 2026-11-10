/** The longest name the API takes for a User. */
export const NAME_MAX = 100

export const NAME_TOO_LONG = `Use um nome de até ${NAME_MAX} caracteres.`

/**
 * What is wrong with a name, already trimmed, or `null`. `missing` is the form's own wording for
 * an empty one ("Informe o nome." for someone else, "Informe seu nome." for oneself).
 */
export function nameProblem(name: string, missing: string): string | null {
  if (name === '') return missing
  if (name.length > NAME_MAX) return NAME_TOO_LONG
  return null
}
