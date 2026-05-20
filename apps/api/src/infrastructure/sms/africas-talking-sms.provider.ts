import { Injectable, Logger } from '@nestjs/common'
import type { SmsProvider } from './sms.interface'

interface AtResponse {
  SMSMessageData?: {
    Recipients?: { status: string; messageId: string }[]
  }
}

/**
 * Africa's Talking SMS — Kenya's standard SMS provider.
 * Docs: https://developers.africastalking.com/docs/sms/sending/bulk
 */
@Injectable()
export class AfricasTalkingSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS')
  private readonly apiKey = process.env.AT_API_KEY ?? ''
  private readonly username = process.env.AT_USERNAME ?? 'sandbox'
  private readonly senderId = process.env.AT_SENDER_ID

  async send(to: string, message: string) {
    if (!this.apiKey) {
      this.logger.error('AT_API_KEY not set — falling back to no-op')
      return { messageId: '', status: 'failed' as const, error: 'No API key' }
    }

    const endpoint =
      this.username === 'sandbox'
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging'

    const body = new URLSearchParams({
      username: this.username,
      to,
      message,
      ...(this.senderId ? { from: this.senderId } : {}),
    })

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apiKey: this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: body.toString(),
      })

      const data = (await res.json()) as AtResponse
      const recipient = data.SMSMessageData?.Recipients?.[0]
      if (!recipient || recipient.status !== 'Success') {
        return { messageId: '', status: 'failed' as const, error: recipient?.status ?? 'Unknown error' }
      }
      return { messageId: recipient.messageId, status: 'sent' as const }
    } catch (err) {
      this.logger.error('AT SMS send failed', err)
      return { messageId: '', status: 'failed' as const, error: String(err) }
    }
  }
}
