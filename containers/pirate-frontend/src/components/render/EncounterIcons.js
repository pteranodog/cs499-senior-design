import { Marker, Tooltip } from 'react-leaflet';
import { cartesianToLatLng } from '../../utils/coords.js';

const EVENT_COLORS = {
  combat: 'orange',
  captures: 'red',
  sinks: 'black',
  evasions: 'blue',
  rescues: 'green',
};

function EncounterIcons({ events, regionCenter }) {
  if (!Array.isArray(events)) return null;
  return (
    <>
      {events.map((event, i) => {
        const { lat, lng } = cartesianToLatLng(event.pos[0], event.pos[1], {
          originLat: regionCenter[0],
          originLon: regionCenter[1],
          metersPerUnit: 1,
          headingDegrees: 0,
        });
        const color = EVENT_COLORS[event.type] || 'purple';
        return (
          <Marker
            key={`encounter-${i}`}
            position={[lat, lng]}
            icon={L.divIcon({
              className: '',
              html: `<div style="width:18px;height:18px;background:${color};border-radius:50%;border:2px solid white;"></div>`
            })}
            interactive={true}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

export default EncounterIcons;
