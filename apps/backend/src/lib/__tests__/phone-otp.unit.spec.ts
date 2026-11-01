import { allow, issuePass, normaliseIndianMobile, readPass } from '../phone-otp'

describe('phone login helpers', () => {
  it.each([
    ['9876543210', '+919876543210'],
    ['+91 98765 43210', '+919876543210'],
    ['09876543210', '+919876543210'],
    ['919876543210', '+919876543210'],
    ['5876543210', null],
    ['98765', null],
  ])('normalises %s → %s', (input, out) => {
    expect(normaliseIndianMobile(input)).toBe(out)
  })

  it('issues a pass that reads back the same phone', () => {
    const { token } = issuePass('+919876543210')
    expect(readPass(token)).toBe('+919876543210')
  })

  it('rejects a tampered or garbage pass', () => {
    const { token } = issuePass('+919876543210')
    const [data, mac] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ p: '+919811122233', e: Date.now() + 60000 })).toString('base64url')
    expect(readPass(`${forged}.${mac}`)).toBeNull()
    expect(readPass(`${data}.x${mac.slice(1)}`)).toBeNull()
    expect(readPass('nonsense')).toBeNull()
    expect(readPass(undefined)).toBeNull()
  })

  it('rejects an expired pass', () => {
    jest.useFakeTimers()
    const { token } = issuePass('+919876543210')
    jest.setSystemTime(Date.now() + 31 * 60 * 1000)
    expect(readPass(token)).toBeNull()
    jest.useRealTimers()
  })

  it('rate limits per key', () => {
    expect([1, 2, 3, 4].map(() => allow('test:k', 3, 60000))).toEqual([true, true, true, false])
    expect(allow('test:other', 3, 60000)).toBe(true)
  })
})
