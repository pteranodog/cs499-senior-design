import { TileLayer, useMap } from 'react-leaflet';
import PointIcons from './PointIcons.js';
import DisplayBadge from './DisplayBadge';
import { useEffect } from 'react';

export default function RegionDisplay({ simState, region }) {
  const DAY_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const DAY_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const map = useMap();

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

    // 2. Start the 2-second flight
    const flightTimeout = setTimeout(() => {
      map.flyTo(region.center, region.defaultZoom, { duration: 2 });
    }, 250);

    // 3. Lock into new region after flight (250ms delay + 2000ms duration)
    const lockTimeout = setTimeout(() => {
      const buffer = 360 / Math.pow(2, region.defaultZoom);
      const dynamicBounds = [
        [region.center[0] - buffer, region.center[1] - buffer],
        [region.center[0] + buffer, region.center[1] + buffer]
      ];

      map.setMaxBounds(dynamicBounds);
      map.setMinZoom(region.defaultZoom - 2);
      setInteraction(true); // Re-enable user control
    }, 2250);

    return () => {
      clearTimeout(flightTimeout);
      clearTimeout(lockTimeout);
    };
  }, [region, map]);

  return (
    <>
      <TileLayer attribution={DAY_TILE_ATTRIBUTION} url={DAY_TILE_URL} />
      <PointIcons pointList={Object.values(region.points)} />
      <DisplayBadge simState={simState} />
    </>
  );
}
