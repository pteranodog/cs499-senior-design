import { useState, useEffect, useRef } from "react";
import Control from "react-leaflet-custom-control";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";

function TopRightControls() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState("Day");
  const [weather, setWeather] = useState("Clear");

  const intervalRef = useRef(null);

  // Clock effect (only runs when isRunning is true)
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Update day/night based on simulated time
  useEffect(() => {
    const simulatedHour = Math.floor((seconds / 3600) % 24);
    setTimeOfDay(simulatedHour >= 6 && simulatedHour < 18 ? "Day" : "Night");

    setWeather("Clear");

  }, [seconds]);

  const formatTime = (s) => {
    const hrs = String(Math.floor(s / 3600)).padStart(2, "0");
    const mins = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const secs = String(s % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const handleStart = () => setIsRunning(true);

  return (
    <Control prepend position="topright">
      <div onClick={(e) => e.stopPropagation()}>

        {/* STATUS DISPLAY */}
        <Row className="mb-2">
          <Col md="auto">
            <Card
              bg="dark"
              text="light"
              className="rounded shadow"
              style={{ minWidth: "200px" }}
            >
              <Card.Body className="p-2 small">
                <div><strong>Elapsed:</strong> {formatTime(seconds)}</div>
                <div><strong>Time:</strong> {timeOfDay}</div>
                <div><strong>Weather:</strong> {weather}</div>

                <div className="mt-2 text-center"> 
                {!isRunning && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={handleStart}
                    >
                      Start Simulation
                    </Button>
                )}

                {isRunning && (
                  <Button
                    size = "sm"
                    variant = "danger"
                    onClick = {() => {
                      setIsRunning(false);
                      setSeconds(0);
                    }}
                  >
                    Terminate
                  </Button>
                )}
                </div>
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
                    Options (Coming Soon)
                  </Dropdown.Toggle>
                  <Dropdown.Menu />
                </Dropdown>
              </Card.Body>
            </Card>
          </Col>
        </Row>

      </div>
    </Control>
  );
}

export default TopRightControls;

