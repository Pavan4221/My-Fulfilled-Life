// Pure scheduling helpers shared by the dispatcher and Node's built-in tests.
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function localParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    time: `${value.hour}:${value.minute}`,
    weekday: value.weekday.toLowerCase()
  };
}

function recurrenceMatches(days, weekday) {
  if (!Array.isArray(days) || days.length === 0 || days.includes('daily')) return true;
  if (days.includes('weekdays')) return !['sat', 'sun'].includes(weekday);
  if (days.includes('weekends')) return ['sat', 'sun'].includes(weekday);
  return days.some((day) => typeof day === 'string' && day.slice(0, 3).toLowerCase() === weekday);
}

/**
 * Return reminder occurrences whose scheduled local minute falls inside the
 * lookback window. Iterating actual instants and formatting each in the
 * requested timezone handles midnight and daylight-saving transitions.
 */
export function getDueReminderSlots(notificationSettings, intentions, timeZone, now = new Date(), lookbackMinutes = 10) {
  if (!notificationSettings?.enabled) return [];
  const zone = timeZone || 'UTC';
  const firstMinute = Math.ceil((now.getTime() - lookbackMinutes * 60_000) / 60_000) * 60_000;
  const dueMinutes = new Map();

  for (let instant = firstMinute; instant <= now.getTime(); instant += 60_000) {
    const local = localParts(new Date(instant), zone);
    dueMinutes.set(`${local.date}|${local.time}`, local);
  }

  const slots = [];
  for (const local of dueMinutes.values()) {
    const add = (kind, id, time, title, body) => {
      if (!TIME_RE.test(time || '') || time !== local.time) return;
      slots.push({
        date: local.date,
        time,
        kind,
        id,
        title,
        body,
        key: [local.date, kind, id, time].join('|')
      });
    };

    const morning = notificationSettings.morningReminder;
    if (morning?.enabled) {
      add('morning', 'morning', morning.time, 'Morning Check-In 🌿', 'A quiet moment to set your intentions for today.');
    }

    const evening = notificationSettings.eveningReminder;
    if (evening?.enabled) {
      add('evening', 'evening', evening.time, 'Evening Reflection 🌙', 'Take a quiet moment of gratitude before winding down.');
    }

    for (const intention of Array.isArray(intentions) ? intentions : []) {
      if (!intention?.reminderEnabled) continue;
      if (!recurrenceMatches(intention.reminderDays, local.weekday)) continue;
      const id = String(intention.id || intention.name || 'intention');
      const title = String(intention.name || 'Gentle Intention').slice(0, 100);
      const body = String(intention.reminderNote || `A gentle reminder: ${title}`).slice(0, 240);
      add('intention', id, intention.reminderTime, title, body);
    }
  }

  return slots;
}

export { recurrenceMatches };
