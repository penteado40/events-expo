/** Something like an email (`a@b.c`): the form's check; the events-api checks it again. */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
