import { rsvpCounts } from '../rsvp-counts'

describe('rsvpCounts', () => {
  it('counts who is going and who is not', () => {
    const rsvps = [true, false, true, true, false, true, true].map((attending) => ({ attending }))

    expect(rsvpCounts(rsvps)).toEqual({ attending: 5, notAttending: 2 })
  })

  it('is zero on both sides with no RSVPs', () => {
    expect(rsvpCounts([])).toEqual({ attending: 0, notAttending: 0 })
  })
})
