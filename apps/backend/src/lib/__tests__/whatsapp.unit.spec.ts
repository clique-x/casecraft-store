import { orderAlertEmails, orderAlertWhatsappNumbers } from '../shop'
import { sendWhatsapp, whatsappEnabled } from '../whatsapp'

describe('owner alerts', () => {
  const env = { ...process.env }
  afterEach(() => {
    process.env = { ...env }
    jest.restoreAllMocks()
  })

  it('recipients: defaults, overrides and off', () => {
    delete process.env.ORDER_ALERT_EMAILS
    delete process.env.ORDER_ALERT_WHATSAPP
    expect(orderAlertEmails()).toEqual(['shambhvi91@gmail.com'])
    expect(orderAlertWhatsappNumbers()).toEqual(['+918077402898'])
    process.env.ORDER_ALERT_EMAILS = 'A@example.com, nonsense, b@example.com'
    process.env.ORDER_ALERT_WHATSAPP = '98765 43210, +44 7700 900123, 12'
    expect(orderAlertEmails()).toEqual(['a@example.com', 'b@example.com'])
    expect(orderAlertWhatsappNumbers()).toEqual(['+919876543210', '+447700900123'])
    process.env.ORDER_ALERT_EMAILS = ''
    process.env.ORDER_ALERT_WHATSAPP = ''
    expect(orderAlertEmails()).toEqual([])
    expect(orderAlertWhatsappNumbers()).toEqual([])
  })

  it('is off until the Twilio sender is set', () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC1'
    process.env.TWILIO_AUTH_TOKEN = 'token'
    delete process.env.TWILIO_WHATSAPP_FROM
    expect(whatsappEnabled()).toBe(false)
    process.env.TWILIO_WHATSAPP_FROM = '+14155238886'
    expect(whatsappEnabled()).toBe(true)
  })

  it('sends a template when one is given, the body otherwise', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC1'
    process.env.TWILIO_AUTH_TOKEN = 'token'
    process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886'
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ sid: 'SM1' }), { status: 201 }))

    expect(await sendWhatsapp({ to: '+918077402898', body: 'Hello', templateSid: 'HX1', variables: { '1': '1042' } })).toBe('SM1')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.twilio.com/2010-04-01/Accounts/AC1/Messages.json')
    const form = new URLSearchParams(init.body as string)
    expect(form.get('From')).toBe('whatsapp:+14155238886')
    expect(form.get('To')).toBe('whatsapp:+918077402898')
    expect(form.get('ContentSid')).toBe('HX1')
    expect(form.get('ContentVariables')).toBe('{"1":"1042"}')
    expect(form.has('Body')).toBe(false)

    await sendWhatsapp({ to: '+918077402898', body: 'Hello' })
    const plain = new URLSearchParams((fetchMock.mock.calls[1] as [string, RequestInit])[1].body as string)
    expect(plain.get('Body')).toBe('Hello')
    expect(plain.has('ContentSid')).toBe(false)
  })

  it('throws Twilio\'s reason when a message is refused', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC1'
    process.env.TWILIO_AUTH_TOKEN = 'token'
    process.env.TWILIO_WHATSAPP_FROM = '+14155238886'
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: 'Outside the allowed window', code: 63016 }), { status: 400 }))
    await expect(sendWhatsapp({ to: '+918077402898', body: 'Hello' })).rejects.toThrow('Outside the allowed window (code 63016)')
  })
})
