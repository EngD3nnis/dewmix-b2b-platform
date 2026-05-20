/**
 * SMS message templates. Pure functions, no DI, no I/O — easy to unit-test
 * and easy to extract for translation/personalisation later.
 *
 * Length budget: Africa's Talking bills per 160-character segment for GSM-7
 * encoded messages. Templates here aim for 1–2 segments. Anything that needs
 * a long body should be email, not SMS.
 */

export interface AdminInquiryReceivedContext {
  referenceNumber: string
  itemCount: number
  /** Absolute URL — derived from PUBLIC_WEB_URL in the caller. */
  adminLink: string
  /** Customer phone if captured, for the admin to call back. */
  customerPhone?: string
}

export function adminInquiryReceivedSms(ctx: AdminInquiryReceivedContext): string {
  const items = `${ctx.itemCount} item${ctx.itemCount === 1 ? '' : 's'}`
  const phone = ctx.customerPhone ? ` Cust: ${ctx.customerPhone}.` : ''
  return `New Dewmix inquiry ${ctx.referenceNumber} (${items}).${phone} ${ctx.adminLink}`
}
