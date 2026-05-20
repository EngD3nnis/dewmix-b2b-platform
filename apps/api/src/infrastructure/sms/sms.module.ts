import { Module } from '@nestjs/common'
import { SMS_PROVIDER } from './sms.interface'
import { ConsoleSmsProvider } from './console-sms.provider'
import { AfricasTalkingSmsProvider } from './africas-talking-sms.provider'

@Module({
  providers: [
    {
      provide: SMS_PROVIDER,
      useClass: process.env.AT_API_KEY ? AfricasTalkingSmsProvider : ConsoleSmsProvider,
    },
  ],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
