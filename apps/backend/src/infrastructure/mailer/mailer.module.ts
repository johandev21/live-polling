import { Global, Module } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { MAILER, Mailer } from './mailer.constants';

@Global()
@Module({
  providers: [
    {
      provide: MAILER,
      useFactory: (): Mailer => {
        const host = process.env.SMTP_HOST ?? '127.0.0.1';
        const port = Number(process.env.SMTP_PORT ?? 1025);
        const transport = nodemailer.createTransport({
          host,
          port,
          secure: false,
        });

        return {
          send: async (message) => {
            console.log(
              `[Mailer] Sending email to ${message.to}: ${message.subject}\nContent:\n${message.text}`,
            );
            try {
              await transport.sendMail({
                from: process.env.MAIL_FROM ?? 'no-reply@live-polling.local',
                ...message,
              });
            } catch (error) {
              console.error(
                `[Mailer] Failed to send email via SMTP (${host}:${port}):`,
                error,
              );
              if (process.env.NODE_ENV === 'production') {
                throw error;
              }
            }
          },
        };
      },
    },
  ],
  exports: [MAILER],
})
export class MailerModule {}
