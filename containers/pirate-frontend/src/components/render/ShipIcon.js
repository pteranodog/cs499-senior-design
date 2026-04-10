import { Marker, Popup } from 'react-leaflet';
import { useMemo } from 'react';
import L from 'leaflet';

const BASE_ZOOM = 6;
const BASE_SCALE = 1.2;
const MIN_SCALE = 0.9;
const MAX_SCALE = 2.0;

const ICON_CONFIG = {
  pirate: {
    iconUrl: '/pirate-icon.png',
    iconSize: [52, 40],
    filter: 'invert(100%) sepia(100%) saturate(10000%) hue-rotate(0deg) brightness(100%) contrast(100%)',
  },
  merchant: {
    iconUrl: '/merchant-icon.png',
    iconSize: [81, 25],
    filter: 'invert(100%) sepia(100%) saturate(10000%) hue-rotate(85deg) brightness(100%) contrast(100%)',
  },
  patrol: {
    iconUrl: '/patrol-icon.png',
    iconSize: [70, 40],
    filter: 'invert(100%) sepia(100%) saturate(10000%) hue-rotate(190deg) brightness(100%) contrast(100%)',
  },
  default: {
    iconUrl: '/boat-icon.png',
    iconSize: [60, 60],
    filter: '',
  }
};

function ShipIcons({ type, lat, lon, zoom }) {
  // For now we'll just set marker text using type, later we'll switch it to show different icons
  var markerText = "Unknown vessel type!";
  if (type === "pirate") {
    markerText = "This is a pirate!";
  } else if (type === "merchant") {
    markerText = "This is a merchant!";
  } else if (type === "patrol") {
    markerText = "This is a security vessel!";
  }

  const shipIcon = useMemo(() => {
    const iconConfig = ICON_CONFIG[type] || ICON_CONFIG.default;
    const scale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, BASE_SCALE * Math.pow(1.15, zoom - BASE_ZOOM))
    );
    const [baseWidth, baseHeight] = iconConfig.iconSize;
    const width = Math.round(baseWidth * scale);
    const height = Math.round(baseHeight * scale);

    const filterStyle = iconConfig.filter ? `filter:${iconConfig.filter};` : '';

    return L.divIcon({
      className: '',
      html: `<img src="${iconConfig.iconUrl}" width="${width}" height="${height}" style="${filterStyle}" />`,
      iconSize: [width, height],
      iconAnchor: [Math.round(width / 2), height],
      popupAnchor: [0, -height + 5],
    });
  }, [type, zoom]);

  return (
    <Marker position={[lat, lon]} icon={shipIcon}>                                                         
      <Popup>                                                                                                          
        {markerText}
      </Popup>                                                                                                         
    </Marker>
  )
}

export default ShipIcons;
