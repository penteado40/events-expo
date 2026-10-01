/** The RSVPs tab's order: the most recent answer first. The app sorts, not the API. */
export function sortRsvps<R extends { createdAt: string }>(rsvps: readonly R[]): R[] {
  return [...rsvps].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}
