export const SLOT_MINUTES = 30;
export const OPENING_MINUTES = 9 * 60;
export const CLOSING_MINUTES = 17 * 60;
export const LAST_SLOT_MINUTES = CLOSING_MINUTES - SLOT_MINUTES;
export const DAILY_CAP = 12;

const DATETIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

export function parseApptDatetime(value) {
  if (typeof value !== "string") return null;
  const match = DATETIME_REGEX.exec(value.trim());
  if (!match) return null;

  const [, y, mo, d, h, mi, s = "0"] = match.map(
    (part) => part && Number(part),
  );
  const date = new Date(y, mo - 1, d, h, mi, s);

  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d ||
    date.getHours() !== h ||
    date.getMinutes() !== mi
  ) {
    return null;
  }
  return date;
}

export function validateSlot(date, now = new Date()) {
  if (date.getTime() <= now.getTime()) {
    return "Appointment must be in the future";
  }

  const minutes = date.getMinutes();
  if (
    minutes % SLOT_MINUTES !== 0 ||
    date.getSeconds() !== 0 ||
    date.getMilliseconds() !== 0
  ) {
    return "Appointment must start on a 30-minute slot boundary (e.g. 09:00, 09:30)";
  }

  const minuteOfDay = date.getHours() * 60 + minutes;
  if (minuteOfDay < OPENING_MINUTES || minuteOfDay > LAST_SLOT_MINUTES) {
    return "Appointment must be within working hours (09:00-17:00, last slot 16:30)";
  }

  return null;
}

export function computeRefundPercent(apptDate, now = new Date()) {
  const hoursNotice = (apptDate.getTime() - now.getTime()) / (60 * 60 * 1000);
  if (hoursNotice > 48) return 100;
  if (hoursNotice >= 24) return 50;
  return 0;
}

export function computeRefundAmount(amountPaid, percent) {
  return Math.round(Number(amountPaid) * percent) / 100;
}

export function toMysqlDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
