import { isMobile } from 'react-device-detect';
import PirateMap from './components/PirateMap.js';
import { useEffect, useState } from 'react';

const MIN_SUPPORTED_WIDTH = 1200;
const MIN_SUPPORTED_HEIGHT = 700;

const getViewportMetrics = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;

  return {
    width,
    height,
    effectiveWidth: Math.round(width * pixelRatio),
    effectiveHeight: Math.round(height * pixelRatio),
  };
};

function App() {
  const [viewportSize, setViewportSize] = useState(getViewportMetrics);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize(getViewportMetrics());
    };

    window.addEventListener('resize', updateViewportSize);
    window.visualViewport?.addEventListener('resize', updateViewportSize);

    return () => {
      window.removeEventListener('resize', updateViewportSize);
      window.visualViewport?.removeEventListener('resize', updateViewportSize);
    };
  }, []);

  const isTooSmall =
    viewportSize.effectiveWidth < MIN_SUPPORTED_WIDTH ||
    viewportSize.effectiveHeight < MIN_SUPPORTED_HEIGHT;

  if (isMobile) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <div className="marquee">
          <div className="marquee-content">
            <img src="/patrol-icon.png" alt="Patrol" style={{ height: '50px', marginRight: '40px' }} />
            <img src="/pirate-icon.png" alt="Pirate" style={{ height: '50px', marginRight: '40px' }} />
            <img src="/merchant-icon.png" alt="Merchant" style={{ height: '50px' }} />
          </div>
        </div>
        <h1>Please use a desktop browser</h1>
        <p>This application is not supported on mobile devices.</p>
      </div>
    )
  }

  if (isTooSmall) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <div className="marquee">
          <div className="marquee-content">
            <img src="/patrol-icon.png" alt="Patrol" style={{ height: '50px', marginRight: '40px' }} />
            <img src="/pirate-icon.png" alt="Pirate" style={{ height: '50px', marginRight: '40px' }} />
            <img src="/merchant-icon.png" alt="Merchant" style={{ height: '50px' }} />
          </div>
        </div>
        <h1>Your Window is too small!</h1>
        <p>
          Please resize your browser window to at least {MIN_SUPPORTED_WIDTH}x{MIN_SUPPORTED_HEIGHT}.
        </p>
        <p>
          Current viewport: {viewportSize.width}x{viewportSize.height} (CSS px)
        </p>
        <p>
          Effective size: {viewportSize.effectiveWidth}x{viewportSize.effectiveHeight} (screen px)
        </p>
      </div>
    );
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.5/dist/css/bootstrap.min.css"
        integrity="sha384-SgOJa3DmI69IUzQ2PVdRZhwQ+dy64/BUtbMJw1MZ8t5HZApcHrRKUc4W0kG879m7"
        crossorigin="anonymous"
      />
      <PirateMap />
    </>
  );
}

export default App;
