import { useMemo, useState } from 'react';
import { Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getOceanCurrentAtLatLng } from '../../data/oceanCurrents.js';
import { isOcean } from '../../utils/isOcean.js';

// Only render arrows at zoom >= this level
const CURRENT_ARROW_MIN_ZOOM = 6;

// Grid spacing in degrees at reference zoom; becomes denser as you zoom in
const BASE_GRID_SPACING = 2.0;
const MIN_GRID_SPACING = 0.5;

// Arrow visual tuning
const ARROW_LENGTH = 28;
const ARROW_HEAD = 7;
const ARROW_STROKE = 2;
const ARROW_COLOR = '#4FC3F7';     // light blue
const ARROW_OPACITY = 0.7;
const MIN_MAGNITUDE = 0.05;        // skip arrows with negligible current

/**
 * Build an SVG arrow icon pointing in the direction of the current vector.
 * heading is in radians (0 = east, π/2 = north).
 * scale controls arrow size relative to zoom.
 */
function createCurrentArrowIcon(heading, magnitude, scale) {
  const length = Math.round(ARROW_LENGTH * scale);
  const head = Math.round(ARROW_HEAD * scale);
  const stroke = Math.max(1.5, ARROW_STROKE * scale);
  const width = length + head + 6;
  const height = Math.max(20, (head * 2) + 10);
  const centerY = Math.round(height / 2);
  const tipX = length;
  const headLeftX = tipX - head;
  const headTopY = centerY - head;
  const headBottomY = centerY + head;

  // Rotate so arrow points in the current's direction
  // atan2 returns radians with 0=east; CSS rotate is clockwise from up,
  // but we use transform-origin at left-center so we match the ship arrow convention.
  const rotationDegrees = (-heading * 180) / Math.PI;

  // Scale opacity by magnitude (stronger current = more visible)
  const opacity = Math.min(ARROW_OPACITY, 0.3 + magnitude * 0.5);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <line x1="0" y1="${centerY}" x2="${tipX}" y2="${centerY}"
            stroke="${ARROW_COLOR}" stroke-width="${stroke}" stroke-linecap="round" opacity="${opacity}" />
      <line x1="${headLeftX}" y1="${headTopY}" x2="${tipX}" y2="${centerY}"
            stroke="${ARROW_COLOR}" stroke-width="${stroke}" stroke-linecap="round" opacity="${opacity}" />
      <line x1="${headLeftX}" y1="${headBottomY}" x2="${tipX}" y2="${centerY}"
            stroke="${ARROW_COLOR}" stroke-width="${stroke}" stroke-linecap="round" opacity="${opacity}" />
    </svg>
  `.trim();

  return L.divIcon({
    className: 'ocean-current-arrow',
    html: `<div style="width:${width}px;height:${height}px;transform:rotate(${rotationDegrees}deg);transform-origin:0 ${centerY}px;pointer-events:none;">${svg}</div>`,
    iconSize: [width, height],
    iconAnchor: [0, centerY],
  });
}

/**
 * Compute grid spacing that becomes denser as the user zooms in.
 */
function gridSpacingForZoom(zoom) {
  const factor = Math.pow(0.7, zoom - CURRENT_ARROW_MIN_ZOOM);
  return Math.max(MIN_GRID_SPACING, BASE_GRID_SPACING * factor);
}

/**
 * Generate the grid of ocean-current arrows visible in the current map viewport.
 */
function useCurrentArrows(zoom, map, regionBounds) {
  return useMemo(() => {
    if (zoom < CURRENT_ARROW_MIN_ZOOM || !regionBounds) return [];

    const mapBounds = map.getBounds();
    const spacing = gridSpacingForZoom(zoom);

    // Clamp to region bounding box
    const latMin = Math.max(regionBounds.bottom, mapBounds.getSouth());
    const latMax = Math.min(regionBounds.top, mapBounds.getNorth());
    const lonMin = Math.max(regionBounds.left, mapBounds.getWest());
    const lonMax = Math.min(regionBounds.right, mapBounds.getEast());

    // Snap starting lat/lon to grid
    const startLat = Math.ceil(latMin / spacing) * spacing;
    const startLon = Math.ceil(lonMin / spacing) * spacing;

    const arrows = [];
    const scale = Math.min(1.5, Math.max(0.6, Math.pow(1.12, zoom - CURRENT_ARROW_MIN_ZOOM)));

    for (let lat = startLat; lat <= latMax; lat += spacing) {
      for (let lon = startLon; lon <= lonMax; lon += spacing) {
        // Only show arrows on ocean, not land
        if (!isOcean(lat, lon)) continue;

        const [vx, vy] = getOceanCurrentAtLatLng(lat, lon);
        const magnitude = Math.sqrt(vx * vx + vy * vy);
        if (magnitude < MIN_MAGNITUDE) continue;

        const heading = Math.atan2(vy, vx); // radians, 0=east
        arrows.push({ lat, lon, heading, magnitude, scale });
      }
    }

    return arrows;
  }, [zoom, map, regionBounds,
      // Re-derive when viewport moves
      map.getBounds().getSouth(),
      map.getBounds().getWest(),
      map.getBounds().getNorth(),
      map.getBounds().getEast()]);
}

export default function OceanCurrentArrows({ regionBounds }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    moveend: () => setZoom(map.getZoom()), // triggers re-render on pan too
  });

  const arrows = useCurrentArrows(zoom, map, regionBounds);

  if (zoom < CURRENT_ARROW_MIN_ZOOM) return null;

  return (
    <>
      {arrows.map(({ lat, lon, heading, magnitude, scale }, i) => (
        <Marker
          key={`current-${lat}-${lon}`}
          position={[lat, lon]}
          icon={createCurrentArrowIcon(heading, magnitude, scale)}
          interactive={false}
          zIndexOffset={-1000}
        />
      ))}
    </>
  );
}
