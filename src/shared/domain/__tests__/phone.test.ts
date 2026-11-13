import {
  formatPhone,
  normalizePhone,
  phoneProblem,
  whatsappMessageUrl,
  whatsappUrl,
} from '../phone'

describe('normalizePhone', () => {
  it.each([
    ['+5527999990005', '+5527999990005'],
    ['+55 27 99999-0005', '+5527999990005'],
    ['+55 (27) 99999.0005', '+5527999990005'],
    ['  +1 415 555 2671 ', '+14155552671'],
  ])('turns %s into E.164', (raw, e164) => {
    expect(normalizePhone(raw)).toBe(e164)
  })

  it.each([
    ['without the country code', '27 99999-0005'],
    ['too short', '+55 2799'],
    ['too long', '+55 27 99999-0005 1234'],
    ['with a country code starting at 0', '+05527999990005'],
    ['with letters', '+55 27 9999A-0005'],
    ['empty', ''],
  ])('refuses a phone %s', (_, raw) => {
    expect(normalizePhone(raw)).toBeNull()
  })
})

describe('phoneProblem', () => {
  it.each(['+55 27 99999-0005', '+55 27 3333-4444', '+1 415 555 2671'])('accepts %s', (raw) => {
    expect(phoneProblem(raw)).toBeNull()
  })

  it.each([
    ['empty', '', 'Informe o telefone com DDI, como +55 27 99999-9999.'],
    ['without the country code', '27 99999-0005', 'Comece pelo DDI, como +55 27 99999-9999.'],
    ['too short', '+55 27 9973', 'Telefone incompleto. Use o formato +55 27 99999-9999.'],
    ['with letters', '+55 27 9999A-0005', 'Telefone inválido. Use o formato +55 27 99999-9999.'],
    ['too long', '+55 27 99999-0005 1234', 'Telefone inválido. Use o formato +55 27 99999-9999.'],
    [
      'from Brazil, too long for one',
      '+55 27 99999-00051',
      'Telefone inválido. Use o formato +55 27 99999-9999.',
    ],
  ])('says what is wrong with a phone %s', (_, raw, message) => {
    expect(phoneProblem(raw)).toBe(message)
  })
})

describe('formatPhone', () => {
  it.each([
    ['a Brazilian mobile', '+5527999990005', '+55 27 99999-0005'],
    ['a Brazilian landline', '+552733334444', '+55 27 3333-4444'],
    ['a phone of another country, as stored', '+14155552671', '+14155552671'],
    ['nothing', '', ''],
  ])('shows %s', (_, e164, shown) => {
    expect(formatPhone(e164)).toBe(shown)
  })
})

describe('whatsappUrl', () => {
  it('opens the conversation with a stored phone, by its digits', () => {
    expect(whatsappUrl('+5527999990005')).toBe('https://wa.me/5527999990005')
  })

  it('has no conversation to open without a phone', () => {
    expect(whatsappUrl('')).toBeNull()
  })
})

describe('whatsappMessageUrl', () => {
  it('opens the message to a typed phone, by its digits', () => {
    expect(whatsappMessageUrl('+55 27 98888-1234', 'Oi, Paula! https://x.test/a?b=1')).toBe(
      'https://wa.me/5527988881234?text=Oi%2C%20Paula!%20https%3A%2F%2Fx.test%2Fa%3Fb%3D1',
    )
  })

  it('lets the sender pick the contact when there is no phone', () => {
    expect(whatsappMessageUrl('', 'Oi')).toBe('https://wa.me/?text=Oi')
  })
})
