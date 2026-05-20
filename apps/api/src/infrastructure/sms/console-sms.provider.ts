import { Injectable, Logger } from '@nestjs/common'
import type { SmsProvider } from './sms.interface'

/**
 * Dev provider: logs SMS to the console.
 * Use this until Africa's Talking credentials are wired in.
 */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS')

  async send(to: string, message: string) {
    this.logger.warn(
      `\n  ╔══════════════════════════════════════════════════╗\n  ║  📱 DEV SMS (would send via Africa's Talking)    ║\n  ║                                                  ║\n  ║  To:  ${to.padEnd(43)}║\n  ║  Msg: ${message.slice(0, 43).padEnd(43)}║\n  ╚══════════════════════════════════════════════════╝`
    )
    return { messageId: `dev-${Date.now()}`, status: 'sent' as const }
  }
}
