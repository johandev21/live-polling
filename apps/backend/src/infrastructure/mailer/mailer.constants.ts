export const MAILER = Symbol('MAILER');

export interface Mailer {
  send(message: { to: string; subject: string; text: string }): Promise<void>;
}
