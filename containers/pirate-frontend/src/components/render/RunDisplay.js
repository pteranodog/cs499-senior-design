import { TileLayer, useMap, Polyline, Rectangle } from 'react-leaflet';
import { cartesianToLatLng } from '../../utils/coords.js'; // temporary
import PointIcons from './PointIcons.js';
import ShipIcons from './ShipIcons.js';
import OceanCurrentArrows from './OceanCurrentArrows.js';
import EncounterIcons from './EncounterIcons.js';
import DisplayBadge from './DisplayBadge'
import { useEffect } from 'react';
import { getTimeOfDayInfo } from '../controls/Controls.js';
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

export default function RunDisplay({ simState, run }) {
  const map = useMap();
  const region = simState?.regions?.[run?.regionId];
  const timeOfDay = getTimeOfDayInfo({
    regionName: region?.name,
    startHour: run?.startHour,
    startMinute: run?.startMinute,
    elapsedTicks: run?.elapsedTime || 0,
    ticksPerMinute: run?.ticksPerMinute || 1,
  }).label;
  const mapTheme = getMapTheme(timeOfDay);

  //if (!run || !simState || !region) return null;

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
  }, [region, map, run?.uuid]);

  useEffect(() => {
    const container = map.getContainer();
    const previousFilter = container.style.filter;
    const previousBackground = container.style.backgroundColor;

    container.style.filter = mapTheme.mapFilter;
    container.style.backgroundColor = mapTheme.isNight ? '#081120' : '#dbeeff';

    return () => {
      container.style.filter = previousFilter;
      container.style.backgroundColor = previousBackground;
    };
  }, [map, mapTheme.isNight, mapTheme.mapFilter]);

  //if (!region) return null;
  if (!run || !simState || !region) return null;

  const pointList = Object.values(region.points);
  const shipList = Object.values(run?.currentState?.ships || {});
  const encounterEvents = run?.currentState?.encounterEvents || [];

  return (
    <>
      <TileLayer attribution={mapTheme.attribution} url={mapTheme.tileUrl} />
      <PointIcons pointList={pointList} />
      <ShipIcons shipList={shipList} regionCenter={region.center} />
      <EncounterIcons events={encounterEvents} regionCenter={region.center} />
      <OceanCurrentArrows regionBounds={region.bounds} />

      {/* TEMPORARY: render patrol paths */}
      {Object.values(run.currentState.ships)
        .filter(ship => ship.type === 'patrol' && ship.behavior?.path?.points)
        .map((ship, i) => {
          const positions = ship.behavior.path.points.map(point => {
            const { lat, lng } = cartesianToLatLng(point[0], point[1], {
              originLat: region.center[0],
              originLon: region.center[1],
              metersPerUnit: 1,
              headingDegrees: 0,
            });
            return [lat, lng];
          });
          return <Polyline key={i} positions={positions} pathOptions={{ color: 'cyan', weight: 1, opacity: 0.5 }} />;
        })
      }

      <DisplayBadge simState={simState} />

      {/* TEMPORARY: bounding box of region */}

      <Rectangle
        bounds={[
          [region.bounds.bottom, region.bounds.left],
          [region.bounds.top, region.bounds.right]
        ]}
        pathOptions={{ color: 'red', weight: 2, fill: false }}
      />
    </>
  );
}
