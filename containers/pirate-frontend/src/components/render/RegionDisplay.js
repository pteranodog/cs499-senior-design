import { TileLayer, useMap, Rectangle } from 'react-leaflet';
import PointIcons from './PointIcons.js';
import DisplayBadge from './DisplayBadge';
import { useEffect } from 'react';
import { getMapTheme } from './mapTheme.js';

function getRegionBounds(region) {
  if (region?.bounds) {
    return [
      [region.bounds.bottom, region.bounds.left],
      [region.bounds.top, region.bounds.right],
    ];
  }

  const buffer = 360 / Math.pow(2, region.defaultZoom);
  return [
    [region.center[0] - buffer, region.center[1] - buffer],
    [region.center[0] + buffer, region.center[1] + buffer],
  ];
}

export default function RegionDisplay({ simState, region }) {
  const map = useMap();
  const mapTheme = getMapTheme('Day');

  useEffect(() => {
    if (!region) return;

    // Helper to toggle all interaction handlers
    const setInteraction = (enabled) => {
      const action = enabled ? 'enable' : 'disable';
      map.dragging[action]();
      map.touchZoom[action]();
      map.doubleClickZoom[action]();
      map.scrollWheelZoom[action]();
      map.boxZoom[action]();
      map.keyboard[action]();
    };

    // 1. Prepare for flight
    setInteraction(false); // Lock user out
    map.setMaxBounds(null); 
    map.options.maxBoundsViscosity = 1.0; // Make future bounds "solid"
    const targetBounds = getRegionBounds(region);

    // 2. Start the 2-second flight
    const flightTimeout = setTimeout(() => {
      map.flyToBounds(targetBounds, { duration: 2, padding: [12, 12] });
    }, 250);

    // 3. Lock into new region after flight (250ms delay + 2000ms duration)
    const lockTimeout = setTimeout(() => {
      map.setMaxBounds(targetBounds);
      const fittedZoom = map.getBoundsZoom(targetBounds);
      map.setMinZoom(Math.max(1, fittedZoom - 2));
      setInteraction(true); // Re-enable user control
    }, 2250);

    return () => {
      clearTimeout(flightTimeout);
      clearTimeout(lockTimeout);
    };
  }, [region, map]);

  useEffect(() => {
    const container = map.getContainer();
    const previousFilter = container.style.filter;
    const previousBackground = container.style.backgroundColor;

    container.style.filter = mapTheme.mapFilter;
    container.style.backgroundColor = '#dbeeff';

    return () => {
      container.style.filter = previousFilter;
      container.style.backgroundColor = previousBackground;
    };
  }, [map, mapTheme.mapFilter]);

  return (
    <>
      <TileLayer attribution={mapTheme.attribution} url={mapTheme.tileUrl} />
      <PointIcons pointList={Object.values(region.points)} />
      <Rectangle
        bounds={[
          [region.bounds.bottom, region.bounds.left],
          [region.bounds.top, region.bounds.right]
        ]}
        pathOptions={{ color: 'red', weight: 2, fill: false }}
      />
      <DisplayBadge simState={simState} />
    </>
  );
}
