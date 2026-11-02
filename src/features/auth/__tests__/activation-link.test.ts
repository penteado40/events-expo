import { activationTitle, readActivationLink } from '../activation-link'

describe('readActivationLink', () => {
  it('reads the ticket Clerk appends and what the events-api put in the link', () => {
    expect(
      readActivationLink({
        __clerk_ticket: 'tkt_123',
        __clerk_status: 'sign_up',
        inviter: 'Bruno Reis',
        group: 'Vocal Livre',
        name: 'Lu Andrade',
      }),
    ).toEqual({
      ticket: 'tkt_123',
      alreadyActive: false,
      inviter: 'Bruno Reis',
      group: 'Vocal Livre',
      name: 'Lu Andrade',
    })
  })

  it('leaves out what the link lacks, as in an invitation made in Clerk by hand', () => {
    expect(readActivationLink({ __clerk_ticket: 'tkt_123' })).toEqual({
      ticket: 'tkt_123',
      alreadyActive: false,
      inviter: null,
      group: null,
      name: null,
    })
  })

  it('has no ticket when the link came without one', () => {
    expect(readActivationLink({}).ticket).toBeNull()
  })

  it('knows an account Clerk already has: the invitation was accepted before', () => {
    expect(readActivationLink({ __clerk_ticket: 'tkt_123', __clerk_status: 'sign_in' })).toEqual(
      expect.objectContaining({ alreadyActive: true }),
    )
  })

  it('ignores blank values and takes the first of repeated ones', () => {
    expect(
      readActivationLink({ __clerk_ticket: ['tkt_1', 'tkt_2'], inviter: '  ', group: '' }),
    ).toEqual(expect.objectContaining({ ticket: 'tkt_1', inviter: null, group: null }))
  })
})

describe('activationTitle', () => {
  it.each([
    [{ inviter: 'Bruno Reis', group: 'Vocal Livre' }, 'Bruno te convidou para o Vocal Livre'],
    [{ inviter: null, group: 'Vocal Livre' }, 'Seu convite para o Vocal Livre'],
    [{ inviter: 'Bruno Reis', group: null }, 'Bruno te convidou'],
    [{ inviter: null, group: null }, 'Ative sua conta'],
  ])('%o → %s', (link, title) => {
    expect(activationTitle(link)).toBe(title)
  })
})
