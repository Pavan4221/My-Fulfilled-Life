import test from 'node:test';
import assert from 'node:assert/strict';
import { getDueReminderSlots } from './reminder-schedule.mjs';

const instant = new Date('2026-11-02T02:05:00.000Z'); // Monday, 07:35 in India

test('finds a reminder in the scheduler lookback window in the user timezone', () => {
  const slots = getDueReminderSlots(
    { enabled: true, morningReminder: { enabled: true, time: '07:30' } },
    [],
    'Asia/Kolkata',
    instant,
    10
  );
  assert.equal(slots.length, 1);
  assert.equal(slots[0].date, '2026-11-02');
  assert.equal(slots[0].kind, 'morning');
});

test('does not send a reminder outside the lookback window', () => {
  const slots = getDueReminderSlots(
    { enabled: true, eveningReminder: { enabled: true, time: '07:20' } },
    [],
    'Asia/Kolkata',
    instant,
    10
  );
  assert.equal(slots.length, 0);
});

test('honours weekdays and weekends for intention reminders', () => {
  const intention = {
    id: 'move', name: 'Move gently', reminderEnabled: true,
    reminderTime: '07:30', reminderDays: ['weekdays']
  };
  const monday = getDueReminderSlots({ enabled: true }, [intention], 'Asia/Kolkata', instant, 10);
  assert.equal(monday.length, 1);

  const saturday = getDueReminderSlots(
    { enabled: true },
    [intention],
    'Asia/Kolkata',
    new Date('2026-11-07T02:05:00.000Z'),
    10
  );
  assert.equal(saturday.length, 0);
});

test('does not schedule anything when account notifications are disabled', () => {
  const slots = getDueReminderSlots(
    { enabled: false, morningReminder: { enabled: true, time: '07:30' } },
    [],
    'Asia/Kolkata',
    instant,
    10
  );
  assert.deepEqual(slots, []);
});
