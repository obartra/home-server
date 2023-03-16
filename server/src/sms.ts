import { throttle } from 'lodash';
import twilio from 'twilio';

import * as logger from './logger';
import { getPhoneNumbers, getReportingStatus } from './db';
import './env';

const accountSid = process.env.accountSid;
const authToken = process.env.authToken;

const client = twilio(accountSid, authToken);
const MINUTE = 60_000;

// At most, send a message every 5 minutes
export const sendSMS = throttle(async (message: string | undefined) => {
  if (await getReportingStatus()) {
    return sendUrgentSMS(message, await getPhoneNumbers());
  } else {
    logger.info('sms', `skipped sending message`, { message });
  }
}, 5 * MINUTE);

export const sendUrgentSMS = async (message: string | undefined, phones: string[]) => {
  return Promise.all(
    phones.map((to) =>
      client.messages
        .create({
          body: message,
          from: process.env.twilioPhone,
          to,
        })
        .then((resp) => logger.info('sms', `message sent to ${to}`, { sid: resp.sid }))
        .catch((err) => {
          logger.error(`sms`, `failed to send message to ${to}`, err.message);
          throw new Error(err);
        }),
    ),
  );
};
