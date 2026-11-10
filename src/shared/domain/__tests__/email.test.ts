import { isEmail } from '../email'

describe('isEmail', () => {
  it.each(['paula@example.com', 'a.b+c@sub.example.com.br'])('takes %s', (value) => {
    expect(isEmail(value)).toBe(true)
  })

  it.each(['', 'paula', 'paula@', 'paula@example', 'pa ula@example.com'])(
    'refuses "%s"',
    (value) => {
      expect(isEmail(value)).toBe(false)
    },
  )
})
