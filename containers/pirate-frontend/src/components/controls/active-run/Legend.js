import { useState } from 'react';

export default function Legend() {
  const [minimized, setMinimized] = useState(false);

  const legendItems = [
    { label: 'Merchants', icon: '/merchant-icon.png' },
    { label: 'Pirates', icon: '/pirate-icon.png' },
    { label: 'Security', icon: '/patrol-icon.png' },
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-light text-dark p-3 rounded shadow"
      style={{
        position: 'absolute',
        bottom: 16,
        left: 12,
        zIndex: 1000,
        minWidth: '160px',
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h5 className="mb-0">Legend</h5>
        <button
          type="button"
          onClick={() => setMinimized((prev) => !prev)}
          aria-label={minimized ? 'Expand legend' : 'Minimize legend'}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '0.95rem',
            lineHeight: 1,
            padding: 0,
          }}
        >
          {minimized ? '\u25B2' : '\u25BC'}
        </button>
      </div>

      {!minimized && legendItems.map((item) => (
        <div key={item.label} className="d-flex align-items-center mb-2">
          <img
            src={item.icon}
            alt={item.label}
            style={{
              width: '20px',
              height: '20px',
              objectFit: 'contain',
              marginRight: '8px',
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
