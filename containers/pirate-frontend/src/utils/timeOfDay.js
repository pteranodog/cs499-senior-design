export const REGION_DAYLIGHT_WINDOWS = {
  'Somalian Coast': { sunriseHour: 5, sunriseMinute: 45, sunsetHour: 18, sunsetMinute: 15 },
  'Gulf of Aden/Somalian Coast': { sunriseHour: 5, sunriseMinute: 45, sunsetHour: 18, sunsetMinute: 15 },
  'Gulf of Guinea': { sunriseHour: 6, sunriseMinute: 0, sunsetHour: 18, sunsetMinute: 30 },
  'Malacca Strait': { sunriseHour: 7, sunriseMinute: 0, sunsetHour: 19, sunsetMinute: 15 },
  'Caribbean Sea': { sunriseHour: 6, sunriseMinute: 15, sunsetHour: 18, sunsetMinute: 30 },
  'Red Sea': { sunriseHour: 5, sunriseMinute: 45, sunsetHour: 18, sunsetMinute: 15 },
  'Mozambique Channel': { sunriseHour: 5, sunriseMinute: 30, sunsetHour: 18, sunsetMinute: 0 },
  'South China Sea': { sunriseHour: 6, sunriseMinute: 0, sunsetHour: 18, sunsetMinute: 30 },
  'Sulu-Celebes Seas': { sunriseHour: 5, sunriseMinute: 45, sunsetHour: 18, sunsetMinute: 0 },
};

const MINUTES_PER_DAY = 24 * 60;

export function normalizeMinuteOfDay(totalMinutes) {
  const numericMinutes = Number(totalMinutes);

  if (!Number.isFinite(numericMinutes)) {
    return 0;
  }

  return ((numericMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function formatHourMinute(hourValue, minuteValue) {
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return '00:00';
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function getTimeOfDayFromHour(hourValue) {
  const hour = Number(hourValue);

  if (!Number.isFinite(hour)) {
    return 'Day';
  }

  return hour >= 6 && hour < 18 ? 'Day' : 'Night';
}

export function getRegionDaylightWindow(regionName) {
  return REGION_DAYLIGHT_WINDOWS[regionName] ?? {
    sunriseHour: 6,
    sunriseMinute: 0,
    sunsetHour: 18,
    sunsetMinute: 0,
  };
}

function toMinuteOfDay(hourValue, minuteValue = 0) {
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return 0;
  }

  return normalizeMinuteOfDay(hour * 60 + minute);
}

export function getRunLocalClock({
  startHour,
  startMinute,
  elapsedTicks = 0,
  ticksPerMinute = 1,
} = {}) {
  const hour = Number(startHour);
  const minute = Number(startMinute);
  const safeTicksPerMinute = Math.max(Number(ticksPerMinute) || 1, 1);
  const elapsedMinutes = Math.floor((Number(elapsedTicks) || 0) / safeTicksPerMinute);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return {
      hour: 0,
      minute: 0,
      totalMinutes: 0,
    };
  }

  const baseMinutes = hour * 60 + minute + elapsedMinutes;
  const totalMinutes = normalizeMinuteOfDay(baseMinutes);

  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
    totalMinutes,
  };
}

export function getTimeOfDayInfo({
  regionName,
  startHour,
  startMinute,
  elapsedTicks = 0,
  ticksPerMinute = 1,
} = {}) {
  const clock = getRunLocalClock({
    regionName,
    startHour,
    startMinute,
    elapsedTicks,
    ticksPerMinute,
  });
  const daylightWindow = getRegionDaylightWindow(regionName);
  const sunriseMinutes = toMinuteOfDay(daylightWindow.sunriseHour, daylightWindow.sunriseMinute);
  const sunsetMinutes = toMinuteOfDay(daylightWindow.sunsetHour, daylightWindow.sunsetMinute);
  const label = clock.totalMinutes >= sunriseMinutes && clock.totalMinutes < sunsetMinutes ? 'Day' : 'Night';

  return {
    ...clock,
    label,
    isDay: label === 'Day',
    isNight: label === 'Night',
    clockLabel: formatHourMinute(clock.hour, clock.minute),
    sunriseLabel: formatHourMinute(daylightWindow.sunriseHour, daylightWindow.sunriseMinute),
    sunsetLabel: formatHourMinute(daylightWindow.sunsetHour, daylightWindow.sunsetMinute),
  };
}
