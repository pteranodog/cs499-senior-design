import { isMobile } from 'react-device-detect';
import PirateMap from './components/PirateMap.js';

function App() {
  if (isMobile) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <marquee behavior="scroll" direction="right">
          <img src="/patrol-icon.png" alt="Patrol" style={{ height: '50px', marginRight: '40px' }} />
          <img src="/pirate-icon.png" alt="Pirate" style={{ height: '50px', marginRight: '40px' }} />
          <img src="/merchant-icon.png" alt="Merchant" style={{ height: '50px' }} />
        </marquee>
        <h1>Please use a desktop browser</h1>
        <p>This application is not supported on mobile devices.</p>
      </div>
    )
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
