import { checkLoginCode, dropLoginCode, issueLoginCode } from '../login-code'
import { normaliseEmail } from '../shop'

describe('email sign-in codes', () => {
  it('issues a 6-digit code that works once', () => {
    const code = issueLoginCode('a@example.com')
    expect(code).toMatch(/^\d{6}$/)
    expect(checkLoginCode('a@example.com', code)).toBe(true)
    expect(checkLoginCode('a@example.com', code)).toBe(false)
  })

  it('only works for the email it was sent to', () => {
    const code = issueLoginCode('b@example.com')
    expect(checkLoginCode('c@example.com', code)).toBe(false)
    expect(checkLoginCode('b@example.com', code)).toBe(true)
  })

  it('dies after five wrong guesses', () => {
    const code = issueLoginCode('d@example.com')
    const wrong = code === '000000' ? '111111' : '000000'
    for (let i = 0; i < 5; i++) expect(checkLoginCode('d@example.com', wrong)).toBe(false)
    expect(checkLoginCode('d@example.com', code)).toBe(false)
  })

  it('a new code replaces the old one, and a dropped code is gone', () => {
    const first = issueLoginCode('e@example.com')
    const second = issueLoginCode('e@example.com')
    if (first !== second) expect(checkLoginCode('e@example.com', first)).toBe(false)
    const third = issueLoginCode('e@example.com')
    dropLoginCode('e@example.com')
    expect(checkLoginCode('e@example.com', third)).toBe(false)
  })

  it('expires', () => {
    jest.useFakeTimers()
    const code = issueLoginCode('f@example.com')
    jest.advanceTimersByTime(11 * 60 * 1000)
    expect(checkLoginCode('f@example.com', code)).toBe(false)
    jest.useRealTimers()
  })

  it.each([
    [' Priya.Test@Example.com ', 'priya.test@example.com'],
    ['no-at-sign', null],
    ['a@b', null],
    ['', null],
  ])('normalises %s', (input, out) => {
    expect(normaliseEmail(input)).toBe(out)
  })
})
