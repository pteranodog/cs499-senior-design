export const DAY_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const DAY_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const NIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const NIGHT_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO';

export function getMapTheme(timeOfDay = 'Day') {
  const isNight = timeOfDay === 'Night';

  return {
    isNight,
    tileUrl: isNight ? NIGHT_TILE_URL : DAY_TILE_URL,
    attribution: isNight ? NIGHT_TILE_ATTRIBUTION : DAY_TILE_ATTRIBUTION,
    mapFilter: isNight ? 'brightness(0.82) contrast(1.08) saturate(0.92)' : 'none',
  };
}
