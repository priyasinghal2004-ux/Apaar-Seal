/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Reminder } from '../types';

export function createStudentReminder(
  admissionId: string,
  studentId: string,
  existingReminderCount: number = 0,
  channel: Reminder['channel'] = 'EMAIL'
): Reminder {
  const sentAt = new Date().toISOString();
  const reminderCount = existingReminderCount + 1;
  const id = `REM-${Math.floor(100000 + Math.random() * 900000)}`;

  let nextActionRequired = 'Log in to Candidate Portal and record seat acceptance or submit contestation within statutory period.';
  if (reminderCount >= 2) {
    nextActionRequired = 'URGENT: Third notice. Non-response will be referred to AICTE Regional Officer for manual adjudication.';
  }

  return {
    id,
    admissionId,
    studentId,
    sentAt,
    reminderCount,
    channel,
    nextActionRequired,
  };
}
