// MERGE NOTE: replaced this whole file with version from my branch, i dont think it will break things since
// my changes mainly just adjusted to new coord stuff -ljj
import { Fragment, useState } from 'react';
import { Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import ShipIcon from './ShipIcon.js';
import { cartesianToLatLng } from '../../utils/coords.js';

const ARROW_MIN_ZOOM = 7;
const ARROW_BASE_ZOOM = 8;
const ARROW_MIN_SCALE = 0.7;
const ARROW_MAX_SCALE = 1.35;
const ARROW_STYLE_BY_TYPE = {
  pirate: { offset: 30, length: 34, head: 8 },
  merchant: { offset: 36, length: 40, head: 9 },
  patrol: { offset: 33, length: 37, head: 8 },
  default: { offset: 32, length: 35, head: 8 },
};

function getShipHeading(ship) {
  const velocity = ship.mover?.kinematic?.velocity;

  if (Array.isArray(velocity) && velocity.length >= 2) {
    const [vx, vy] = velocity;
    if (Math.abs(vx) > 0.001 || Math.abs(vy) > 0.001) {
      return Math.atan2(vy, vx);
    }
  }

  return ship.orientation ?? 0;
}

function getArrowScale(zoom) {
  return Math.min(
    ARROW_MAX_SCALE,
    Math.max(ARROW_MIN_SCALE, Math.pow(1.15, zoom - ARROW_BASE_ZOOM))
  );
}

function createArrowIcon(type, heading, zoom) {
  const arrowStyle = ARROW_STYLE_BY_TYPE[type] || ARROW_STYLE_BY_TYPE.default;
  const scale = getArrowScale(zoom);
  const offset = Math.round(arrowStyle.offset * scale);
  const length = Math.round(arrowStyle.length * scale);
  const head = Math.round(arrowStyle.head * scale);
  const stroke = Math.max(3, Math.round(3 * scale));
  const width = offset + length + head + 8;
  const height = Math.max(28, Math.round((head * 2) + 14));
  const centerY = Math.round(height / 2);
  const startX = offset;
  const tipX = offset + length;
  const headLeftX = tipX - head;
  const headTopY = centerY - head;
  const headBottomY = centerY + head;
  const rotationDegrees = (-heading * 180) / Math.PI;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <line x1="${startX}" y1="${centerY}" x2="${tipX}" y2="${centerY}" stroke="#000000" stroke-width="${stroke}" stroke-linecap="round" />
      <line x1="${headLeftX}" y1="${headTopY}" x2="${tipX}" y2="${centerY}" stroke="#000000" stroke-width="${stroke}" stroke-linecap="round" />
      <line x1="${headLeftX}" y1="${headBottomY}" x2="${tipX}" y2="${centerY}" stroke="#000000" stroke-width="${stroke}" stroke-linecap="round" />
    </svg>
  `.trim();

  return L.divIcon({
    className: 'ship-heading-arrow',
    html: `<div style="width:${width}px;height:${height}px;transform:rotate(${rotationDegrees}deg);transform-origin:0 ${centerY}px;">${svg}</div>`,
    iconSize: [width, height],
    iconAnchor: [0, centerY],
  });
}

function ShipIcons({ shipList, regionCenter }) {
  const [zoom, setZoom] = useState(4);

  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    }
  });

  return (
    <>
      {shipList.map((ship, index) => {
        const { lat, lng } = cartesianToLatLng(ship.pos[0], ship.pos[1], {
          originLat: regionCenter[0],
          originLon: regionCenter[1],
          metersPerUnit: 1,
          headingDegrees: 0,
        });
        const shipKey = ship.id || `${ship.type}-${index}-${lat}-${lng}`;
        const heading = getShipHeading(ship);

        return (
          <Fragment key={shipKey}>
            {zoom >= ARROW_MIN_ZOOM && (
              <Marker
                position={[lat, lng]}
                icon={createArrowIcon(ship.type, heading, zoom)}
                interactive={false}
                zIndexOffset={1000}
              />
            )}
            <ShipIcon
              type={ship.type}
              lat={lat}
              lon={lng}
              zoom={zoom}
            />
          </Fragment>
        );
      })}
    </>
  );
}

export default ShipIcons;
