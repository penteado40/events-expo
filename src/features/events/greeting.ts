/** The greeting's name: the User's name up to the first space. */
export const firstName = (name: string) => name.split(' ')[0]

/** Today in the device's timezone, e.g. "qui., 1 de out.". */
export const formatToday = (now: Date) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).format(now)
