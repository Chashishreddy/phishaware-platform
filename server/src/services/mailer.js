import nodemailer from 'nodemailer'
import { MAILER_ENABLED, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from '../config.js'

class ConsoleMailer {
  async sendMail (options) {
    console.log('[ConsoleMailer] Email send simulated with safety guard:', {
      to: options.to,
      subject: options.subject,
      // DO NOT log body fields that may contain personalized data beyond awareness context
      preview: options.text?.slice(0, 120)
    })
    return { accepted: [options.to] }
  }
}

class SMTPMailer {
  constructor () {
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    })
  }

  async sendMail (options) {
    return this.transporter.sendMail(options)
  }
}

export const createMailer = () => {
  if (!MAILER_ENABLED) {
    return new ConsoleMailer()
  }
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('MAILER_ENABLED=true but SMTP credentials missing; reverting to console mailer for safety.')
    return new ConsoleMailer()
  }
  return new SMTPMailer()
}
