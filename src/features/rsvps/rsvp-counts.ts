/** The "RSVP · vão" and "RSVP · não vão" stats. */
export function rsvpCounts(rsvps: readonly { attending: boolean }[]) {
  const attending = rsvps.filter((r) => r.attending).length
  return { attending, notAttending: rsvps.length - attending }
}
