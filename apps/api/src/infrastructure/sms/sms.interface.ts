/**
 * Provider-agnostic SMS interface.
 * We use Africa's Talking in production. In development, messages log to console.
 */
export interface SmsProvider {
  send(to: string, message: string): Promise<{ messageId: string; status: 'sent' | 'failed'; error?: string }>
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER')
