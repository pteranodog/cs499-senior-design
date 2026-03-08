import Control from 'react-leaflet-custom-control';

export default function Legend() { // TODO: replace colors w/ actual icons
  return (
    <Control prepend position="bottomleft">
      <div className="bg-light text-dark p-3 rounded shadow" style={{ minWidth: '160px' }}>
        <h5 className="mb-2">Legend</h5>

        <div className="d-flex align-items-center mb-1">
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: 'green',
              marginRight: '8px',
            }}
          />
          <span>Merchants</span>
        </div>

        <div className="d-flex align-items-center mb-1">
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: 'red',
              marginRight: '8px',
            }}
          />
          <span>Pirates</span>
        </div>

        <div className="d-flex align-items-center mb-1">
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: 'blue',
              marginRight: '8px',
            }}
          />
          <span>Security</span>
        </div>
      </div>
    </Control>
  )
}