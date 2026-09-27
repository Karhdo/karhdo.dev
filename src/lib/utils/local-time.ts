/**
 * Time-zone helpers for the footer statusline clock (task 09). Pure: everything is derived from
 * `Intl`, so DST and half-hour / 45-minute zones work with no hard-coded offsets.
 */

/** `HH:mm` (24 h) wall-clock time of `date` in `timeZone`. */
export function formatHcmTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
    date
  );
}

/** Offset of `timeZone` from UTC at `date`, in minutes east of UTC (e.g. `420` for UTC+7). */
export function getZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  const truncated = Math.floor(date.getTime() / 1000) * 1000;
  return Math.round((asUtc - truncated) / 60_000);
}

/**
 * How the zone relates to the visitor: `same time`, `2h ahead`, `5h30m behind`, `45m ahead`.
 * Both offsets are minutes east of UTC; "ahead"/"behind" describes the zone relative to the visitor.
 */
export function describeOffset(visitorOffsetMin: number, zoneOffsetMin: number): string {
  const diff = zoneOffsetMin - visitorOffsetMin;
  if (diff === 0) return 'same time';
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const amount = `${hours ? `${hours}h` : ''}${minutes ? `${minutes}m` : ''}`;
  return `${amount} ${diff > 0 ? 'ahead' : 'behind'}`;
}
