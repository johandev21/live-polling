import { Global, Module } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { MAILER, Mailer } from './mailer.constants';

@Global()
@Module({
  providers: [
    {
      provide: MAILER,
      useFactory: (): Mailer => {
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST ?? 'localhost',
          port: Number(process.env.SMTP_PORT ?? 1025),
          secure: false,
        });
        return {
          send: async (message) => {
            await transport.sendMail({
              from: process.env.MAIL_FROM ?? 'no-reply@live-polling.local',
              ...message,
            });
          },
        };
      },
    },
  ],
  exports: [MAILER],
})
export class MailerModule {}
