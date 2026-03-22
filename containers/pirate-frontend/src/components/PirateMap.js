import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useReducer, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { simulationPointsToLeaflet } from '../utils/coords';
import Controls from './controls/Controls';
import ShipIcons from './render/ShipIcons.js';
import PointIcons from './render/PointIcons.js';
import { simStateReducer, appStartState } from '../data/reducer.js';

const shipList = [
  { id: 'pirate-1', type: 'pirate', lat: 10, lon: 60 },
  { id: 'pirate-2', type: 'pirate', lat: 11, lon: 59 },
  { id: 'merchant-1', type: 'merchant', lat: 9, lon: 62 },
  { id: 'merchant-2', type: 'merchant', lat: 12, lon: 65 },
  { id: 'patrol-1', type: 'patrol', lat: 8, lon: 59 },
  { id: 'patrol-2', type: 'patrol', lat: 13, lon: 61 },
];

const pointList = [
  {
    id: 'port-said',
    type: 'port',
    lat: 31.268591553342564,
    lon: 32.3080159013517,
    name: 'Port Said (Egypt)',
    region: 'Gulf of Aden/Somalian Coast',
  },
  {
    id: 'mombasa',
    type: 'port',
    lat: -4.0717176235876895,
    lon: 39.67302089897652,
    name: 'Mombasa (Kenya)',
    region: 'Gulf of Aden/Somalian Coast',
  },
  {
    id: 'dar-es-salaam',
    type: 'port',
    lat: -6.764025272071542,
    lon: 39.27479457164424,
    name: 'Dar es Salaam (Tanzania)',
    region: 'Gulf of Aden/Somalian Coast',
  },
  {
    id: 'djibouti',
    type: 'port',
    lat: 11.604819989415411,
    lon: 43.14977135115654,
    name: 'Djibouti',
    region: 'Gulf of Aden/Somalian Coast',
  },
  {
    id: 'cove-1',
    type: 'pirateCove',
    lat: 11.170546041737072,
    lon: 47.404807848330168,
    region: 'Gulf of Aden/Somalian Coast',
  },
  {
    id: 'cove-2',
    type: 'pirateCove',
    lat: 5.065907743093423,
    lon: 48.297863487974084,
    region: 'Gulf of Aden/Somalian Coast',
  },
  {
    id: 'camp-lemonnier',
    type: 'patrolBase',
    lat: 11.543419592150114,
    lon: 43.17903502125963,
    name: 'Camp Lemonnier (U.S.A.)',
    region: 'Gulf of Aden/Somalian Coast',
  },
];

const regionView = {
  'Gulf of Guinea': { center: [2.5, 1.5], zoom: 6 },
  'Gulf of Aden/Somalian Coast': { center: [9.5, 46.0], zoom: 6 },
  'Malacca Strait': { center: [3.0, 101.5], zoom: 7 },
};

const transformConfig = {
  originLat: 34.7190616534629,
  originLon: -86.64664978111168,
  metersPerUnit: 1,
  headingDegrees: 0,
};

const simulationTrack = [
  { id: 'start', x: 0, y: 0, label: 'Simulation origin (0, 0)' },
  { id: 'wp1', x: 90, y: 30, label: 'Waypoint 1 (90, 30)' },
  { id: 'wp2', x: 180, y: 60, label: 'Waypoint 2 (180, 60)' },
  { id: 'wp3', x: 240, y: -20, label: 'Waypoint 3 (240, -20)' },
];

function MapViewportController({
  selectedPoint,
  simulationRegion,
  defaultCenter,
  defaultZoom,
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedPoint) {
      map.flyTo([selectedPoint.lat, selectedPoint.lon], Math.max(map.getZoom(), 8), {
        duration: 1.2,
      });
      return;
    }

    if (simulationRegion && regionView[simulationRegion]) {
      const { center, zoom } = regionView[simulationRegion];
      map.flyTo(center, zoom, { duration: 1.2 });
      return;
    }

    map.flyTo(defaultCenter, defaultZoom, { duration: 1.0 });
  }, [defaultCenter, defaultZoom, map, selectedPoint, simulationRegion]);

  return null;
}

const DAY_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DAY_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const NIGHT_TILE_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const NIGHT_TILE_ATTRIBUTION = '&copy; <a href="https://stadiamaps.com">Stadia Maps</a> contributors';

