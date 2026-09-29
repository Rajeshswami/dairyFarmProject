import { DateTime } from 'luxon';

const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export function getFarmTimezone(): string {
  return process.env.FARM_TIMEZONE || DEFAULT_TIMEZONE;
}

/**
 * Convert a YYYY-MM-DD calendar date into
 * the start of that date in the farm timezone,
 * represented as a JavaScript Date.
 */
export function startOfFarmDate(date: string | Date): Date {
  const dt = date instanceof Date
    ? DateTime.fromJSDate(date, { zone: getFarmTimezone() })
    : DateTime.fromISO(date, { zone: getFarmTimezone() });

  if (!dt.isValid) {
    throw new Error(`Invalid date: ${date}`);
  }

  return dt.toJSDate();
}

/**
 * Get the start of the next farm calendar day.
 */
export function startOfNextFarmDate(date: string): Date {
  const dt = DateTime.fromISO(date, {
    zone: getFarmTimezone(),
  })
    .plus({ days: 1 })
    .startOf('day');

  if (!dt.isValid) {
    throw new Error(`Invalid date: ${date}`);
  }

  return dt.toJSDate();
}

/**
 * Get the start of a month in the farm timezone.
 */
export function startOfFarmMonth(
  year: number,
  month: number,
): Date {
  const dt = DateTime.fromObject(
    {
      year,
      month,
      day: 1,
    },
    {
      zone: getFarmTimezone(),
    },
  ).startOf('month');

  if (!dt.isValid) {
    throw new Error(`Invalid month: ${year}-${month}`);
  }

  return dt.toJSDate();
}

/**
 * Get the start of the next month in the farm timezone.
 */
export function startOfNextFarmMonth(
  year: number,
  month: number,
): Date {
  const dt = DateTime.fromObject(
    {
      year,
      month,
      day: 1,
    },
    {
      zone: getFarmTimezone(),
    },
  )
    .plus({ months: 1 })
    .startOf('month');

  if (!dt.isValid) {
    throw new Error(`Invalid month: ${year}-${month}`);
  }

  return dt.toJSDate();
}

/**
 * Convert a Date stored in MongoDB into
 * a farm-local YYYY-MM-DD string.
 */
export function toFarmDateString(date: Date): string {
  return DateTime.fromJSDate(date)
    .setZone(getFarmTimezone())
    .toFormat('yyyy-MM-dd');
}