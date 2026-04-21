import React from 'react';

export default function EncounterList({ events }) {
  if (!Array.isArray(events) || events.length === 0) {
    return <div className="small text-secondary">No encounters recorded.</div>;
  }
  return (
    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
      <table className="table table-sm table-dark table-bordered mb-0">
        <thead>
          <tr>
            <th>Type</th>
            <th>Time</th>
            <th>Pos</th>
            <th>Ship(s)</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={i}>
              <td>{e.type}</td>
              <td>{e.time}</td>
              <td>{Array.isArray(e.pos) ? `${e.pos[0].toFixed(0)}, ${e.pos[1].toFixed(0)}` : ''}</td>
              <td>{e.shipAType ? `${e.shipAType} vs ${e.shipBType}` : e.shipType || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
