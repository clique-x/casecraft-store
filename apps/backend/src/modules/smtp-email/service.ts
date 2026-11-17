import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from '@medusajs/framework/types'
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/framework/utils'
import nodemailer, { type Transporter } from 'nodemailer'

export interface SmtpEmailOptions {
  /** e.g. smtp.hostinger.com, smtp.zoho.in, smtp.resend.com. */
  host?: string
  /** 465 (SSL, the default) or 587 (STARTTLS). */
  port?: number
  user?: string
  pass?: string
  /** Sender, e.g. "GadgetsHub <orders@gadgetshub.io>". Most providers only send from the mailbox you log in with. */
  from: string
  /** Where customers' replies go, e.g. the support inbox. */
  reply_to?: string
  /** Local development: write each email to this folder as .html and .txt instead of sending it. */
  preview_dir?: string
}

/**
 * Sends the shop's emails (sign-in codes, order confirmations, shipping updates) through any SMTP mailbox.
 * Callers render the email themselves and pass it as `content` (subject, html, text), so this stays a plain
 * transport.
 */
export default class SmtpEmailService extends AbstractNotificationProviderService {
  static identifier = 'smtp-email'

  protected readonly options_: SmtpEmailOptions
  protected readonly logger_: Logger
  protected readonly transport_: Transporter | null

  static validateOptions(options: Record<string, unknown>): void {
    if (!options.from) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'smtp-email: `from` (EMAIL_FROM) is required')
    if (!options.host && !options.preview_dir) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'smtp-email: `host` (SMTP_HOST) is required')
    }
  }

  constructor({ logger }: { logger: Logger }, options: SmtpEmailOptions) {
    super()
    this.options_ = options
    this.logger_ = logger
    const port = Number(options.port) || 465
    this.transport_ = options.host
      ? nodemailer.createTransport({
          host: options.host,
          port,
          secure: port === 465,
          auth: options.user ? { user: options.user, pass: options.pass ?? '' } : undefined,
          connectionTimeout: 15_000,
          greetingTimeout: 10_000,
          socketTimeout: 20_000,
        })
      : null
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const content = notification.content
    if (!notification.to || !content?.subject || (!content.html && !content.text)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'An email needs a recipient, a subject and a body')
    }

    if (!this.transport_) return this.preview(notification)

    const info = await this.transport_.sendMail({
      from: notification.from || this.options_.from,
      to: notification.to,
      replyTo: this.options_.reply_to || undefined,
      subject: content.subject,
      html: content.html,
      text: content.text,
      attachments: (notification.attachments ?? []).map((a) => ({
        filename: a.filename,
        content: a.content,
        encoding: 'base64',
        contentType: a.content_type,
      })),
    })
    return { id: info.messageId }
  }

  /** Development: the email lands in preview_dir, where it can be opened in a browser. */
  private async preview(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const dir = this.options_.preview_dir!
    await mkdir(dir, { recursive: true })
    const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${notification.template || 'email'}`
    const { subject, html, text } = notification.content!
    if (html) await writeFile(path.join(dir, `${id}.html`), html)
    await writeFile(path.join(dir, `${id}.txt`), `To: ${notification.to}\nSubject: ${subject}\n\n${text ?? ''}`)
    this.logger_.info(`Email "${subject}" to ${notification.to} written to ${path.join(dir, id)}.html`)
    return { id }
  }
}