function PirateMap() {
  const [simState, modifySimState] = useReducer(simStateReducer, {}, appStartState);
  const [startCenterPoint, setStartCenterPoint] = useState(null);
  const [simulationConfig, setSimulationConfig] = useState(null);
  const [simulationTimeMinutes, setSimulationTimeMinutes] = useState(12 * 60); // 24h clock simulation time in minutes
  const [previewStartTimeMinutes, setPreviewStartTimeMinutes] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const defaultCenter = useMemo(
    () => [transformConfig.originLat, transformConfig.originLon],
    [],
  );

  const mappedTrack = useMemo(
    () => simulationPointsToLeaflet(simulationTrack, transformConfig),
    [],
  );

  const polylinePoints = useMemo(
    () => mappedTrack.map(({ latLng }) => [latLng.lat, latLng.lng]),
    [mappedTrack],
  );

  useEffect(() => {
    if (!isRunning || !simulationConfig) {
      return undefined;
    }

    const interval = setInterval(() => {
      setSimulationTimeMinutes((prev) => (prev + 60) % (24 * 60));
    }, 6000); // 6 seconds per simulated hour for live feel

    return () => clearInterval(interval);
  }, [isRunning, simulationConfig]);

  const activeTimeMinutes =
    simulationConfig?.startTimeMinutes ??
    (previewStartTimeMinutes !== null ? previewStartTimeMinutes : simulationTimeMinutes);
  const activeTimeHour = Math.floor(activeTimeMinutes / 60);
  const isDay = activeTimeHour >= 6 && activeTimeHour < 18;
  const activeMode = isDay ? 'day' : 'night';
  const tileUrl = activeMode === 'day' ? DAY_TILE_URL : NIGHT_TILE_URL;
  const attribution = activeMode === 'day' ? DAY_TILE_ATTRIBUTION : NIGHT_TILE_ATTRIBUTION;

  const topBadgeStyle = {
    position: 'absolute',
    top: 8,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    padding: '0.5rem 0.9rem',
    borderRadius: '999px',
    backgroundColor: activeMode === 'day' ? 'rgba(255,255,255,0.90)' : 'rgba(0,0,0,0.7)',
    color: activeMode === 'day' ? '#222' : '#fff',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    boxShadow: '0 0 20px rgba(0,0,0,0.35)',
  };

  const backgroundTint = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: isDay ? 'transparent' : 'rgba(0, 18, 45, 0.22)',
    zIndex: 450,
  };

  const handleConfigTimeChange = (minuteOfDay) => {
    setPreviewStartTimeMinutes(minuteOfDay);
  };

  const handleSimulationStart = (config) => {
    setSimulationConfig(config);
    if (config && typeof config.startTimeMinutes === 'number') {
      const value = config.startTimeMinutes % (24 * 60);
      setSimulationTimeMinutes(value);
    } else {
      setSimulationTimeMinutes(12 * 60);
    }
    setIsRunning(true);
    setPreviewStartTimeMinutes(null);
  };

  const handleSimulationStop = () => {
    setIsRunning(false);
    setSimulationConfig(null);
    setSimulationTimeMinutes(12 * 60);
    setPreviewStartTimeMinutes(null);
  };

  return (
    <MapContainer
      style={{ position: 'absolute', width: '100%', height: '100%', filter: activeMode === 'day' ? 'none' : 'brightness(0.75) contrast(1.15)'}}
      center={[transformConfig.originLat, transformConfig.originLon]}
      zoom={16}
    >
      <div style={backgroundTint} />

      <div style={topBadgeStyle}>
        <span style={{ fontSize: '2rem' }}>{activeMode === 'day' ? '☀️' : '🌙'}</span>
        <span style={{ fontSize: '1.1rem' }}>
          {activeMode === 'day' ? 'Day' : 'Night'}
        </span>
      </div>

      <TileLayer attribution={attribution} url={tileUrl} />

      <Marker position={[transformConfig.originLat, transformConfig.originLon]}>
        <Popup>Simulation Origin</Popup>
      </Marker>

      <PointIcons pointList={pointList} />
      <ShipIcons shipList={shipList} />

      <Polyline positions={polylinePoints} />

      {mappedTrack.map((point) => (
        <Marker key={point.id} position={[point.latLng.lat, point.latLng.lng]}>
          <Popup>
            <strong>{point.label}</strong>
            <br />
            Sim XY: ({point.x}, {point.y})
            <br />
            Lat/Lon: {point.latLng.lat.toFixed(6)}, {point.latLng.lng.toFixed(6)}
          </Popup>
        </Marker>
      ))}

      <MapViewportController
        selectedPoint={startCenterPoint}
        simulationRegion={simulationConfig?.region || ''}
        defaultCenter={defaultCenter}
        defaultZoom={16}
      />
      {/* Controls that float above the map in the top right */}
      <Controls
        pointsOfInterest={pointList}
        onStartCenterPointChange={setStartCenterPoint}
        onSimulationStart={handleSimulationStart}
        onSimulationStop={handleSimulationStop}
        onConfigTimeChange={handleConfigTimeChange}
      />
    </MapContainer>
  );
}

export default PirateMap;
