import {useState, useEffect} from 'react';
import Control from 'react-leaflet-custom-control';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';

function Controls() 
{
  const [seconds, setSeconds] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState("Day");
  const [weather, setWeather] = useState("Clear");
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  useEffect ( () => 
  {
    if (!isRunning) return;

    const interval = setInterval ( () => 
    {
      setSeconds((prev) => prev +1);

      const hour = new Date().getHours();
      setTimeOfDay (hour >= 6 && hour < 18 ? "Day" : "Night");

      setWeather("Clear");
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (s) => 
  {
    const hrs = String(Math.floor(s / 3600)).padStart(2, "0");
    const mins = String(Math.floor(s % 3600 / 60)).padStart(2, "0");
    const secs = String(s % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const handleStart = () => 
  {
    setShowStartScreen(false);
    setIsRunning(true);
  };

  return (
    <Control prepend position="topright">
      <div onClick={(e) => e.stopPropagation()}>
        
        {/* START SCREEN IN CENTER OF SCREEN */}
        {showStartScreen && (
          <div
            className = "position-fixed top-50 start-50 translate-middle bg-dark text-light p-4 rounded shadow"
            style = {{zindex: 2000, minWidth: "400px"}}
          >
            <h5 
              className = "mb-3" > Configure Simulation
            </h5>

            {/* CONFIG INFO GOES HERE */}

            <div className = "d-grid mt-4">
              <button className = "btn btn-success" onClick = {handleStart}>
                Start Simulation
              </button>
            </div>
          </div>
        )}


        {/* STATUS DISPLAY IN TOP RIGHT */}
        <Row className="mb-2">
          <Col md="auto">
            <Card
              bg="dark"
              text="light"
              className="rounded shadow"
              style={{ minWidth: "100px" }}
            >
              <Card.Body className="p-2 small">
                <div><strong>Elapsed:</strong> {formatTime(seconds)}</div>
                <div><strong>Time:</strong> {timeOfDay}</div>
                <div><strong>Weather:</strong> {weather}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>


        {/* EMPTY DROPDOWN */}
        <Row>
          <Col md="auto">
            <Card bg="secondary" className="rounded shadow">
              <Card.Body className="p-2">
                <Dropdown>
                  <Dropdown.Toggle
                    variant="light"
                    size="sm"
                    disabled
                  >
                    View Live Counts
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {/* Empty for now */}
                  </Dropdown.Menu>
                </Dropdown>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Control>
  );
}

export default Controls;
