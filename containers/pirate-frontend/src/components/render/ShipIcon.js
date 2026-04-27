import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const BASE_ZOOM = 10;
const BASE_SCALE = 0.5;
const MIN_SCALE = 0.1;
const MAX_SCALE = 2.0;

const ICON_CONFIG = {
  pirate: {
    iconUrl: '/pirate-icon.png',
    iconSize: [65, 50],
    filter: '',
  },
  merchant: {
    iconUrl: '/merchant-icon.png',
    iconSize: [100, 40],
    filter: '',
  },
  patrol: {
    iconUrl: '/patrol-icon.png',
    iconSize: [85, 50],
    filter: '',
  },
  default: {
    iconUrl: '/boat-icon.png',
    iconSize: [60, 60],
    filter: '',
  }
};

const POPUP_TEXT = {
  pirate: 'This is a pirate!',
  merchant: 'This is a merchant!',
  patrol: 'This is a patrol vessel!',
};

// Module-level cache: lives for the lifetime of the page, shared across all
// ShipIcon instances. Key is "type:zoom" — only as many entries as there are
// distinct (type × zoom-level) combinations, typically < 50.
const shipIconCache = new Map();

function getShipIcon(type, zoom) {
  const key = `${type}:${zoom}`;
  if (shipIconCache.has(key)) return shipIconCache.get(key);

  const iconConfig = ICON_CONFIG[type] || ICON_CONFIG.default;
  const scale = Math.min(
    MAX_SCALE,
    Math.max(MIN_SCALE, BASE_SCALE * Math.pow(1.15, zoom - BASE_ZOOM))
  );
  const [baseWidth, baseHeight] = iconConfig.iconSize;
  const width = Math.round(baseWidth * scale);
  const height = Math.round(baseHeight * scale);
  const filterStyle = iconConfig.filter ? `filter:${iconConfig.filter};` : '';

  const icon = L.divIcon({
    className: '',
    html: `<img src="${iconConfig.iconUrl}" width="${width}" height="${height}" style="${filterStyle}" />`,
    iconSize: [width, height],
    iconAnchor: [Math.round(width / 2), height],
    popupAnchor: [0, -height + 5],
  });

  shipIconCache.set(key, icon);
  return icon;
}

function ShipIcon({ type, lat, lon, zoom }) {
  const icon = getShipIcon(type, zoom);
  const markerText = POPUP_TEXT[type] ?? 'Unknown vessel type!';

  return (
    <Marker position={[lat, lon]} icon={icon}>
      <Popup>{markerText}</Popup>
    </Marker>
  );
}

export default ShipIcon;
